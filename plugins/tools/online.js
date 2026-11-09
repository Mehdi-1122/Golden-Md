// Net tools — free APIs, koi key nahi (internet chahiye)
import { translate } from '../../lib/translate.js'

export default [
  { name: 'qr', category: 'tools', desc: 'Text → QR code',
    async run ({ text, sock, from, msg, reply }) {
      if (!text) return reply('.qr <text ya link>')
      const url = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + encodeURIComponent(text)
      await sock.sendMessage(from, { image: { url }, caption: '📱 ' + text }, { quoted: msg })
    } },
  { name: 'weather', aliases: ['mausam'], category: 'tools', desc: 'Mausam (.weather Lahore)',
    async run ({ text, reply }) {
      if (!text) return reply('.weather Lahore')
      const r = await fetch(`https://wttr.in/${encodeURIComponent(text)}?format=j1`)
      if (!r.ok) return reply('Shehar nahi mila.')
      const j = await r.json()
      const c = j.current_condition[0]
      await reply(`🌦️ *${text}*\n🌡️ ${c.temp_C}°C (feels ${c.FeelsLikeC}°C)\n☁️ ${c.weatherDesc[0].value}\n💧 Humidity: ${c.humidity}%\n💨 Wind: ${c.windspeedKmph} km/h`)
    } },
  { name: 'translate', aliases: ['trt', 'tr'], category: 'tools', desc: 'Translate (.trt ur hello)',
    async run ({ args, reply }) {
      const lang = args.shift()
      const q = args.join(' ')
      if (!lang || !q) return reply('.trt <lang> <text>\nmisal: .trt ur Hello how are you')
      await reply('🌐 ' + await translate(q, lang))
    } },
  { name: 'define', aliases: ['dict', 'meaning'], category: 'tools', desc: 'Word ka matlab (English)',
    async run ({ text, reply }) {
      if (!text) return reply('.define <word>')
      const r = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(text.trim()))
      if (!r.ok) return reply('Word nahi mila.')
      const j = await r.json()
      const m = j[0].meanings.slice(0, 3).map(x => `*${x.partOfSpeech}:* ${x.definitions[0].definition}`).join('\n')
      await reply(`📚 *${j[0].word}*\n${j[0].phonetic || ''}\n\n${m}`)
    } },
  { name: 'shorten', aliases: ['short', 'tinyurl'], category: 'tools', desc: 'URL chhota karo',
    async run ({ text, reply }) {
      if (!/^https?:\/\//.test(text || '')) return reply('.shorten https://example.com/...')
      const r = await fetch('https://is.gd/create.php?format=simple&url=' + encodeURIComponent(text))
      const s = await r.text()
      await reply(s.startsWith('http') ? '🔗 ' + s : 'Short nahi ho saka.')
    } }
]
