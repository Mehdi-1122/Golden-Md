// Search / info / utility tools
export default [
  { name: 'calc', aliases: ['calculate'], category: 'tools', desc: 'Hisaab: .calc 2+2*3',
    async run ({ text, reply }) {
      if (!/^[-+*/.()\d\s]+$/.test(text)) return reply('Sirf numbers aur + - * / ( )')
      try { await reply('🧮 ' + Function('"use strict";return (' + text + ')')()) }
      catch { await reply('Ghalat hisaab.') }
    } },
  { name: 'ai', aliases: ['gpt', 'ask'], category: 'ai', desc: 'AI se sawal',
    async run ({ text, reply }) {
      if (!text) return reply('.ai <sawal>')
      if (!process.env.ANTHROPIC_API_KEY) return reply('⚠️ .env mein ANTHROPIC_API_KEY daalein.')
      try {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-haiku-5-5', max_tokens: 600,
            system: 'You are a helpful WhatsApp assistant. Reply briefly in the user\'s language.',
            messages: [{ role: 'user', content: text }] })
        })
        const j = await r.json()
        await reply(r.ok ? (j.content?.map(c => c.text).join('') || '...') : '⚠️ ' + (j.error?.message || r.status))
      } catch (e) { await reply('⚠️ ' + e.message) }
    } },
  { name: 'tts', category: 'tools', desc: 'Text to speech link',
    async run ({ text, reply }) {
      if (!text) return reply('.tts <text>')
      await reply('🔊 https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ur&q=' + encodeURIComponent(text))
    } },
  { name: 'wa', aliases: ['wame'], category: 'tools', desc: 'wa.me link',
    async run ({ args, reply }) { const n = (args[0] || '').replace(/\D/g, ''); if (!n) return reply('Number dein.'); await reply('https://wa.me/' + n) } }
]
