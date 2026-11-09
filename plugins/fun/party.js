// Aur fun — sab offline
const pick = a => a[Math.floor(Math.random() * a.length)]

const WYR = [
  'Hamesha ke liye roti ya hamesha ke liye biryani?',
  'Udnay ki taqat ya ghaib hone ki taqat?',
  'Bina internet 1 saal ya bina chai 1 saal?',
  'Ameer but akela ya ghareeb but doston ke saath?'
]
const NHIE = [
  'Maine kabhi school/office se jhoot bol ke chutti nahi li 🙊',
  'Maine kabhi raat 3 baje tak movie nahi dekhi 🌙',
  'Maine kabhi kisi ka message dekh ke ignore nahi kiya 👀'
]
const RIDDLES = [
  ['Aisi cheez jo gili hone par sukhti hai?', 'Tauliya'],
  ['Jiske paas keys hain par taale nahi khulte?', 'Keyboard/Piano'],
  ['Subah 4 paon, dopahar 2, shaam 3 — kya?', 'Insaan (bachpan, jawani, burhapa)']
]
const PICKUP = [
  'Tum wifi ho kya? Kyunki main connection feel kar raha hoon 📶',
  'Google ho tum? Kyunki tum mein wo sab hai jo main dhoond raha tha 🔎'
]
const COMPLIMENT = ['Tum kamaal ke insaan ho! 🌟', 'Teri smile din bana deti hai 😄', 'Tum jo karte ho dil se karte ho 💯']
const ROAST = ['Dimagh to hai tumhare paas… bas abhi tak unbox nahi hua 📦😂', 'Tum itne unique ho ke tumhari galtiyan bhi copyright ho sakti hain 😅']

export default [
  { name: 'wyr', aliases: ['wouldyourather'], category: 'fun', desc: 'Would you rather',
    async run ({ reply }) { await reply('🤔 ' + pick(WYR)) } },
  { name: 'nhie', aliases: ['neverhaveiever'], category: 'fun', desc: 'Never have I ever',
    async run ({ reply }) { await reply('🙈 ' + pick(NHIE)) } },
  { name: 'riddle', aliases: ['paheli'], category: 'fun', desc: 'Paheli (jawab 30 second baad)',
    async run ({ reply }) {
      const [q, a] = pick(RIDDLES)
      await reply(`🧩 ${q}\n\n⏱️ Jawab 30 second baad...`)
      setTimeout(() => reply(`💡 Jawab: *${a}*`).catch(() => {}), 30000)
    } },
  { name: 'pickup', aliases: ['line'], category: 'fun', desc: 'Pickup line',
    async run ({ reply }) { await reply('😏 ' + pick(PICKUP)) } },
  { name: 'compliment', aliases: ['tareef'], category: 'fun', desc: 'Tareef',
    async run ({ reply }) { await reply(pick(COMPLIMENT)) } },
  { name: 'roast', category: 'fun', desc: 'Halka roast (mazak)',
    async run ({ reply }) { await reply(pick(ROAST)) } }
]
