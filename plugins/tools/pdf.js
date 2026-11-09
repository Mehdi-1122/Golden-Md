// Photos se PDF: .pdfadd (photo par reply) phir .pdf
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { PDFDocument } from 'pdf-lib'
import { getQuoted, getType } from '../../lib/helpers.js'

const MAX_PAGES = 20
const queues = new Map()    // "chat|sender" -> { images, t }

export async function imagesToPdf (images) {
  const pdf = await PDFDocument.create()
  for (const buf of images) {
    const isPng = buf[0] === 0x89 && buf[1] === 0x50
    const img = isPng ? await pdf.embedPng(buf) : await pdf.embedJpg(buf)
    pdf.addPage([img.width, img.height]).drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
  }
  return Buffer.from(await pdf.save())
}

async function photoOf (sock, msg) {
  const q = getQuoted(msg)
  const target = q?.message?.imageMessage ? q : msg
  if (getType(target) !== 'imageMessage') return null
  return downloadMediaMessage(target, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
}

const keyOf = (from, sender) => `${from}|${sender}`
function queueOf (k) {
  for (const [key, v] of queues) if (Date.now() - v.t > 1800000) queues.delete(key)
  if (!queues.has(k)) queues.set(k, { images: [], t: Date.now() })
  return queues.get(k)
}

export default [
  { name: 'pdfadd', aliases: ['addpdf'], category: 'tools', desc: 'Photo PDF list mein daalo (reply)',
    async run ({ sock, msg, from, sender, reply }) {
      const buf = await photoOf(sock, msg)
      if (!buf) return reply('Kisi photo par reply kar ke .pdfadd likho.')
      const q = queueOf(keyOf(from, sender))
      if (q.images.length >= MAX_PAGES) return reply(`Zyada se zyada ${MAX_PAGES} photos. Ab .pdf likho.`)
      q.images.push(buf); q.t = Date.now()
      await reply(`📄 Page ${q.images.length} add ho gaya. Aur photos ke liye .pdfadd, bana ne ke liye .pdf`)
    } },
  { name: 'pdf', aliases: ['topdf', 'makepdf'], category: 'tools', desc: 'Photos se PDF (.pdf naam)',
    async run ({ sock, msg, from, sender, text, reply }) {
      const k = keyOf(from, sender)
      const images = [...(queues.get(k)?.images || [])]
      if (getQuoted(msg)?.message?.imageMessage && images.length < MAX_PAGES) images.push(await photoOf(sock, msg))
      if (!images.length) return reply('Kisi photo par reply kar ke .pdf likho, ya pehle .pdfadd se photos jama karo.')
      const document = await imagesToPdf(images)
      queues.delete(k)
      const name = (text || 'Golden-MD').replace(/[^\w\s-]/g, '').trim().slice(0, 40) || 'Golden-MD'
      await sock.sendMessage(from, { document, mimetype: 'application/pdf', fileName: name + '.pdf', caption: `📄 ${images.length} page ki PDF` }, { quoted: msg })
    } },
  { name: 'pdfclear', aliases: ['clearpdf'], category: 'tools', desc: 'PDF list khali karo',
    async run ({ from, sender, reply }) { queues.delete(keyOf(from, sender)); await reply('🗑️ PDF list khali.') } }
]
