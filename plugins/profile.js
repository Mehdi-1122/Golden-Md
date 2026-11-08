// Profile picture set — bot ki DP + group ki photo
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { getQuoted, getType, num } from '../lib/helpers.js'

// reply ki hui image ya caption wali image ka buffer
async function imageBuffer (sock, msg) {
  const q = getQuoted(msg)
  const target = q && q.message.imageMessage ? q : msg
  if (getType(target) !== 'imageMessage') return null
  return downloadMediaMessage(target, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
}

export default [
  { name: 'setpp', aliases: ['setdp', 'setbotpp'], category: 'owner', owner: true,
    desc: 'Bot ki profile pic (SIRF asal owner)',
    async run ({ sock, msg, isRealOwner, reply }) {
      // DP sirf asal owner badal sake — sudo users bhi nahi
      if (!isRealOwner)
        return reply('🔒 Bot ki DP sirf asal owner badal sakta hai.')
      const buf = await imageBuffer(sock, msg)
      if (!buf) return reply('Kisi *image* pe reply kar ke .setpp likhein.')
      const me = num(sock.user.id) + '@s.whatsapp.net'
      await sock.updateProfilePicture(me, buf)
      await reply('✅ Bot ki profile pic lag gayi.')
    } },
  { name: 'setppgc', aliases: ['gcpp', 'setgrouppp'], category: 'group', group: true, admin: true,
    desc: 'Group ki photo (image pe reply)',
    async run ({ sock, msg, from, reply }) {
      const buf = await imageBuffer(sock, msg)
      if (!buf) return reply('Kisi *image* pe reply kar ke .setppgc likhein.')
      await sock.updateProfilePicture(from, buf)
      await reply('✅ Group ki photo lag gayi.')
    } }
]
