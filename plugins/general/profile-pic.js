// Kisi ki profile picture dekho
import { num, getContextInfo } from '../../lib/helpers.js'

const target = (msg, args, fb) => {
  const ci = getContextInfo(msg)
  if (ci.mentionedJid?.length) return ci.mentionedJid[0]
  if (ci.participant) return ci.participant
  if (args[0] && /\d{6,}/.test(args[0])) return args[0].replace(/\D/g, '') + '@s.whatsapp.net'
  return fb
}

export default [
  { name: 'getpp', aliases: ['pp', 'avatar'], category: 'general', desc: 'Profile pic',
    async run ({ sock, msg, args, sender, from, reply }) {
      const t = target(msg, args, sender || from)
      try {
        const url = await sock.profilePictureUrl(t, 'image')
        await sock.sendMessage(from, { image: { url }, caption: `🖼️ ${num(t)}` }, { quoted: msg })
      } catch { await reply('Profile pic nahi mili (ya private hai).') }
    } }
]
