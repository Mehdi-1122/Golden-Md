// On/Off "buttons" — WhatsApp poll (✅ ON / ❌ OFF) bhejte hain; vote aate hi setting badal jati hai.
// (Purane WhatsApp buttons ab zyada tar phones par nazar nahi aate, poll har jagah chalta hai.)
import crypto from 'crypto'
import store from './store.js'
import { num, isAdmin } from './helpers.js'

const polls = new Map()   // poll message id -> { msg, chat, label, options, apply, perm, requester }
const sha = (s) => crypto.createHash('sha256').update(s).digest()

// session.js ka getMessage isse poll dhoondta hai (vote decrypt karne ke liye zaroori)
export const getPollMessage = (id) => polls.get(id)?.msg?.message

// poll bhejo; options[0] = ON (true), options[1] = OFF (false)
export async function sendToggle (ctx, { label, isOn, apply, perm = 'admin', options = ['✅ ON', '❌ OFF'], state }) {
  const { sock, from, msg, config } = ctx
  const now = state || (isOn ? 'ON ✅' : 'OFF ❌')
  const sent = await sock.sendMessage(from, {
    poll: { name: `⚙️ ${label} — abhi: ${now}\nVote karo (ya ${config.prefix}${ctx.cmd?.name || ''} on/off)`, values: options, selectableCount: 1 }
  }, { quoted: msg })
  polls.set(sent.key.id, { msg: sent, chat: from, label, options, apply, perm, requester: ctx.sender })
  if (polls.size > 300) polls.delete(polls.keys().next().value)
}

// store wali seedhi toggle: .cmd on / .cmd off / .cmd (poll button)
export async function toggleRun (ctx, { key, id = ctx.from, label, perm = 'admin', on, off }) {
  const v = (ctx.args[0] || '').toLowerCase()
  const apply = (s) => s ? store.on(key, id) : store.off(key, id)
  if (v === 'on') { apply(true); return ctx.reply(on || `✅ ${label} ON`) }
  if (v === 'off') { apply(false); return ctx.reply(off || `❌ ${label} OFF`) }
  return sendToggle(ctx, { label, isOn: store.is(key, id), apply, perm })
}

// session.js: poll par vote aaya
export async function handleVote (sock, key, update, isOwner) {
  const p = polls.get(key.id)
  if (!p) return
  for (const u of update.pollUpdates || []) {
    const sel = u.vote?.selectedOptions?.[0]
    if (!sel) continue
    const idx = p.options.findIndex(o => Buffer.from(sel).equals(sha(o)))
    if (idx < 0) continue
    const vk = u.pollUpdateMessageKey || {}
    const voter = vk.participant || vk.remoteJid
    let ok = vk.fromMe || isOwner(voter) || isOwner(vk.participantPn || voter) || num(voter) === num(p.requester)
    if (!ok && p.perm === 'admin' && p.chat.endsWith('@g.us')) {
      try { ok = isAdmin(await sock.groupMetadata(p.chat), voter) } catch {}
    }
    if (!ok) {
      await sock.sendMessage(p.chat, { text: `⛔ @${num(voter)} — ${p.label} sirf ${p.perm === 'owner' ? 'owner' : 'admin'} badal sakta hai.`, mentions: [voter] })
      continue
    }
    await p.apply(idx === 0)
    await sock.sendMessage(p.chat, { text: `${idx === 0 ? '✅' : '❌'} *${p.label}*: ${p.options[idx].replace(/^\W+\s*/, '')}${vk.fromMe ? '' : ` (@${num(voter)})`}`, mentions: vk.fromMe ? [] : [voter] })
  }
}
