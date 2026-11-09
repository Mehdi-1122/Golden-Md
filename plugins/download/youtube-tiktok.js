// Downloaders — YouTube (ytdl + yt-search, no key) + TikTok (tikwm free API)
// NOTE: ffmpeg system par install hona chahiye (audio convert ke liye).
import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import ytdl from '@distube/ytdl-core'
import yts from 'yt-search'

const tmp = (ext) => path.join(os.tmpdir(), `gmd_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`)

const MB = 1048576
const MAX_AUDIO = 100 * MB, MAX_VIDEO = 60 * MB, MAX_DOC = 350 * MB

// had se bari file poori download hone se pehle hi rok do
const stream2file = (stream, file, max) => new Promise((res, rej) => {
  const w = fs.createWriteStream(file)
  let got = 0
  stream.on('data', d => {
    got += d.length
    if (got > max) { const e = new Error(`File ${max / MB}MB se bari hai, nahi bhej sakta.`); rej(e); stream.destroy(); w.destroy() }
  })
  stream.pipe(w); w.on('finish', res); w.on('error', rej); stream.on('error', rej)
})

const toMp3 = (inp, out) => new Promise((res, rej) => {
  const ff = spawn('ffmpeg', ['-y', '-i', inp, '-vn', '-ab', '128k', '-ar', '44100', out])
  ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg fail')))
  ff.on('error', rej)
})

const clean = (...f) => f.forEach(x => { try { fs.unlinkSync(x) } catch {} })

export default [
  { name: 'play', aliases: ['song', 'ytplay'], category: 'download', desc: 'Gaana naam se',
    async run ({ text, sock, from, msg, reply }) {
      if (!text) return reply('.play <gaana ka naam>')
      const r = await yts(text)
      const v = r.videos?.[0]
      if (!v) return reply('Kuch nahi mila.')
      await reply(`🎵 *${v.title}*\n⏱️ ${v.timestamp} • 👁️ ${v.views}\nDownload ho raha hai...`)
      const webm = tmp('webm'), mp3 = tmp('mp3')
      try {
        await stream2file(ytdl(v.url, { filter: 'audioonly', quality: 'highestaudio' }), webm, MAX_AUDIO)
        await toMp3(webm, mp3)
        await sock.sendMessage(from, { audio: fs.readFileSync(mp3), mimetype: 'audio/mpeg', fileName: v.title + '.mp3' }, { quoted: msg })
      } finally { clean(webm, mp3) }
    } },
  { name: 'ytmp3', aliases: ['yta'], category: 'download', desc: 'YouTube link → mp3',
    async run ({ text, sock, from, msg, reply }) {
      if (!ytdl.validateURL(text)) return reply('.ytmp3 <youtube link>')
      await reply('🎵 Audio download ho raha hai...')
      const webm = tmp('webm'), mp3 = tmp('mp3')
      try {
        const info = await ytdl.getInfo(text)
        await stream2file(ytdl(text, { filter: 'audioonly', quality: 'highestaudio' }), webm, MAX_AUDIO)
        await toMp3(webm, mp3)
        await sock.sendMessage(from, { audio: fs.readFileSync(mp3), mimetype: 'audio/mpeg', fileName: info.videoDetails.title + '.mp3' }, { quoted: msg })
      } finally { clean(webm, mp3) }
    } },
  { name: 'ytmp4', aliases: ['ytv', 'video'], category: 'download', desc: 'YouTube link → video (360p)',
    async run ({ text, sock, from, msg, reply }) {
      if (!ytdl.validateURL(text)) return reply('.ytmp4 <youtube link>')
      await reply('🎬 Video download ho raha hai (360p)...')
      const mp4 = tmp('mp4')
      try {
        const info = await ytdl.getInfo(text)
        // itag 18 = 360p mp4 (audio+video ek file mein)
        await stream2file(ytdl(text, { quality: '18' }), mp4, MAX_VIDEO)
        const size = fs.statSync(mp4).size
        if (size > 60 * 1024 * 1024) return reply('⚠️ Video bohot bada hai (60MB+), WhatsApp pe nahi bhej sakta.')
        await sock.sendMessage(from, { video: fs.readFileSync(mp4), caption: info.videoDetails.title }, { quoted: msg })
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
      const mp4 = tmp('mp4')
      try {
        await stream2file(ytdl(v.url, { quality: '18' }), mp4, MAX_VIDEO)
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
      const mp4 = tmp('mp4')
      try {
        await stream2file(ytdl(v.url, { quality: '18' }), mp4, MAX_DOC)   // 360p mp4 (audio+video)
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
      const webm = tmp('webm'), mp3 = tmp('mp3')
      try {
        await stream2file(ytdl(v.url, { filter: 'audioonly', quality: 'highestaudio' }), webm, MAX_AUDIO)
        await toMp3(webm, mp3)
        await sock.sendMessage(from, { audio: fs.readFileSync(mp3), mimetype: 'audio/mpeg', fileName: v.title + '.mp3' }, { quoted: msg })
      } finally { clean(webm, mp3) }
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
