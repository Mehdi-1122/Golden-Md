// Hangman, flag quiz, word guess, guess the song (points leaderboard ke saath)
import store from '../../lib/store.js'
import { num } from '../../lib/helpers.js'

const pick = a => a[Math.floor(Math.random() * a.length)]
const clean = (s) => s.toLowerCase().replace(/\([^)]*\)|\[[^\]]*\]/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

function addPoints (chat, jid, n) {
  const all = store.obj('points'); const g = (all[chat] ||= {})
  g[num(jid)] = (g[num(jid)] || 0) + n; store.save()
  return g[num(jid)]
}

const WORDS = ['pakistan', 'lahore', 'karachi', 'islamabad', 'cricket', 'biryani', 'computer', 'mobile', 'internet', 'whatsapp', 'football', 'teacher', 'student', 'doctor', 'engineer', 'mountain', 'river', 'garden', 'kitchen', 'library', 'airplane', 'elephant', 'tiger', 'rainbow', 'diamond', 'window', 'bottle', 'guitar', 'camera', 'sunflower']
const FLAGS = [['🇵🇰', 'pakistan'], ['🇮🇳', 'india'], ['🇧🇩', 'bangladesh'], ['🇦🇫', 'afghanistan'], ['🇮🇷', 'iran'], ['🇸🇦', 'saudi arabia', 'saudia', 'ksa'], ['🇦🇪', 'uae', 'united arab emirates', 'dubai'], ['🇹🇷', 'turkey', 'turkiye'], ['🇶🇦', 'qatar'], ['🇰🇼', 'kuwait'], ['🇴🇲', 'oman'], ['🇮🇶', 'iraq'], ['🇪🇬', 'egypt'], ['🇲🇾', 'malaysia'], ['🇮🇩', 'indonesia'], ['🇨🇳', 'china'], ['🇯🇵', 'japan'], ['🇰🇷', 'south korea', 'korea'], ['🇷🇺', 'russia'], ['🇺🇸', 'usa', 'america', 'united states'], ['🇬🇧', 'uk', 'england', 'britain', 'united kingdom'], ['🇨🇦', 'canada'], ['🇦🇺', 'australia'], ['🇳🇿', 'new zealand'], ['🇫🇷', 'france'], ['🇩🇪', 'germany'], ['🇮🇹', 'italy'], ['🇪🇸', 'spain'], ['🇵🇹', 'portugal'], ['🇧🇷', 'brazil'], ['🇦🇷', 'argentina'], ['🇲🇽', 'mexico'], ['🇿🇦', 'south africa'], ['🇳🇬', 'nigeria'], ['🇱🇰', 'sri lanka'], ['🇳🇵', 'nepal'], ['🇸🇪', 'sweden'], ['🇳🇴', 'norway'], ['🇨🇭', 'switzerland'], ['🇳🇱', 'netherlands', 'holland']]
const ARTISTS = ['Atif Aslam', 'Arijit Singh', 'Rahat Fateh Ali Khan', 'Ali Zafar', 'Coke Studio Pakistan', 'Nusrat Fateh Ali Khan', 'Shreya Ghoshal', 'Ed Sheeran', 'The Weeknd', 'Taylor Swift', 'Justin Bieber', 'Imagine Dragons']

const hangman = new Map(), flag = new Map(), wordg = new Map(), song = new Map()
const LIVES = 6
const shown = g => [...g.word].map(c => g.got.has(c) ? c.toUpperCase() : '_').join(' ')
const hearts = g => '❤️'.repeat(g.lives) + '🖤'.repeat(LIVES - g.lives)

function arm (map, from, ms, onEnd) {
  const g = map.get(from)
  clearTimeout(g.timer)
  g.timer = setTimeout(() => { map.delete(from); onEnd(g) }, ms)
}
const finish = (map, from, g) => { clearTimeout(g.timer); map.delete(from) }

export default [
  { name: 'hangman', aliases: ['hm', 'lafzphansi'], category: 'games', desc: 'Harf se lafz dhoondo (+5)',
    async run ({ from, args, reply }) {
      const cur = hangman.get(from)
      if (['stop', 'end'].includes(args[0])) { if (!cur) return reply('Koi game nahi.'); finish(hangman, from, cur); return reply(`🛑 Khatam. Lafz tha: *${cur.word}*`) }
      if (cur) return reply(`Game chal raha hai:\n\n${shown(cur)}\n${hearts(cur)}`)
      const g = { word: pick(WORDS), got: new Set(), tried: new Set(), lives: LIVES }
      hangman.set(from, g)
      arm(hangman, from, 180000, x => reply(`⌛ Waqt khatam! Lafz tha: *${x.word}*`).catch(() => {}))
      await reply(`🪢 *Hangman*\n\n${shown(g)}\n${hearts(g)}\n\nEk harf likho (a-z), ya poora lafz. Band: .hangman stop`)
    } },
  { name: 'flagquiz', aliases: ['flag', 'jhanda'], category: 'games', desc: 'Jhanda pehchano (+3)',
    async run ({ from, reply }) {
      if (flag.has(from)) return reply('Pehle wale jhande ka jawab do!')
      const [f, ...names] = pick(FLAGS)
      flag.set(from, { names })
      arm(flag, from, 25000, () => reply(`⌛ Waqt khatam! Ye *${names[0]}* tha.`).catch(() => {}))
      await reply(`🏳️ *Flag Quiz*\n\n${f}\n\nYe kis mulk ka jhanda hai? (25 second)`)
    } },
  { name: 'wordguess', aliases: ['wg', 'scramble'], category: 'games', desc: 'Ulte harf se lafz banao (+3)',
    async run ({ from, reply }) {
      if (wordg.has(from)) return reply('Pehle wala lafz hal karo!')
      const word = pick(WORDS)
      let mixed = word
      for (let i = 0; i < 8 && mixed === word; i++) mixed = [...word].sort(() => Math.random() - 0.5).join('')
      wordg.set(from, { word })
      arm(wordg, from, 30000, () => reply(`⌛ Waqt khatam! Lafz tha: *${word}*`).catch(() => {}))
      await reply(`🔤 *Word Guess*\n\n*${mixed.toUpperCase()}*\n\nSahi lafz likho (30 second)`)
    } },
  { name: 'guesssong', aliases: ['gs', 'gaanapehchano'], category: 'games', desc: 'Gaana sun kar naam batao (+5)',
    async run ({ sock, from, msg, reply }) {
      if (song.has(from)) return reply('Pehle wale gaane ka jawab do!')
      const r = await fetch('https://api.deezer.com/search?limit=25&q=' + encodeURIComponent(pick(ARTISTS)))
      const list = ((await r.json()).data || []).filter(t => t.preview)
      if (!list.length) return reply('⚠️ Gaana nahi mila, dobara try karo.')
      const t = pick(list)
      const title = clean(t.title_short || t.title)
      song.set(from, { title, shownTitle: t.title_short || t.title, artist: t.artist?.name })
      arm(song, from, 45000, g => reply(`⌛ Waqt khatam! Gaana tha: *${g.shownTitle}* — ${g.artist}`).catch(() => {}))
      await sock.sendMessage(from, { audio: { url: t.preview }, mimetype: 'audio/mpeg' }, { quoted: msg })
      await reply('🎵 *Guess The Song*\n\nGaane ka naam likho (45 second)')
    } }
]

export async function hook ({ from, sender, body, reply }) {
  const raw = (body || '').trim()
  if (!raw || raw.length > 60) return
  const t = raw.toLowerCase()
  const win = (n) => `🎉 @${num(sender)} +${n} points (kul ${addPoints(from, sender, n)})`

  const h = hangman.get(from)
  if (h && /^[a-z]+$/.test(t) && (t.length === 1 || t.length === h.word.length)) {
    if (t === h.word || [...h.word].every(c => h.got.has(c) || c === t)) {
      finish(hangman, from, h)
      return reply(`✅ Lafz tha *${h.word.toUpperCase()}*\n${win(5)}`, { mentions: [sender] })
    }
    if (t.length > 1) { h.lives-- } else {
      if (h.tried.has(t)) return reply(`*${t}* pehle try ho chuka hai.`)
      h.tried.add(t)
      if (h.word.includes(t)) h.got.add(t); else h.lives--
    }
    if (h.lives <= 0) { finish(hangman, from, h); return reply(`💀 Game over! Lafz tha: *${h.word}*`) }
    return reply(`${shown(h)}\n${hearts(h)}`)
  }

  const f = flag.get(from)
  if (f && f.names.includes(clean(raw))) {
    finish(flag, from, f)
    return reply(`✅ Sahi, *${f.names[0]}*!\n${win(3)}`, { mentions: [sender] })
  }

  const w = wordg.get(from)
  if (w && t === w.word) {
    finish(wordg, from, w)
    return reply(`✅ Sahi, *${w.word}*!\n${win(3)}`, { mentions: [sender] })
  }

  const s = song.get(from)
  if (s) {
    const a = clean(raw)
    if (a === s.title || (a.length >= 4 && s.title.includes(a) && a.length >= s.title.length * 0.6) || (s.title.length >= 4 && a.includes(s.title))) {
      finish(song, from, s)
      return reply(`✅ Sahi, *${s.shownTitle}* — ${s.artist}\n${win(5)}`, { mentions: [sender] })
    }
  }
}
