// Member mute, slow mode, anti-bot, group stats
import store from '../../lib/store.js'
import { num, getContextInfo, isAdmin, botIsAdmin } from '../../lib/helpers.js'
import { toggleRun } from '../../lib/buttons.js'

const UNITS = { s: 1000, m: 60000, h: 3600000, d: 86400000 }
const MAX_MUTE = 7 * UNITS.d

// har message par metadata na mangwana pare
const metaCache = new Map()
async function getMeta (sock, gid) {
  const c = metaCache.get(gid)
  if (c && Date.now() - c.t < 60000) return c.meta
  const meta = await sock.groupMetadata(gid)
  if (metaCache.size > 500) metaCache.clear()
  metaCache.set(gid, { meta, t: Date.now() })
  return meta
}

const targetOf = (msg, args) => {
  const ci = getContextInfo(msg)
  if (ci.mentionedJid?.length) return ci.mentionedJid[0]
  if (ci.participant) return ci.participant
  const n = args.find(a => /^\+?\d{6,}$/.test(a))
  return n ? n.replace(/\D/g, '') + '@s.whatsapp.net' : null
}

const label = (ms) => ms >= UNITS.d ? `${Math.round(ms / UNITS.d)} din` : ms >= UNITS.h ? `${Math.round(ms / UNITS.h)} ghante` : ms >= UNITS.m ? `${Math.round(ms / UNITS.m)} minute` : `${Math.round(ms / 1000)} second`

export default [
  { name: 'mute', category: 'group', group: true, admin: true, desc: 'Member mute (.mute @user 10m) ya poora group band',
    async run ({ sock, from, msg, args, reply }) {
      const t = targetOf(msg, args)
      if (!t) { await sock.groupSettingUpdate(from, 'announcement'); return reply('🔒 Group locked (sirf admins).') }
      if (!botIsAdmin(await sock.groupMetadata(from), sock)) return reply('❌ Pehle bot ko admin banao, tabhi us ke messages delete honge.')
      const d = args.map(a => /^(\d+)(s|m|h|d)$/i.exec(a)).find(Boolean)
      const ms = d ? (+d[1]) * UNITS[d[2].toLowerCase()] : 10 * UNITS.m
      if (ms > MAX_MUTE) return reply('Zyada se zyada 7 din.')
      const all = store.obj('mutes');
      (all[from] ||= {})[num(t)] = Date.now() + ms; store.save()
      await reply(`🔇 @${num(t)} ${label(ms)} ke liye mute. Is ke messages delete hote rahenge.`, { mentions: [t] })
    } },
  { name: 'unmute', category: 'group', group: true, admin: true, desc: 'Member unmute ya poora group khol do',
    async run ({ sock, from, msg, args, reply }) {
      const t = targetOf(msg, args)
      if (!t) { await sock.groupSettingUpdate(from, 'not_announcement'); return reply('🔓 Group open.') }
      delete store.obj('mutes')[from]?.[num(t)]; store.save()
      await reply(`🔊 @${num(t)} unmute ho gaya.`, { mentions: [t] })
    } },
  { name: 'slowmode', aliases: ['slow2', 'slowchat'], category: 'group', group: true, admin: true, desc: 'Har banda N second mein ek message (.slowmode 30)',
    async run ({ from, args, reply, sock }) {
      const all = store.obj('slowmode')
      const v = (args[0] || '').toLowerCase()
      if (v === 'off') { delete all[from]; store.save(); return reply('✅ Slow mode OFF.') }
      const n = parseInt(v)
      if (!(n >= 5 && n <= 3600)) return reply(`Slow mode: ${all[from] ? all[from] + ' second' : 'OFF'}\n.slowmode 30   (5 se 3600 second)\n.slowmode off`)
      if (!botIsAdmin(await sock.groupMetadata(from), sock)) return reply('❌ Pehle bot ko admin banao.')
      all[from] = n; store.save()
      await reply(`🐢 Slow mode ON: har member ${n} second mein ek message. Admins par laagu nahi.`)
    } },
  { name: 'antibot', category: 'safety', group: true, admin: true, desc: 'Doosre bots ke messages delete',
    run: (ctx) => toggleRun(ctx, { key: 'antibot', label: 'Anti-bot', on: '✅ Anti-bot ON — doosre bots ke messages delete honge (pehchan andaze se hoti hai, admins par laagu nahi).' }) },
  { name: 'groupstats', aliases: ['gcstats', 'gstats'], category: 'group', group: true, desc: 'Group ka report card',
    async run ({ sock, from, reply }) {
      const m = await sock.groupMetadata(from)
      const activity = Object.entries(store.obj('activity')[from] || {}).sort((a, b) => b[1] - a[1])
      const week = Object.values(store.obj('lastseen')[from] || {}).filter(t => Date.now() - t < 7 * UNITS.d).length
      const warns = Object.keys(store.obj('warns')[from] || {}).length
      const total = activity.reduce((s, [, c]) => s + c, 0)
      const top = activity.slice(0, 5)
      await reply(`📊 *${m.subject}*\n\n👤 Members: ${m.participants.length}\n🛡️ Admins: ${m.participants.filter(p => p.admin).length}\n💬 Kul messages: ${total}\n🔥 Is hafte active: ${week}\n⚠️ Warnings wale: ${warns}\n\n🏆 *Top 5*\n${top.map(([n, c], i) => `${i + 1}. @${n} — ${c}`).join('\n') || 'Abhi data nahi.'}`,
        { mentions: top.map(([n]) => n + '@s.whatsapp.net') })
    } }
]

const lastMsg = new Map()     // slow mode: "group|user" -> time
const noticeAt = new Map()    // notice throttle
const looksLikeBot = (id = '') => /^BAE5/.test(id) || /^3EB0[0-9A-F]{18}$/.test(id)

function notice (key) {
  if (Date.now() - (noticeAt.get(key) || 0) < 60000) return false
  if (noticeAt.size > 5000) noticeAt.clear()
  noticeAt.set(key, Date.now())
  return true
}

export async function hook ({ sock, msg, from, sender, isGroup, isOwner, reply }) {
  if (!isGroup || msg.key.fromMe || isOwner) return
  const ids = [sender, msg.key.participantPn].filter(Boolean).map(num)
  const remove = () => sock.sendMessage(from, { delete: msg.key })

  const mutes = store.obj('mutes')[from]
  if (mutes) {
    for (const id of ids) {
      if (!mutes[id]) continue
      if (Date.now() > mutes[id]) { delete mutes[id]; store.save(); continue }
      if (botIsAdmin(await getMeta(sock, from), sock)) await remove()
      return
    }
  }

  const slow = store.obj('slowmode')[from]
  const bot = store.is('antibot', from) && looksLikeBot(msg.key.id)
  if (!slow && !bot) return
  const meta = await getMeta(sock, from)
  if (isAdmin(meta, sender) || !botIsAdmin(meta, sock)) return

  if (bot) {
    await remove()
    if (notice(from + '|bot|' + ids[0])) await reply('🤖 Anti-bot: is group mein doosre bots allowed nahi.')
    return
  }
  const k = from + '|' + ids[0]
  const now = Date.now()
  if (now - (lastMsg.get(k) || 0) < slow * 1000) {
    await remove()
    if (notice('slow|' + k)) await reply(`🐢 Slow mode: ${slow} second mein ek message.`)
    return
  }
  if (lastMsg.size > 20000) lastMsg.clear()
  lastMsg.set(k, now)
}
