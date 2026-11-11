// Status saver
// 1) Aap (bot wala number) kisi ke status par "save" reply karo → woh status aap ke "Message yourself" inbox mein aa jata hai.
// 2) .autosend on → koi aap ke status par "send" / "save" reply kare to bot use woh status uske inbox mein bhej deta hai.
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { toggleRun } from '../../lib/buttons.js'
import { num, getContextInfo, viewOnceInner, selfJid } from '../../lib/helpers.js'

const TRIGGER = /^(save|sv|send|snd|sendme|send me|bhejo|bhej do|bhejdo|de do|dedo|status)[\s!.]*$/i

async function sendStatus (sock, to, ci, note) {
  let qm = ci.quotedMessage
  qm = viewOnceInner(qm) || qm
  const key = { remoteJid: 'status@broadcast', id: ci.stanzaId, participant: ci.participant, fromMe: false }
  const kind = ['imageMessage', 'videoMessage', 'audioMessage'].find(k => qm[k])
  if (!kind) {
    const t = qm.extendedTextMessage?.text || qm.conversation
    if (!t) throw new Error('Is status ko save nahi kar sakta.')
    return sock.sendMessage(to, { text: `${note}\n\n${t}` })
  }
  const buf = await downloadMediaMessage({ key, message: { [kind]: qm[kind] } }, 'buffer', {},
    { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
  const caption = [note, qm[kind].caption].filter(Boolean).join('\n\n')
  if (kind === 'imageMessage') return sock.sendMessage(to, { image: buf, caption })
  if (kind === 'videoMessage') return sock.sendMessage(to, { video: buf, caption })
  return sock.sendMessage(to, { audio: buf, mimetype: qm[kind].mimetype || 'audio/mp4', ptt: !!qm[kind].ptt })
}

export default [
  { name: 'autosend', aliases: ['statussend', 'stsend'], category: 'owner', owner: true,
    desc: 'Koi aap ke status par "send" likhe to bot use status bhej de (on/off)',
    run: (ctx) => toggleRun(ctx, { key: 'autosend', id: ctx.config.scope('global'), label: 'Status auto-send', perm: 'owner',
      on: '✅ Ab koi aap ke status par "send" ya "save" reply karega to bot use woh status bhej dega.', off: '❌ Status auto-send OFF.' }) }
]

export async function hook ({ sock, msg, from, body, config, store }) {
  const text = (body || '').trim()
  if (!text || text.length > 20 || !TRIGGER.test(text)) return
  const ci = getContextInfo(msg)
  if (ci.remoteJid !== 'status@broadcast' || !ci.quotedMessage) return
  const me = [num(sock.user?.id), num(sock.user?.lid || '')].filter(Boolean)
  const statusIsMine = me.includes(num(ci.participant))

  try {
    if (msg.key.fromMe && !statusIsMine) {
      // owner ne kisi aur ke status par "save" likha → apne inbox mein
      const selfChat = selfJid(sock)
      await sendStatus(sock, selfChat, ci, `📥 Status saved — @${num(ci.participant)}`)
    } else if (!msg.key.fromMe && statusIsMine && store.is('autosend', config.scope('global'))) {
      // kisi ne bot wale ka status maanga → uske inbox mein
      await sendStatus(sock, from, ci, '📤 Yeh lo status 😊')
    }
  } catch (e) { console.error('status save:', e.message) }
}
