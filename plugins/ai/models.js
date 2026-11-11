// .gpt .gemini .mistral — alag alag AI models
// Key ho to official API, warna free (pollinations), warna Claude (ANTHROPIC_API_KEY). Jawab ke neeche likha hota hai kis ne diya.
import { askAI } from '../../lib/ai.js'

const SYSTEM = 'You are a helpful WhatsApp assistant. Reply briefly and clearly in the same language the user writes in (Roman Urdu, Urdu or English).'

async function postJSON (url, headers, body, ms = 30000) {
  const r = await fetch(url, { method: 'POST', signal: AbortSignal.timeout(ms), headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error?.message || j.message || 'HTTP ' + r.status)
  return j
}

// OpenAI-jaisi chat API (OpenAI, Mistral dono yehi format)
async function chatAPI (url, key, model, text) {
  const j = await postJSON(url, { authorization: 'Bearer ' + key },
    { model, max_tokens: 700, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: text }] })
  return j.choices?.[0]?.message?.content?.trim()
}

async function geminiAPI (key, model, text) {
  const j = await postJSON(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {},
    { systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ role: 'user', parts: [{ text }] }] })
  return j.candidates?.[0]?.content?.parts?.map(p => p.text).join('').trim()
}

// Free, bina key — kabhi kabhi atak jata hai, is liye 2 koshishen
async function freeAPI (model, text) {
  for (let i = 0; i < 2; i++) {
    try {
      const j = await postJSON('https://text.pollinations.ai/openai', {},
        { model, private: true, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: text }] }, 20000)
      const ans = j.choices?.[0]?.message?.content?.trim()
      if (ans) return ans
    } catch {}
  }
  return null
}

const MODELS = {
  gpt: {
    label: 'ChatGPT', free: 'openai',
    official: (t) => process.env.OPENAI_API_KEY &&
      chatAPI('https://api.openai.com/v1/chat/completions', process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL || 'gpt-4o-mini', t)
  },
  gemini: {
    label: 'Gemini', free: 'gemini',
    official: (t) => process.env.GEMINI_API_KEY &&
      geminiAPI(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL || 'gemini-2.0-flash', t)
  },
  mistral: {
    label: 'Mistral', free: 'mistral',
    official: (t) => process.env.MISTRAL_API_KEY &&
      chatAPI('https://api.mistral.ai/v1/chat/completions', process.env.MISTRAL_API_KEY, process.env.MISTRAL_MODEL || 'mistral-small-latest', t)
  }
}

async function answer (id, text) {
  const m = MODELS[id]
  try { const a = await m.official(text); if (a) return { a, by: m.label } } catch (e) { console.error(id + ' official:', e.message) }
  const free = await freeAPI(m.free, text)
  if (free) return { a: free, by: m.label + ' (free)' }
  if (process.env.ANTHROPIC_API_KEY) return { a: await askAI(text, { system: SYSTEM, max: 700 }), by: 'Claude (' + m.label + ' nahi mila)' }
  throw new Error(m.label + ' abhi jawab nahi de raha. Thori der baad koshish karein.')
}

const make = (id, aliases, emoji) => ({
  name: id, aliases, category: 'ai', desc: MODELS[id].label + ' se sawal',
  async run ({ text, reply, msg }) {
    // reply kiye hue message ka text bhi sawal mein shamil
    const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const qt = q?.conversation || q?.extendedTextMessage?.text || q?.imageMessage?.caption || ''
    const prompt = [qt && `"${qt}"`, text].filter(Boolean).join('\n\n')
    if (!prompt) return reply(`.${id} <sawal>  (ya kisi message pe reply kar ke .${id})`)
    const { a, by } = await answer(id, prompt)
    await reply(`${emoji} ${a}\n\n_— ${by}_`)
  }
})

export default [
  make('gpt', ['chatgpt', 'openai'], '🧠'),
  make('gemini', ['bard', 'gem'], '✨'),
  make('mistral', ['mistralai'], '🌪️')
]
