// Fun & games — offline, hamesha chalti hain
import { num, getContextInfo } from '../../lib/helpers.js'

const pick = a => a[Math.floor(Math.random() * a.length)]
const jokes = ['Teacher: homework kahan hai? Student: dog kha gaya. Teacher: tumhare paas dog nahi. Student: isi liye to late hai, kharidne gaya tha 😅',
  'Doctor: aap ko aaram ki zarurat hai. Mareez: ghar pe bachay hain. Doctor: to doosri biwi le aao. Mareez: pehli ki ijazat? 😂']
const quotes = ['Mehnat itni khamoshi se karo ke kamyabi shor macha de.', 'Waqt aur taqdeer dono badalte hain, bas himmat na haaro.']
const facts = ['Shahad kabhi kharab nahi hota.', 'Octopus ke 3 dil hote hain.', 'Honey bee ek second mein 200 baar par hilati hai.']
const eightball = ['Haan ✅', 'Nahi ❌', 'Shayad 🤔', 'Bilkul', 'Mushkil hai', 'Baad mein pooch', 'Yaqeenan']

export default [
  { name: 'joke', aliases: ['mazaq'], category: 'fun', desc: 'Joke', async run ({ reply }) { await reply(pick(jokes)) } },
  { name: 'quote', aliases: ['qoute'], category: 'fun', desc: 'Quote', async run ({ reply }) { await reply('💬 ' + pick(quotes)) } },
  { name: 'fact', category: 'fun', desc: 'Random fact', async run ({ reply }) { await reply('🧠 ' + pick(facts)) } },
  { name: 'roll', aliases: ['dice'], category: 'fun', desc: 'Dice', async run ({ reply }) { await reply('🎲 ' + (1 + Math.floor(Math.random() * 6))) } },
  { name: 'flip', aliases: ['toss'], category: 'fun', desc: 'Coin', async run ({ reply }) { await reply(Math.random() < 0.5 ? '🪙 Heads' : '🪙 Tails') } },
  { name: '8ball', aliases: ['ball'], category: 'fun', desc: 'Sawal ka jawab',
    async run ({ text, reply }) { if (!text) return reply('Sawal poochein.'); await reply('🎱 ' + pick(eightball)) } },
  { name: 'rate', category: 'fun', desc: 'Rate out of 100',
    async run ({ reply, text }) { await reply(`📊 ${text || 'Ye'}: ${Math.floor(Math.random() * 101)}/100`) } },
  { name: 'ship', category: 'fun', desc: 'Love %',
    async run ({ reply }) { await reply(`❤️ Love: ${Math.floor(Math.random() * 101)}%`) } },
  { name: 'truth', category: 'fun', desc: 'Truth sawal',
    async run ({ reply }) { await reply('❓ ' + pick(['Sabse bada jhoot jo bola?', 'Crush ka naam?', 'Sabse sharmindagi wala pal?'])) } },
  { name: 'dare', category: 'fun', desc: 'Dare task',
    async run ({ reply }) { await reply('🔥 ' + pick(['Group DP 1 ghanta ke liye badlo.', 'Apna last photo bhejo.', '10 push-ups ki video.'])) } }
]
