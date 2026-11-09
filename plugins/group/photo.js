// Group ki photo set karo
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { getQuoted, getType } from '../../lib/helpers.js'

export default [
  { name: 'setppgc', aliases: ['gcpp', 'setgrouppp'], category: 'group', group: true, admin: true,
    desc: 'Group ki photo (image pe reply)',
    async run ({ sock, msg, from, reply }) {
      const q = getQuoted(msg)
      const target = q && q.message.imageMessage ? q : msg
      if (getType(target) !== 'imageMessage') return reply('Kisi *image* pe reply kar ke .setppgc likhein.')
      const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
      await sock.updateProfilePicture(from, buf)
      await reply('✅ Group ki photo lag gayi.')
    } }
]
