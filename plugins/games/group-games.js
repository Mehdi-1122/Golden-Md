// Group games — anagram, emojiquiz, numberbattle, wordbattle, impostor, groupvote
// + random member pickers: king, queen, captain, lucky, unlucky, mostlikely
import store from '../../lib/store.js'
import { num, getContextInfo, botIsAdmin, isAdmin } from '../../lib/helpers.js'

const pick = a => a[Math.floor(Math.random() * a.length)]
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
const tag = j => '@' + num(j)

// .leaderboard wale points hi
function addPoints (chat, jid, n) {
  const g = (store.obj('points')[chat] ||= {})
  g[num(jid)] = (g[num(jid)] || 0) + n; store.save()
  return g[num(jid)]
}

const games = { anagram: new Map(), emoji: new Map(), number: new Map(), word: new Map(), impostor: new Map(), vote: new Map() }
const end = (map, from) => { const g = map.get(from); if (g) { clearTimeout(g.timer); map.delete(from) } return g }
const timeout = (map, from, ms, fn) => { const g = map.get(from); clearTimeout(g.timer); g.timer = setTimeout(() => { map.delete(from); fn(g) }, ms) }

// ---------- data ----------
const ANAGRAMS = ['programming', 'chocolate', 'adventure', 'butterfly', 'telephone', 'umbrella', 'pineapple', 'strawberry', 'hospital', 'birthday', 'friendship', 'beautiful', 'education', 'calendar', 'keyboard', 'universe', 'sandwich', 'treasure', 'festival', 'motorbike', 'blanket', 'kangaroo', 'dinosaur', 'chemistry', 'pakistani', 'thunder', 'whistle', 'cucumber', 'landmark', 'notebook']
const EMOJI_Q = [
  ['🦁👑', 'lion king'], ['🕷️🧑', 'spiderman', 'spider man'], ['🚢🧊💔', 'titanic'], ['🧙‍♂️💍🌋', 'lord of the rings'], ['🦇🧑', 'batman', 'bat man'],
  ['❄️👸', 'frozen'], ['🐠🔍', 'finding nemo', 'nemo'], ['🧸🍯', 'winnie the pooh', 'pooh'], ['🏏🏆🇵🇰', '1992 world cup', 'world cup'],
  ['🍕🇮🇹', 'pizza'], ['☕🍪', 'chai biscuit', 'tea biscuit'], ['🌙⭐🕌', 'eid'], ['🐓🥚', 'anda', 'egg'], ['📱🍎', 'iphone', 'apple'],
  ['👻🏠', 'haunted house', 'bhoot bangla'], ['🍛🐔', 'chicken biryani', 'biryani'], ['🌧️☂️', 'barish', 'rain'], ['🏠🔙', 'ghar wapsi', 'home alone'],
  ['👨‍🚀🌕', 'moon landing', 'astronaut'], ['🧛🩸', 'dracula', 'vampire'], ['🐼🥋', 'kung fu panda'], ['🚗⚡', 'cars', 'lightning mcqueen'],
  ['🧞‍♂️🪔', 'aladdin', 'aladin'], ['🐉🔥', 'dragon'], ['⚽🐐', 'messi', 'ronaldo'], ['🎤🇵🇰👑', 'atif aslam', 'nusrat fateh ali khan'],
  ['🦖🏞️', 'jurassic park'], ['🧪💚👨', 'hulk'], ['🔨⚡', 'thor'], ['🕶️💊', 'matrix', 'the matrix']
]
const IMPOSTOR_WORDS = [['chai', 'coffee'], ['biryani', 'pulao'], ['cricket', 'football'], ['lahore', 'karachi'], ['doctor', 'nurse'], ['school', 'college'],
  ['bike', 'cycle'], ['mobile', 'laptop'], ['shaadi', 'mehndi'], ['samosa', 'pakora'], ['eid', 'ramzan'], ['dog', 'cat'], ['beach', 'river'],
  ['pizza', 'burger'], ['teacher', 'principal'], ['bus', 'train'], ['rain', 'storm'], ['mango', 'banana'], ['police', 'army'], ['movie', 'drama']]

const TITLES = {
  king: ['👑', 'Aaj ka *King* hai', 'Sab salaam karo!'],
  queen: ['👸', 'Aaj ki *Queen* hai', 'Taj mubarak ho!'],
  captain: ['🧑‍✈️', 'Group ka *Captain* hai', 'Ab sab is ki sunenge 😎'],
  lucky: ['🍀', 'Aaj ka sab se *Lucky* banda', 'Lottery ka ticket le lo aaj!'],
  unlucky: ['🙈', 'Aaj ka sab se *Unlucky* banda', 'Aaj ghar se mat niklo 😂']
}

async function members (sock, from) {
  const meta = await sock.groupMetadata(from)
  const me = [num(sock.user?.id), num(sock.user?.lid || '')]
  return { meta, list: meta.participants.map(p => p.id).filter(j => !me.includes(num(j))) }
}

const picker = (key, aliases) => ({
  name: key, aliases, category: 'games', group: true, desc: TITLES[key][1].replace(/\*/g, '') + ' (random member)',
  async run ({ sock, from, reply }) {
    const { list } = await members(sock, from)
    if (!list.length) return reply('Group mein koi member nahi mila.')
    const w = pick(list); const [e, t, s] = TITLES[key]
    await reply(`${e} ${t}: ${tag(w)}\n${s}`, { mentions: [w] })
  }
})

async function isWord (w) {
  try {
    const r = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(w), { signal: AbortSignal.timeout(6000) })
    return r.status !== 404
  } catch { return true }   // API band ho to game na ruke
}

function wordRound (from, reply) {
  const g = games.word.get(from)
  if (!g) return
  if (g.round >= g.rounds) {
    end(games.word, from)
    const top = Object.entries(g.score).sort((a, b) => b[1] - a[1])
    return reply(`🏁 *Word Battle khatam!*\n\n${top.length ? top.map(([j, n], i) => `${i + 1}. @${j} — ${n}`).join('\n') : 'Kisi ne score nahi kiya 😅'}`,
      { mentions: top.map(([j]) => j + '@s.whatsapp.net') }).catch(() => {})
  }
  g.round++
  g.letter = pick('abcdefghiklmnoprstw'.split(''))
  g.min = 4 + Math.floor(Math.random() * 3)
  g.open = true
  reply(`⚔️ *Round ${g.round}/${g.rounds}*\n\n*${g.letter.toUpperCase()}* se shuru hone wala English lafz likho — kam az kam *${g.min}* harf. (30 second)`).catch(() => {})
  clearTimeout(g.timer)
  g.timer = setTimeout(() => { if (g.open) { g.open = false; reply('⌛ Kisi ne jawab nahi diya.').catch(() => {}); wordRound(from, reply) } }, 30000)
}

function impostorReveal (from, reply) {
  const g = end(games.impostor, from)
  if (!g || g.phase !== 'vote') return
  const count = {}
  for (const t of Object.values(g.votes)) count[t] = (count[t] || 0) + 1
  const top = Object.entries(count).sort((a, b) => b[1] - a[1])
  const out = top[0] && (!top[1] || top[1][1] < top[0][1]) ? top[0][0] : null
  const caught = out === g.impostor
  if (caught) g.players.filter(p => p !== g.impostor).forEach(p => addPoints(from, p, 3))
  else addPoints(from, g.impostor, 5)
  reply(`🕵️ *Impostor tha:* ${tag(g.impostor)}\nAsal lafz: *${g.word}* | Impostor ka lafz: *${g.fake}*\n\n${out ? `Sab ne ${tag(out)} ko chuna.` : 'Vote barabar ho gaye.'}\n${caught ? '🎉 Players jeet gaye! (+3 har ek)' : '😈 Impostor jeet gaya! (+5)'}`,
    { mentions: [g.impostor, ...(out ? [out] : [])] }).catch(() => {})
}

// ---------- commands ----------
export default [
  { name: 'anagram', aliases: ['unscramble'], category: 'games', desc: 'Lambe lafz ke harf seedhe karo (+4)',
    async run ({ from, args, reply }) {
      if (args[0] === 'stop') { const g = end(games.anagram, from); return reply(g ? `🛑 Lafz tha: *${g.word}*` : 'Koi game nahi.') }
      if (games.anagram.has(from)) return reply('Pehle wala hal karo! (hint: .anagram hint)')
      const word = pick(ANAGRAMS)
      let mixed = word
      while (mixed === word) mixed = shuffle([...word]).join('')
      games.anagram.set(from, { word })
      timeout(games.anagram, from, 45000, () => reply(`⌛ Waqt khatam! Lafz tha: *${word}*`).catch(() => {}))
      await reply(`🔠 *Anagram*\n\n*${mixed.toUpperCase().split('').join(' ')}*\n\n${word.length} harf, pehla harf *${word[0].toUpperCase()}*. Sahi lafz likho (45 second)`)
    } },

  { name: 'emojiquiz', aliases: ['eq', 'emojiguess'], category: 'games', desc: 'Emoji se film/cheez pehchano (+3)',
    async run ({ from, args, reply }) {
      if (args[0] === 'stop') { const g = end(games.emoji, from); return reply(g ? `🛑 Jawab tha: *${g.ans[0]}*` : 'Koi game nahi.') }
      if (games.emoji.has(from)) return reply('Pehle wale emoji ka jawab do!')
      const [e, ...ans] = pick(EMOJI_Q)
      games.emoji.set(from, { ans })
      timeout(games.emoji, from, 30000, () => reply(`⌛ Waqt khatam! Jawab tha: *${ans[0]}*`).catch(() => {}))
      await reply(`🧩 *Emoji Quiz*\n\n${e}\n\nYeh kya hai? Film, insaan ya cheez (30 second)`)
    } },

  { name: 'numberbattle', aliases: ['nb', 'numbattle'], category: 'games', desc: '1-100 ka number dhoondo, sab mil kar (+5)',
    async run ({ from, args, reply }) {
      if (args[0] === 'stop') { const g = end(games.number, from); return reply(g ? `🛑 Number tha: *${g.n}*` : 'Koi game nahi.') }
      if (games.number.has(from)) return reply('Game chal raha hai, number likho!')
      const max = Math.min(Math.max(parseInt(args[0]) || 100, 10), 10000)
      games.number.set(from, { n: 1 + Math.floor(Math.random() * max), tries: 0, max })
      timeout(games.number, from, 180000, g => reply(`⌛ Waqt khatam! Number tha: *${g.n}*`).catch(() => {}))
      await reply(`🔢 *Number Battle*\n\nMaine 1 se ${max} tak ek number socha hai. Sab number likho, main bataunga bada hai ya chhota. Pehle sahi = +5 (3 minute)`)
    } },

  { name: 'wordbattle', aliases: ['wb', 'lafzjang'], category: 'games', group: true, desc: '5 rounds: diye harf se lafz (+2 har round)',
    async run ({ from, args, reply }) {
      if (args[0] === 'stop') { const g = end(games.word, from); return reply(g ? '🛑 Word battle band.' : 'Koi game nahi.') }
      if (games.word.has(from)) return reply('Word battle chal raha hai!')
      games.word.set(from, { round: 0, rounds: 5, used: new Set(), score: {} })
      await reply('⚔️ *Word Battle shuru!* 5 rounds, har round mein pehla sahi lafz +2.')
      wordRound(from, reply)
    } },

  { name: 'impostor', aliases: ['imposter', 'spygame'], category: 'games', group: true,
    desc: 'Impostor dhoondo (.impostor → join → start → vote @user)',
    async run ({ sock, from, args, sender, msg, reply }) {
      const sub = (args[0] || '').toLowerCase()
      let g = games.impostor.get(from)
      if (sub === 'stop' || sub === 'end') { end(games.impostor, from); return reply('🛑 Impostor game band.') }
      if (!g) {
        if (sub && sub !== 'new') return reply('Koi game nahi. Shuru: .impostor')
        g = { phase: 'lobby', host: sender, players: [sender], votes: {} }
        games.impostor.set(from, g)
        timeout(games.impostor, from, 600000, () => reply('⌛ Impostor game ka waqt khatam.').catch(() => {}))
        return reply(`🕵️ *Impostor Game*\n\nKhelne ke liye *.impostor join* likho.\n${tag(sender)} (host) 3+ players hone par *.impostor start* likhe.\n\nHar player ko private mein ek lafz milega — ek banda (impostor) ka lafz alag hoga. Baat karo, phir *.impostor vote @user*`, { mentions: [sender] })
      }
      if (sub === 'join') {
        if (g.phase !== 'lobby') return reply('Game shuru ho chuka hai.')
        if (g.players.includes(sender)) return reply('Aap pehle se shamil hain.')
        g.players.push(sender)
        return reply(`✅ ${tag(sender)} shamil (${g.players.length} players)`, { mentions: [sender] })
      }
      if (sub === 'start') {
        if (g.phase !== 'lobby') return reply('Game pehle se chal raha hai.')
        if (sender !== g.host) return reply('Sirf host start kar sakta hai.')
        if (g.players.length < 3) return reply(`Kam az kam 3 players chahiye (abhi ${g.players.length}).`)
        const [a, b] = shuffle(pick(IMPOSTOR_WORDS))
        Object.assign(g, { phase: 'vote', word: a, fake: b, impostor: pick(g.players) })
        const failed = []
        for (const p of g.players) {
          try { await sock.sendMessage(p, { text: `🕵️ Impostor game ka tumhara lafz: *${p === g.impostor ? b : a}*\n\nKisi ko seedha mat batana! Group mein ishaaron se baat karo.` }) } catch { failed.push(p) }
        }
        return reply(`🎬 *Game shuru!* Sab ko private mein lafz bhej diya.${failed.length ? `\n⚠️ ${failed.map(tag).join(', ')} ko nahi gaya.` : ''}\n\nBaari baari apne lafz ke baare mein ek hint do. Phir: *.impostor vote @user*\nHost: *.impostor reveal*`, { mentions: [...g.players] })
      }
      if (sub === 'vote') {
        if (g.phase !== 'vote') return reply('Abhi voting nahi.')
        if (!g.players.includes(sender)) return reply('Aap is game mein nahi.')
        const t = getContextInfo(msg).mentionedJid?.[0]
        if (!t || !g.players.includes(t)) return reply('Kisi player ko tag karo: .impostor vote @user')
        g.votes[sender] = t
        await reply(`🗳️ Vote ho gaya (${Object.keys(g.votes).length}/${g.players.length})`)
        if (Object.keys(g.votes).length >= g.players.length) impostorReveal(from, reply)
        return
      }
      if (sub === 'reveal') {
        if (sender !== g.host) return reply('Sirf host reveal kar sakta hai.')
        return impostorReveal(from, reply)
      }
      return reply(`Game chal raha hai (${g.phase}). .impostor join / start / vote @user / reveal / stop`)
    } },

  { name: 'groupvote', aliases: ['votekick', 'gvote'], category: 'group', group: true, admin: true,
    desc: 'Member ko nikaalne par group ka vote (.groupvote @user)',
    async run ({ sock, from, msg, reply }) {
      if (games.vote.has(from)) return reply('Ek vote pehle se chal raha hai.')
      const ci = getContextInfo(msg)
      const t = ci.mentionedJid?.[0] || ci.participant
      if (!t) return reply('Kisi ko tag/reply karo: .groupvote @user')
      const meta = await sock.groupMetadata(from)
      if (isAdmin(meta, t)) return reply('Admin par vote nahi ho sakta.')
      const g = { target: t, yes: new Set(), no: new Set() }
      games.vote.set(from, g)
      timeout(games.vote, from, 120000, async (x) => {
        const need = Math.max(3, Math.ceil(meta.participants.length * 0.2))
        const pass = x.yes.size > x.no.size && x.yes.size >= need
        let note = ''
        if (pass) {
          const m2 = await sock.groupMetadata(from).catch(() => meta)
          if (botIsAdmin(m2, sock)) { await sock.groupParticipantsUpdate(from, [x.target], 'remove').catch(() => {}); note = '\n🚪 Nikaal diya gaya.' } else note = '\n⚠️ Bot admin nahi, is liye nikaal nahi saka.'
        }
        await sock.sendMessage(from, { text: `🗳️ *Vote khatam* — ${tag(x.target)}\n✅ Haan: ${x.yes.size} | ❌ Nahi: ${x.no.size} (kam az kam ${need} haan chahiye the)\n${pass ? 'Faisla: *nikaalo*' : 'Faisla: *rehne do*'}${note}`, mentions: [x.target] }).catch(() => {})
      })
      await reply(`🗳️ *Group Vote*\n\nKya ${tag(t)} ko group se nikaal diya jaye?\n\n*haan* ya *nahi* likho (2 minute)`, { mentions: [t] })
    } },

  { name: 'mostlikely', aliases: ['whoismost', 'kon'], category: 'games', group: true, desc: 'Kaun sab se zyada... (.mostlikely late aayega)',
    async run ({ sock, from, text, reply }) {
      if (!text) return reply('.mostlikely exam mein fail hoga')
      const { list } = await members(sock, from)
      if (!list.length) return reply('Koi member nahi mila.')
      const w = pick(list)
      await reply(`🤔 Sab se zyada imkaan hai ke *${text}*...\n\n👉 ${tag(w)} 😂`, { mentions: [w] })
    } },

  picker('king', ['badshah']),
  picker('queen', ['malika']),
  picker('captain', ['kaptaan']),
  picker('lucky', ['luckyone']),
  picker('unlucky', ['badqismat'])
]

// ---------- jawab sunne wala hook ----------
export async function hook ({ from, sender, body, msg, reply, config }) {
  if (msg.key.fromMe && !body) return
  const raw = (body || '').trim()
  if (!raw || raw.length > 40 || raw.startsWith(config.prefix)) return
  const t = raw.toLowerCase()
  const win = (n) => `🎉 ${tag(sender)} +${n} points (kul ${addPoints(from, sender, n)})`

  const a = games.anagram.get(from)
  if (a && t === a.word) { end(games.anagram, from); return reply(`✅ Sahi, *${a.word}*!\n${win(4)}`, { mentions: [sender] }) }

  const e = games.emoji.get(from)
  if (e && e.ans.includes(t.replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim())) { end(games.emoji, from); return reply(`✅ Sahi, *${e.ans[0]}*!\n${win(3)}`, { mentions: [sender] }) }

  const n = games.number.get(from)
  if (n && /^\d{1,5}$/.test(t)) {
    const v = +t; n.tries++
    if (v === n.n) { end(games.number, from); return reply(`🎯 Sahi! Number tha *${n.n}* (${n.tries} koshishen)\n${win(5)}`, { mentions: [sender] }) }
    return reply(v < n.n ? `⬆️ ${v} se *bada* hai` : `⬇️ ${v} se *chhota* hai`)
  }

  const w = games.word.get(from)
  if (w?.open && /^[a-z]+$/.test(t) && t.startsWith(w.letter) && t.length >= w.min) {
    if (w.used.has(t)) return reply(`*${t}* pehle aa chuka hai.`)
    if (!await isWord(t)) return
    if (!w.open) return
    w.open = false; w.used.add(t); clearTimeout(w.timer)
    w.score[num(sender)] = (w.score[num(sender)] || 0) + 2
    addPoints(from, sender, 2)
    await reply(`✅ ${tag(sender)} — *${t}* (+2)`, { mentions: [sender] })
    return wordRound(from, reply)
  }

  const g = games.vote.get(from)
  if (g && /^(haan|han|ha|yes|y|ji|nahi|nhi|na|no|n)$/.test(t) && sender !== g.target) {
    const yes = /^(haan|han|ha|yes|y|ji)$/.test(t)
    g.yes.delete(sender); g.no.delete(sender)
    ;(yes ? g.yes : g.no).add(sender)
  }
}
