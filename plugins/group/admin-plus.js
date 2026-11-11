// Admin plus — join requests, anticountry, removecountry, antisticker, antigm, autogroupclose/open
import store from '../../lib/store.js'
import { toggleRun } from '../../lib/buttons.js'
import { num, botIsAdmin, isAdmin } from '../../lib/helpers.js'

const sleep = ms => new Promise(r => setTimeout(r, ms))
const TZ = process.env.TZ_GROUP || 'Asia/Karachi'

// member ka asal phone number (agar group mein nazar aata ho)
const phoneOf = (p) => [p.jid, p.id, p.phoneNumber].find(j => j?.endsWith?.('@s.whatsapp.net'))
const codesOf = (text) => (text || '').split(/[\s,]+/).map(c => c.replace(/\D/g, '')).filter(c => c && c.length <= 4)

async function needBotAdmin (sock, from, reply) {
  const meta = await sock.groupMetadata(from)
  if (!botIsAdmin(meta, sock)) { await reply('⚠️ Pehle bot ko group admin banao.'); return null }
  return meta
}

// ---------- join requests ----------
async function pending (sock, from) {
  const list = await sock.groupRequestParticipantsList(from)
  return (list || []).map(r => ({ jid: r.jid, phone: r.phone_number || (r.jid?.endsWith('@s.whatsapp.net') ? r.jid : null) }))
}
const label = (r, i) => `${i + 1}. ${r.phone ? '+' + num(r.phone) : num(r.jid) + ' (number chhupa)'}`

// ".approve all" / ".approve 1 3" (requests list ka number) / ".approve 923001234567"
function choose (list, args) {
  if (!args.length || args[0] === 'all') return list
  return args.flatMap(a => {
    const d = a.replace(/\D/g, '')
    if (!d) return []
    if (d.length <= 3) return list[+d - 1] ? [list[+d - 1]] : []
    return list.filter(r => num(r.phone || r.jid) === d || num(r.jid) === d)
  })
}

async function decide (ctx, action) {
  const { sock, from, args, reply } = ctx
  if (!await needBotAdmin(sock, from, reply)) return
  const list = await pending(sock, from)
  if (!list.length) return reply('📭 Koi join request nahi.')
  if (!args.length) return reply(`Kis ko? .${action} all  ya  .${action} 1 2  (list: .requests)`)
  const pick = choose(list, args)
  if (!pick.length) return reply('Yeh request list mein nahi mili. .requests se dekh lo.')
  let ok = 0
  for (let i = 0; i < pick.length; i += 20) {
    const res = await sock.groupRequestParticipantsUpdate(from, pick.slice(i, i + 20).map(r => r.jid), action)
    ok += (res || []).filter(x => !x.status || String(x.status) === '200').length
  }
  await reply(`${action === 'approve' ? '✅ Approve' : '❌ Reject'}: ${ok}/${pick.length}`)
}

// ---------- auto open/close ----------
function parseClock (s) {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i.exec((s || '').trim())
  if (!m) return null
  let h = +m[1]; const min = +(m[2] || 0); const ap = (m[3] || '').toLowerCase()
  if (ap === 'pm' && h < 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  if (h > 23 || min > 59) return null
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}
const show12 = (hm) => { const [h, m] = hm.split(':').map(Number); return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}` }

const autoCmd = (name, aliases, kind, word, will) => ({
  name, aliases, category: 'group', group: true, admin: true,
  desc: `Roz waqt par group khud ${word} (.${name} 10pm / off)`,
  async run ({ sock, from, text, reply }) {
    const all = store.obj('autogc'); const g = (all[from] ||= {})
    const v = (text || '').trim().toLowerCase()
    if (!v) return reply(g[kind] ? `⏰ Roz ${show12(g[kind])} par group ${word} hota hai.\nBand: .${name} off` : `.${name} 10pm  (ya 22:00)`)
    if (v === 'off') { delete g[kind]; if (!Object.keys(g).length) delete all[from]; store.save(); return reply(`✅ Auto ${kind === 'close' ? 'close' : 'open'} band.`) }
    const hm = parseClock(v)
    if (!hm) return reply(`Waqt samajh nahi aaya. Misal: .${name} 10pm  ya  .${name} 22:30`)
    if (!await needBotAdmin(sock, from, reply)) return
    g[kind] = hm; store.save(); gcSocks.set(from, sock)
    await reply(`✅ Ab roz *${show12(hm)}* (Pakistan time) par group khud ${will}.`)
  }
})

export default [
  { name: 'requests', aliases: ['requestlist', 'joinrequests', 'pending'], category: 'group', group: true, admin: true,
    desc: 'Group join requests ki list',
    async run ({ sock, from, reply }) {
      if (!await needBotAdmin(sock, from, reply)) return
      const list = await pending(sock, from)
      if (!list.length) return reply('📭 Koi join request nahi.')
      await reply(`📥 *Join requests (${list.length})*\n\n${list.slice(0, 100).map(label).join('\n')}\n\n.approve all  |  .approve 1 2\n.reject 3  |  .rejectall`)
    } },
  { name: 'approve', aliases: ['accept', 'approveall'], category: 'group', group: true, admin: true,
    desc: 'Join request approve (.approve all / .approve 1 2)',
    run: (ctx) => { if (ctx.body.toLowerCase().includes('approveall')) ctx.args = ['all']; return decide(ctx, 'approve') } },
  { name: 'reject', aliases: ['decline'], category: 'group', group: true, admin: true,
    desc: 'Join request reject (.reject 1 2 / .reject all)',
    run: (ctx) => decide(ctx, 'reject') },
  { name: 'rejectall', aliases: ['declineall'], category: 'group', group: true, admin: true,
    desc: 'Saari join requests reject',
    run: (ctx) => { ctx.args = ['all']; return decide(ctx, 'reject') } },

  { name: 'anticountry', aliases: ['blockcountry', 'bancountry'], category: 'safety', group: true, admin: true,
    desc: 'In country codes ke numbers join par kick (.anticountry 1 234 / off)',
    async run ({ from, text, reply }) {
      const all = store.obj('anticountry')
      const v = (text || '').trim().toLowerCase()
      if (!v) return reply(all[from] ? `🚫 Blocked codes: ${all[from].map(c => '+' + c).join(', ')}\nBand: .anticountry off` : '.anticountry 1 234 91  — in codes wale join karte hi nikal jayenge\n(Purane members ke liye: .removecountry 234)')
      if (v === 'off') { delete all[from]; store.save(); return reply('✅ Anti-country band.') }
      const codes = codesOf(v)
      if (!codes.length) return reply('Country code dein, misal: .anticountry 1 234')
      all[from] = codes; store.save()
      await reply(`✅ Anti-country ON — ${codes.map(c => '+' + c).join(', ')} wale numbers join karte hi nikaal diye jayenge (bot admin hona chahiye).`)
    } },
  { name: 'removecountry', aliases: ['kickcountry'], category: 'group', group: true, admin: true,
    desc: 'Kisi country code ke maujooda members nikaalo (.removecountry 234)',
    async run ({ sock, from, args, reply }) {
      const codes = codesOf(args.filter(a => a !== 'confirm').join(' '))
      if (!codes.length) return reply('.removecountry 234  (phir confirm ke saath)')
      const meta = await needBotAdmin(sock, from, reply); if (!meta) return
      const me = num(sock.user?.id)
      const list = meta.participants.filter(p => !p.admin && phoneOf(p) && num(phoneOf(p)) !== me && codes.some(c => num(phoneOf(p)).startsWith(c))).map(p => p.id)
      if (!list.length) return reply(`✅ ${codes.map(c => '+' + c).join(', ')} ka koi member nahi (admins aur chhupe numbers ginti mein nahi).`)
      if (!args.includes('confirm')) return reply(`⚠️ ${list.length} members milay (${codes.map(c => '+' + c).join(', ')}).\nNikaalne ke liye: .removecountry ${codes.join(' ')} confirm`)
      let done = 0
      for (let i = 0; i < list.length; i += 5) {
        try { await sock.groupParticipantsUpdate(from, list.slice(i, i + 5), 'remove'); done += list.slice(i, i + 5).length } catch {}
        await sleep(2000)   // ek dum sab nikaalne par WhatsApp rok deta hai
      }
      await reply(`🚫 ${done} members nikaal diye.`)
    } },

  { name: 'antisticker', aliases: ['nosticker'], category: 'safety', group: true, admin: true, desc: 'Members ke stickers delete',
    run: (ctx) => toggleRun(ctx, { key: 'antisticker', label: 'Anti-sticker' }) },
  { name: 'antigm', aliases: ['antigroupmention', 'antistatusmention'], category: 'safety', group: true, admin: true,
    desc: 'Status mein group mention wale message delete',
    run: (ctx) => toggleRun(ctx, { key: 'antigm', label: 'Anti group-mention' }) },

  autoCmd('autogroupclose', ['autoclose', 'gcautoclose'], 'close', 'band', 'band ho jayega'),
  autoCmd('autogroupopen', ['autoopen', 'gcautoopen'], 'open', 'khul', 'khul jayega')
]

// ---------- message hook: antisticker, antigm ----------
export async function hook ({ sock, msg, from, isGroup, sender, isOwner }) {
  if (isGroup && store.obj('autogc')[from]) gcSocks.set(from, sock)
  if (!isGroup || msg.key.fromMe || isOwner) return
  const m = msg.message || {}
  const sticker = !!m.stickerMessage && store.is('antisticker', from)
  const ctxInfo = Object.values(m).find(v => v?.contextInfo)?.contextInfo
  const gm = store.is('antigm', from) && (!!m.groupStatusMentionMessage || ctxInfo?.groupMentions?.length > 0)
  if (!sticker && !gm) return
  const meta = await sock.groupMetadata(from)
  if (isAdmin(meta, sender) || !botIsAdmin(meta, sock)) return
  await sock.sendMessage(from, { delete: msg.key })
  await sock.sendMessage(from, { text: `⚠️ @${num(sender)} ${sticker ? 'stickers allowed nahi' : 'group ko status mein mention karna allowed nahi'}.`, mentions: [sender] })
}

// ---------- join: anticountry ----------
export async function onGroup (sock, { id, participants, action }) {
  if (action !== 'add') return
  const codes = store.obj('anticountry')[id]
  if (!codes?.length) return
  const jids = participants.map(p => typeof p === 'string' ? p : (p.phoneNumber || p.id))
  const bad = jids.filter(j => j?.endsWith('@s.whatsapp.net') && codes.some(c => num(j).startsWith(c)))
  if (!bad.length) return
  const meta = await sock.groupMetadata(id)
  if (!botIsAdmin(meta, sock)) return
  // phone jid se asal participant id (lid ho sakti hai)
  const ids = bad.map(j => meta.participants.find(p => [p.id, p.jid, p.phoneNumber].includes(j))?.id || j)
  await sock.groupParticipantsUpdate(id, ids, 'remove')
  await sock.sendMessage(id, { text: `🚫 Anti-country: ${bad.map(j => '+' + num(j)).join(', ')} nikaale gaye.` })
}

// ---------- auto open/close engine ----------
const gcSocks = new Map()      // group -> sock
const anySock = new Map()      // scope -> sock (restart ke baad fallback)
const done = new Set()
export function onSocket (sock, cfg) { anySock.set(cfg.scope('global'), sock) }

function nowHM () {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map(x => [x.type, x.value]))
  return { day: `${p.year}-${p.month}-${p.day}`, hm: `${p.hour}:${p.minute}` }
}

clearInterval(globalThis.__gmdAutoGc)
globalThis.__gmdAutoGc = setInterval(async () => {
  const { day, hm } = nowHM()
  for (const [gid, g] of Object.entries(store.obj('autogc'))) {
    for (const kind of ['close', 'open']) {
      const id = `${gid}|${kind}|${day}`
      if (g[kind] !== hm || done.has(id)) continue
      const sock = (gcSocks.get(gid) || [...anySock.values()].find(s => (s.live?.() || s).gmdOpen))?.live?.()
      if (!sock?.gmdOpen) continue
      done.add(id)
      try {
        await sock.groupSettingUpdate(gid, kind === 'close' ? 'announcement' : 'not_announcement')
        await sock.sendMessage(gid, { text: kind === 'close' ? `🔒 Group band ho gaya (${show12(hm)}). Ab sirf admins message kar sakte hain.` : `🔓 Group khul gaya (${show12(hm)}). Sab message kar sakte hain.` })
      } catch (e) { console.error('autogc:', e.message) }
    }
  }
  if (done.size > 2000) done.clear()
}, 20000)
