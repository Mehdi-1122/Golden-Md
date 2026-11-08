// Text tools — BOHOT saare stylish fonts + transformers
// Unicode ke math alphabets mein kuch harf "Letterlike" block mein hain; asal jagah khali hoti hai
const HOLES = {
  0x1D455: 0x210E,
  0x1D49D: 0x212C, 0x1D4A0: 0x2130, 0x1D4A1: 0x2131, 0x1D4A3: 0x210B, 0x1D4A4: 0x2110, 0x1D4A7: 0x2112, 0x1D4A8: 0x2133, 0x1D4AD: 0x211B,
  0x1D4BA: 0x212F, 0x1D4BC: 0x210A, 0x1D4C4: 0x2134,
  0x1D506: 0x212D, 0x1D50B: 0x210C, 0x1D50C: 0x2111, 0x1D515: 0x211C, 0x1D51D: 0x2128,
  0x1D53A: 0x2102, 0x1D53F: 0x210D, 0x1D545: 0x2115, 0x1D547: 0x2119, 0x1D548: 0x211A, 0x1D549: 0x211D, 0x1D551: 0x2124
}
const cp = n => String.fromCodePoint(HOLES[n] || n)
function mapAlpha (str, up, lo, dig, upperOnly) {
  return [...str].map(ch => {
    const c = ch.codePointAt(0)
    if (c >= 65 && c <= 90) return cp(up + (c - 65))
    if (c >= 97 && c <= 122) return upperOnly ? cp(up + (c - 97)) : (lo ? cp(lo + (c - 97)) : ch)
    if (dig && c >= 48 && c <= 57) return cp(dig + (c - 48))
    return ch
  }).join('')
}
const combine = (str, mark) => [...str].map(c => /\s/.test(c) ? c : c + mark).join('')

const SMALL = { a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ' }
const FLIP = { a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z' }
const smallcaps = s => [...s].map(c => SMALL[c.toLowerCase()] || c).join('')
const flip = s => [...s.toLowerCase()].map(c => FLIP[c] || c).reverse().join('')

const S = [
  ['Bold', s => mapAlpha(s, 0x1D400, 0x1D41A, 0x1D7CE)],
  ['Italic', s => mapAlpha(s, 0x1D434, 0x1D44E)],
  ['Bold Italic', s => mapAlpha(s, 0x1D468, 0x1D482)],
  ['Script', s => mapAlpha(s, 0x1D49C, 0x1D4B6)],
  ['Bold Script', s => mapAlpha(s, 0x1D4D0, 0x1D4EA)],
  ['Fraktur', s => mapAlpha(s, 0x1D504, 0x1D51E)],
  ['Bold Fraktur', s => mapAlpha(s, 0x1D56C, 0x1D586)],
  ['Double Struck', s => mapAlpha(s, 0x1D538, 0x1D552, 0x1D7D8)],
  ['Monospace', s => mapAlpha(s, 0x1D670, 0x1D68A, 0x1D7F6)],
  ['Sans', s => mapAlpha(s, 0x1D5A0, 0x1D5BA)],
  ['Sans Bold', s => mapAlpha(s, 0x1D5D4, 0x1D5EE, 0x1D7EC)],
  ['Sans Italic', s => mapAlpha(s, 0x1D608, 0x1D622)],
  ['Sans Bold Italic', s => mapAlpha(s, 0x1D63C, 0x1D656)],
  ['Circled', s => mapAlpha(s, 0x24B6, 0x24D0)],
  ['Circled Dark', s => mapAlpha(s, 0x1F150, 0, null, true)],
  ['Squared', s => mapAlpha(s, 0x1F130, 0, null, true)],
  ['Squared Dark', s => mapAlpha(s, 0x1F170, 0, null, true)],
  ['Fullwidth', s => mapAlpha(s, 0xFF21, 0xFF41, 0xFF10)],
  ['Parenthesized', s => mapAlpha(s, 0x1F110, 0x249C, null, false)],
  ['Regional', s => mapAlpha(s, 0x1F1E6, 0, null, true)],
  ['Small Caps', smallcaps],
  ['Upside Down', flip],
  ['Strikethrough', s => combine(s, '̶')],
  ['Underline', s => combine(s, '̲')],
  ['Slashed', s => combine(s, '̸')]
]

// decorative frames (base = sans bold)
const B = s => mapAlpha(s, 0x1D5D4, 0x1D5EE, 0x1D7EC)
const FRAMES = [
  s => `꧁༒${B(s)}༒꧂`,
  s => `「 ${B(s)} 」`,
  s => `◤${B(s)}◢`,
  s => `★彡 ${B(s)} 彡★`,
  s => `༺ ${B(s)} ༻`,
  s => `▄︻デ ${B(s)} ═一💥`,
  s => `✦•┈۬୨${B(s)}୧۬┈•✦`,
  s => `⫷ ${B(s)} ⫸`,
  s => `꧁${smallcaps(s)}꧂`,
  s => `✿ ${B(s)} ✿`
]

export default [
  { name: 'fancy', aliases: ['style', 'stylish', 'font', 'fonts'], category: 'text',
    desc: 'Text ko bohot saare stylish fonts',
    async run ({ text, reply }) {
      if (!text) return reply('.fancy Mehdi King')
      let out = `✨ *${text}* — ${S.length + FRAMES.length} styles\n`
      for (const [name, fn] of S) out += `\n${fn(text)}`
      out += '\n'
      for (const f of FRAMES) out += `\n${f(text)}`
      await reply(out.trim())
    } },
  { name: 'mock', category: 'text', desc: 'sPoNgEbOb text',
    async run ({ text, reply }) { if (!text) return reply('.mock text'); await reply([...text].map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join('')) } },
  { name: 'reverse', aliases: ['rev'], category: 'text', desc: 'Ulta text',
    async run ({ text, reply }) { if (!text) return reply('.reverse text'); await reply([...text].reverse().join('')) } },
  { name: 'upper', category: 'text', desc: 'CAPITAL', async run ({ text, reply }) { await reply((text || '').toUpperCase() || '.upper text') } },
  { name: 'lower', category: 'text', desc: 'small', async run ({ text, reply }) { await reply((text || '').toLowerCase() || '.lower text') } },
  { name: 'spaceout', aliases: ['spread'], category: 'text', desc: 's p a c e', async run ({ text, reply }) { if (!text) return reply('.spaceout text'); await reply([...text].join(' ')) } },
  { name: 'clap', category: 'text', desc: 'word👏by👏word', async run ({ text, reply }) { if (!text) return reply('.clap text'); await reply(text.split(/\s+/).join(' 👏 ')) } },
  { name: 'count', aliases: ['len'], category: 'text', desc: 'Ginti', async run ({ text, reply }) { if (!text) return reply('.count text'); await reply(`🔤 Chars: ${text.length}\n📝 Words: ${text.trim().split(/\s+/).length}`) } }
]
