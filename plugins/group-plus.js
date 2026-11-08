// Group plus — rules, antifake, inactive members, autoreply
import store from '../lib/store.js'
import { num, botIsAdmin } from '../lib/helpers.js'
import { toggleRun } from '../lib/buttons.js'

const sleep = ms => new Promise(r => setTimeout(r, ms))
const DAY = 86400000

// group ke wo members jo N din se nahi bole (tracking shuru hone ke baad)
async function inactiveList (sock, gid, days) {
  const meta = await sock.groupMetadata(gid)
  const seen = store.obj('lastseen')[gid] || {}
  const me = num(sock.user?.id)
  return meta.participants.filter(p => {
    const n = num(p.id)
    if (n === me || p.admin) return false
    const t = seen[n] || seen[num(p.jid || '')] || seen[num(p.lid || '')]
    return !t || Date.now() - t > days * DAY
  }).map(p => p.id)
}

export default [
  { name: 'rules', aliases: ['qawaid', 'grouprules'], category: 'group', group: true, desc: 'Group ke rules',
    async run ({ from, reply, config }) {
      const r = store.obj('rules')[from]
      await reply(r ? `📜 *Group Rules*\n\n${r}` : `Abhi koi rules nahi. Admin set karein: ${config.prefix}setrules <rules>`)
    } },
  { name: 'setrules', category: 'group', group: true, admin: true, desc: 'Rules set (naye member ko khud jayenge)',
    async run ({ from, text, reply }) {
      if (!text) return reply('.setrules 1. Gaali nahi\n2. Links nahi\n3. Izzat se baat')
      store.obj('rules')[from] = text; store.save()
      await reply('✅ Rules set — naya member aaye ga to usay rules bhi milenge.')
    } },
  { name: 'delrules', category: 'group', group: true, admin: true, desc: 'Rules hatao',
    async run ({ from, reply }) { delete store.obj('rules')[from]; store.save(); await reply('✅ Rules hata diye.') } },

  { name: 'antifake', aliases: ['antiforeign'], category: 'safety', group: true, admin: true,
    desc: 'Bahar ke numbers join par kick (.fakecode 92)',
    run: (ctx) => toggleRun(ctx, { key: 'antifake', label: 'Anti-fake',
      on: `✅ Anti-fake ON — sirf +${store.obj('fakecode')[ctx.from] || '92'} wale numbers reh sakte hain (bot admin hona chahiye).` }) },
  { name: 'fakecode', category: 'safety', group: true, admin: true, desc: 'Antifake ke allowed country codes',
    async run ({ from, args, reply }) {
      const codes = args.join(',').split(',').map(c => c.replace(/\D/g, '')).filter(Boolean)
      if (!codes.length) return reply(`Abhi: +${store.obj('fakecode')[from] || '92'}\nBadlo: .fakecode 92,971`)
      store.obj('fakecode')[from] = codes.join(','); store.save()
      await reply('✅ Allowed: ' + codes.map(c => '+' + c).join(', '))
    } },

  { name: 'inactive', aliases: ['silent', 'chup'], category: 'group', group: true, admin: true, desc: 'Jo N din se chup hain (.inactive 30)',
    async run ({ sock, from, args, reply }) {
      const days = parseInt(args[0]) || 30
      const list = await inactiveList(sock, from, days)
      if (!list.length) return reply(`✅ Sab ne pichle ${days} din mein baat ki hai.`)
      await reply(`😶 *${days} din se chup (${list.length})*\n\n${list.slice(0, 80).map(j => '@' + num(j)).join('\n')}\n\n_Note: count tab se hai jab se bot is group mein messages dekh raha hai._\nNikaalne ke liye: .kickinactive ${days} confirm`, { mentions: list.slice(0, 80) })
    } },
  { name: 'kickinactive', category: 'group', group: true, admin: true, desc: 'Chup members nikaalo (confirm ke saath)',
    async run ({ sock, from, args, reply }) {
      const days = parseInt(args[0]) || 30
      const list = await inactiveList(sock, from, days)
      if (!list.length) return reply('Koi inactive nahi.')
      if (args[1] !== 'confirm') return reply(`⚠️ ${list.length} members nikal jayenge (${days} din se chup).\nPakka? Likho: .kickinactive ${days} confirm`)
      if (!botIsAdmin(await sock.groupMetadata(from), sock)) return reply('❌ Bot admin nahi hai.')
      await reply(`🧹 ${list.length} members nikaal raha hoon...`)
      let ok = 0
      for (let i = 0; i < list.length; i += 5) {
        try { await sock.groupParticipantsUpdate(from, list.slice(i, i + 5), 'remove'); ok += list.slice(i, i + 5).length } catch {}
        await sleep(2000)
      }
      await reply(`✅ ${ok} inactive members nikaal diye.`)
    } },

  { name: 'autoreply', aliases: ['ar', 'addreply'], category: 'group', admin: true, desc: 'Lafz par auto jawab (.autoreply hi = salam)',
    async run ({ from, text, reply }) {
      const [k, ...v] = (text || '').split('=')
      const key = (k || '').trim().toLowerCase(), val = v.join('=').trim()
      if (!key || !val) return reply('.autoreply hi = Walaikum salam! 👋\nList: .autoreplylist • Hatao: .delautoreply hi')
      const all = store.obj('autoreply'); (all[from] ||= {})[key] = val; store.save()
      await reply(`✅ Ab koi "*${key}*" likhega to jawab: ${val}`)
    } },
  { name: 'delautoreply', aliases: ['delar'], category: 'group', admin: true, desc: 'Auto jawab hatao',
    async run ({ from, text, reply }) {
      const g = store.obj('autoreply')[from] || {}
      const key = (text || '').trim().toLowerCase()
      if (!g[key]) return reply('Ye lafz list mein nahi.')
      delete g[key]; store.save(); await reply('✅ Hata diya: ' + key)
    } },
  { name: 'autoreplylist', aliases: ['arlist'], category: 'group', desc: 'Auto jawab ki list',
    async run ({ from, reply }) {
      const g = Object.entries(store.obj('autoreply')[from] || {})
      await reply(g.length ? '🤖 *Auto Replies*\n\n' + g.map(([k, v]) => `• ${k} → ${v}`).join('\n') : 'Koi auto reply nahi.')
    } }
]

// har message: last seen + autoreply
export async function hook ({ from, sender, isGroup, body, msg, reply, config }) {
  if (msg.key.fromMe) return
  if (isGroup) { const ls = store.obj('lastseen'); (ls[from] ||= {})[num(sender)] = Date.now(); store.save() }
  const t = (body || '').trim().toLowerCase()
  if (!t || t.startsWith(config.prefix)) return
  const list = store.obj('autoreply')[from]
  if (list && Object.hasOwn(list, t)) await reply(list[t])
}

// group join: antifake + rules
export async function onGroup (sock, { id, participants, action }) {
  if (action !== 'add') return
  let jids = participants.map(p => typeof p === 'string' ? p : p.id)
  if (store.is('antifake', id)) {
    const codes = (store.obj('fakecode')[id] || '92').split(',')
    // @lid wale numbers ka country pata nahi chalta, unhe chhod do
    const bad = jids.filter(j => j.endsWith('@s.whatsapp.net') && !codes.some(c => num(j).startsWith(c)))
    if (bad.length && botIsAdmin(await sock.groupMetadata(id), sock)) {
      await sock.groupParticipantsUpdate(id, bad, 'remove')
      await sock.sendMessage(id, { text: `🚫 Anti-fake: ${bad.map(j => '+' + num(j)).join(', ')} nikaale gaye (sirf +${codes.join(', +')} allowed).` })
      jids = jids.filter(j => !bad.includes(j))
    }
  }
  const rules = store.obj('rules')[id]
  if (rules && jids.length) await sock.sendMessage(id, { text: `📜 ${jids.map(j => '@' + num(j)).join(' ')} — group ke rules:\n\n${rules}`, mentions: jids })
}
