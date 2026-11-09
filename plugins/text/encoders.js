// Encoders / converters (sab offline, Node built-in)
import crypto from 'crypto'

const MORSE = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', ' ': '/' }
const UNMORSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]))

export default [
  { name: 'base64', aliases: ['b64', 'encode'], category: 'convert', desc: 'Text → base64',
    async run ({ text, reply }) { if (!text) return reply('.base64 text'); await reply(Buffer.from(text).toString('base64')) } },
  { name: 'unbase64', aliases: ['unb64', 'decode'], category: 'convert', desc: 'base64 → text',
    async run ({ text, reply }) { if (!text) return reply('.unbase64 <code>'); try { await reply(Buffer.from(text, 'base64').toString('utf8')) } catch { await reply('Ghalat base64.') } } },
  { name: 'binary', aliases: ['tobin'], category: 'convert', desc: 'Text → binary',
    async run ({ text, reply }) { if (!text) return reply('.binary text'); await reply([...text].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')) } },
  { name: 'unbinary', aliases: ['frombin'], category: 'convert', desc: 'Binary → text',
    async run ({ text, reply }) { if (!text) return reply('.unbinary 0100...'); try { await reply(text.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('')) } catch { await reply('Ghalat binary.') } } },
  { name: 'morse', category: 'convert', desc: 'Text → morse',
    async run ({ text, reply }) { if (!text) return reply('.morse text'); await reply([...text.toLowerCase()].map(c => MORSE[c] || '').join(' ').trim()) } },
  { name: 'unmorse', aliases: ['demorse'], category: 'convert', desc: 'Morse → text',
    async run ({ text, reply }) { if (!text) return reply('.unmorse .- -...'); await reply(text.trim().split(' ').map(m => UNMORSE[m] || '').join('')) } },
  { name: 'hash', aliases: ['md5', 'sha256'], category: 'convert', desc: 'MD5 + SHA256',
    async run ({ text, reply }) {
      if (!text) return reply('.hash text')
      await reply(`MD5:\n${crypto.createHash('md5').update(text).digest('hex')}\n\nSHA256:\n${crypto.createHash('sha256').update(text).digest('hex')}`)
    } }
]
