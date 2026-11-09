// News, film ki info, duniya ka waqt, domain whois (koi key nahi chahiye)
const decode = (s) => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()

async function getJSON (url) {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } })
  if (!r.ok) throw new Error('API ' + r.status)
  return r.json()
}

export default [
  { name: 'news', aliases: ['khabrein', 'headlines'], category: 'tools', desc: 'Taza khabrein (.news ya .news cricket)',
    async run ({ text, reply }) {
      const q = (text || '').trim()
      const url = q
        ? 'https://news.google.com/rss/search?hl=en-PK&gl=PK&ceid=PK:en&q=' + encodeURIComponent(q)
        : 'https://news.google.com/rss?hl=en-PK&gl=PK&ceid=PK:en'
      const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } })
      if (!r.ok) return reply('⚠️ Khabrein abhi nahi mil rahin.')
      const items = (await r.text()).split('<item>').slice(1, 9).map(x => decode(/<title>([\s\S]*?)<\/title>/.exec(x)?.[1] || ''))
      if (!items.length) return reply('Is baare mein khabar nahi mili.')
      await reply(`📰 *${q ? 'News: ' + q : 'Taza Khabrein'}*\n\n${items.map((t, i) => `${i + 1}. ${t}`).join('\n\n')}`)
    } },
  { name: 'imdb', aliases: ['movieinfo', 'film'], category: 'tools', desc: 'Film ya drama ki info',
    async run ({ text, sock, from, msg, reply }) {
      if (!text) return reply('.imdb <film ka naam>   misal: .imdb Interstellar')
      const q = text.trim().toLowerCase().replace(/\s+/g, '_')
      const j = await getJSON(`https://v3.sg.media-imdb.com/suggestion/${encodeURIComponent(q[0])}/${encodeURIComponent(q)}.json`)
      const m = (j.d || []).find(x => x.id?.startsWith('tt'))
      if (!m) return reply('Film nahi mili.')
      const caption = `🎬 *${m.l}* ${m.y ? `(${m.y})` : ''}\n📺 ${m.q || 'Title'}\n⭐ Cast: ${m.s || '-'}\n🔗 https://www.imdb.com/title/${m.id}/`
      if (m.i?.imageUrl) return sock.sendMessage(from, { image: { url: m.i.imageUrl }, caption }, { quoted: msg })
      await reply(caption)
    } },
  { name: 'time', aliases: ['timezone', 'waqt'], category: 'tools', desc: 'Kisi shehar ka waqt (.time Dubai)',
    async run ({ text, reply }) {
      if (!text) return reply('.time Dubai   ya   .time London')
      const g = (await getJSON('https://geocoding-api.open-meteo.com/v1/search?count=1&name=' + encodeURIComponent(text.trim()))).results?.[0]
      if (!g) return reply('Shehar nahi mila.')
      const now = new Intl.DateTimeFormat('en-GB', { timeZone: g.timezone, weekday: 'long', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date())
      await reply(`🕐 *${g.name}, ${g.country}*\n\n${now}\n🌐 ${g.timezone}`)
    } },
  { name: 'whois', aliases: ['domain'], category: 'tools', desc: 'Domain ki maloomat (.whois google.com)',
    async run ({ text, reply }) {
      const d = (text || '').trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0]
      if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d)) return reply('.whois google.com')
      const r = await fetch('https://rdap.org/domain/' + encodeURIComponent(d), { headers: { accept: 'application/rdap+json', 'user-agent': 'Mozilla/5.0' } })
      if (r.status === 404) return reply('Ye domain register nahi, ya is ki maloomat public nahi.')
      if (!r.ok) return reply('⚠️ Maloomat nahi mil saki.')
      const j = await r.json()
      const when = (a) => j.events?.find(e => e.eventAction === a)?.eventDate?.slice(0, 10) || '-'
      const registrar = j.entities?.find(e => e.roles?.includes('registrar'))?.vcardArray?.[1]?.find(v => v[0] === 'fn')?.[3] || '-'
      const ns = (j.nameservers || []).slice(0, 4).map(n => n.ldhName.toLowerCase()).join('\n   ') || '-'
      await reply(`🌐 *${d}*\n\n🏢 Registrar: ${registrar}\n📅 Bana: ${when('registration')}\n⌛ Khatam: ${when('expiration')}\n🔄 Update: ${when('last changed')}\n🖧 Nameservers:\n   ${ns}`)
    } }
]
