// Downloaders — YouTube (yt-dlp + yt-search, no key) + TikTok (tikwm free API)
// NOTE: ffmpeg aur yt-dlp system par install hone chahiye (ya .env mein YTDLP=<poora path>).
import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import yts from 'yt-search'

const tmp = (ext) => path.join(os.tmpdir(), `gmd_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`)

const MB = 1048576
const MAX_AUDIO = 100 * MB, MAX_VIDEO = 60 * MB, MAX_DOC = 350 * MB

const YT_LINK = /^https?:\/\/([\w-]+\.)*(youtube\.com|youtu\.be)\/\S+$/i
const AUDIO_FORMAT = 'bestaudio/best'
// itag 18 = 360p mp4 (audio+video ek file mein)
const VIDEO_FORMAT = '18/b[ext=mp4][height<=480]/b[ext=mp4]'

// yt-dlp se download; { file, title } wapas. Had se bari file par yt-dlp khud ruk jata hai.
const ytDownload = (url, format, max) => new Promise((res, rej) => {
  const template = tmp('%(ext)s')
  const base = template.slice(0, -'%(ext)s'.length)
  const p = spawn(process.env.YTDLP || 'yt-dlp', [
    '--no-playlist', '--no-warnings', '--js-runtimes', `node:${process.execPath}`,
    '-f', format, '--max-filesize', String(max),
    '--print', 'after_move:title', '-o', template, '--', url
  ])
  let out = '', err = ''
  p.stdout.on('data', d => { out += d })
  p.stderr.on('data', d => { err += d })
  p.on('error', () => rej(new Error('yt-dlp install nahi hai (pip install "yt-dlp[default]")')))
  p.on('close', code => {
    const dir = os.tmpdir()
    const found = fs.readdirSync(dir).map(x => path.join(dir, x)).filter(x => x.startsWith(base))
    const file = code === 0 && found.find(x => !x.endsWith('.part'))
    if (file) return res({ file, title: out.trim().split('\n').pop() })
    clean(...found)
    // exit 0 aur file nahi = --max-filesize ne rok diya
    rej(new Error(code === 0
      ? `File ${max / MB}MB se bari hai, nahi bhej sakta.`
      : err.split('\n').find(l => /error/i.test(l))?.slice(0, 200) || 'Download nahi ho saka'))
  })
})

const toMp3 = (inp, out, seconds) => new Promise((res, rej) => {
  const ff = spawn('ffmpeg', ['-y', '-i', inp, ...(seconds ? ['-t', String(seconds)] : []), '-vn', '-ab', '128k', '-ar', '44100', out])
  ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg fail')))
  ff.on('error', rej)
})

const clean = (...f) => f.forEach(x => { try { fs.unlinkSync(x) } catch {} })

// YouTube gaane ka shuru ka hissa mp3 buffer mein (menu ke gaane ke liye)
export async function ytAudioClip (url, seconds) {
  const { file } = await ytDownload(url, AUDIO_FORMAT, MAX_AUDIO)
  const mp3 = tmp('mp3')
  try {
    await toMp3(file, mp3, seconds)
    return fs.readFileSync(mp3)
  } finally { clean(file, mp3) }
}

async function sendYtAudio ({ sock, from, msg }, url) {
  const { file, title } = await ytDownload(url, AUDIO_FORMAT, MAX_AUDIO)
  const mp3 = tmp('mp3')
  try {
    await toMp3(file, mp3)
    await sock.sendMessage(from, { audio: fs.readFileSync(mp3), mimetype: 'audio/mpeg', fileName: title + '.mp3' }, { quoted: msg })
  } finally { clean(file, mp3) }
}

export default [
  { name: 'play', aliases: ['song', 'ytplay'], category: 'download', desc: 'Gaana naam se',
    async run ({ text, sock, from, msg, reply }) {
      if (!text) return reply('.play <gaana ka naam>')
      const r = await yts(text)
      const v = r.videos?.[0]
      if (!v) return reply('Kuch nahi mila.')
      await reply(`🎵 *${v.title}*\n⏱️ ${v.timestamp} • 👁️ ${v.views}\nDownload ho raha hai...`)
      await sendYtAudio({ sock, from, msg }, v.url)
    } },
  { name: 'ytmp3', aliases: ['yta'], category: 'download', desc: 'YouTube link → mp3',
    async run ({ text, sock, from, msg, reply }) {
      const url = (text || '').trim()
      if (!YT_LINK.test(url)) return reply('.ytmp3 <youtube link>')
      await reply('🎵 Audio download ho raha hai...')
      await sendYtAudio({ sock, from, msg }, url)
    } },
  { name: 'ytmp4', aliases: ['ytv', 'video'], category: 'download', desc: 'YouTube link → video (360p)',
    async run ({ text, sock, from, msg, reply }) {
      const url = (text || '').trim()
      if (!YT_LINK.test(url)) return reply('.ytmp4 <youtube link>')
      await reply('🎬 Video download ho raha hai (360p)...')
      const { file: mp4, title } = await ytDownload(url, VIDEO_FORMAT, MAX_VIDEO)
      try {
        const size = fs.statSync(mp4).size
        if (size > 60 * 1024 * 1024) return reply('⚠️ Video bohot bada hai (60MB+), WhatsApp pe nahi bhej sakta.')
        await sock.sendMessage(from, { video: fs.readFileSync(mp4), caption: title }, { quoted: msg })
      } finally { clean(mp4) }
    } },
  { name: 'yts', aliases: ['ytsearch', 'search'], category: 'download', desc: 'Naam se YouTube par dhoondo',
    async run ({ text, reply }) {
      if (!text) return reply('.yts <gaana / drama / video ka naam>')
      const r = await yts(text)
      const vids = (r.videos || []).slice(0, 6)
      if (!vids.length) return reply('Kuch nahi mila.')
      let t = `🔎 *Results:* ${text}\n\n`
      vids.forEach((v, i) => { t += `${i + 1}. *${v.title}*\n   ⏱️ ${v.timestamp} • 👁️ ${v.views}\n   ${v.url}\n\n` })
      t += 'Download: .ytmp4 <link> (video)  ya  .ytmp3 <link> (audio)'
      await reply(t.trim())
    } },
  { name: 'vid', aliases: ['playvid', 'videoplay'], category: 'download', desc: 'Naam se video download',
    async run ({ text, sock, from, msg, reply }) {
      if (!text) return reply('.vid <naam>')
      const r = await yts(text)
      const v = r.videos?.[0]
      if (!v) return reply('Kuch nahi mila.')
      if (v.seconds > 2700) // ~45 min+ (drama/movie) ko inline video ki jagah .drama (document) se bhejo
        return reply(`⚠️ *${v.title}* lamba hai (${v.timestamp}).\nFull episode file ke liye: *.drama ${text}*\n🎵 Audio: .ytmp3 ${v.url}\n🔗 ${v.url}`)
      await reply(`🎬 *${v.title}* (${v.timestamp}) download ho raha hai...`)
      const { file: mp4 } = await ytDownload(v.url, VIDEO_FORMAT, MAX_VIDEO)
      try {
        if (fs.statSync(mp4).size > 60 * 1024 * 1024)
          return reply(`⚠️ Video bada hai (60MB+), nahi bhej sakta.\n🔗 ${v.url}`)
        await sock.sendMessage(from, { video: fs.readFileSync(mp4), caption: v.title }, { quoted: msg })
      } finally { clean(mp4) }
    } },
  { name: 'drama', aliases: ['episode', 'movie'], category: 'download', desc: 'Drama/episode naam se (file)',
    async run ({ text, sock, from, msg, reply }) {
      if (!text) return reply('.drama <naam>   misal: .drama Tere Bin episode 1')
      const r = await yts(text)
      const v = r.videos?.[0]
      if (!v) return reply('Kuch nahi mila.')
      await reply(`🎬 *${v.title}* (${v.timestamp})\n⬇️ Download ho raha hai... lamba ho to kuch minute lag sakte hain.`)
      const { file: mp4 } = await ytDownload(v.url, VIDEO_FORMAT, MAX_DOC)   // 360p mp4 (audio+video)
      try {
        const size = fs.statSync(mp4).size
        const mb = (size / 1048576).toFixed(0)
        if (size > 350 * 1024 * 1024)  // WhatsApp document ki practical had
          return reply(`⚠️ File bohot bari hai (~${mb}MB) — WhatsApp pe nahi ja sakti.\n🔗 Dekhein: ${v.url}`)
        // Document ke roop mein — isse video se bari file ja sakti hai
        await sock.sendMessage(from, {
          document: { url: mp4 }, mimetype: 'video/mp4',
          fileName: (v.title.replace(/[^\w\s-]+/g, '').trim() || 'drama') + '.mp4'
        }, { quoted: msg })
        await reply(`✅ Bhej diya (~${mb}MB): ${v.title}`)
      } finally { clean(mp4) }
    } },
  { name: 'spotify', aliases: ['spdl', 'sp'], category: 'download', desc: 'Spotify link ya naam se gaana',
    async run ({ text, sock, from, msg, reply }) {
      if (!text) return reply('.spotify <gaana ya spotify link>')
      let q = text.trim()
      if (/^https?:\/\/open\.spotify\.com\/(intl-[a-z]+\/)?track\/\S+$/i.test(q)) {
        const r = await fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(q))
        if (!r.ok) return reply('Spotify link se gaana nahi mila.')
        q = (await r.json()).title
      }
      const v = (await yts(q)).videos?.[0]   // Spotify audio nahi deta, wahi gaana YouTube se
      if (!v) return reply('Kuch nahi mila.')
      await reply(`🎧 *${v.title}*\n⏱️ ${v.timestamp}\nDownload ho raha hai...`)
      await sendYtAudio({ sock, from, msg }, v.url)
    } },
  { name: 'tiktok', aliases: ['tt', 'tiktokdl'], category: 'download', desc: 'TikTok bina watermark',
    async run ({ text, sock, from, msg, reply }) {
      if (!/tiktok\.com/.test(text || '')) return reply('.tiktok <tiktok link>')
      const r = await fetch('https://tikwm.com/api/?url=' + encodeURIComponent(text))
      const j = await r.json()
      if (!j?.data?.play) return reply('Download nahi ho saka.')
      await sock.sendMessage(from, { video: { url: j.data.play }, caption: j.data.title || '🎬 TikTok' }, { quoted: msg })
    } }
]
