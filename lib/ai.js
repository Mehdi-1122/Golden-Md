// Claude API ka chhota helper — naye AI plugins isi ko use karte hain
export async function askAI (prompt, { system = 'You are a helpful WhatsApp assistant. Reply briefly in the user\'s language.', max = 600 } = {}) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('.env mein ANTHROPIC_API_KEY daalein.')
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-haiku-5-5', max_tokens: max, system,
      messages: [{ role: 'user', content: prompt }] })
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error?.message || 'AI ' + r.status)
  return j.content?.map(c => c.text).join('') || '...'
}
