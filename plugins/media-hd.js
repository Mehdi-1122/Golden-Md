// .hd — image ko 2x upscale + sharpen (HD jaisa), ffmpeg se
import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { getQuoted, getType } from '../lib/helpers.js'

const tmp = (e) => path.join(os.tmpdir(), `hd_${Date.now()}_${Math.random().toString(36).slice(2)}.${e}`)
const clean = (...f) => f.forEach(x => { try { fs.unlinkSync(x) } catch {} })
const ff = (a) => new Promise((res, rej) => { const p = spawn('ffmpeg', ['-y', ...a]); p.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg fail'))); p.on('error', rej) })

export default [
  { name: 'hd', aliases: ['remini', 'enhance', 'upscale'], category: 'media',
    desc: 'Image HD/clear (reply)',
    async run ({ sock, msg, from, reply }) {
      const q = getQuoted(msg)
      const target = q && q.message.imageMessage ? q : msg
      if (getType(target) !== 'imageMessage') return reply('Kisi image pe reply/caption mein .hd likhein.')
      await reply('✨ Image HD ho rahi hai...')
      const inp = tmp('jpg'), out = tmp('jpg')
      try {
        const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
        fs.writeFileSync(inp, buf)
        await ff(['-i', inp, '-vf', 'scale=iw*2:ih*2:flags=lanczos,unsharp=5:5:1.2:5:5:0.0', '-q:v', '2', out])
        await sock.sendMessage(from, { image: fs.readFileSync(out), caption: '✨ HD' }, { quoted: msg })
      } catch (e) { await reply('⚠️ ' + e.message) } finally { clean(inp, out) }
    } }
]
