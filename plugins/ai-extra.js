// AI image, website screenshot, shayari
const pick = a => a[Math.floor(Math.random() * a.length)]
const SHAYARI = [
  'Mohabbat mein nahi hai farq jeene aur marne ka,\nusi ko dekh kar jeete hain jis kafir pe dam nikle.',
  'Hazaron khwahishen aisi ke har khwahish pe dam nikle,\nbahut nikle mere armaan lekin phir bhi kam nikle.',
  'Kuch to majbooriyan rahi hongi,\nyun hi koi bewafa nahi hota.'
]

export default [
  { name: 'img', aliases: ['imagine', 'aiimage', 'dalle'], category: 'ai', desc: 'AI se image banao',
    async run ({ text, sock, from, msg, reply }) {
      if (!text) return reply('.img <prompt>   misal: .img a lion in space')
      await reply('🎨 Image ban rahi hai...')
      const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(text) + '?width=1024&height=1024&nologo=true'
      await sock.sendMessage(from, { image: { url }, caption: '🎨 ' + text }, { quoted: msg })
    } },
  { name: 'ssweb', aliases: ['screenshot', 'ss'], category: 'ai', desc: 'Website ka screenshot',
    async run ({ text, sock, from, msg, reply }) {
      if (!/^https?:\/\//.test(text || '')) return reply('.ssweb https://example.com')
      const url = 'https://image.thum.io/get/width/1200/' + text
      await sock.sendMessage(from, { image: { url }, caption: '🖥️ ' + text }, { quoted: msg })
    } },
  { name: 'shayari', aliases: ['poetry', 'sher'], category: 'ai', desc: 'Shayari (AI ya built-in)',
    async run ({ text, reply }) {
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const r = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
            body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-haiku-5-5', max_tokens: 200,
              messages: [{ role: 'user', content: `Ek khoobsurat Urdu shayari (2-4 lines) likho${text ? ' is topic par: ' + text : ''}. Sirf shayari, aur kuch nahi.` }] })
          })
          const j = await r.json()
          if (r.ok) return reply('🖋️ ' + (j.content?.map(c => c.text).join('') || pick(SHAYARI)))
        } catch {}
      }
      await reply('🖋️ ' + pick(SHAYARI))
    } }
]
