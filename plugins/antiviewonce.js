// View-once media ko normal media bana ke dobara bhejta hai (jab setting ON ho)
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { getType, viewOnceInner } from '../lib/helpers.js'

export async function hook (ctx) {
  const { msg, from, sock, store } = ctx
  if (!store.is('antiviewonce', from) && !store.is('antiviewonce', ctx.config.scope('global'))) return
  const inner = viewOnceInner(msg.message)
  if (!inner) return
  const kind = getType({ message: inner })      // imageMessage / videoMessage / audioMessage
  if (!kind || !inner[kind]?.mediaKey) return
  try {
    const buf = await downloadMediaMessage({ key: msg.key, message: inner }, 'buffer', {},
      { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
    const caption = inner[kind]?.caption || '👁️ View-once'
    if (kind === 'imageMessage') await sock.sendMessage(from, { image: buf, caption }, { quoted: msg })
    else if (kind === 'videoMessage') await sock.sendMessage(from, { video: buf, caption }, { quoted: msg })
    else if (kind === 'audioMessage') await sock.sendMessage(from, { audio: buf, mimetype: 'audio/mp4' }, { quoted: msg })
  } catch (e) { console.error('viewonce:', e.message) }
}

export default []
