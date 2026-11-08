// View-once media ko normal media bana ke dobara bhejta hai (jab setting ON ho)
import { downloadMediaMessage } from '@whiskeysockets/baileys'

export async function hook (ctx) {
  const { msg, from, sock, store } = ctx
  if (!store.is('antiviewonce', from) && !store.is('antiviewonce', ctx.config.scope('global'))) return
  const vo = msg.message?.viewOnceMessageV2 || msg.message?.viewOnceMessage || msg.message?.viewOnceMessageV2Extension
  if (!vo) return
  const inner = vo.message || {}
  const kind = Object.keys(inner)[0]            // imageMessage / videoMessage / audioMessage
  if (!kind) return
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
