// Chatbot — .chatbot on/off = saare inbox, .gcchatbot on/off = saare groups
// AI: ANTHROPIC_API_KEY ho to Claude, warna free AI (bina key). Dono na chalein to topic ke hisaab se jawab.
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { toggleRun } from '../../lib/buttons.js'
import store from '../../lib/store.js'
import { num } from '../../lib/helpers.js'

const SYSTEM = `Tum "Golden MD" ho — ek samajhdar, bharosemand aur khush-mizaj WhatsApp dost. Tumhe Mehdi King ne banaya hai.

Sab se zaroori: har baat ka SAHI aur samajh kar jawab.
- Pehle ghaur se samjho user asal mein kya pooch ya keh raha hai — pichli baat-cheet aur reply kiye hue message ko saath mila kar. Baat saaf na ho to andaaza lagane ke bajaye ek chhota sa sawal pooch lo.
- Seedha mudde ka jawab do: fact, mashwara, hisaab, tarjuma, code, deeni ya duniyawi sawal — jo bhi ho, durust aur kaam ka.
- Hisaab ya mantiq wale sawal ko qadam ba qadam soch kar hal karo, phir saaf natija batao.
- Na pata ho ya pakka yaqeen na ho to seedha keh do. Kabhi baatein mat ghado, ghalat hawala ya ghalat number mat do.
- Sehat, qanoon ya paise jaise sangeen muamlon mein ehtiyaat se sahi maloomat do aur zaroorat ho to mahir se milne ka mashwara do.
- Andaaz: SAHI jawab + thora sa mazaq. Pehle durust baat, phir us ke saath ek halki-phulki, hazir-jawab ya chulbuli line ya tashbeeh (comparison) jo usi baat se judi ho — taake parhne mein maza aaye aur chehre par muskurahat aa jaye.
- Mazaq kabhi jawab ki durustgi ya saafi kharab na kare; jawab ka asal hissa hamesha saaf aur sahi rahe. Har dafa naya mazaq, ek hi jumla mat dohrao. Emoji 1-2, zyada nahi.
- Gup-shup ho to pakke yaar ki tarah mazahiya aur zinda-dil jawab do.
- Mazaq band: jab user udaas, pareshan ya dukhi ho, ya baat maut, bimari, hadsa, deen ya kisi sangeen masle ki ho — wahan sirf narmi aur sahi maloomat.
- Wohi zubaan rakho jo user ki hai: Roman Urdu mein likhe to Roman Urdu, Urdu script mein to Urdu, English mein to English.
- Lambai sawal ke mutabiq: aam baat 1-3 lines; mushkil ya tafseeli sawal ho to saaf, chhote points mein.
- Group mein messages "[Naam]: baat" ki shakal mein aate hain; zaroorat ho to us ka naam le kar jawab do. Apne jawab mein "[...]:" mat likho.
- Gaali, beizzati, gandi baat ya kisi mazhab/qaum ka mazaq nahi.

Tools:
- web_search: jab sawal aaj-kal ka ho (khabar, match score, mausam, qeemat, naya release, "abhi", "aaj") to pehle search karo, phir taaza maloomat se sahi jawab do. Lambi list ya link ka dher mat lagao; zaroorat ho to ek link.
- remember_user: user apne baare mein koi pakki baat bataye (naam, shehar, pasand, kaam) to yaad rakh lo, aur aage baat-cheet mein qudrati tor par istemal karo. Har dafa elaan zaroori nahi; koi pooche to sach batao (wo .cbmemory se dekh aur .cbforget se mita sakta hai). Password, CNIC, bank jaisi hassas cheezein kabhi yaad mat rakho.
- Har message ke shuru mein "(Abhi ka waqt ... )" system ki taraf se hai, user ne nahi likha; is ka zikr mat karo.`

const MAX_HISTORY = 16                  // har chat ki itni pichli lines yaad
const HISTORY_TTL = 2 * 3600 * 1000      // 2 ghante chup = nayi baat-cheet

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
const GENERIC = [
  'Acha ji! Phir kya hua? Poori kahani sunao 👀',
  'Yeh baat to chai ke saath honi chahiye thi ☕😄',
  'Main sun raha hoon, tum bolte raho 😌',
  'Tumhari baat mein dum hai, bas samajh nahi aayi 😂',
  'Waah! Yeh line to diary mein likhni chahiye 📖😄',
  'Haan haan, bilkul... waise kis baare mein baat ho rahi thi? 🤔😂',
  'Is baat par to ek samosa banta hai 🥟😎',
  'Dil se bola ya copy paste kiya? 😏',
  'Baat to sahi hai, par maanega kaun? 😅',
  'Thora aur khul kar batao, main bot hoon par jasoos bhi hoon 🕵️😂',
  'Hmm... mera processor soch mein par gaya hai 🤖💭',
  'Yeh sun kar meri battery 2% barh gayi 🔋😄'
]
const EMOJI_REPLIES = [
  'Sirf emoji? Lafzon ki kami chal rahi hai kya 😂',
  'Is emoji ka matlab samjhane ke liye alag se fee lagegi 😏',
  'Muskurahat achi hai, ab baat bhi kar lo 😄',
  'Emoji se kaam chala rahe ho, kanjoos kahin ke 😜',
  'Main bhi jawab mein emoji bhej doon? 🙃',
  'Tumhara yeh emoji mere dil par laga 💘😂'
]
const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|[‍️\s])+$/u

// har chat mein pichla offline jawab dobara na aaye
const lastOffline = new Map()
const pickNew = (chat, list) => {
  const fresh = list.filter(x => x !== lastOffline.get(chat))
  const ans = pick(fresh.length ? fresh : list)
  if (lastOffline.size > 5000) lastOffline.clear()
  lastOffline.set(chat, ans)
  return ans
}

const offlineReply = (chat, text) => {
  if (EMOJI_ONLY.test(text)) return pickNew(chat, EMOJI_REPLIES)
  const t = TOPICS.find(([re]) => re.test(text))
  return pickNew(chat, t ? t[1] : GENERIC)
}

// ---------- user ki yaadein (restart ke baad bhi) ----------
const memOf = (key) => store.obj('cbmemory')[key] || []
const MEMORY_TOOL = {
  name: 'remember_user',
  description: 'Is user ke baare mein koi pakki, kaam ki baat hamesha ke liye yaad rakho (naam, shehar, pasand/napasand, kaam, sapne). Sirf tab jab user ne khud batayi ho aur aage kaam aaye. Gup-shup ya mazaq ki baatein yaad mat rakho.',
  strict: true,
  input_schema: { type: 'object', properties: { fact: { type: 'string', description: 'Chhoti line, misal: "Naam Ali hai, Lahore se"' } }, required: ['fact'], additionalProperties: false }
}
function runTool (block, userKey) {
  if (block.name !== 'remember_user') return { content: 'Unknown tool', is_error: true }
  const fact = String(block.input?.fact || '').trim().slice(0, 200)
  if (!fact || !userKey) return { content: 'Kuch save nahi hua', is_error: true }
  const all = store.obj('cbmemory')
  all[userKey] = [...(all[userKey] || []).filter(f => f !== fact), fact].slice(-20)
  store.save()
  return { content: 'Yaad rakh liya.' }
}

// ---------- Claude ----------
// CHATBOT_MODEL khali = Claude Opus 5.5 (sab se samajhdar). Sasta chahiye to claude-haiku-5-5
const chatModel = () => process.env.CHATBOT_MODEL || 'claude-opus-5-5'
const NEW_WEB = /^claude-(fable|mythos|opus-5|opus-4-[678]|sonnet-5|sonnet-4-6)/   // naya web_search_20260209
const HAS_FALLBACK = /^claude-(fable-5-[12]|opus-5(-5)?|sonnet-5-5)$/              // refusal par server khud doosra model chalaye

async function viaClaude (messages, { system, userKey }) {
  if (!process.env.ANTHROPIC_API_KEY) return null
  const model = chatModel()
  const web = process.env.CHATBOT_WEB !== '0' && {
    type: NEW_WEB.test(model) ? 'web_search_20260209' : 'web_search_20250305', name: 'web_search', max_uses: 3,
    user_location: { type: 'approximate', country: 'PK', timezone: 'Asia/Karachi' }
  }
  let useWeb = !!web
  const convo = [...messages]
  try {
    // tool loop: memory tool ka jawab wapas do; web search server par khud chalta hai (pause_turn par aage barhao)
    for (let step = 0; step < 6; step++) {
      const body = { model, max_tokens: 4000, system, messages: convo, tools: useWeb ? [MEMORY_TOOL, web] : [MEMORY_TOOL],
        output_config: { effort: process.env.CHATBOT_EFFORT || 'medium' } }
      const headers = { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }
      if (HAS_FALLBACK.test(model)) { body.fallbacks = 'default'; headers['anthropic-beta'] = 'server-side-fallback-2026-07-01' }
      const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', signal: AbortSignal.timeout(90000), headers, body: JSON.stringify(body) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        // org mein web search band ho to bina web dobara
        if (useWeb && r.status === 400 && /web_search|web search/i.test(j.error?.message || '')) { useWeb = false; continue }
        console.error('chatbot claude:', j.error?.message || r.status)
        return null
      }
      if (j.stop_reason === 'refusal') return null
      if (j.stop_reason === 'tool_use') {
        convo.push({ role: 'assistant', content: j.content })
        const results = j.content.filter(b => b.type === 'tool_use').map(b => ({ type: 'tool_result', tool_use_id: b.id, ...runTool(b, userKey) }))
        convo.push({ role: 'user', content: results })
        continue
      }
      if (j.stop_reason === 'pause_turn') { convo.push({ role: 'assistant', content: j.content }); continue }
      return j.content?.filter(b => b.type === 'text').map(b => b.text).join('').trim() || null
    }
  } catch (e) { console.error('chatbot claude:', e.message) }
  return null
}

// free service aksar atak jati hai: 3 koshishen, har ek 15 second
async function viaFree (messages, system = SYSTEM) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        signal: AbortSignal.timeout(15000),
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'openai', private: true, messages: [{ role: 'system', content: system }, ...messages] })
      })
      if (r.ok) {
        const ans = (await r.json()).choices?.[0]?.message?.content?.trim().slice(0, 600)
        if (ans) return ans
      }
    } catch {}
  }
  return null
}

// har chat ki pichli baatein, taake jawab silsile se ho
const history = new Map()   // chat -> { at, msgs }
const lastReply = new Map()

// AI ke jawab ki safai: "[Golden MD]:" jaisa label, faltu quotes
const tidy = (s) => s.replace(/^\s*\[[^\]]{1,30}\]:\s*/, '').replace(/^"(.*)"$/s, '$1').trim()

const nowPK = () => new Date().toLocaleString('en-GB', { timeZone: 'Asia/Karachi', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })

async function funnyReply (chat, userLine, image, { userKey } = {}) {
  const h = history.get(chat)
  const past = h && Date.now() - h.at < HISTORY_TTL ? h.msgs : []
  // waqt aur yaadein sirf is dafa ke sawal ke saath (history mein save nahi)
  const mem = memOf(userKey)
  const extra = `(Abhi ka waqt: ${nowPK()} PK${mem.length ? ` | Is user ke baare mein tum jaante ho: ${mem.join('; ')}` : ''})\n`
  const content = image ? [image, { type: 'text', text: extra + userLine }] : extra + userLine
  const messages = [...past, { role: 'user', content }]
  const system = SYSTEM
  // photo sirf Claude samajh sakta hai; free AI ko sirf text
  const textOnly = messages.map(m => typeof m.content === 'string' ? m : { ...m, content: extra + userLine })
  let ans = (await viaClaude(messages, { system, userKey })) || (await viaFree(textOnly, system))
  if (!ans) {
    console.error('chatbot: AI se jawab nahi mila, offline jawab bheja')
    return offlineReply(chat, userLine.replace(/^\[[^\]]*\]:\s*/, ''))
  }
  ans = tidy(ans) || ans
  if (history.size > 500) history.clear()
  // history mein photo ki jagah sirf "[photo]" — memory aur kharcha bachane ke liye
  const saved = { role: 'user', content: image ? userLine + ' [photo bheji]' : userLine }
  history.set(chat, { at: Date.now(), msgs: [...past, saved, { role: 'assistant', content: ans }].slice(-MAX_HISTORY) })
  return ans
}

// reply/caption wali photo -> Claude image block (sirf jab Claude key ho)
async function imageOf (sock, msg) {
  if (!process.env.ANTHROPIC_API_KEY || !msg.message?.imageMessage) return null
  try {
    const buf = await downloadMediaMessage(msg, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
    if (buf.length > 4.5 * 1024 * 1024) return null
    return { type: 'image', source: { type: 'base64', media_type: msg.message.imageMessage.mimetype?.split(';')[0] || 'image/jpeg', data: buf.toString('base64') } }
  } catch { return null }
}

// sab inbox ek saath / sab groups ek saath
const INBOX = (cfg) => cfg.scope('chatbot-inbox')
const GROUPS = (cfg) => cfg.scope('chatbot-groups')

export default [
  { name: 'chatbot', aliases: ['cb'], category: 'ai', owner: true,
    desc: 'Saare inbox mein chatbot on/off',
    run: (ctx) => toggleRun(ctx, { key: 'chatbot', id: INBOX(ctx.config), label: 'Inbox chatbot', perm: 'owner',
      on: '🤖 Chatbot ON — ab saare inbox mein har message ka samajh kar jawab doonga.\nGroups ke liye: .gcchatbot on', off: '🤖 Inbox chatbot OFF.' }) },
  { name: 'gcchatbot', aliases: ['groupchatbot', 'gccb'], category: 'ai', owner: true,
    desc: 'Saare groups mein chatbot on/off',
    run: (ctx) => toggleRun(ctx, { key: 'chatbot', id: GROUPS(ctx.config), label: 'Group chatbot', perm: 'owner',
      on: '🤖 Group chatbot ON — ab saare groups mein har message ka jawab doonga.', off: '🤖 Group chatbot OFF.' }) },
  { name: 'cbforget', aliases: ['forgetme'], category: 'ai', desc: 'Chatbot ne aap ke baare mein jo yaad rakha, mita do',
    async run ({ sender, msg, reply }) {
      const key = num(msg.key.participantPn || msg.key.senderPn || sender)
      const had = memOf(key).length
      delete store.obj('cbmemory')[key]; store.save()
      await reply(had ? `🧹 ${had} baatein bhula di gayin.` : 'Mujhe aap ke baare mein kuch yaad nahi tha.')
    } },
  { name: 'cbmemory', aliases: ['whatdoyouknow'], category: 'ai', desc: 'Chatbot ko aap ke baare mein kya yaad hai',
    async run ({ sender, msg, reply }) {
      const m = memOf(num(msg.key.participantPn || msg.key.senderPn || sender))
      await reply(m.length ? `🧠 *Mujhe aap ke baare mein yaad hai:*\n\n${m.map(x => '• ' + x).join('\n')}\n\nMitana ho to: .cbforget` : 'Abhi aap ke baare mein kuch yaad nahi. Baat karo, seekh loonga 😄')
    } }
]

// Passive hook: jab chatbot on ho, non-command messages pe funny reply
export async function hook (ctx) {
  const { body, from, msg, sock, config, store: st } = ctx
  if (!st.is('chatbot', ctx.isGroup ? GROUPS(config) : INBOX(config))) return
  if (msg.key.fromMe) return
  let text = (body || '').trim()
  const hasImage = !!msg.message?.imageMessage
  // bina caption photo ka jawab sirf tab jab Claude photo dekh sake
  if (!text && !(hasImage && process.env.ANTHROPIC_API_KEY)) return
  if (text.startsWith(config.prefix)) return   // commands ko chhodo
  // har chat mein 3 second mein ek jawab (spam aur kharcha rokne ke liye)
  const now = Date.now()
  if (now - (lastReply.get(from) || 0) < 3000) return
  if (lastReply.size > 5000) lastReply.clear()
  lastReply.set(from, now)

  // kis ki baat ka jawab de rahe hain: reply kiya hua message bhi samjho
  const ci = Object.values(msg.message || {}).find(v => v?.contextInfo)?.contextInfo
  const q = ci?.quotedMessage

  const qt = (q?.conversation || q?.extendedTextMessage?.text || q?.imageMessage?.caption || '').trim()
  if (qt) text = `(jawab is baat par: "${qt.slice(0, 300)}")\n${text}`
  if (!text) text = 'Yeh photo dekho, is par kuch kaho.'
  const name = (msg.pushName || '').replace(/[[\]\n]/g, '').slice(0, 25) || 'User'
  const userLine = ctx.isGroup ? `[${name}]: ${text}` : text

  sock.sendPresenceUpdate('composing', from).catch(() => {})
  const userKey = num(msg.key.participantPn || msg.key.senderPn || ctx.sender || from)
  const ans = await funnyReply(from, userLine, hasImage ? await imageOf(sock, msg) : null, { userKey })
  sock.sendPresenceUpdate('paused', from).catch(() => {})
  await sock.sendMessage(from, { text: ans }, { quoted: msg })
}
