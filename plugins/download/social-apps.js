// Downloader extra — Instagram, Facebook, Pinterest (yt-dlp), lyrics (lrclib), APK (Aptoide)
// NOTE: ig/fb/pin ke liye system par yt-dlp install hona chahiye (pip install yt-dlp)
//       ya .env mein YTDLP=<poora path> do.
import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

const MAX = 60 * 1024 * 1024
const DOC_MAX = 100 * 1024 * 1024

// yt-dlp se file download; downloaded file ka path wapas
const ytdlp = (url) => new Promise((res, rej) => {
  const base = path.join(os.tmpdir(), `gmd_${Date.now()}_${Math.random().toString(36).slice(2)}`)
  const p = spawn(process.env.YTDLP || 'yt-dlp', ['--no-playlist', '-f', 'best[ext=mp4]/best', '--max-filesize', '60M', '-o', base + '.%(ext)s', '--', url])
  let err = ''
  p.stderr.on('data', d => { err += d })
  p.on('error', () => rej(new Error('yt-dlp install nahi hai (pip install yt-dlp)')))
  p.on('close', () => {
    const f = fs.readdirSync(os.tmpdir()).find(x => path.join(os.tmpdir(), x).startsWith(base))
    f ? res(path.join(os.tmpdir(), f)) : rej(new Error(err.split('\n').find(l => l.includes('ERROR'))?.slice(0, 150) || 'Download nahi ho saka'))
  })
})

// file ko type ke hisaab se bhejo, phir delete
async function sendFile ({ sock, from, msg }, file, caption) {
  try {
    if (fs.statSync(file).size > MAX) throw new Error('File 60MB se bari hai.')
    const buf = fs.readFileSync(file)
    const isImg = /\.(jpe?g|png|webp)$/i.test(file)
    await sock.sendMessage(from, isImg ? { image: buf, caption } : { video: buf, caption }, { quoted: msg })
  } finally { try { fs.unlinkSync(file) } catch {} }
}

const linkCmd = (name, aliases, re, label, desc) => ({
  name, aliases, category: 'download', desc,
  async run (ctx) {
    const url = (ctx.text || '').trim()
    if (!re.test(url)) return ctx.reply(`.${name} <${label} link>`)
    await ctx.reply(`⬇️ ${label} se download ho raha hai...`)
    await sendFile(ctx, await ytdlp(url), `📥 ${label}`)
  }
})

export default [
  linkCmd('ig', ['insta', 'instagram', 'igdl', 'reel'], /^https?:\/\/([\w-]+\.)*instagram\.com\/\S*$/i, 'Instagram', 'Instagram reel/video'),
  linkCmd('fb', ['facebook', 'fbdl'], /^https?:\/\/([\w-]+\.)*(facebook\.com|fb\.watch)\/\S*$/i, 'Facebook', 'Facebook video'),
  linkCmd('twitter', ['x', 'tw', 'twdl'], /^https?:\/\/([\w-]+\.)*(twitter\.com|x\.com)\/\S*$/i, 'Twitter/X', 'Twitter/X video'),
  linkCmd('threads', ['thdl'], /^https?:\/\/([\w-]+\.)*threads\.(net|com)\/\S*$/i, 'Threads', 'Threads video'),
  { name: 'pin', aliases: ['pinterest'], category: 'download', desc: 'Pinterest pin (link) ya search',
    async run (ctx) {
      const t = (ctx.text || '').trim()
      if (!t) return ctx.reply('.pin <pinterest link>   ya   .pin <search>')
      if (/^https?:\/\/([\w-]+\.)*(pinterest\.[a-z.]+|pin\.it)\/\S*$/i.test(t)) {
        await ctx.reply('⬇️ Pinterest se download ho raha hai...')
        return sendFile(ctx, await ytdlp(t), '📌 Pinterest')
      }
      await ctx.reply(`📌 *${t}* — Pinterest search:\nhttps://www.pinterest.com/search/pins/?q=${encodeURIComponent(t)}\n\nKoi pin pasand aaye to uska link: .pin <link>\nYa AI image: .img ${t}`)
    } },
  { name: 'mediafire', aliases: ['mf', 'mfdl'], category: 'download', desc: 'MediaFire file (100MB tak)',
    async run ({ text, sock, from, msg, reply }) {
      const url = (text || '').trim()
      if (!/^https?:\/\/(www\.)?mediafire\.com\/\S+$/i.test(url)) return reply('.mediafire <mediafire link>')
      const page = await (await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } })).text()
      const link = /href="(https:\/\/download\d*\.mediafire\.com\/[^"]+)"/.exec(page)?.[1]
      if (!link) return reply('File nahi mili (link ghalat ya file delete ho chuki).')
      const head = await fetch(link, { method: 'HEAD', headers: { 'user-agent': 'Mozilla/5.0' } })
      const len = +head.headers.get('content-length') || 0
      if (len > DOC_MAX) return reply(`⚠️ File ${(len / 1048576).toFixed(0)}MB ki hai, had 100MB hai.\n${url}`)
      const fileName = decodeURIComponent(link.split('/').pop())
      await reply(`⬇️ *${fileName}* bhej raha hoon...`)
      await sock.sendMessage(from, { document: { url: link }, mimetype: head.headers.get('content-type') || 'application/octet-stream', fileName }, { quoted: msg })
    } },
  { name: 'gdrive', aliases: ['drive', 'gd'], category: 'download', desc: 'Google Drive file (100MB tak, public)',
    async run ({ text, sock, from, msg, reply }) {
      const t = (text || '').trim()
      if (!/^https?:\/\/(drive|docs)\.google\.com\//i.test(t)) return reply('.gdrive <google drive link>')
      const id = /\/d\/([\w-]{10,})/.exec(t)?.[1] || /[?&]id=([\w-]{10,})/.exec(t)?.[1]
      if (!id) return reply('Is link mein file nahi mili.')
      const link = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`
      const r = await fetch(link, { headers: { 'user-agent': 'Mozilla/5.0' } })
      const type = r.headers.get('content-type') || ''
      r.body?.cancel().catch(() => {})
      if (!r.ok || type.includes('text/html')) return reply('⚠️ File public nahi hai, ya Drive ne roka hai. Link par "Anyone with the link" lagao.')
      const len = +r.headers.get('content-length') || 0
      if (len > DOC_MAX) return reply(`⚠️ File ${(len / 1048576).toFixed(0)}MB ki hai, had 100MB hai.`)
      const fileName = /filename="([^"]+)"/.exec(r.headers.get('content-disposition') || '')?.[1] || 'drive-file'
      await reply(`⬇️ *${fileName}* bhej raha hoon...`)
      await sock.sendMessage(from, { document: { url: link }, mimetype: type || 'application/octet-stream', fileName }, { quoted: msg })
    } },
  { name: 'lyrics', aliases: ['lyric', 'lirik'], category: 'download', desc: 'Gaane ke lyrics',
    async run ({ text, reply }) {
      if (!text) return reply('.lyrics <gaana>   misal: .lyrics tum hi ho')
      const r = await fetch('https://lrclib.net/api/search?q=' + encodeURIComponent(text))
      const j = await r.json()
      if (!Array.isArray(j)) return reply('⚠️ Lyrics server busy hai, thori der baad try karo.')
      const s = j.find(x => x.plainLyrics)
      if (!s) return reply('Lyrics nahi mile.')
      const body = s.plainLyrics.length > 3500 ? s.plainLyrics.slice(0, 3500) + '\n...' : s.plainLyrics
      await reply(`🎤 *${s.trackName}* — ${s.artistName}\n\n${body}`)
    } },
  { name: 'apk', aliases: ['app', 'apkdl'], category: 'download', desc: 'Android app (APK) — search, phir package se download',
    async run ({ text, sock, from, msg, reply }) {
      if (!text) return reply('.apk <app ka naam>   misal: .apk capcut')
      const q = text.trim()
      // package naam (com.whatsapp) => seedha download
      if (/^[a-z][\w]*(\.[\w]+)+$/i.test(q)) {
        const r = await fetch('https://ws75.aptoide.com/api/7/app/getMeta?package_name=' + encodeURIComponent(q))
        const a = (await r.json())?.data
        if (!a?.file?.path) return reply('App nahi mili.')
        if (a.file.malware?.rank && a.file.malware.rank !== 'TRUSTED') return reply(`⚠️ Is APK par malware warning hai (${a.file.malware.rank}) — nahi bheji.`)
        const mb = (a.size / 1048576).toFixed(1)
        await reply(`📱 *${a.name}*\n📦 ${a.package}\n🔖 v${a.file.vername}\n💾 ${mb} MB\n⬇️ Downloads: ${a.stats?.downloads ?? '-'}`)
        if (a.size > 100 * 1024 * 1024) return reply('⚠️ 100MB se bari hai, link se lo:\n' + a.file.path)
        return sock.sendMessage(from, { document: { url: a.file.path }, mimetype: 'application/vnd.android.package-archive', fileName: `${a.name}.apk` }, { quoted: msg })
      }
      // naam => list (nakli uploads: v999, chhota size, malware warning chhod kar)
      const r = await fetch('https://ws75.aptoide.com/api/7/apps/search?limit=15&query=' + encodeURIComponent(q))
      const list = ((await r.json())?.datalist?.list || [])
        .filter(x => x.size > 1048576 && !/^9{3}/.test(x.file?.vername || '') && (x.file?.malware?.rank || 'TRUSTED') === 'TRUSTED')
        .sort((x, y) => (y.stats?.downloads || 0) - (x.stats?.downloads || 0)).slice(0, 5)
      if (!list.length) return reply('App nahi mili.')
      const t = list.map((a, i) => `${i + 1}. *${a.name}*\n   📦 ${a.package}\n   🔖 v${a.file.vername} • ${(a.size / 1048576).toFixed(0)}MB • ⬇️ ${a.stats?.downloads ?? '-'}`).join('\n\n')
      await reply(`🔎 *${q}* — results:\n\n${t}\n\nDownload: *.apk <package>*  misal: .apk ${list[0].package}\n⚠️ Package dhyan se dekho — nakli apps se bacho.`)
    } }
]
