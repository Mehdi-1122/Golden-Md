// Group tools — notes (#lafz), scheduled messages, report to admins, tagadmins, contacts (vcf)
import store from '../../lib/store.js'
import { num, quotedText } from '../../lib/helpers.js'

const UNITS = { m: 60000, h: 3600000, d: 86400000 }
const PK = 5 * 3600000   // Pakistan UTC+5 (DST nahi)
const pkTime = (t) => new Date(t).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })
const admins = (meta) => meta.participants.filter(p => p.admin)

// "21:30" / "9pm" / "9:15am" / "30m" / "2h" -> timestamp
function parseWhen (s) {
  const rel = /^(\d+)(m|h|d)$/i.exec(s)
  if (rel) return Date.now() + (+rel[1]) * UNITS[rel[2].toLowerCase()]
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i.exec(s)
  if (!m) return null
  let h = +m[1]; const min = +(m[2] || 0); const ap = (m[3] || '').toLowerCase()
  if (ap === 'pm' && h < 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  if (h > 23 || min > 59) return null
  const pkNow = new Date(Date.now() + PK)
  let t = Date.UTC(pkNow.getUTCFullYear(), pkNow.getUTCMonth(), pkNow.getUTCDate(), h, min) - PK
  if (t <= Date.now()) t += UNITS.d
  return t
}

export default [
  { name: 'note', aliases: ['save'], category: 'group', desc: 'Note save/dekho (.note wifi = 1234)',
    async run ({ from, text, reply, isGroup, sender, sock, isOwner }) {
      const [k, ...v] = (text || '').split('=')
      const key = (k || '').trim().toLowerCase(), val = v.join('=').trim()
      const all = store.obj('notes'); const g = (all[from] ||= {})
      if (!key) return reply('.note <naam> = <baat>   (save)\n.note <naam>   ya   #naam   (dekho)\n.notes (list) • .delnote <naam>')
      if (!val) return reply(Object.hasOwn(g, key) ? `📝 *${key}*\n\n${g[key]}` : 'Ye note nahi mila. List: .notes')
      if (isGroup && !isOwner) {
        const meta = await sock.groupMetadata(from)
        if (!admins(meta).some(p => [p.id, p.jid, p.lid].some(j => j && num(j) === num(sender)))) return reply('❌ Note sirf admin save kar sakta hai.')
      }
      g[key] = val; store.save()
      await reply(`✅ Note save: *${key}*\nKoi bhi #${key} likh kar dekh sakta hai.`)
    } },
  { name: 'notes', aliases: ['notelist'], category: 'group', desc: 'Saare notes',
    async run ({ from, reply }) {
      const k = Object.keys(store.obj('notes')[from] || {})
      await reply(k.length ? '📝 *Notes*\n\n' + k.map(x => '#' + x).join('\n') + '\n\nDekhne ke liye #naam likho' : 'Koi note nahi. Save: .note wifi = 1234')
    } },
  { name: 'delnote', aliases: ['rmnote'], category: 'group', admin: true, desc: 'Note hatao',
    async run ({ from, text, reply }) {
      const g = store.obj('notes')[from] || {}; const key = (text || '').trim().toLowerCase()
      if (!g[key]) return reply('Ye note nahi mila.')
      delete g[key]; store.save(); await reply('✅ Note hata diya: ' + key)
    } },

  { name: 'schedule', aliases: ['schedulemsg', 'later'], category: 'group', group: true, admin: true,
    desc: 'Message waqt par bhejo (.schedule 9pm text)',
    async run ({ from, args, text: full, reply, sock }) {
      const at = parseWhen(args[0] || '')
      const text = (full || '').replace(/^\S+\s*/, '')
      if (!at || !text) return reply('.schedule 9pm Meeting shuru ho rahi hai\n.schedule 21:30 <text>\n.schedule 30m <text>   (m=min, h=ghante, d=din)\n\nList: .schedules • Hatao: .delschedule 1')
      const all = store.obj('schedules'); (all[from] ||= []).push({ at, text }); all[from].sort((a, b) => a.at - b.at); store.save()
      socks.set(from, sock)
      await reply(`⏰ Theek hai — *${pkTime(at)}* (PK time) par bhej dunga:\n\n${text}`)
    } },
  { name: 'schedules', aliases: ['schedulelist'], category: 'group', group: true, desc: 'Scheduled messages ki list',
    async run ({ from, reply }) {
      const l = store.obj('schedules')[from] || []
      await reply(l.length ? '⏰ *Scheduled*\n\n' + l.map((s, i) => `${i + 1}. ${pkTime(s.at)} — ${s.text.slice(0, 60)}`).join('\n') : 'Koi scheduled message nahi.')
    } },
  { name: 'delschedule', aliases: ['unschedule'], category: 'group', group: true, admin: true, desc: 'Scheduled message hatao',
    async run ({ from, args, reply }) {
      const l = store.obj('schedules')[from] || []; const i = parseInt(args[0]) - 1
      if (!l[i]) return reply('Number ghalat. List: .schedules')
      l.splice(i, 1); store.save(); await reply('✅ Hata diya.')
    } },

  { name: 'report', aliases: ['complain', 'shikayat'], category: 'group', group: true, desc: 'Admins ko private shikayat',
    async run ({ sock, from, msg, sender, text, reply }) {
      const q = quotedText(msg)
      if (!text && !q) return reply('.report <shikayat>   (ya ghalat message ko reply kar ke .report)')
      const meta = await sock.groupMetadata(from)
      const list = admins(meta).filter(p => num(p.id) !== num(sock.user?.id)).slice(0, 10)
      const body = `🚨 *Report — ${meta.subject}*\n👤 @${num(sender)}\n\n${text || ''}${q ? `\n\n💬 Message:\n"${q.slice(0, 500)}"` : ''}`
      let sent = 0
      for (const a of list) {
        const to = a.jid || a.id
        try { await sock.sendMessage(to, { text: body, mentions: [sender] }); sent++ } catch {}
      }
      await reply(sent ? `✅ Shikayat ${sent} admins ko private mein bhej di.` : '⚠️ Admins tak nahi pohanchi.')
    } },
  { name: 'tagadmins', aliases: ['calladmin', 'staff'], category: 'group', group: true, desc: 'Sirf admins ko tag',
    async run ({ sock, from, text, msg }) {
      const a = admins(await sock.groupMetadata(from))
      await sock.sendMessage(from, { text: `👮 *Admins* — ${text || 'zaroori baat'}\n\n${a.map(p => '@' + num(p.id)).join(' ')}`, mentions: a.map(p => p.id) }, { quoted: msg })
    } },
  { name: 'vcf', aliases: ['contacts', 'savecontacts'], category: 'group', group: true, admin: true, desc: 'Sab members ke contacts (.vcf file)',
    async run ({ sock, from, msg, reply }) {
      const meta = await sock.groupMetadata(from)
      const nums = [...new Set(meta.participants.map(p => [p.jid, p.id].find(j => j?.endsWith('@s.whatsapp.net'))).filter(Boolean).map(num))]
      if (!nums.length) return reply('Numbers nahi mile (is group mein numbers chhupe hue hain).')
      const name = (meta.subject || 'Group').replace(/[^\w\s-]/g, '').trim() || 'Group'
      const vcf = nums.map((n, i) => `BEGIN:VCARD\nVERSION:3.0\nFN:${name} ${i + 1}\nTEL;type=CELL;waid=${n}:+${n}\nEND:VCARD`).join('\n')
      await sock.sendMessage(from, { document: Buffer.from(vcf), mimetype: 'text/vcard', fileName: `${name}.vcf`, caption: `📇 ${nums.length} contacts — file khol kar sab ek saath save karo.` }, { quoted: msg })
    } }
]

// ---------- schedule engine ----------
const socks = new Map()
clearInterval(globalThis.__gmdSched)
globalThis.__gmdSched = setInterval(async () => {
  const all = store.obj('schedules')
  for (const [gid, list] of Object.entries(all)) {
    const sock = socks.get(gid)?.live?.()
    if (!sock?.gmdOpen || !list.length) continue
    // bhejne ke baad hi list se hatao, taake connection tootne par message gum na ho
    for (const s of list.filter(s => s.at <= Date.now())) {
      try {
        await sock.sendMessage(gid, { text: `📢 ${s.text}` })
        all[gid] = all[gid].filter(x => x !== s); store.save()
      } catch {}
    }
  }
}, 20000)

// hook: #note + schedule wale group ka sock yaad rakho
export async function hook ({ from, body, reply, sock }) {
  if (store.obj('schedules')[from]?.length) socks.set(from, sock)
  const m = /^#(\S+)$/.exec((body || '').trim())
  if (!m) return
  const list = store.obj('notes')[from]
  const key = m[1].toLowerCase()
  if (list && Object.hasOwn(list, key)) await reply(`📝 *${m[1]}*\n\n${list[key]}`)
}
