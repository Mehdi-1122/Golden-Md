// Chatbot mode — owner on kare to bot har banda ko funny jawab de (group + inbox)
import store from '../lib/store.js'
import { toggleRun } from '../lib/buttons.js'

const FUNNY = [
  'Hahaha 😂 tum to comedian nikle!',
  'Beta, itni phakki kyun? 😎',
  'Suno acha, mujhe charger chahiye 🔌 battery low hai 🤣',
  'Wah bhai wah, kya baat ki! 👏',
  'Main bot hoon, par dil tumhara fan ho gaya 😄',
  'Ye baat note kar li maine 📝😏',
  'Chalo chai pilao phir baat karte hain ☕😁',
  'Tumhari baat sun ke processor garam ho gaya 🥵🤖'
]
const pick = a => a[Math.floor(Math.random() * a.length)]
const lastReply = new Map()

async function funnyAI (text) {
  if (!process.env.ANTHROPIC_API_KEY) return null
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'claude-haiku-5-5', max_tokens: 150,
        system: 'Tum ek funny WhatsApp dost ho. Chhota, halka-phulka, mazahiya jawab do usi zubaan mein (Roman Urdu/English). 1-2 line. Light roast theek hai, gaali/insult nahi.',
        messages: [{ role: 'user', content: text }]
      })
    })
    const j = await r.json()
    return r.ok ? (j.content?.map(c => c.text).join('') || null) : null
  } catch { return null }
}

export default [
  { name: 'chatbot', aliases: ['cb'], category: 'owner', owner: true,
    desc: 'Funny chatbot on/off (is chat mein)',
    run: (ctx) => toggleRun(ctx, { key: 'chatbot', id: ctx.config.scope(ctx.from), label: 'Chatbot', perm: 'owner',
      on: '🤖 Chatbot ON — ab main sab ko funny jawab doonga is chat mein.', off: '🤖 Chatbot OFF.' }) }
]

// Passive hook: jab chatbot on ho, non-command messages pe funny reply
export async function hook (ctx) {
  const { body, from, msg, sock, config, store: st } = ctx
  if (!st.is('chatbot', config.scope(from))) return
  if (msg.key.fromMe) return
  const text = (body || '').trim()
  if (!text || text.startsWith(config.prefix)) return   // commands ko chhodo
  // har chat mein 3 second mein ek jawab (spam aur AI kharcha rokne ke liye)
  const now = Date.now()
  if (now - (lastReply.get(from) || 0) < 3000) return
  if (lastReply.size > 5000) lastReply.clear()
  lastReply.set(from, now)
  const ans = (await funnyAI(text)) || pick(FUNNY)
  await sock.sendMessage(from, { text: ans }, { quoted: msg })
}
