// Sticker se video, photo/video compress, photo crop
import fs from 'fs'
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { getQuoted, getType } from '../../lib/helpers.js'
import { tmp, clean, ff } from '../../lib/media-tools.js'

const CROPS = {
  square: "crop='min(iw,ih)':'min(iw,ih)'",
  wide: "crop='min(iw,ih*16/9)':'min(iw*9/16,ih)'",
  story: "crop='min(iw,ih*9/16)':'min(iw*16/9,ih)'"
}

const download = (sock, target) => downloadMediaMessage(target, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })

// ffmpeg ko input de kar output wapas (temp files khud saaf)
async function convert (input, inExt, outExt, args, before = []) {
  const inp = tmp(inExt), out = tmp(outExt)
  try {
    fs.writeFileSync(inp, input)
    await ff([...before, '-i', inp, ...args, out])
    return fs.readFileSync(out)
  } finally { clean(inp, out) }
}

export const cropImage = (buf, shape) => convert(buf, 'jpg', 'jpg', ['-vf', CROPS[shape], '-frames:v', '1', '-q:v', '2'])
export const compressImage = (buf) => convert(buf, 'jpg', 'jpg', ['-vf', "scale='min(1280,iw)':-2", '-frames:v', '1', '-q:v', '12'])
export const compressVideo = (buf) => convert(buf, 'mp4', 'mp4', ['-vf', "scale=-2:'min(480,ih)'", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '64k'])
export const stickerToVideo = (buf) => convert(buf, 'webp', 'mp4', ['-t', '3', '-r', '15', '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:white,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast'], ['-loop', '1'])

const size = (b) => (b.length / 1048576).toFixed(2) + ' MB'

export default [
  { name: 'tovideo', aliases: ['tomp4', 'stickervideo'], category: 'media', desc: 'Sticker se video (reply)',
    async run ({ sock, msg, from, reply }) {
      const q = getQuoted(msg)
      if (!q?.message?.stickerMessage) return reply('Kisi sticker par reply kar ke .tovideo likho.')
      const buf = await download(sock, q)
      if (buf.includes('ANMF')) return reply('⚠️ Animated sticker abhi support nahi, sirf saada sticker chalta hai.')
      await sock.sendMessage(from, { video: await stickerToVideo(buf) }, { quoted: msg })
    } },
  { name: 'compress', aliases: ['shrink', 'chhota'], category: 'media', desc: 'Photo ya video ka size kam (reply)',
    async run ({ sock, msg, from, reply }) {
      const q = getQuoted(msg)
      const target = q || msg
      const t = getType(target)
      if (t !== 'imageMessage' && t !== 'videoMessage') return reply('Kisi photo ya video par reply kar ke .compress likho.')
      await reply('🗜️ Size kam ho raha hai...')
      const buf = await download(sock, target)
      if (t === 'videoMessage' && buf.length > 60 * 1048576) return reply('⚠️ Video 60MB se bari hai.')
      const res = t === 'imageMessage' ? await compressImage(buf) : await compressVideo(buf)
      const caption = `✅ ${size(buf)} → ${size(res)}`
      await sock.sendMessage(from, t === 'imageMessage' ? { image: res, caption } : { video: res, caption }, { quoted: msg })
    } },
  { name: 'crop', category: 'media', desc: 'Photo crop (.crop square / wide / story)',
    async run ({ sock, msg, from, args, reply }) {
      const shape = (args[0] || 'square').toLowerCase()
      if (!Object.hasOwn(CROPS, shape)) return reply('.crop square   ya   .crop wide   ya   .crop story')
      const q = getQuoted(msg)
      const target = q?.message?.imageMessage ? q : msg
      if (getType(target) !== 'imageMessage') return reply('Kisi photo par reply kar ke .crop likho.')
      await sock.sendMessage(from, { image: await cropImage(await download(sock, target), shape), caption: `✂️ ${shape}` }, { quoted: msg })
    } }
]
