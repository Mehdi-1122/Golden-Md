// Message parsing + permission helpers
import { getContentType } from '@whiskeysockets/baileys'

export const num = (jid = '') => String(jid).split('@')[0].split(':')[0]

// disappearing chats mein asal message ephemeralMessage ke andar hota hai
export function unwrapMsg (msg) {
  const inner = msg.message?.ephemeralMessage?.message
  if (inner) msg.message = inner
  return msg
}

export function getText (msg) {
  const m = msg.message || {}
  return m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId || ''
}

export function getType (msg) {
  return getContentType(msg.message || {}) || ''   // senderKeyDistributionMessage ko chhod kar asal type
}

export function getContextInfo (msg) {
  const m = msg.message || {}
  return m[getContentType(m)]?.contextInfo || {}
}

export function getQuoted (msg) {
  const ci = getContextInfo(msg)
  if (!ci.quotedMessage) return null
  return {
    key: { remoteJid: msg.key.remoteJid, id: ci.stanzaId, participant: ci.participant, fromMe: false },
    message: ci.quotedMessage
  }
}

// View-once ka asal content: purana wrapper, ya naya imageMessage { viewOnce: true }
export function viewOnceInner (message) {
  if (!message) return null
  if (message.ephemeralMessage?.message) return viewOnceInner(message.ephemeralMessage.message)
  const wrap = message.viewOnceMessageV2 || message.viewOnceMessage || message.viewOnceMessageV2Extension
  if (wrap?.message) return wrap.message
  for (const k of ['imageMessage', 'videoMessage', 'audioMessage']) {
    if (message[k]?.viewOnce) return { [k]: message[k] }
  }
  return null
}

export function fmtUptime (start) {
  const s = Math.floor((Date.now() - start) / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${d ? d + 'd ' : ''}${h}h ${m}m ${s % 60}s`
}

// "Message yourself" chat ka address. Naye accounts par WhatsApp apne aap ko LID se pehchanta hai;
// phone-number wale address par bheja message phone par "Waiting for this message" ban jata hai.
// SELF_CHAT_PN=1 = purana tareeqa (number wala address)
export const selfJid = (sock) => {
  const lid = sock.user?.lid
  if (lid && process.env.SELF_CHAT_PN !== '1') return num(lid) + '@lid'
  return num(sock.user?.id) + '@s.whatsapp.net'
}

export const findPart = (meta, jid) =>
  meta.participants.find(p => [p.id, p.jid, p.lid].includes(jid))

export const isAdmin = (meta, jid) => {
  const p = findPart(meta, jid)
  return p?.admin === 'admin' || p?.admin === 'superadmin'
}

// bot khud is group mein admin hai?
export const botIsAdmin = (meta, sock) => {
  const me = [num(sock.user?.id), num(sock.user?.lid || '')].filter(Boolean)
  const p = meta.participants.find(x => [x.id, x.jid, x.lid].some(j => j && me.includes(num(j))))
  return p?.admin === 'admin' || p?.admin === 'superadmin'
}

// reply kiye hue message ka text
export const quotedText = (msg) => {
  const q = getQuoted(msg)
  return q ? getText(q) : ''
}
