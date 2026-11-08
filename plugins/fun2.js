// Fun — free APIs (koi key nahi, internet chahiye)
const dec = s => (s || '').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').replace(/&eacute;/g, 'é').replace(/&shy;/g, '')

export default [
  { name: 'advice', aliases: ['mashwara'], category: 'fun', desc: 'Random advice',
    async run ({ reply }) {
      const j = await (await fetch('https://api.adviceslip.com/advice')).json()
      await reply('💡 ' + j.slip.advice)
    } },
  { name: 'quotes', aliases: ['motivate', 'qt'], category: 'fun', desc: 'Motivational quote',
    async run ({ reply }) {
      try { const j = await (await fetch('https://api.quotable.io/random')).json(); return reply(`💬 "${j.content}"\n— ${j.author}`) }
      catch { const j = await (await fetch('https://zenquotes.io/api/random')).json(); return reply(`💬 "${j[0].q}"\n— ${j[0].a}`) }
    } },
  { name: 'catfact', aliases: ['cat'], category: 'fun', desc: 'Billi ke baare mein fact',
    async run ({ reply }) {
      const j = await (await fetch('https://catfact.ninja/fact')).json()
      await reply('🐱 ' + j.fact)
    } },
  { name: 'bored', aliases: ['activity'], category: 'fun', desc: 'Bore ho? ye karo',
    async run ({ reply }) {
      const j = await (await fetch('https://www.boredapi.com/api/activity')).json()
      await reply('🎯 ' + j.activity)
    } },
  { name: 'trivia', aliases: ['quizq'], category: 'fun', desc: 'Trivia sawal (jawab 30 second baad)',
    async run ({ reply }) {
      const j = await (await fetch('https://opentdb.com/api.php?amount=1&type=multiple')).json()
      const q = j.results[0]
      const opts = [...q.incorrect_answers, q.correct_answer].map(dec).sort(() => Math.random() - 0.5)
      await reply(`🧠 *${dec(q.category)}*\n\n${dec(q.question)}\n\n${opts.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\n⏱️ Jawab 30 second baad...`)
      setTimeout(() => reply(`💡 Jawab: *${dec(q.correct_answer)}*`).catch(() => {}), 30000)
    } }
]
