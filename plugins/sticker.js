// Sticker tools (needs ffmpeg installed on the system)
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import wsf from 'wa-sticker-formatter'
import { getQuoted, getType } from '../lib/helpers.js'

const Sticker = wsf.Sticker || wsf.default?.Sticker
const StickerTypes = wsf.StickerTypes || wsf.default?.StickerTypes

export default [
  { name: 'sticker', aliases: ['s', 'stiker'], category: 'media', desc: 'Image/video → sticker (apne naam ka)',
    async run ({ sock, msg, from, text, reply }) {
      const q = getQuoted(msg)
      const target = q && (q.message.imageMessage || q.message.videoMessage) ? q : msg
      const t = getType(target)
      if (t !== 'imageMessage' && t !== 'videoMessage')
        return reply('Kisi image/video pe reply kar ke .sticker likhein.')
      const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
      // Public mein har banda apne naam ka sticker: pack = diya gaya text ya uska WhatsApp naam
      const pack = (text && text.trim()) || msg.pushName || process.env.STICKER_PACK || 'Golden MD'
      const sticker = new Sticker(buf, {
        pack,
        author: msg.pushName || process.env.STICKER_AUTHOR || 'Golden MD',
        type: StickerTypes.FULL, quality: 60
      })
      await sock.sendMessage(from, { sticker: await sticker.toBuffer() }, { quoted: msg })
    } },
  { name: 'take', aliases: ['steal', 'rename'], category: 'media', desc: 'Sticker ka pack naam badlo',
    async run ({ sock, msg, from, text, reply }) {
      const q = getQuoted(msg)
      if (!q?.message?.stickerMessage) return reply('Sticker pe reply karein: .take MyPack')
      const buf = await downloadMediaMessage(q, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
      const s = new Sticker(buf, { pack: text || 'Golden MD', author: process.env.STICKER_AUTHOR || 'Golden MD', type: StickerTypes.FULL })
      await sock.sendMessage(from, { sticker: await s.toBuffer() }, { quoted: msg })
    } },
  { name: 'toimg', aliases: ['toimage'], category: 'media', desc: 'Sticker → image',
    async run ({ sock, msg, from, reply }) {
      const q = getQuoted(msg)
      if (!q?.message?.stickerMessage) return reply('Sticker pe reply karein.')
      const buf = await downloadMediaMessage(q, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
      await sock.sendMessage(from, { image: buf, caption: '🖼️' }, { quoted: msg })
    } }
]
