// Group games with points — tic-tac-toe, Pakistan quiz, math, word chain, leaderboard
import store from '../lib/store.js'
import { num, getContextInfo } from '../lib/helpers.js'

const pick = a => a[Math.floor(Math.random() * a.length)]
const shuffle = a => [...a].sort(() => Math.random() - 0.5)

// points per chat: store.points[chat][number]
function addPoints (chat, jid, n) {
  const all = store.obj('points'); const g = (all[chat] ||= {})
  g[num(jid)] = (g[num(jid)] || 0) + n; store.save()
  return g[num(jid)]
}

// [sawal, sahi jawab, ghalat 1, ghalat 2, ghalat 3]
const QUIZ = [
  ['Pakistan kab azad hua?', '14 August 1947', '15 August 1947', '23 March 1940', '14 August 1948'],
  ['Pakistan ka qaumi phool?', 'Chambeli', 'Gulab', 'Sooraj Mukhi', 'Kanwal'],
  ['Pakistan ka qaumi janwar?', 'Markhor', 'Sher', 'Cheetah', 'Hiran'],
  ['Pakistan ka qaumi parinda?', 'Chakor', 'Shaheen', 'Mor', 'Tota'],
  ['Qaumi tarana kis ne likha?', 'Hafeez Jalandhari', 'Allama Iqbal', 'Faiz Ahmed Faiz', 'Ahmed Faraz'],
  ['Pakistan ka darul hukumat?', 'Islamabad', 'Karachi', 'Lahore', 'Rawalpindi'],
  ['Pakistan ki sab se unchi choti?', 'K2', 'Nanga Parbat', 'Rakaposhi', 'Tirich Mir'],
  ['Quaid-e-Azam kis shehar mein paida hue?', 'Karachi', 'Lahore', 'Mumbai', 'Ziarat'],
  ['Allama Iqbal kis shehar mein paida hue?', 'Sialkot', 'Lahore', 'Gujranwala', 'Multan'],
  ['Pakistan ka qaumi khel?', 'Hockey', 'Cricket', 'Squash', 'Kabaddi'],
  ['Pakistan ka qaumi darakht?', 'Deodar', 'Neem', 'Peepal', 'Shisham'],
  ['1992 World Cup mein Pakistan ka captain?', 'Imran Khan', 'Javed Miandad', 'Wasim Akram', 'Inzamam-ul-Haq'],
  ['Pakistan ka sab se bara shehar?', 'Karachi', 'Lahore', 'Faisalabad', 'Islamabad'],
  ['Pakistan ke pehle Prime Minister?', 'Liaquat Ali Khan', 'Quaid-e-Azam', 'Khawaja Nazimuddin', 'Ayub Khan'],
  ['Minar-e-Pakistan kis shehar mein hai?', 'Lahore', 'Karachi', 'Islamabad', 'Multan'],
  ['Faisal Masjid kis shehar mein hai?', 'Islamabad', 'Lahore', 'Karachi', 'Peshawar'],
  ['Pakistan ka sab se lamba darya?', 'Sindh (Indus)', 'Jhelum', 'Chenab', 'Ravi'],
  ['Youm-e-Takbeer (atomi dhamaka) kab hua?', '28 May 1998', '11 May 1998', '28 May 1999', '6 September 1965'],
  ['Pakistan ki qaumi zubaan?', 'Urdu', 'Punjabi', 'English', 'Sindhi'],
  ['Qarardad-e-Pakistan kab manzoor hui?', '23 March 1940', '14 August 1947', '23 March 1956', '25 December 1940'],
  ['Pakistan ka qaumi phal?', 'Aam', 'Seb', 'Kela', 'Kinno'],
  ['Badshahi Masjid kis ne banwayi?', 'Aurangzeb', 'Shah Jahan', 'Akbar', 'Jahangir'],
  ['Mazar-e-Quaid kis shehar mein hai?', 'Karachi', 'Lahore', 'Islamabad', 'Ziarat'],
  ['Pakistan ka pehla Nobel inaam kis ko mila?', 'Dr. Abdus Salam', 'Malala Yousafzai', 'Dr. Abdul Qadeer Khan', 'Abdul Sattar Edhi'],
  ['Khewra mine kis cheez ke liye mashhoor hai?', 'Namak', 'Koyla', 'Sona', 'Gas'],
  ['Gwadar port kis soobe mein hai?', 'Balochistan', 'Sindh', 'KPK', 'Punjab'],
  ['Pakistan ka pehla aaeen kab bana?', '1956', '1947', '1962', '1973'],
  ['Shalimar Bagh kis shehar mein hai?', 'Lahore', 'Multan', 'Karachi', 'Peshawar'],
  ['Pakistan ke kitne soobe (provinces) hain?', '4', '5', '3', '6'],
  ['Pakistan ki currency?', 'Rupee', 'Taka', 'Dinar', 'Riyal']
]
const START_WORDS = ['pakistan', 'lahore', 'cricket', 'biryani', 'mango', 'karachi', 'school', 'mobile', 'friend', 'water']

const ttt = new Map(), quiz = new Map(), math = new Map(), chain = new Map()

// ---------- tic-tac-toe ----------
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
const ICON = { X: '❌', O: '⭕' }
const NUMS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']
const board = b => [0, 3, 6].map(i => b.slice(i, i + 3).map((c, j) => c ? ICON[c] : NUMS[i + j]).join('')).join('\n')
const winner = b => LINES.find(([a, c, d]) => b[a] && b[a] === b[c] && b[a] === b[d]) ? 'win' : b.every(Boolean) ? 'draw' : null

async function tttMove (ctx, g, cell) {
  const { from, reply } = ctx
  g.b[cell] = g.turn
  let r = winner(g.b)
  if (!r && g.bot && g.turn === 'X') {   // bot (O) ki chaal
    const free = g.b.map((c, i) => c ? null : i).filter(i => i !== null)
    const smart = free.find(i => { const t = [...g.b]; t[i] = 'O'; return winner(t) === 'win' }) ??
      free.find(i => { const t = [...g.b]; t[i] = 'X'; return winner(t) === 'win' }) ?? pick(free)
    g.b[smart] = 'O'
    r = winner(g.b); if (r) g.turn = 'O'
  } else if (!r) g.turn = g.turn === 'X' ? 'O' : 'X'
  const p = g.turn === 'X' ? g.x : g.o
  if (r === 'win') {
    ttt.delete(from)
    if (p === 'bot') return reply(`${board(g.b)}\n\n🤖 Bot jeet gaya!`)
    addPoints(from, p, 5)
    return reply(`${board(g.b)}\n\n🎉 @${num(p)} jeet gaya! +5 points`, { mentions: [p] })
  }
  if (r === 'draw') { ttt.delete(from); return reply(`${board(g.b)}\n\n🤝 Draw!`) }
  await reply(`${board(g.b)}\n\nAb @${num(p)} ki baari (${ICON[g.turn]}) — 1-9 likho`, { mentions: [p] })
}

export default [
  { name: 'ttt', aliases: ['tictactoe', 'xo'], category: 'games', desc: 'Tic-tac-toe (.ttt @user ya bot se)',
    async run ({ from, msg, sender, args, reply }) {
      if (args[0] === 'end' || args[0] === 'stop') { ttt.delete(from); return reply('🛑 Game khatam.') }
      if (ttt.has(from)) return reply('Pehle se game chal raha hai. Khatam: .ttt end')
      const ci = getContextInfo(msg)
      const opp = ci.mentionedJid?.[0] || ci.participant || null
      if (opp && num(opp) === num(sender)) return reply('Apne aap se nahi khel sakte 😅')
      const g = { b: Array(9).fill(null), x: sender, o: opp || 'bot', bot: !opp, turn: 'X' }
      ttt.set(from, g)
      await reply(`🎮 *Tic-Tac-Toe*\n❌ @${num(sender)}  vs  ⭕ ${opp ? '@' + num(opp) : 'Bot 🤖'}\n\n${board(g.b)}\n\n@${num(sender)} pehle — 1-9 mein se number likho`, { mentions: [sender, opp].filter(Boolean) })
    } },
  { name: 'quiz', aliases: ['gk', 'pakquiz'], category: 'games', desc: 'Pakistan GK quiz (+3 points)',
    async run ({ from, reply }) {
      if (quiz.has(from)) return reply('Pehle wale sawal ka jawab do!')
      const [q, right, ...wrong] = pick(QUIZ)
      const opts = shuffle([right, ...wrong]); const ans = 'ABCD'[opts.indexOf(right)]
      const timer = setTimeout(() => { quiz.delete(from); reply(`⌛ Waqt khatam! Sahi jawab: *${ans}) ${right}*`) }, 30000)
      quiz.set(from, { ans, right, tried: new Set(), timer })
      await reply(`🇵🇰 *Pakistan Quiz*\n\n❓ ${q}\n\n${opts.map((o, i) => `${'ABCD'[i]}) ${o}`).join('\n')}\n\n⏱️ 30 second — A/B/C/D likho (har banda ek dafa)`)
    } },
  { name: 'math', aliases: ['mathgame', 'hisaab'], category: 'games', desc: 'Tez hisaab game (+2 points)',
    async run ({ from, reply }) {
      if (math.has(from)) return reply('Pehle wala sawal hal karo!')
      const op = pick(['+', '-', '×']); const a = 2 + Math.floor(Math.random() * (op === '×' ? 15 : 90)); const b = 2 + Math.floor(Math.random() * (op === '×' ? 12 : 90))
      const ans = op === '+' ? a + b : op === '-' ? a - b : a * b
      const timer = setTimeout(() => { math.delete(from); reply(`⌛ Waqt khatam! Jawab tha *${ans}*`) }, 20000)
      math.set(from, { ans, timer })
      await reply(`🧮 *${a} ${op} ${b} = ?*\n⏱️ 20 second — sab se pehle sahi jawab jeetega!`)
    } },
  { name: 'wordchain', aliases: ['wc', 'lafzchain'], category: 'games', desc: 'Word chain game (+1 har lafz)',
    async run ({ from, args, reply }) {
      const g = chain.get(from)
      if (args[0] === 'stop' || args[0] === 'end') {
        if (!g) return reply('Koi game nahi chal raha.')
        clearTimeout(g.timer); chain.delete(from)
        return reply(`🛑 Word chain khatam! Kul ${g.used.size} lafz.`)
      }
      if (g) return reply(`Game chal raha hai — agla lafz *${g.last.slice(-1).toUpperCase()}* se. Khatam: .wordchain stop`)
      const w = pick(START_WORDS)
      chain.set(from, { last: w, used: new Set([w]), timer: null })
      resetChainTimer(from, reply)
      await reply(`🔗 *Word Chain*\n\nPehla lafz: *${w}*\nAgla lafz *${w.slice(-1).toUpperCase()}* se shuru ho (English, 3+ harf, dobara nahi)\nHar sahi lafz = +1 point • 2 min koi na bole to khatam`)
    } },
  { name: 'leaderboard', aliases: ['lb', 'points'], category: 'games', desc: 'Games ke points',
    async run ({ from, args, reply, isOwner }) {
      if (args[0] === 'reset' && isOwner) { delete store.obj('points')[from]; store.save(); return reply('✅ Points reset.') }
      const g = Object.entries(store.obj('points')[from] || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
      if (!g.length) return reply('Abhi kisi ke points nahi. Khelo: .quiz .math .ttt .wordchain')
      const medal = ['🥇', '🥈', '🥉']
      await reply('🏆 *Leaderboard*\n\n' + g.map(([n, p], i) => `${medal[i] || (i + 1) + '.'} @${n} — ${p} pts`).join('\n'), { mentions: g.map(([n]) => n + '@s.whatsapp.net') })
    } }
]

function resetChainTimer (from, reply) {
  const g = chain.get(from); if (!g) return
  clearTimeout(g.timer)
  g.timer = setTimeout(() => { chain.delete(from); reply(`⌛ 2 minute koi nahi bola — word chain khatam (${g.used.size} lafz).`) }, 120000)
}

// hook: game ke jawab (bina prefix ke)
export async function hook (ctx) {
  // fromMe bhi chalta hai: web mode mein owner apne hi number se khelta hai (bot ke apne jawab yahan nahi aate)
  const { from, sender, body, reply } = ctx
  const t = (body || '').trim()

  const g = ttt.get(from)
  if (g && /^[1-9]$/.test(t)) {
    const p = g.turn === 'X' ? g.x : g.o
    if (num(p) !== num(sender)) return
    if (g.b[+t - 1]) return reply('Ye khana bhara hua hai.')
    return tttMove(ctx, g, +t - 1)
  }

  const q = quiz.get(from)
  if (q && /^[a-d]$/i.test(t)) {
    if (q.tried.has(num(sender))) return
    q.tried.add(num(sender))
    if (t.toUpperCase() !== q.ans) return
    clearTimeout(q.timer); quiz.delete(from)
    const tot = addPoints(from, sender, 3)
    return reply(`✅ Sahi! *${q.ans}) ${q.right}*\n🎉 @${num(sender)} +3 points (kul ${tot})`, { mentions: [sender] })
  }

  const m = math.get(from)
  if (m && /^-?\d+$/.test(t) && +t === m.ans) {
    clearTimeout(m.timer); math.delete(from)
    const tot = addPoints(from, sender, 2)
    return reply(`✅ Sahi jawab *${m.ans}*!\n🎉 @${num(sender)} +2 points (kul ${tot})`, { mentions: [sender] })
  }

  const c = chain.get(from)
  if (c && /^[a-z]{3,}$/i.test(t)) {
    const w = t.toLowerCase()
    if (w[0] !== c.last.slice(-1)) return
    if (c.used.has(w)) return reply(`❌ *${w}* pehle aa chuka hai!`)
    c.used.add(w); c.last = w; resetChainTimer(from, reply)
    addPoints(from, sender, 1)
    return reply(`✅ *${w}* (+1) → agla lafz *${w.slice(-1).toUpperCase()}* se`)
  }
}
