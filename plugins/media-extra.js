// .vv — reply kiye hue view-once media ko reveal karo (on-demand)
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { getQuoted } from '../lib/helpers.js'

export default [
  { name: 'vv', aliases: ['reveal', 'viewonce'], category: 'media',
    desc: 'View-once media kholo (reply karke)',
    async run ({ sock, msg, from, reply }) {
      const q = getQuoted(msg)
      const vo = q?.message?.viewOnceMessageV2 || q?.message?.viewOnceMessage || q?.message?.viewOnceMessageV2Extension
      if (!vo) return reply('Kisi *view-once* photo/video pe reply kar ke .vv likhein.')
      const inner = vo.message || {}
      const kind = Object.keys(inner)[0]
      try {
        const buf = await downloadMediaMessage({ key: q.key, message: inner }, 'buffer', {},
          { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
        const caption = inner[kind]?.caption || '👁️ Revealed'
        if (kind === 'imageMessage') await sock.sendMessage(from, { image: buf, caption }, { quoted: msg })
        else if (kind === 'videoMessage') await sock.sendMessage(from, { video: buf, caption }, { quoted: msg })
        else if (kind === 'audioMessage') await sock.sendMessage(from, { audio: buf, mimetype: 'audio/mp4' }, { quoted: msg })
        else await reply('Is type ko reveal nahi kar sakta.')
      } catch (e) { await reply('⚠️ ' + e.message) }
    } }
]
