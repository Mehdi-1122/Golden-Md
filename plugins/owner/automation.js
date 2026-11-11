// Owner automation — anticall, autoread, alwaysonline, autorecording, autostsreact, forward, fulldp
import fs from 'fs'
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import store from '../../lib/store.js'
import { toggleRun } from '../../lib/buttons.js'
import { num, getQuoted, getType } from '../../lib/helpers.js'
import { tmp, clean, ff } from '../../lib/media-tools.js'

const G = (ctx) => ctx.config.scope('global')
const DEFAULT_CALL_MSG = '📵 Maaf kijiye, yeh number calls receive nahi karta. Message kar dein, jald jawab milega.'

export default [
  { name: 'anticall', aliases: ['nocall', 'callblock'], category: 'owner', owner: true,
    desc: 'Aane wali calls khud cut + message (.anticall msg <text> / .anticall block on)',
    async run (ctx) {
      const { args, text, reply } = ctx
      const sub = (args[0] || '').toLowerCase()
      if (sub === 'msg') {
        const m = text.slice(3).trim()
        if (!m) return reply('Abhi ka message:\n' + (store.obj('anticallmsg')[G(ctx)] || DEFAULT_CALL_MSG) + '\n\nBadlo: .anticall msg <naya message>')
        store.obj('anticallmsg')[G(ctx)] = m; store.save()
        return reply('✅ Call wala message set.')
      }
      if (sub === 'block') {
        ctx.args = args.slice(1)
        return toggleRun(ctx, { key: 'anticallblock', id: G(ctx), label: 'Call karne wale ko block', perm: 'owner' })
      }
      return toggleRun(ctx, { key: 'anticall', id: G(ctx), label: 'Anti-call', perm: 'owner',
        on: '✅ Anti-call ON — ab har call khud cut hogi aur caller ko message jayega.' })
    } },

  { name: 'autoread', aliases: ['autoseen', 'readall'], category: 'owner', owner: true, desc: 'Har message khud read (blue tick)',
    run: (ctx) => toggleRun(ctx, { key: 'autoread', id: G(ctx), label: 'Auto read', perm: 'owner' }) },

  { name: 'alwaysonline', aliases: ['online24', 'aonline'], category: 'owner', owner: true, desc: 'Hamesha online dikho',
    async run (ctx) {
      await toggleRun(ctx, { key: 'alwaysonline', id: G(ctx), label: 'Always online', perm: 'owner' })
      ctx.sock.sendPresenceUpdate(store.is('alwaysonline', G(ctx)) ? 'available' : 'unavailable').catch(() => {})
    } },

  { name: 'autorecording', aliases: ['autorecord', 'fakerecording'], category: 'owner', owner: true, desc: 'Message aate hi "recording..." dikhao',
    run: (ctx) => toggleRun(ctx, { key: 'autorecording', id: G(ctx), label: 'Auto recording', perm: 'owner' }) },

  { name: 'autostsreact', aliases: ['statusreact', 'autostatusreact', 'stsreact'], category: 'owner', owner: true,
    desc: 'Sab ke status par khud react (.autostsreact emoji 💚 🔥)',
    async run (ctx) {
      const { args, reply } = ctx
      if ((args[0] || '').toLowerCase() === 'emoji') {
        const list = args.slice(1).filter(Boolean)
        if (!list.length) return reply('Abhi: ' + (store.obj('stsreactemoji')[G(ctx)] || ['💚']).join(' ') + '\nBadlo: .autostsreact emoji 💚 🔥 😍  (kai hon to random)')
        store.obj('stsreactemoji')[G(ctx)] = list.slice(0, 20); store.save()
        return reply('✅ Status react emoji: ' + list.join(' '))
      }
      // default ON hai: store mein sirf "band" hona yaad rakha jata hai
      const v = (args[0] || '').toLowerCase()
      if (v === 'on') { store.off('autostsreactoff', G(ctx)); return reply('✅ Status auto react ON — har naye status par random react hoga.') }
      if (v === 'off') { store.on('autostsreactoff', G(ctx)); return reply('❌ Status auto react OFF.') }
      return reply(`💚 Status auto react: *${store.is('autostsreactoff', G(ctx)) ? 'OFF' : 'ON'}* (default ON)\n\n.autostsreact on / off\n.autostsreact emoji 💚 🔥 😍`)
    } },

  { name: 'forward', aliases: ['fwd'], category: 'owner', owner: true,
    desc: 'Reply kiya message kisi number/group ko bhejo (.forward 923001234567)',
    async run ({ sock, msg, args, from, reply }) {
      const q = getQuoted(msg)
      if (!q) return reply('Kisi message pe reply kar ke likhein: .forward 923001234567  (ya group JID, ya "here")')
      const a = (args[0] || '').trim()
      const to = a === 'here' ? from : a.endsWith('@g.us') || a.endsWith('@newsletter') ? a : a.replace(/\D/g, '').length >= 8 ? a.replace(/\D/g, '') + '@s.whatsapp.net' : null
      if (!to) return reply('Number ya group JID dein. Group JID ke liye .jid group mein likhein.')
      const type = getType(q)
      await sock.sendMessage(to, { forward: { key: q.key, message: { [type]: q.message[type] } } })
      await reply('✅ Forward ho gaya → ' + (to.endsWith('@s.whatsapp.net') ? '+' + num(to) : to))
    } },

  { name: 'fulldp', aliases: ['fullpp', 'setfullpp'], category: 'owner', owner: true,
    desc: 'Bot ki poori DP bina crop (photo pe reply)',
    async run ({ sock, msg, isRealOwner, reply }) {
      if (!isRealOwner) return reply('🔒 Bot ki DP sirf asal owner badal sakta hai.')
      const q = getQuoted(msg)
      const target = q?.message?.imageMessage ? q : msg
      if (getType(target) !== 'imageMessage') return reply('Kisi *photo* pe reply kar ke .fulldp likhein.')
      const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
      const inp = tmp('jpg'), out = tmp('jpg')
      try {
        fs.writeFileSync(inp, buf)
        // photo ko square mein fit karo (kinare kaale), taake WhatsApp kaate nahi
        await ff(['-i', inp, '-vf', 'scale=720:720:force_original_aspect_ratio=decrease,pad=720:720:(ow-iw)/2:(oh-ih)/2:color=black', '-q:v', '2', out])
        await sock.updateProfilePicture(num(sock.user.id) + '@s.whatsapp.net', fs.readFileSync(out))
        await reply('✅ Poori DP lag gayi (bina crop).')
      } finally { clean(inp, out) }
    } }
]

// ---------- har message par ----------
const recLast = new Map()
export async function hook ({ sock, msg, from, config }) {
  if (msg.key.fromMe) return
  const g = config.scope('global')
  if (store.is('autoread', g)) sock.readMessages([msg.key]).catch(() => {})
  if (store.is('autorecording', g)) {
    const now = Date.now()
    if (now - (recLast.get(from) || 0) < 10000) return
    if (recLast.size > 5000) recLast.clear()
    recLast.set(from, now)
    sock.sendPresenceUpdate('recording', from).catch(() => {})
    setTimeout(() => sock.sendPresenceUpdate('paused', from).catch(() => {}), 8000)
  }
}

// ---------- har socket par: calls + always online ----------
const online = new Map()   // scope -> sock
clearInterval(globalThis.__gmdOnline)
globalThis.__gmdOnline = setInterval(() => {
  for (const [g, s] of online) {
    const sock = s.live?.() || s
    if (sock.gmdOpen && store.is('alwaysonline', g)) sock.sendPresenceUpdate('available').catch(() => {})
  }
}, 45000)

export function onSocket (sock, cfg) {
  const g = cfg.scope('global')
  online.set(g, sock)
  const warned = new Map()
  sock.ev.on('call', async (calls) => {
    if (!store.is('anticall', g)) return
    for (const c of calls) {
      if (c.status !== 'offer') continue
      const caller = c.from
      if (num(caller) === cfg.owner || store.sudoList(cfg).includes(num(caller))) continue
      try { await sock.rejectCall(c.id, caller) } catch (e) { console.error('anticall reject:', e.message) }
      // ek banda baar baar call kare to message 1 minute mein ek hi dafa
      if (Date.now() - (warned.get(caller) || 0) < 60000) continue
      warned.set(caller, Date.now())
      try {
        await sock.sendMessage(caller, { text: store.obj('anticallmsg')[g] || DEFAULT_CALL_MSG })
        if (store.is('anticallblock', g)) await sock.updateBlockStatus(caller, 'block')
      } catch (e) { console.error('anticall msg:', e.message) }
    }
  })
}
