// .vv — reply kiye hue view-once media ko reveal karo (on-demand)
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { getQuoted, getType, viewOnceInner } from '../../lib/helpers.js'

export default [
  { name: 'vv', aliases: ['reveal', 'viewonce'], category: 'media',
    desc: 'View-once media kholo (reply karke)',
    async run ({ sock, msg, from, reply }) {
      const q = getQuoted(msg)
      const inner = viewOnceInner(q?.message)
      if (!inner) return reply('Kisi *view-once* photo/video pe reply kar ke .vv likhein.')
      const kind = getType({ message: inner })
      if (!inner[kind]?.mediaKey) return reply('⚠️ WhatsApp ne is view-once ki media linked device ko nahi di, is liye khul nahi sakti.')
      try {
        const buf = await downloadMediaMessage({ key: q.key, message: inner }, 'buffer', {},
          { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
        const caption = [inner[kind]?.caption, '*POWERED BY MEHDI KING*'].filter(Boolean).join('\n\n')
        if (kind === 'imageMessage') await sock.sendMessage(from, { image: buf, caption }, { quoted: msg })
        else if (kind === 'videoMessage') await sock.sendMessage(from, { video: buf, caption }, { quoted: msg })
        else if (kind === 'audioMessage') await sock.sendMessage(from, { audio: buf, mimetype: 'audio/mp4' }, { quoted: msg })
        else await reply('Is type ko reveal nahi kar sakta.')
      } catch (e) { await reply('⚠️ ' + e.message) }
    } }
]
