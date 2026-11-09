// Text se voice note, aur translate kar ke voice note
import fs from 'fs'
import { tmp, clean, ff } from '../../lib/media-tools.js'
import { translate } from '../../lib/translate.js'

const LANGS = new Set(['ur', 'en', 'ar', 'hi', 'fr', 'es', 'tr', 'de', 'ru', 'zh-cn', 'pa', 'bn', 'fa', 'id'])
const MAX_TEXT = 1000

// Google TTS ek dafa mein ~200 harf leta hai
function chunks (text, max = 190) {
  const out = []; let line = ''
  for (const w of text.split(/\s+/)) {
    if ((line + ' ' + w).trim().length > max) { if (line) out.push(line); line = w.slice(0, max) } else line = (line + ' ' + w).trim()
  }
  if (line) out.push(line)
  return out
}

export async function speak (text, lang) {
  const parts = []
  for (const c of chunks(text)) {
    const r = await fetch(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(c)}`, { headers: { 'user-agent': 'Mozilla/5.0' } })
    if (!r.ok) throw new Error('Awaaz nahi ban saki, dobara try karo.')
    parts.push(Buffer.from(await r.arrayBuffer()))
  }
  const inp = tmp('mp3'), out = tmp('ogg')
  try {
    fs.writeFileSync(inp, Buffer.concat(parts))
    await ff(['-i', inp, '-vn', '-c:a', 'libopus', '-b:a', '48k', '-ac', '1', out])
    return fs.readFileSync(out)
  } finally { clean(inp, out) }
}

// Urdu likhai ho to Urdu, Roman ho to Hindi awaaz (Roman Urdu isi mein sahi parhi jati hai)
const guessLang = (t) => /[؀-ۿ]/.test(t) ? 'ur' : 'hi'
const sendVoice = (ctx, audio) => ctx.sock.sendMessage(ctx.from, { audio, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: ctx.msg })

export default [
  { name: 'tts', aliases: ['bolo', 'say'], category: 'ai', desc: 'Text se voice note (.tts en hello)',
    async run (ctx) {
      let t = (ctx.text || '').trim()
      if (!t) return ctx.reply('.tts <text>\n.tts en hello   (ur, en, ar, hi, tr, fr...)')
      let lang = guessLang(t)
      const first = (ctx.args[0] || '').toLowerCase()
      if (LANGS.has(first) && ctx.args.length > 1) { lang = first; t = t.replace(/^\S+\s*/, '') }
      if (t.length > MAX_TEXT) return ctx.reply(`Text ${MAX_TEXT} harf se chhota rakho.`)
      await sendVoice(ctx, await speak(t, lang))
    } },
  { name: 'trvoice', aliases: ['trv', 'translatevoice'], category: 'ai', desc: 'Translate + voice note (.trv en salam)',
    async run (ctx) {
      const lang = (ctx.args[0] || '').toLowerCase()
      const t = (ctx.text || '').replace(/^\S+\s*/, '')
      if (!LANGS.has(lang) || !t) return ctx.reply('.trv <zubaan> <text>\nMisal: .trv en mera naam Mehdi hai')
      if (t.length > MAX_TEXT) return ctx.reply(`Text ${MAX_TEXT} harf se chhota rakho.`)
      const done = await translate(t, lang)
      await ctx.reply('🌐 ' + done)
      await sendVoice(ctx, await speak(done, lang))
    } }
]
