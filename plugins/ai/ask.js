// .ai — seedha sawal jawab (Claude API)
export default [
  { name: 'ai', aliases: ['ask'], category: 'ai', desc: 'AI se sawal',
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
    } }
]
