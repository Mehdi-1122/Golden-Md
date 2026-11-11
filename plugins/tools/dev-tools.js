// Kaam ke tools — json, hex, uuid, urlencode, timestamp, expandurl, spell, summarize, regex, readqr
import crypto from 'crypto'
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { askAny } from '../../lib/ai.js'
import { getQuoted, getType, quotedText } from '../../lib/helpers.js'

// command ka text, ya reply kiye hue message ka text
const input = (ctx) => ctx.text || quotedText(ctx.msg)
const TZ = 'Asia/Karachi'
const fmtDate = (d) => d.toLocaleString('en-GB', { timeZone: TZ, weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })

const simple = (name, aliases, desc, usage, fn) => ({
  name, aliases, category: 'tools', desc,
  async run (ctx) {
    const t = input(ctx)
    if (!t) return ctx.reply(usage)
    try { await ctx.reply(fn(t)) } catch (e) { await ctx.reply('⚠️ ' + e.message) }
  }
})

export default [
  simple('json', ['jsonformat', 'prettyjson'], 'JSON check + saaf format', '.json {"a":1}  (ya JSON wale message pe reply)',
    t => { try { return '✅ Sahi JSON\n\n```' + JSON.stringify(JSON.parse(t), null, 2).slice(0, 3500) + '```' } catch (e) { return '❌ Ghalat JSON: ' + e.message } }),
  simple('hex', ['tohex'], 'Text → hex', '.hex hello', t => Buffer.from(t).toString('hex')),
  simple('unhex', ['fromhex'], 'Hex → text', '.unhex 68656c6c6f',
    t => { const h = t.replace(/\s|0x/gi, ''); if (!/^[0-9a-f]*$/i.test(h) || h.length % 2) throw new Error('Ghalat hex.'); return Buffer.from(h, 'hex').toString('utf8') }),
  simple('urlencode', ['encodeurl'], 'Text → URL encoded', '.urlencode hello world', t => encodeURIComponent(t)),
  simple('urldecode', ['decodeurl'], 'URL encoded → text', '.urldecode hello%20world',
    t => { try { return decodeURIComponent(t) } catch { throw new Error('Ghalat encoded text.') } }),

  { name: 'uuid', aliases: ['guid'], category: 'tools', desc: 'Random UUID (.uuid 5)',
    async run ({ args, reply }) {
      const n = Math.min(Math.max(parseInt(args[0]) || 1, 1), 20)
      await reply(Array.from({ length: n }, () => crypto.randomUUID()).join('\n'))
    } },

  { name: 'timestamp', aliases: ['unix', 'epoch'], category: 'tools', desc: 'Unix time ↔ date (.timestamp 1700000000)',
    async run ({ text, reply }) {
      const t = (text || '').trim()
      if (!t) { const d = new Date(); return reply(`🕒 Abhi\nUnix: ${Math.floor(d / 1000)}\nMs: ${+d}\nPK: ${fmtDate(d)}\nUTC: ${d.toISOString()}`) }
      if (/^\d{9,13}$/.test(t)) {
        const d = new Date(t.length > 11 ? +t : +t * 1000)
        return reply(`📅 ${t}\nPK: ${fmtDate(d)}\nUTC: ${d.toISOString()}`)
      }
      const d = new Date(t)
      if (isNaN(d)) return reply('Samajh nahi aaya. Misal: .timestamp 1700000000  ya  .timestamp 2026-12-31 23:59')
      await reply(`🔢 ${t}\nUnix: ${Math.floor(d / 1000)}\nMs: ${+d}`)
    } },

  { name: 'expandurl', aliases: ['unshorten', 'longurl'], category: 'tools', desc: 'Chhote link ka asal link (.expandurl bit.ly/xyz)',
    async run (ctx) {
      let u = (input(ctx) || '').trim().split(/\s+/)[0]
      if (!u) return ctx.reply('.expandurl https://bit.ly/xyz')
      if (!/^https?:\/\//i.test(u)) u = 'https://' + u
      const hops = [u]
      for (let i = 0; i < 10; i++) {
        const r = await fetch(u, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(10000), headers: { 'user-agent': 'Mozilla/5.0' } })
        const loc = r.headers.get('location')
        if (!(r.status >= 300 && r.status < 400 && loc)) break
        u = new URL(loc, u).href; hops.push(u)
      }
      await ctx.reply(hops.length > 1 ? `🔗 *Asal link:*\n${u}\n\nRaasta (${hops.length - 1} redirect):\n${hops.join('\n↓\n')}` : `🔗 Yeh link kahin redirect nahi hota:\n${u}`)
    } },

  { name: 'spell', aliases: ['spellcheck', 'grammar'], category: 'tools', desc: 'Spelling/grammar theek karo (AI)',
    async run (ctx) {
      const t = input(ctx)
      if (!t) return ctx.reply('.spell <text>  (ya message pe reply)')
      const a = await askAny(t.slice(0, 3000), { system: 'Fix spelling and grammar of the user text. Keep the same language and meaning. Reply with ONLY the corrected text, then on a new line "Ghaltiyan:" and a very short list of what you changed (max 5). If nothing is wrong, say "✅ Koi ghalti nahi."', max: 800 })
      await ctx.reply('✍️ ' + a)
    } },

  { name: 'summarize', aliases: ['summary', 'khulasa', 'tldr'], category: 'tools', desc: 'Lambe text ka khulasa (AI)',
    async run (ctx) {
      const t = input(ctx)
      if (!t) return ctx.reply('Kisi lambe message pe reply kar ke .summarize likho (ya .summarize <text>)')
      if (t.length < 150) return ctx.reply('Yeh to pehle hi chhota hai 🙂')
      const a = await askAny(t.slice(0, 12000), { system: 'Summarize the user text in 3-6 short bullet points in the same language as the text (Roman Urdu if it is Roman Urdu). No intro line.', max: 600 })
      await ctx.reply('📝 *Khulasa*\n\n' + a)
    } },

  { name: 'regex', aliases: ['regextest'], category: 'tools', desc: 'Regex test (.regex \\d+ | text 123)',
    async run (ctx) {
      const [p, ...rest] = (ctx.text || '').split('|')
      const subject = rest.join('|').trim() || quotedText(ctx.msg)
      if (!p?.trim() || !subject) return ctx.reply('.regex <pattern> | <text>\nMisal: .regex \\d+ | mera number 0300 1234567\nFlags: .regex /hello/i | Hello')
      let src = p.trim(), flags = 'g'
      const m = /^\/(.+)\/([gimsuy]*)$/.exec(src)
      if (m) { src = m[1]; flags = [...new Set((m[2] + 'g').split(''))].join('') }
      if (src.length > 200 || subject.length > 3000) return ctx.reply('Pattern ya text bohat lamba hai.')
      let re
      try { re = new RegExp(src, flags) } catch (e) { return ctx.reply('❌ Ghalat regex: ' + e.message) }
      const found = [...subject.matchAll(re)].slice(0, 30)
      await ctx.reply(found.length ? `✅ ${found.length} match:\n\n${found.map((x, i) => `${i + 1}. "${x[0]}" (index ${x.index})${x.length > 1 ? ' groups: ' + x.slice(1).map(g => JSON.stringify(g ?? null)).join(', ') : ''}`).join('\n')}` : '❌ Koi match nahi.')
    } },

  { name: 'readqr', aliases: ['scanqr', 'qrread'], category: 'tools', desc: 'QR code wali photo pe reply → us ka text',
    async run ({ sock, msg, reply }) {
      const q = getQuoted(msg)
      const target = q?.message?.imageMessage ? q : msg
      if (getType(target) !== 'imageMessage') return reply('QR code wali *photo* pe reply kar ke .readqr likho')
      const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
      const form = new FormData()
      form.append('file', new Blob([buf], { type: 'image/jpeg' }), 'qr.jpg')
      const r = await fetch('https://api.qrserver.com/v1/read-qr-code/', { method: 'POST', body: form, signal: AbortSignal.timeout(20000) })
      const j = await r.json().catch(() => null)
      const data = j?.[0]?.symbol?.[0]?.data
      await reply(data ? `📷 *QR ka text:*\n\n${data}` : '❌ Is photo mein QR code nahi mila (saaf aur seedhi photo bhejein).')
    } }
]
