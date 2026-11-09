// Chatbot mode — owner on kare to bot baat samajh kar funny jawab de (group + inbox)
// AI: ANTHROPIC_API_KEY ho to Claude, warna free AI (bina key). Dono na chalein to topic ke hisaab se jawab.
import { toggleRun } from '../lib/buttons.js'

const SYSTEM = 'Tum ek mazahiya WhatsApp dost ho. User ki baat ko samajh kar USI ke mutabiq jawab do. Sawal ho to pehle us ka sahi jawab do, phir us mein mazaq daalo. Be-talluq ya random baat bilkul mat karo. Usi zubaan mein likho jis mein user likhe (Roman Urdu, Urdu ya English). Sirf 1-2 lines, emoji theek hai. Halka mazaq, gaali ya insult nahi.'

const pick = a => a[Math.floor(Math.random() * a.length)]

// AI band ho to bhi jawab baat se juda ho
const TOPICS = [
  [/(assalam|salam|\baoa\b)/i, ['Walaikum Assalam! 😄 Salam to ho gaya, ab chai bhi pila do ☕', 'Walaikum Assalam! Itni izzat? Zaroor udhaar maangne aaye ho 😏']],
  [/(kaise ho|kese ho|kaisy ho|kia haal|kya haal|how are you)/i, ['Main theek, bas battery aur dil dono low hain 🔋😂', 'Bot hoon, bukhar nahi hota. Tum sunao, kaise ho? 😄']],
  [/(naam|name)/i, ['Mera naam Golden MD hai, sona nahi hoon par mehnga zaroor hoon 👑😂', 'Naam mein kya rakha hai, recharge mein sab kuch hai 😎']],
  [/(khana|khaya|bhook|biryani|roti|food)/i, ['Biryani ka zikr kiya aur mujhe bulaya nahi? Dosti khatam 🍛😤', 'Main bijli khata hoon, tum biryani bhej do, adjust kar lunga 😂']],
  [/(pyar|mohabbat|love|crush|shadi|shaadi)/i, ['Pyar ka masla? Mera to sirf WiFi se rishta hai aur wo bhi toot jata hai 💔📶', 'Shaadi ka mashwara bot se? Halaat waqai kharab hain 😂']],
  [/(paisa|paise|money|udhar|udhaar|qarz)/i, ['Paise ka naam mat lo, mera balance bhi 0 aur mood bhi 😭', 'Udhaar mohabbat ki qainchi hai, aur main to waise bhi kangaal bot hoon 💸😂']],
  [/(neend|sleep|so ja|sona hai)/i, ['So jao, kal phir yehi faltu baatein karni hain 😴', 'Main to 24 ghante jaagta hoon, tum ja kar so jao 🦉']],
  [/(shukria|shukriya|thanks|thank you)/i, ['Shukriya se pet nahi bharta, biryani bhejo 😎', 'Koi baat nahi, bill baad mein bhej dunga 🧾😂']],
  [/(kya kar|kia kar|kia kr|what.*doing)/i, ['Tumhare messages ka jawab de raha hoon, aur kya meri zindagi hai 😔😂', 'Bas server par leta hua hoon, tum sunao 🛌']],
  [/\b(hi|hello|hey|helo)\b/i, ['Hello ji! Itni der baad yaad aayi? 😏', 'Hi hi! Hasi aa gayi tumhein dekh kar 😂']],
  [/(\?|kya|kia|kyun|kyu|kab|kahan|kaise|kon|kaun)/i, ['Sawal acha hai, par mera dimagh abhi chai peene gaya hai ☕ thori der baad poochna 😅', 'Itna mushkil sawal? Main bot hoon, professor nahi 🤓😂']]
]
const offlineReply = (text) => {
  const t = TOPICS.find(([re]) => re.test(text))
  return t ? pick(t[1]) : `"${text.slice(0, 30)}"? Baat gehri hai, samajh sirf WiFi aane par aayegi 📶😂`
}

async function viaClaude (messages) {
  if (!process.env.ANTHROPIC_API_KEY) return null
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: AbortSignal.timeout(25000),
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-haiku-5-5', max_tokens: 200, system: SYSTEM, messages })
    })
    const j = await r.json()
    return r.ok ? (j.content?.map(c => c.text).join('').trim() || null) : null
  } catch { return null }
}

// free service kabhi atak jati hai: 2 koshishen, har ek 20 second
async function viaFree (messages) {
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        signal: AbortSignal.timeout(20000),
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'openai', private: true, messages: [{ role: 'system', content: SYSTEM }, ...messages] })
      })
      if (r.ok) {
        const ans = (await r.json()).choices?.[0]?.message?.content?.trim().slice(0, 600)
        if (ans) return ans
      }
    } catch {}
  }
  return null
}

// har chat ki pichli kuch baatein, taake jawab silsile se ho
const history = new Map()
const lastReply = new Map()

async function funnyReply (chat, text) {
  const past = history.get(chat) || []
  const messages = [...past, { role: 'user', content: text }]
  const ans = (await viaClaude(messages)) || (await viaFree(messages))
  if (!ans) return offlineReply(text)
  if (history.size > 500) history.clear()
  history.set(chat, [...messages, { role: 'assistant', content: ans }].slice(-8))
  return ans
}

export default [
  { name: 'chatbot', aliases: ['cb'], category: 'owner', owner: true,
    desc: 'Funny chatbot on/off (is chat mein)',
    run: (ctx) => toggleRun(ctx, { key: 'chatbot', id: ctx.config.scope(ctx.from), label: 'Chatbot', perm: 'owner',
      on: '🤖 Chatbot ON — ab main baat samajh kar funny jawab doonga is chat mein.', off: '🤖 Chatbot OFF.' }) }
]

// Passive hook: jab chatbot on ho, non-command messages pe funny reply
export async function hook (ctx) {
  const { body, from, msg, sock, config, store: st } = ctx
  if (!st.is('chatbot', config.scope(from))) return
  if (msg.key.fromMe) return
  const text = (body || '').trim()
  if (!text || text.startsWith(config.prefix)) return   // commands ko chhodo
  // har chat mein 3 second mein ek jawab (spam aur kharcha rokne ke liye)
  const now = Date.now()
  if (now - (lastReply.get(from) || 0) < 3000) return
  if (lastReply.size > 5000) lastReply.clear()
  lastReply.set(from, now)
  const ans = await funnyReply(from, text)
  await sock.sendMessage(from, { text: ans }, { quoted: msg })
}
