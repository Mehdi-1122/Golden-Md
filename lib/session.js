// Reusable session engine — ek function se ek WhatsApp session chalao.
// Single-mode (index.js) aur multi-user server (server.js) dono ise use karte hain.
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import makeWASocket, {
  useMultiFileAuthState, DisconnectReason,
  fetchLatestBaileysVersion, Browsers
} from '@whiskeysockets/baileys'

import store from './store.js'
import { num, getText, getType, isAdmin, findPart, unwrapMsg } from './helpers.js'
import { config, commands, hooks, groupHooks, stats } from './core.js'
import { getPollMessage, handleVote } from './buttons.js'
import { restoreFromId } from './sessionid.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// DEBUG=1: har message ka haal terminal par (message ki likhai nahi, sirf type aur faisla)
const DEBUG = process.env.DEBUG === '1'
const dbg = (...a) => { if (DEBUG) console.log('[debug]', ...a) }
const logger = pino({ level: DEBUG ? 'error' : 'silent' })

// Kisi ek command ki ghalti se poora bot band na ho (web mode mein sab users isi process mein hain)
process.on('unhandledRejection', (e) => console.error('unhandledRejection:', e?.message || e))

// ---------- Plugins ----------
// Sirf ek dafa load: kai sessions saath start hon to hooks double na hon
let loading = null
export function loadPlugins () { return (loading ||= doLoadPlugins()) }

async function doLoadPlugins () {
  commands.clear(); hooks.length = 0; groupHooks.length = 0
  const dir = path.join(__dirname, '..', 'plugins')
  if (!fs.existsSync(dir)) return
  for (const file of fs.readdirSync(dir, { recursive: true }).filter(f => f.endsWith('.js')).sort()) {
    try {
      const mod = await import(pathToFileURL(path.join(dir, file)).href + '?t=' + Date.now())
      for (const cmd of (mod.default || [])) {
        for (const n of [cmd.name, ...(cmd.aliases || [])]) commands.set(n.toLowerCase(), cmd)
      }
      if (mod.hook) hooks.push(mod.hook)
      if (mod.onGroup) groupHooks.push(mod.onGroup)
    } catch (e) { console.error('Plugin load fail:', file, e.message) }
  }
  console.log(`✅ ${new Set([...commands.values()]).size} commands, ${hooks.length} hooks`)
}

export const sessions = new Map()   // dir -> sock

const msgCaches = new Map()         // dir -> (id -> msg); reconnect par yaad na mite

// Delete hua message wapas: group mein wahin, inbox mein sirf owner ke "Message yourself" mein
export async function recoverDeleted (sock, cached, chat) {
  const who = cached.key.participantPn || cached.key.senderPn || cached.key.participant || cached.key.remoteJid
  const target = chat.endsWith('@g.us') ? chat : num(sock.user.id) + '@s.whatsapp.net'
  const name = cached.pushName ? ` (${cached.pushName})` : ''
  await sock.sendMessage(target, { text: `🗑️ @${num(who)}${name} ne message delete kiya:`, mentions: [who] })
  const type = getType(cached)   // sirf asal content forward ho, encryption wali keys nahi
  await sock.sendMessage(target, { forward: { key: cached.key, message: { [type]: cached.message[type] } } })
}

// Session band karo (reconnect ke baghair); wipe = session folder bhi mita do
export function stopSession (dir, { wipe = false } = {}) {
  const s = sessions.get(dir)
  if (s) { s.gmdStopped = true; sessions.delete(dir); try { s.end(undefined) } catch {} }
  if (wipe) { try { fs.rmSync(dir, { recursive: true, force: true }) } catch {} }
}

// ---------- Ek session start ----------
export async function startSession ({ dir, owner, pairingNumber = null, onPair = null, onOpen = null, sessionId = null, printQR = false, multi = false, onReplaced = null, onLoggedOut = null }) {
  await loadPlugins()
  await restoreFromId(dir, sessionId)      // SESSION_ID (chhoti ya lambi) se session bana lo
  const { state, saveCreds } = await useMultiFileAuthState(dir)
  const { version } = await fetchLatestBaileysVersion()
  // anti-delete + poll votes ke liye messages yaad rakho
  if (!msgCaches.has(dir)) msgCaches.set(dir, new Map())
  const msgCache = msgCaches.get(dir)
  const cacheMsg = (m) => { if (m.key?.id) { msgCache.set(m.key.id, m); if (msgCache.size > 5000) msgCache.delete(msgCache.keys().next().value) } }
  const sock = makeWASocket({
    version, logger, printQRInTerminal: false, auth: state,
    getMessage: async (key) => getPollMessage(key.id) || msgCache.get(key.id)?.message || undefined,
    browser: Browsers.ubuntu('Chrome'), markOnlineOnConnect: false,
    generateHighQualityLinkPreview: true
  })
  sessions.set(dir, sock)
  sock.logger = logger
  sock.gmdOpen = false                               // sock.user pairing code par hi set ho jata hai, is liye alag flag
  sock.live = () => sessions.get(dir) || sock        // timers reconnect ke baad naya socket use karein
  const sessionOwner = (owner || config.owner || '').replace(/\D/g, '')
  // web mode: har user ki owner-level settings alag; single mode mein purani keys hi rehti hain
  const scope = (id) => multi ? `${id}:${sessionOwner}` : id
  const sessionConfig = { ...config, owner: sessionOwner, multi, scope, mode: store.obj('modes')[scope('global')] || config.mode }

  // pairing code login
  if (!sock.authState.creds.registered && pairingNumber) {
    setTimeout(async () => {
      try { const code = await sock.requestPairingCode(pairingNumber.replace(/\D/g, '')); onPair && onPair(code) }
      catch (e) { onPair && onPair(null, e) }
    }, 3000)
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (u) => {
    const { connection, lastDisconnect, qr } = u
    if (qr && printQR) qrcode.generate(qr, { small: true })
    if (connection === 'open') {
      sock.gmdOpen = true
      console.log(`🟢 Connected: ${num(sock.user?.id)} (owner ${sessionConfig.owner})`)
      if (onOpen) Promise.resolve().then(() => onOpen(sock)).catch(e => console.error('onOpen:', e.message))
    }
    if (connection === 'close') {
      sock.gmdOpen = false
      if (sock.gmdStopped) return
      const code = lastDisconnect?.error?.output?.statusCode
      const linked = !!sock.authState.creds.account   // WhatsApp se link ho chuka hai?
      if (code === DisconnectReason.loggedOut) {
        console.log('🔴 Logged out:', dir)
        sessions.delete(dir)
        try { onLoggedOut && onLoggedOut() } catch {}
        try { fs.rmSync(dir, { recursive: true, force: true }) } catch {}
        // pairing number ho to atke rehne ke bajaye naya code do
        if (!multi && pairingNumber) {
          console.log('🔁 Naya pairing code ban raha hai...')
          setTimeout(() => startSession({ dir, owner, pairingNumber, onPair, onOpen, printQR, multi, onReplaced, onLoggedOut })
            .catch(e => console.error('reconnect:', e.message)), 2500)
        }
      } else if (code === DisconnectReason.connectionReplaced) {
        // Yehi creds kahin aur chal rahi hain; reconnect karte to dono ek doosre ko nikaalte rehte
        console.log('⚠️ Session doosri jagah chal rahi hai, yahan band kar di:', dir)
        sessions.delete(dir)
        try { onReplaced && onReplaced() } catch {}
      } else if (!linked && multi) {
        // Website se pairing poori nahi hui: khali socket hamesha retry na kare
        console.log('⌛ Pairing poori nahi hui:', dir)
        stopSession(dir, { wipe: true })
        onPair && onPair(null, new Error('Pairing poori nahi hui, dobara code lein.'))
      } else {
        setTimeout(() => startSession({ dir, owner, pairingNumber, onPair, onOpen, printQR, multi, onReplaced, onLoggedOut })
          .catch(e => console.error('reconnect:', e.message)), 2500)
      }
    }
  })

  // admin-lock (welcome/goodbye ab plugins/group/welcome.js mein)
  sock.ev.on('group-participants.update', async (ev) => {
    try {
      const { id, participants, action, author } = ev
      if ((action === 'promote' || action === 'demote') && author && store.is('adminlock', scope(id))) {
        try {
          // author @lid ho sakta hai: phone number group metadata se milao
          const p = findPart(await sock.groupMetadata(id), author)
          const actorIds = [author, p?.id, p?.jid, p?.lid].filter(Boolean).map(num)
          const allowed = [sessionConfig.owner, num(sock.user?.id), num(sock.user?.lid || ''), ...store.sudoList(sessionConfig)].filter(Boolean)
          if (!actorIds.some(x => allowed.includes(x))) {
            const undo = action === 'promote' ? 'demote' : 'promote'
            await sock.groupParticipantsUpdate(id, participants, undo)
            await sock.groupParticipantsUpdate(id, [author], 'demote')
            await sock.sendMessage(id, { text: `🔒 Admin-lock: @${num(author)} ko ijazat nahi thi.`, mentions: [author] })
          }
        } catch {}
      }
      for (const h of groupHooks) { try { await h(sock, ev) } catch (e) { console.error('group hook:', e.message) } }
    } catch {}
  })

  const ownerJid = (jid) => num(jid) === sessionConfig.owner || store.sudoList(sessionConfig).includes(num(jid))

  sock.ev.on('messages.update', async (updates) => {
    for (const { key, update } of updates) {
      if (update?.pollUpdates) { handleVote(sock, key, update, ownerJid).catch(e => console.error('vote:', e.message)); continue }
      if (update?.message !== null && update?.messageStubType !== 68) continue
      const chat = key.remoteJid
      const inbox = !chat.endsWith('@g.us') && store.is('antidelete', scope('inbox'))
      if (!inbox && !store.is('antidelete', chat) && !store.is('antidelete', scope('global'))) continue
      const cached = msgCache.get(key.id)
      if (!cached || cached.key.fromMe) continue
      try { await recoverDeleted(sock, cached, chat) } catch (e) { console.error('antidelete:', e.message) }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') { dbg('skip: upsert type', type, 'count', messages.length); return }
    for (const msg of messages) {
      if (!msg.message) { dbg('skip: message khali (decrypt fail?)', msg.key.remoteJid, 'fromMe', msg.key.fromMe, 'stub', msg.messageStubType, msg.messageStubParameters?.[0]); continue }
      unwrapMsg(msg)   // disappearing chats ka wrapper hatao
      cacheMsg(msg)
      try { await onMessage(sock, msg, sessionConfig) } catch (e) { console.error('msg err:', e.message) }
    }
  })

  return sock
}

// ---------- Cooldown (AI ka kharcha aur server ka load bachane ke liye) ----------
const COOLDOWN = { ai: 5000, download: 10000, logo: 5000 }
const MAX_DOWNLOADS = 4
const lastUse = new Map()
let activeDownloads = 0

// ---------- Message handler ----------
export async function onMessage (sock, msg, cfg) {
  const from = msg.key.remoteJid
  if (from === 'status@broadcast') {
    if (store.is('autostatus', cfg.scope('global')) && !msg.key.fromMe) sock.readMessages([msg.key]).catch(() => {})
    return
  }
  const isGroup = from.endsWith('@g.us')
  const self = num(sock.user?.id)
  const fromMe = !!msg.key.fromMe
  // apna DM: remoteJid saamne wale ka hota hai, sender bot khud hai
  const sender = (isGroup ? msg.key.participant : (fromMe ? null : from)) || (fromMe ? self + '@s.whatsapp.net' : '')
  const body = getText(msg)
  const sudo = store.sudoList(cfg)
  // @lid groups mein asal number participantPn/senderPn mein hota hai
  const senderIds = [sender, msg.key.participantPn, msg.key.senderPn].filter(Boolean).map(num)
  const isRealOwner = fromMe || senderIds.includes(cfg.owner)
  const isOwner = isRealOwner || senderIds.some(n => sudo.includes(n))

  const ctx = {
    sock, msg, from, sender, isGroup, body, isOwner, isRealOwner, self, store, config: cfg,
    reply: (text, extra = {}) => sock.live().sendMessage(from, { text, ...extra }, { quoted: msg })
  }

  dbg('msg', { from, sender, fromMe, pn: msg.key.participantPn || msg.key.senderPn, keys: Object.keys(msg.message || {}), isCmd: body.startsWith(cfg.prefix), isOwner })

  for (const h of hooks) { try { await h(ctx) } catch (e) { console.error('hook:', e.message) } }

  if (!body.startsWith(cfg.prefix)) return
  const raw = body.slice(cfg.prefix.length).trim()
  const args = raw.split(/\s+/)
  const name = (args.shift() || '').toLowerCase()
  const cmd = commands.get(name)
  if (!cmd) { dbg('skip: command nahi mili', name); return }

  if (cfg.mode === 'private' && !isOwner) { dbg('skip: private mode, sender owner nahi'); return }
  if (isGroup && store.is('gclock', from) && !isOwner && cmd.name !== 'gclock') return   // admin lock khol sake

  ctx.args = args; ctx.cmd = cmd
  ctx.text = raw.slice(name.length).trim()   // lines (\n) barqarar rehti hain

  if (cmd.owner && !isOwner) return ctx.reply('👑 Sirf owner ke liye.')
  if (cmd.group && !isGroup) return ctx.reply('👥 Yeh command sirf group mein chalti hai.')
  if (cmd.admin && isGroup) {
    const meta = await sock.groupMetadata(from); ctx.meta = meta
    if (!isAdmin(meta, sender) && !isOwner) return ctx.reply('❌ Sirf group admins ke liye.')
  }

  const wait = COOLDOWN[cmd.category]
  if (wait && !isOwner) {
    const k = `${cfg.owner}|${senderIds[0]}|${cmd.category}`
    const left = (lastUse.get(k) || 0) + wait - Date.now()
    if (left > 0) return ctx.reply(`⏳ ${Math.ceil(left / 1000)} second baad dobara koshish karein.`)
    if (lastUse.size > 5000) lastUse.clear()
    lastUse.set(k, Date.now())
  }
  const isDownload = cmd.category === 'download'
  if (isDownload && activeDownloads >= MAX_DOWNLOADS) return ctx.reply('⏳ Server abhi busy hai, thori der baad koshish karein.')

  stats.cmds++; stats.by[cmd.name] = (stats.by[cmd.name] || 0) + 1
  if (store.is('autotyping', cfg.scope('global'))) sock.sendPresenceUpdate('composing', from).catch(() => {})
  if (isDownload) activeDownloads++
  dbg('run', cmd.name)
  try {
    await cmd.run(ctx)
    dbg('done', cmd.name)
  } catch (e) {
    console.error('cmd fail:', cmd.name, e.message)
    ctx.reply('⚠️ Error: ' + e.message).catch(x => console.error('reply fail:', x.message))
  }
  finally { if (isDownload) activeDownloads-- }
}
