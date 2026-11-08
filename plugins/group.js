import { num, getContextInfo } from '../lib/helpers.js'

const targets = (msg, args) => {
  const ci = getContextInfo(msg)
  if (ci.mentionedJid?.length) return ci.mentionedJid
  if (ci.participant) return [ci.participant]
  return args.filter(a => /\d{6,}/.test(a)).map(a => a.replace(/\D/g, '') + '@s.whatsapp.net')
}

export default [
  { name: 'tagall', aliases: ['everyone'], category: 'group', group: true, admin: true,
    desc: 'Sab ko tag',
    async run ({ sock, from, text, msg }) {
      const meta = await sock.groupMetadata(from)
      const ids = meta.participants.map(p => p.id)
      const t = `📢 ${text || 'Attention'}\n\n` + meta.participants.map(p => `@${num(p.id)}`).join('\n')
      await sock.sendMessage(from, { text: t, mentions: ids }, { quoted: msg })
    } },
  { name: 'hidetag', aliases: ['htag'], category: 'group', group: true, admin: true,
    desc: 'Bina @ sab ko msg',
    async run ({ sock, from, text }) {
      const meta = await sock.groupMetadata(from)
      await sock.sendMessage(from, { text: text || '📢', mentions: meta.participants.map(p => p.id) })
    } },
  { name: 'kick', aliases: ['remove'], category: 'group', group: true, admin: true,
    desc: 'Member nikaalo',
    async run ({ sock, from, msg, args, reply }) {
      const t = targets(msg, args)
      if (!t.length) return reply('Kisi ko tag/reply karein ya number dein.')
      await sock.groupParticipantsUpdate(from, t, 'remove')
    } },
  { name: 'add', category: 'group', group: true, admin: true, desc: 'Number add karo',
    async run ({ sock, from, args, reply }) {
      const t = args.filter(a => /\d{6,}/.test(a)).map(a => a.replace(/\D/g, '') + '@s.whatsapp.net')
      if (!t.length) return reply('Number dein: .add 923001234567')
      const r = await sock.groupParticipantsUpdate(from, t, 'add')
      await reply(r.map(x => `${num(x.jid)}: ${x.status}`).join('\n'))
    } },
  { name: 'promote', category: 'group', group: true, owner: true, desc: 'Admin banao (sirf bot owner)',
    async run ({ sock, from, msg, args, reply }) {
      const t = targets(msg, args); if (!t.length) return reply('Tag/reply karein.')
      await sock.groupParticipantsUpdate(from, t, 'promote')
    } },
  { name: 'demote', category: 'group', group: true, owner: true, desc: 'Admin hatao (sirf bot owner)',
    async run ({ sock, from, msg, args, reply }) {
      const t = targets(msg, args); if (!t.length) return reply('Tag/reply karein.')
      await sock.groupParticipantsUpdate(from, t, 'demote')
    } }
]
