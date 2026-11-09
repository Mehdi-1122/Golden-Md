// Media converters — video→mp3, audio→voice note, video→gif (ffmpeg)
import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { getQuoted, getType } from '../../lib/helpers.js'

const tmp = (ext) => path.join(os.tmpdir(), `cv_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`)
const clean = (...f) => f.forEach(x => { try { fs.unlinkSync(x) } catch {} })
const ff = (args) => new Promise((res, rej) => {
  const p = spawn('ffmpeg', ['-y', ...args]); p.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg fail'))); p.on('error', rej)
})

// reply ki hui media (video/audio) ka buffer
async function media (sock, msg, kinds) {
  const q = getQuoted(msg)
  const target = q || msg
  const t = getType(target)
  if (!kinds.includes(t)) return null
  const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
  return { buf, type: t }
}

export default [
  { name: 'tomp3', aliases: ['toaudio', 'mp3'], category: 'media', desc: 'Video → mp3 (reply)',
    async run ({ sock, msg, from, reply }) {
      const m = await media(sock, msg, ['videoMessage', 'audioMessage'])
      if (!m) return reply('Kisi video/audio pe reply kar ke .tomp3 likhein.')
      const inp = tmp('dat'), out = tmp('mp3')
      try { fs.writeFileSync(inp, m.buf); await ff(['-i', inp, '-vn', '-ab', '128k', '-ar', '44100', out])
        await sock.sendMessage(from, { audio: fs.readFileSync(out), mimetype: 'audio/mpeg' }, { quoted: msg }) }
      catch (e) { await reply('⚠️ ' + e.message) } finally { clean(inp, out) }
    } },
  { name: 'tovn', aliases: ['vn', 'voice'], category: 'media', desc: 'Audio/video → voice note (reply)',
    async run ({ sock, msg, from, reply }) {
      const m = await media(sock, msg, ['videoMessage', 'audioMessage'])
      if (!m) return reply('Kisi audio/video pe reply kar ke .vn likhein.')
      const inp = tmp('dat'), out = tmp('ogg')
      try { fs.writeFileSync(inp, m.buf); await ff(['-i', inp, '-vn', '-c:a', 'libopus', '-b:a', '64k', '-ac', '1', out])
        await sock.sendMessage(from, { audio: fs.readFileSync(out), mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: msg }) }
      catch (e) { await reply('⚠️ ' + e.message) } finally { clean(inp, out) }
    } },
  { name: 'togif', aliases: ['gif'], category: 'media', desc: 'Video → GIF (chhota, reply)',
    async run ({ sock, msg, from, reply }) {
      const m = await media(sock, msg, ['videoMessage'])
      if (!m) return reply('Kisi video pe reply kar ke .togif likhein.')
      const inp = tmp('mp4'), out = tmp('mp4')
      try { fs.writeFileSync(inp, m.buf)
        // pehle 6 sec, chhota — WhatsApp "gif" asal mein muted mp4 hota hai
        await ff(['-i', inp, '-t', '6', '-an', '-vf', 'scale=320:-2', out])
        await sock.sendMessage(from, { video: fs.readFileSync(out), gifPlayback: true }, { quoted: msg }) }
      catch (e) { await reply('⚠️ ' + e.message) } finally { clean(inp, out) }
    } }
]
