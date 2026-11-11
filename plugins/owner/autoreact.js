// .autoreact on/off — aane wale har message par khud random emoji react
// .autoreact here — sirf is chat mein on/off
import { toggleRun } from '../../lib/buttons.js'

const EMOJIS = ['❤️', '😂', '🔥', '👍', '😍', '🥰', '😎', '💯', '✨', '🤩', '👏', '😁', '🙌', '💖', '🌸', '⭐', '🤍', '💫']
const pick = a => a[Math.floor(Math.random() * a.length)]

// har chat mein 2 second mein ek react (busy groups mein WhatsApp ban ka khatra kam)
const last = new Map()

export default [
  { name: 'autoreact', aliases: ['areact', 'autoreaction'], category: 'owner', owner: true,
    desc: 'Har message par auto emoji react on/off (.autoreact here = sirf is chat)',
    run: (ctx) => {
      if ((ctx.args[0] || '').toLowerCase() === 'here') {
        ctx.args = ctx.args.slice(1)
        return toggleRun(ctx, { key: 'autoreact', id: ctx.config.scope(ctx.from), label: 'Auto react (is chat)', perm: 'owner' })
      }
      return toggleRun(ctx, { key: 'autoreact', id: ctx.config.scope('global'), label: 'Auto react (sab chats)', perm: 'owner',
        on: '✅ Auto react ON — ab har message par emoji react hoga.', off: '❌ Auto react OFF.' })
    } }
]

export async function hook ({ sock, msg, from, body, config, store }) {
  if (msg.key.fromMe) return
  if (!store.is('autoreact', config.scope('global')) && !store.is('autoreact', config.scope(from))) return
  const m = msg.message || {}
  if (m.reactionMessage || m.protocolMessage || m.pollUpdateMessage) return
  if ((body || '').startsWith(config.prefix)) return   // commands par react nahi
  const now = Date.now()
  if (now - (last.get(from) || 0) < 2000) return
  if (last.size > 5000) last.clear()
  last.set(from, now)
  await sock.sendMessage(from, { react: { text: pick(EMOJIS), key: msg.key } })
}
