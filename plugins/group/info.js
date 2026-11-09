// Extra group tools
import { num, getContextInfo, getQuoted } from '../../lib/helpers.js'

const target = (msg, args) => {
  const ci = getContextInfo(msg)
  if (ci.mentionedJid?.length) return ci.mentionedJid[0]
  if (ci.participant) return ci.participant
  if (args[0] && /\d{6,}/.test(args[0])) return args[0].replace(/\D/g, '') + '@s.whatsapp.net'
  return null
}

export default [
  { name: 'gcinfo', aliases: ['groupinfo'], category: 'group', group: true, desc: 'Group ki info',
    async run ({ sock, from, reply }) {
      const m = await sock.groupMetadata(from)
      const admins = m.participants.filter(p => p.admin).length
      await reply(`👥 *${m.subject}*\n🆔 ${m.id}\n👤 Members: ${m.participants.length}\n🛡️ Admins: ${admins}\n👑 Owner: ${m.owner ? num(m.owner) : 'N/A'}\n📝 ${m.desc || '(no description)'}`)
    } },
  { name: 'listadmin', aliases: ['admins'], category: 'group', group: true, desc: 'Admins ki list',
    async run ({ sock, from, reply }) {
      const m = await sock.groupMetadata(from)
      const ad = m.participants.filter(p => p.admin)
      await reply('🛡️ *Admins:*\n' + ad.map(p => `• @${num(p.id)}`).join('\n'), { mentions: ad.map(p => p.id) })
    } },
  { name: 'del', aliases: ['delete'], category: 'group', group: true, admin: true, desc: 'Reply kiya msg delete',
    async run ({ sock, from, msg, reply }) {
      const q = getQuoted(msg)
      if (!q) return reply('Jo message delete karna hai uspe reply karein.')
      await sock.sendMessage(from, { delete: q.key })
    } },
  { name: 'jid', aliases: ['id'], category: 'general', desc: 'Chat/user ka JID',
    async run ({ from, sender, reply }) { await reply(`💬 Chat: ${from}\n👤 Sender: ${sender || from}`) } },
  { name: 'getbio', aliases: ['bio'], category: 'general', desc: 'Kisi ki WhatsApp bio',
    async run ({ sock, msg, args, sender, reply }) {
      const t = target(msg, args) || sender
      try { const r = await sock.fetchStatus(t); await reply(`📝 Bio of ${num(t)}:\n${r?.[0]?.status?.status || '(khali)'}`) }
      catch { await reply('Bio nahi mili.') }
    } }
]
