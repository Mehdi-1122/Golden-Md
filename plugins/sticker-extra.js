// .ttp — text ko sticker banao (ffmpeg drawtext)
import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import wsf from 'wa-sticker-formatter'

const Sticker = wsf.Sticker || wsf.default?.Sticker
const StickerTypes = wsf.StickerTypes || wsf.default?.StickerTypes

const FONTS = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
  '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
  '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
]
const font = () => FONTS.find(f => { try { return fs.existsSync(f) } catch { return false } })

const tmp = (ext) => path.join(os.tmpdir(), `ttp_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`)
const clean = (...f) => f.forEach(x => { try { fs.unlinkSync(x) } catch {} })

// lambe text ko lines mein todo taake sticker mein fit ho
function wrap (text, max = 11) {
  const words = text.split(/\s+/)
  const lines = []; let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) { if (line) lines.push(line); line = w }
    else line = (line + ' ' + w).trim()
  }
  if (line) lines.push(line)
  return lines
}

const render = (txtFile, out, ff, fontsize) => new Promise((res, rej) => {
  const vf = `drawtext=fontfile=${ff}:textfile=${txtFile}:expansion=none:fontcolor=white:fontsize=${fontsize}:borderw=6:bordercolor=black:line_spacing=14:x=(w-text_w)/2:y=(h-text_h)/2,format=rgba`
  const p = spawn('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'color=c=black@0.0:s=512x512', '-vf', vf, '-frames:v', '1', out])
  p.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg fail')))
  p.on('error', rej)
})

export default [
  { name: 'ttp', aliases: ['texttosticker'], category: 'media', desc: 'Text → sticker',
    async run ({ text, sock, from, msg, reply }) {
      if (!text) return reply('.ttp <text>')
      const ff = font()
      if (!ff) return reply('⚠️ Server par font nahi mila (ttp ke liye fonts-dejavu install karein).')
      const t = tmp('txt'), png = tmp('png')
      try {
        const lines = wrap(text.slice(0, 60))
        const maxLen = Math.max(...lines.map(l => l.length), 1)
        // auto font size: lambai aur lines ke hisaab se fit karo
        let fontsize = Math.min(Math.floor(440 / (maxLen * 0.6)), Math.floor(430 / lines.length), 120)
        fontsize = Math.max(fontsize, 28)
        fs.writeFileSync(t, lines.join('\n'))
        await render(t, png, ff, fontsize)
        const s = new Sticker(fs.readFileSync(png), { pack: 'Golden MD', author: msg.pushName || 'Golden MD', type: StickerTypes.FULL })
        await sock.sendMessage(from, { sticker: await s.toBuffer() }, { quoted: msg })
      } catch (e) { await reply('⚠️ ' + e.message) }
      finally { clean(t, png) }
    } }
]
