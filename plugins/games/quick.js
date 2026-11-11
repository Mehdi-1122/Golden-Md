// Games — offline, hamesha chalti hain
const pick = a => a[Math.floor(Math.random() * a.length)]

export default [
  { name: 'rps', aliases: ['pkp'], category: 'games', desc: 'Stone paper scissor',
    async run ({ text, reply }) {
      const map = { stone: '🪨', rock: '🪨', paper: '📄', scissor: '✂️', scissors: '✂️' }
      const u = map[(text || '').toLowerCase()]
      if (!u) return reply('.rps stone / paper / scissor')
      const bot = pick(['🪨', '📄', '✂️'])
      const beats = { '🪨': '✂️', '📄': '🪨', '✂️': '📄' }
      const res = u === bot ? '🤝 Draw!' : beats[u] === bot ? '🎉 Tum jeet gaye!' : '😎 Bot jeet gaya!'
      await reply(`Tum: ${u}\nBot: ${bot}\n\n${res}`)
    } },
  { name: 'slot', aliases: ['slots'], category: 'games', desc: 'Slot machine',
    async run ({ reply }) {
      const e = ['🍒', '🍋', '🍉', '⭐', '7️⃣', '🍀']
      const r = [pick(e), pick(e), pick(e)]
      const win = r[0] === r[1] && r[1] === r[2]
      await reply(`🎰 [ ${r.join(' | ')} ]\n\n${win ? '💰 JACKPOT!' : 'Phir koshish karo 🎲'}`)
    } },
  { name: 'lottery', aliases: ['luckynumber'], category: 'games', desc: 'Lucky number',
    async run ({ reply }) { await reply('🎟️ Tumhara lucky number: ' + (1 + Math.floor(Math.random() * 100))) } },
  { name: 'pick', aliases: ['choose'], category: 'games', desc: 'Options mein se ek chuno',
    async run ({ text, reply }) {
      const opts = (text || '').split('|').map(s => s.trim()).filter(Boolean)
      if (opts.length < 2) return reply('.pick chai | coffee | juice')
      await reply('🤔 Main kehta hoon: *' + pick(opts) + '*')
    } },
  { name: 'guess', category: 'games', desc: 'Bot ka number guess (1-5)',
    async run ({ text, reply }) {
      const g = parseInt(text), n = 1 + Math.floor(Math.random() * 5)
      if (!(g >= 1 && g <= 5)) return reply('.guess <1-5>')
      await reply(g === n ? `🎉 Sahi! Number tha ${n}` : `❌ Nahi, number tha ${n}`)
    } }
]
