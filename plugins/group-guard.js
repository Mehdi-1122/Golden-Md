// Group guard — warn, antibadword, antispam, tempclose, poll, topactive, afk
import store from '../lib/store.js'
import { toggleRun } from '../lib/buttons.js'
import { num, getContextInfo, botIsAdmin, isAdmin } from '../lib/helpers.js'

const MAX_WARN = 3
const UNITS = { s: 1000, m: 60000, h: 3600000 }
// default gaaliyan — group admin .addbadword se aur daal sakte hain
const BAD = ['madarchod', 'maderchod', 'behenchod', 'bhenchod', 'behnchod', 'chutiya', 'chutia', 'bhosdike', 'bhosdi',
  'bsdk', 'gandu', 'harami', 'haramzada', 'haramkhor', 'kanjar', 'randi', 'lodu', 'lund', 'kutti', 'kamina', 'kameeni',
  'fuck', 'fucker', 'motherfucker', 'bitch', 'asshole', 'bastard', 'slut', 'dick']

const targets = (msg, args) => {
  const ci = getContextInfo(msg)
  if (ci.mentionedJid?.length) return ci.mentionedJid
  if (ci.participant) return [ci.participant]
  return args.filter(a => /\d{6,}/.test(a)).map(a => a.replace(/\D/g, '') + '@s.whatsapp.net')
}
const ago = (t) => {
  const m = Math.floor((Date.now() - t) / 60000)
  return m < 1 ? 'kuch second' : m < 60 ? `${m} min` : `${Math.floor(m / 60)} ghante ${m % 60} min`
}

// warning do; MAX_WARN par kick (agar bot admin hai)
async function giveWarn (sock, gid, jid, reason) {
  const all = store.obj('warns'); const g = (all[gid] ||= {})
  const n = (g[num(jid)] || 0) + 1
  g[num(jid)] = n; store.save()
  if (n < MAX_WARN)
    return sock.sendMessage(gid, { text: `⚠️ @${num(jid)} ko warning *${n}/${MAX_WARN}*\nWajah: ${reason}`, mentions: [jid] })
  delete g[num(jid)]; store.save()
  const meta = await sock.groupMetadata(gid)
  if (!botIsAdmin(meta, sock))
    return sock.sendMessage(gid, { text: `🚫 @${num(jid)} ki ${MAX_WARN} warnings poori — bot admin nahi, kick nahi kar saka.`, mentions: [jid] })
  await sock.sendMessage(gid, { text: `🚫 @${num(jid)} ki ${MAX_WARN} warnings poori — group se nikaala ja raha hai.`, mentions: [jid] })
  await sock.groupParticipantsUpdate(gid, [jid], 'remove')
}

export default [
  { name: 'warn', category: 'group', group: true, admin: true, desc: `Warning do (${MAX_WARN} par kick)`,
    async run ({ sock, from, msg, args, reply }) {
      const t = targets(msg, args)
      if (!t.length) return reply('.warn @user <wajah>   (ya message ko reply karo)')
      const reason = args.filter(a => !a.startsWith('@') && !/^\d{6,}$/.test(a)).join(' ') || 'Group rules tode'
      for (const j of t) await giveWarn(sock, from, j, reason)
    } },
  { name: 'unwarn', aliases: ['resetwarn', 'delwarn'], category: 'group', group: true, admin: true, desc: 'Warnings saaf',
    async run ({ from, msg, args, reply }) {
      const t = targets(msg, args)
      if (!t.length) return reply('.unwarn @user')
      const g = store.obj('warns')[from] || {}
      for (const j of t) delete g[num(j)]
      store.save(); await reply('✅ Warnings saaf.')
    } },
  { name: 'warns', aliases: ['warnlist', 'checkwarn'], category: 'group', group: true, desc: 'Kis ki kitni warnings',
    async run ({ from, reply }) {
      const g = Object.entries(store.obj('warns')[from] || {})
      if (!g.length) return reply('✅ Kisi ki warning nahi.')
      await reply('⚠️ *Warnings*\n\n' + g.map(([n, c]) => `@${n}: ${c}/${MAX_WARN}`).join('\n'), { mentions: g.map(([n]) => n + '@s.whatsapp.net') })
    } },

  { name: 'antibadword', aliases: ['antigaali', 'antitoxic'], category: 'safety', group: true, admin: true, desc: 'Gaali wala msg delete + warn',
    run: (ctx) => toggleRun(ctx, { key: 'antibadword', label: 'Anti-badword', on: '✅ Anti-badword ON — gaali wala message delete + warning.\nApne lafz: .addbadword <lafz>' }) },
  { name: 'addbadword', category: 'safety', group: true, admin: true, desc: 'Gaali list mein lafz daalo',
    async run ({ args, from, reply }) {
      const w = args.map(a => a.toLowerCase()).filter(Boolean)
      if (!w.length) return reply('.addbadword <lafz1> <lafz2>')
      const all = store.obj('badwords'); all[from] = [...new Set([...(all[from] || []), ...w])]; store.save()
      await reply(`✅ Add: ${w.join(', ')}`)
    } },
  { name: 'delbadword', category: 'safety', group: true, admin: true, desc: 'Gaali list se lafz hatao',
    async run ({ args, from, reply }) {
      const all = store.obj('badwords'); const w = args.map(a => a.toLowerCase())
      all[from] = (all[from] || []).filter(x => !w.includes(x)); store.save()
      await reply(`✅ Hata diye. Group list: ${all[from].join(', ') || '(khali)'}`)
    } },
  { name: 'antispam', aliases: ['antiflood'], category: 'safety', group: true, admin: true, desc: 'Tez messages par warning',
    run: (ctx) => toggleRun(ctx, { key: 'antispam', label: 'Anti-spam', on: '✅ Anti-spam ON — 8 second mein 6+ messages = warning.' }) },

  { name: 'tempclose', aliases: ['tmute', 'closefor'], category: 'group', group: true, admin: true, desc: 'Kuch der group band (.tempclose 30m)',
    async run ({ sock, from, args, reply }) {
      const d = /^(\d+)(s|m|h)$/.exec((args[0] || '').toLowerCase())
      if (!d) return reply('.tempclose 30m   (s=sec, m=min, h=ghanta, max 24h)')
      const ms = (+d[1]) * UNITS[d[2]]
      if (ms > 86400000) return reply('Max 24h.')
      await sock.groupSettingUpdate(from, 'announcement')
      await reply(`🔒 Group *${args[0]}* ke liye band (sirf admins).`)
      setTimeout(async () => {
        try { const s = sock.live(); await s.groupSettingUpdate(from, 'not_announcement'); await s.sendMessage(from, { text: '🔓 Waqt poora — group khul gaya.' }) } catch {}
      }, ms)
    } },
  { name: 'poll', aliases: ['vote'], category: 'group', desc: 'Poll banao (.poll Sawal | A | B)',
    async run ({ sock, from, text, reply }) {
      const [q, ...opts] = (text || '').split('|').map(s => s.trim()).filter(Boolean)
      if (!q || opts.length < 2) return reply('.poll Kal kahan chalein? | Lahore | Murree | Ghar')
      if (opts.length > 12) return reply('Max 12 options.')
      const multi = /^multi\s+/i.test(q)
      await sock.sendMessage(from, { poll: { name: q.replace(/^multi\s+/i, ''), values: opts, selectableCount: multi ? opts.length : 1 } })
    } },
  { name: 'topactive', aliases: ['top', 'msgcount'], category: 'group', group: true, desc: 'Sab se zyada messages kis ke',
    async run ({ from, reply, args }) {
      if (args[0] === 'reset') { delete store.obj('activity')[from]; store.save(); return reply('✅ Count reset.') }
      const g = Object.entries(store.obj('activity')[from] || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
      if (!g.length) return reply('Abhi koi data nahi.')
      const medal = ['🥇', '🥈', '🥉']
      await reply('📊 *Top Active Members*\n\n' + g.map(([n, c], i) => `${medal[i] || (i + 1) + '.'} @${n} — ${c} msgs`).join('\n'),
        { mentions: g.map(([n]) => n + '@s.whatsapp.net') })
    } },
  { name: 'afk', aliases: ['away'], category: 'group', desc: 'AFK set (koi tag kare to bata dega)',
    async run ({ sender, text, reply }) {
      store.obj('afk')[num(sender)] = { reason: text || 'Busy', t: Date.now() }; store.save()
      await reply(`💤 Tum ab AFK ho: ${text || 'Busy'}\nWapas aa kar koi bhi message karo.`)
    } }
]

// ---------- hooks ----------
const flood = new Map()   // "group|user" -> [timestamps]
const warned = new Map()  // flood warning throttle
const afkSeen = new Map() // afk notice throttle

export async function hook (ctx) {
  const { sock, msg, from, sender, isGroup, body, isOwner, config } = ctx
  if (msg.key.fromMe) return
  const me = num(sender)

  // AFK wapsi
  const afk = store.obj('afk')
  if (afk[me] && !body.toLowerCase().startsWith(config.prefix + 'afk') && !body.toLowerCase().startsWith(config.prefix + 'away')) {
    const a = afk[me]; delete afk[me]; store.save()
    await ctx.reply(`👋 Welcome back! Tum ${ago(a.t)} AFK rahe.`)
  }
  // AFK bande ko tag/reply kiya
  const ci = getContextInfo(msg)
  for (const j of [...(ci.mentionedJid || []), ci.participant].filter(Boolean)) {
    const a = afk[num(j)]; const k = from + num(j)
    if (!a || Date.now() - (afkSeen.get(k) || 0) < 60000) continue
    afkSeen.set(k, Date.now())
    await ctx.reply(`💤 @${num(j)} AFK hai (${ago(a.t)} se)\nWajah: ${a.reason}`, { mentions: [j] })
  }

  if (!isGroup) return

  // message count (topactive)
  const act = store.obj('activity'); const g = (act[from] ||= {})
  g[me] = (g[me] || 0) + 1; store.save()

  if (isOwner) return

  // antibadword
  if (store.is('antibadword', from) && body) {
    const words = body.toLowerCase().split(/[^a-z؀-ۿ]+/)
    const list = [...BAD, ...(store.obj('badwords')[from] || [])]
    if (words.some(w => list.includes(w))) {
      const meta = await sock.groupMetadata(from)
      if (isAdmin(meta, sender)) return
      if (botIsAdmin(meta, sock)) await sock.sendMessage(from, { delete: msg.key })
      await giveWarn(sock, from, sender, 'Gaali / ganda lafz')
      return
    }
  }

  // antispam
  if (store.is('antispam', from)) {
    const k = from + '|' + me; const now = Date.now()
    const list = (flood.get(k) || []).filter(t => now - t < 8000); list.push(now); flood.set(k, list)
    if (list.length >= 6 && now - (warned.get(k) || 0) > 30000) {
      warned.set(k, now); flood.delete(k)
      const meta = await sock.groupMetadata(from)
      if (!isAdmin(meta, sender)) await giveWarn(sock, from, sender, 'Spam (bohot tez messages)')
    }
  }
}
