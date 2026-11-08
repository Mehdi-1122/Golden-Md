// Media plus — removebg, emojimix, brat sticker, blur, grayscale, circle sticker, meme
// NOTE: brat/blur/grayscale/circle ke liye ffmpeg; removebg ke liye REMOVEBG_API_KEY (remove.bg)
import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import wsf from 'wa-sticker-formatter'
import { getQuoted, getType } from '../lib/helpers.js'

const Sticker = wsf.Sticker || wsf.default?.Sticker
const StickerTypes = wsf.StickerTypes || wsf.default?.StickerTypes

const tmp = (e) => path.join(os.tmpdir(), `mp_${Date.now()}_${Math.random().toString(36).slice(2)}.${e}`)
const clean = (...f) => f.forEach(x => { try { fs.unlinkSync(x) } catch {} })
const ff = (a) => new Promise((res, rej) => { const p = spawn('ffmpeg', ['-y', ...a]); p.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg fail'))); p.on('error', () => rej(new Error('ffmpeg install nahi hai'))) })

const FONTS = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
  '/System/Library/Fonts/Supplemental/Arial.ttf',
  'C:/Windows/Fonts/arial.ttf'
]
// ffmpeg filter mein Windows drive ka ":" escape karna padta hai
const font = () => FONTS.find(f => { try { return fs.existsSync(f) } catch { return false } })?.replace(/^([A-Z]):/, '$1\\:')

const sticker = async (buf, msg) => new Sticker(buf, { pack: process.env.STICKER_PACK || 'Golden MD', author: msg.pushName || 'Golden MD', type: StickerTypes.FULL, quality: 70 }).toBuffer()

// reply ki hui ya caption wali image ka buffer
async function getImage (sock, msg) {
  const q = getQuoted(msg)
  const target = q?.message?.imageMessage ? q : msg
  if (getType(target) !== 'imageMessage') return null
  return downloadMediaMessage(target, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
}

// image par ffmpeg filter laga kar bhejo
const effect = (name, aliases, desc, vf, asSticker = false) => ({
  name, aliases, category: 'media', desc,
  async run ({ sock, msg, from, reply }) {
    const buf = await getImage(sock, msg)
    if (!buf) return reply(`Kisi photo ko reply kar ke .${name} likho`)
    const inp = tmp('jpg'), out = tmp(asSticker ? 'png' : 'jpg')
    try {
      fs.writeFileSync(inp, buf)
      await ff(['-i', inp, '-vf', vf, ...(asSticker ? [] : ['-q:v', '2']), out])
      const res = fs.readFileSync(out)
      await sock.sendMessage(from, asSticker ? { sticker: await sticker(res, msg) } : { image: res, caption: '✨ ' + name }, { quoted: msg })
    } catch (e) { await reply('⚠️ ' + e.message) } finally { clean(inp, out) }
  }
})

const KITCHEN = ['20201001', '20210218', '20210521', '20210831', '20211115', '20220110', '20220203', '20220406', '20220506', '20220815',
  '20220823', '20221101', '20221107', '20230126', '20230127', '20230216', '20230221', '20230301', '20230418', '20230426', '20230613',
  '20230803', '20230818', '20230821', '20231113', '20231128', '20240206', '20240214', '20240530', '20240610', '20240715', '20241021', '20241023']
const cp = (e) => [...e].map(c => 'u' + c.codePointAt(0).toString(16)).join('-')

function wrap (text, max) {
  const lines = []; let line = ''
  for (const w of text.split(/\s+/)) {
    if ((line + ' ' + w).trim().length > max) { if (line) lines.push(line); line = w } else line = (line + ' ' + w).trim()
  }
  if (line) lines.push(line)
  return lines
}

export default [
  { name: 'removebg', aliases: ['nobg', 'rmbg'], category: 'media', desc: 'Photo ka background hatao',
    async run ({ sock, msg, from, reply }) {
      if (!process.env.REMOVEBG_API_KEY) return reply('⚠️ .env mein REMOVEBG_API_KEY daalein (free: https://www.remove.bg/api)')
      const buf = await getImage(sock, msg)
      if (!buf) return reply('Kisi photo ko reply kar ke .removebg likho')
      await reply('✂️ Background hat raha hai...')
      const form = new FormData()
      form.append('image_file_b64', buf.toString('base64')); form.append('size', 'auto')
      const r = await fetch('https://api.remove.bg/v1.0/removebg', { method: 'POST', headers: { 'X-Api-Key': process.env.REMOVEBG_API_KEY }, body: form })
      if (!r.ok) return reply('⚠️ remove.bg: ' + ((await r.json().catch(() => ({}))).errors?.[0]?.title || r.status))
      const png = Buffer.from(await r.arrayBuffer())
      await sock.sendMessage(from, { document: png, mimetype: 'image/png', fileName: 'nobg.png' }, { quoted: msg })
      await sock.sendMessage(from, { sticker: await sticker(png, msg) }, { quoted: msg })
    } },
  { name: 'emojimix', aliases: ['emix', 'mix'], category: 'media', desc: 'Do emoji mila kar sticker (.emojimix 😂+🔥)',
    async run ({ text, sock, from, msg, reply }) {
      const [a, b] = (text || '').split(/[+\s]+/).filter(Boolean)
      if (!a || !b) return reply('.emojimix 😂+🔥')
      const urls = []
      for (const d of KITCHEN) for (const [x, y] of [[cp(a), cp(b)], [cp(b), cp(a)]])
        urls.push(`https://www.gstatic.com/android/keyboard/emojikitchen/${d}/${x}/${x}_${y}.png`)
      const found = (await Promise.all(urls.map(u => fetch(u, { method: 'HEAD' }).then(r => r.ok ? u : null).catch(() => null)))).find(Boolean)
      if (!found) return reply('❌ In dono emoji ka mix nahi bana. Koi aur try karo.')
      const buf = Buffer.from(await (await fetch(found)).arrayBuffer())
      await sock.sendMessage(from, { sticker: await sticker(buf, msg) }, { quoted: msg })
    } },
  { name: 'brat', aliases: ['bratsticker'], category: 'media', desc: 'Brat style text sticker',
    async run ({ text, sock, from, msg, reply }) {
      if (!text) return reply('.brat <text>')
      const f = font()
      if (!f) return reply('⚠️ Server par font nahi mila (fonts-dejavu install karein).')
      const lines = wrap(text.toLowerCase().slice(0, 80), 12)
      const size = Math.max(36, Math.min(110, Math.floor(460 / (Math.max(...lines.map(l => l.length)) * 0.55)), Math.floor(460 / (lines.length * 1.25))))
      const t = tmp('txt'), png = tmp('png')
      try {
        fs.writeFileSync(t, lines.join('\n'))
        const tf = t.replace(/\\/g, '/').replace(/^([A-Z]):/, '$1\\:')
        await ff(['-f', 'lavfi', '-i', 'color=c=white:s=512x512', '-vf',
          `drawtext=fontfile='${f}':textfile='${tf}':expansion=none:fontcolor=black:fontsize=${size}:line_spacing=8:x=28:y=28,boxblur=2:1`, '-frames:v', '1', png])
        await sock.sendMessage(from, { sticker: await sticker(fs.readFileSync(png), msg) }, { quoted: msg })
      } catch (e) { await reply('⚠️ ' + e.message) } finally { clean(t, png) }
    } },
  effect('blur', ['blurimg'], 'Photo blur', 'boxblur=10:2'),
  effect('grayscale', ['gray', 'bw'], 'Photo black & white', 'hue=s=0'),
  effect('circle', ['round', 'circlesticker'], 'Gol sticker (photo)',
    "crop='min(iw,ih)':'min(iw,ih)',scale=512:512,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte(hypot(X-W/2,Y-H/2),W/2),255,0)'", true),
  { name: 'meme', aliases: ['memes'], category: 'media', desc: 'Random meme (.meme / .meme <subreddit>)',
    async run ({ text, sock, from, msg, reply }) {
      const sub = (text || '').trim().replace(/^r\//, '')
      for (let i = 0; i < 3; i++) {
        const r = await fetch('https://meme-api.com/gimme' + (sub ? '/' + encodeURIComponent(sub) : ''))
        const j = await r.json().catch(() => ({}))
        if (!r.ok || !j.url) return reply('Meme nahi mila' + (sub ? ` (r/${sub})` : '') + '.')
        if (j.nsfw) continue
        return sock.sendMessage(from, { image: { url: j.url }, caption: `😂 ${j.title}\n👍 ${j.ups ?? ''} • r/${j.subreddit}` }, { quoted: msg })
      }
      await reply('Saaf meme nahi mila, dobara try karo.')
    } }
]
