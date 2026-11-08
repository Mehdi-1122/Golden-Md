// AI tools — summary, grammar fix, caption, CV/bio, homework (Claude API)
import { askAI } from '../lib/ai.js'
import { quotedText } from '../lib/helpers.js'

// reply kiye message ka text, warna command ke saath likha text
const input = ({ msg, text }) => quotedText(msg) || text

const aiCmd = (name, aliases, desc, usage, system, max = 700) => ({
  name, aliases, category: 'ai', desc,
  async run (ctx) {
    const t = input(ctx)
    if (!t) return ctx.reply(usage)
    try { await ctx.reply(await askAI(t, { system, max })) }
    catch (e) { await ctx.reply('⚠️ ' + e.message) }
  }
})

export default [
  aiCmd('summary', ['summarize', 'tldr', 'khulasa'], 'Lambe msg ka khulasa',
    'Lambe message ko reply kar ke .summary likho (ya .summary <text>)',
    'Diye gaye text ka chhota khulasa 3-5 bullet points mein do, usi zubaan mein jis mein text hai (Roman Urdu / Urdu / English). Sirf khulasa.'),
  aiCmd('fix', ['grammar', 'correct'], 'Grammar/spelling theek karo',
    'Message ko reply kar ke .fix (ya .fix <text>)',
    'Text ki grammar, spelling aur punctuation theek karo, zubaan wahi rakho. Pehle sirf theek kiya hua text do, phir "Galtiyan:" ke neeche 1-3 chhoti baatein.'),
  aiCmd('caption', ['hashtag', 'hashtags'], 'Insta/TikTok caption + hashtags',
    '.caption <post kis baare mein hai>   misal: .caption beach par dosto ke saath',
    'Social media (Instagram/TikTok) ke liye 3 alag catchy captions do (emoji ke saath, Roman Urdu ya English jaise user likhe), phir 10-15 relevant hashtags ek line mein.'),
  aiCmd('cv', ['resume', 'mycv'], 'Chhota CV / profile bio',
    '.cv <naam, taleem, skills, tajurba>   misal: .cv Ali, BS CS, PHP/Laravel, 2 saal web developer',
    'Diye gaye details se WhatsApp-friendly chhota professional CV banao: Naam, Summary (2 line), Skills, Experience, Education. *bold* headings use karo. Jo details nahi di, wo mat ghadho. Aakhir mein ek 1-line LinkedIn/Insta bio bhi do.', 900),
  aiCmd('homework', ['hw', 'solve', 'explain'], 'Sawal ka step-by-step hal',
    '.homework <sawal>   (ya sawal ko reply karo)',
    'Tum ek acche ustad ho. Sawal ko step-by-step asaan zubaan mein hal karo (usi zubaan mein jis mein sawal hai), aakhir mein *Jawab:* likh kar final answer. Math ke liye seedha text use karo, LaTeX nahi.', 1000)
]
