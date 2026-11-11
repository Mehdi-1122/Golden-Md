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

// Claude (key ho to), warna free AI — spell/summarize jaise chhote kaam ke liye
export async function askAny (prompt, { system, max = 600 } = {}) {
  if (process.env.ANTHROPIC_API_KEY) {
    try { return await askAI(prompt, { system, max }) } catch (e) { console.error('askAny claude:', e.message) }
  }
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST', signal: AbortSignal.timeout(20000), headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'openai', private: true, messages: [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content: prompt }] })
      })
      const a = r.ok && (await r.json()).choices?.[0]?.message?.content?.trim()
      if (a) return a
    } catch {}
  }
  throw new Error('AI abhi jawab nahi de raha, thori der baad koshish karein.')
}
