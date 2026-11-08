// Extra owner tools + profile pic
import { num, getContextInfo } from '../lib/helpers.js'

const target = (msg, args, fb) => {
  const ci = getContextInfo(msg)
  if (ci.mentionedJid?.length) return ci.mentionedJid[0]
  if (ci.participant) return ci.participant
  if (args[0] && /\d{6,}/.test(args[0])) return args[0].replace(/\D/g, '') + '@s.whatsapp.net'
  return fb
}

export default [
  { name: 'listgc', aliases: ['groups'], category: 'owner', owner: true, desc: 'Sab groups ki list',
    async run ({ sock, reply }) {
      const all = await sock.groupFetchAllParticipating()
      const list = Object.values(all)
      if (!list.length) return reply('Bot kisi group mein nahi.')
      let t = `👥 *${list.length} Groups:*\n\n`
      list.forEach((g, i) => { t += `${i + 1}. ${g.subject} (${g.participants.length})\n` })
      await reply(t.trim())
    } },
  { name: 'getpp', aliases: ['pp', 'avatar'], category: 'general', desc: 'Profile pic',
    async run ({ sock, msg, args, sender, from, reply }) {
      const t = target(msg, args, sender || from)
      try {
        const url = await sock.profilePictureUrl(t, 'image')
        await sock.sendMessage(from, { image: { url }, caption: `🖼️ ${num(t)}` }, { quoted: msg })
      } catch { await reply('Profile pic nahi mili (ya private hai).') }
    } }
]
