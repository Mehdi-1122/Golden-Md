// Islamic plus — tafseer (quran.com), AI dua, Islamic quiz, Jumma
import store from '../lib/store.js'
import { num } from '../lib/helpers.js'
import { askAI } from '../lib/ai.js'
import { toggleRun } from '../lib/buttons.js'

const pick = a => a[Math.floor(Math.random() * a.length)]
const shuffle = a => [...a].sort(() => Math.random() - 0.5)

// [sawal, sahi, ghalat x3]
const QUIZ = [
  ['Quran mein kitni surtein hain?', '114', '113', '110', '120'],
  ['Quran ki sab se lambi surah?', 'Al-Baqarah', 'Aal-e-Imran', 'An-Nisa', 'Yaseen'],
  ['Quran ki sab se chhoti surah?', 'Al-Kawthar', 'Al-Ikhlas', 'An-Nasr', 'Al-Asr'],
  ['Pehli wahi kis ghaar mein aayi?', 'Ghar-e-Hira', 'Ghar-e-Saur', 'Ghar-e-Uhud', 'Ghar-e-Arafat'],
  ['Islam ke kitne arkaan hain?', '5', '4', '6', '7'],
  ['Islam ke pehle khalifa?', 'Hazrat Abu Bakr (RA)', 'Hazrat Umar (RA)', 'Hazrat Usman (RA)', 'Hazrat Ali (RA)'],
  ['Islam ke teesre khalifa?', 'Hazrat Usman (RA)', 'Hazrat Ali (RA)', 'Hazrat Umar (RA)', 'Hazrat Abu Bakr (RA)'],
  ['Nabi ﷺ ne kis shehar ki taraf hijrat ki?', 'Madinah', 'Taif', 'Makkah', 'Jerusalem'],
  ['Quran kis mahine mein nazil hona shuru hua?', 'Ramzan', 'Shaban', 'Muharram', 'Rajab'],
  ['Zamzam ka chashma kis ke liye nikla?', 'Hazrat Ismail (AS)', 'Hazrat Ibrahim (AS)', 'Hazrat Musa (AS)', 'Hazrat Isa (AS)'],
  ['Din mein kitni farz namazein hain?', '5', '3', '4', '6'],
  ['Ghazwa-e-Badr kis Hijri saal mein hua?', '2 Hijri', '3 Hijri', '5 Hijri', '8 Hijri'],
  ['Nabi ﷺ ki walida ka naam?', 'Hazrat Aamina', 'Hazrat Khadija', 'Hazrat Halima', 'Hazrat Fatima'],
  ['Islam ke pehle muezzin?', 'Hazrat Bilal (RA)', 'Hazrat Ammar (RA)', 'Hazrat Zaid (RA)', 'Hazrat Anas (RA)'],
  ['Quran ke kitne paare hain?', '30', '40', '114', '25'],
  ['Kis nabi ko machli ne nigla?', 'Hazrat Yunus (AS)', 'Hazrat Nuh (AS)', 'Hazrat Musa (AS)', 'Hazrat Yusuf (AS)'],
  ['Zaboor kis nabi par nazil hui?', 'Hazrat Dawood (AS)', 'Hazrat Musa (AS)', 'Hazrat Isa (AS)', 'Hazrat Sulaiman (AS)'],
  ['Tauraat kis nabi par nazil hui?', 'Hazrat Musa (AS)', 'Hazrat Dawood (AS)', 'Hazrat Isa (AS)', 'Hazrat Ibrahim (AS)'],
  ['Injeel kis nabi par nazil hui?', 'Hazrat Isa (AS)', 'Hazrat Musa (AS)', 'Hazrat Yahya (AS)', 'Hazrat Dawood (AS)'],
  ['Ayat-ul-Kursi kis surah mein hai?', 'Al-Baqarah', 'Aal-e-Imran', 'Yaseen', 'Al-Mulk'],
  ['Kaunsi surah Bismillah ke baghair shuru hoti hai?', 'At-Tawbah', 'Al-Fatiha', 'Al-Ikhlas', 'Al-Anfal'],
  ['Zakat maal ka kitna hissa hai?', '2.5%', '5%', '10%', '1%'],
  ['Hajj kis Islami mahine mein hota hai?', 'Zul-Hijjah', 'Ramzan', 'Muharram', 'Shawwal'],
  ['Nabi ﷺ kis shehar mein paida hue?', 'Makkah', 'Madinah', 'Taif', 'Jeddah']
]
const quiz = new Map()

export default [
  { name: 'tafseer', aliases: ['tafsir'], category: 'islamic', desc: 'Ayat ki tafseer (.tafseer 2:255 / en)',
    async run ({ args, reply }) {
      const ref = (args[0] || '').replace(/\s/g, '')
      if (!/^\d+:\d+$/.test(ref)) return reply('.tafseer 2:255   (Urdu — Ibn Kathir)\n.tafseer 2:255 en   (English)')
      const id = args[1] === 'en' ? 169 : 160
      const r = await fetch(`https://api.quran.com/api/v4/tafsirs/${id}/by_ayah/${ref}`)
      const j = await r.json()
      const t = (j.tafsir?.text || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim()
      if (!t) return reply('Tafseer nahi mili.')
      await reply(`📖 *Tafseer ${ref}* — ${j.tafsir.resource_name || (id === 160 ? 'Ibn Kathir (Urdu)' : 'Ibn Kathir')}\n\n${t.length > 3500 ? t.slice(0, 3500) + '...' : t}`)
    } },
  { name: 'duaai', aliases: ['duafor', 'masnoondua'], category: 'islamic', desc: 'Masle ke liye masnoon dua (AI)',
    async run ({ text, reply }) {
      if (!text) return reply('.duaai <masla>   misal: .duaai imtihan ki tension')
      try {
        await reply('🤲 ' + await askAI(text, { max: 500,
          system: 'User ke masle ke liye 1-2 mashhoor masnoon duayein do (Quran ya sahih hadith se): Arabic, Roman Urdu talaffuz, Urdu tarjuma, aur hawala (surah/ayat ya kitab). Agar pakka hawala na ho to wo dua mat do. Aakhir mein likho: "Kisi aalim se tasdeeq kar lein."' }))
      } catch (e) { await reply('⚠️ ' + e.message) }
    } },
  { name: 'islamicquiz', aliases: ['iquiz', 'deeniquiz'], category: 'islamic', desc: 'Islamic quiz (+3 points)',
    async run ({ from, reply }) {
      if (quiz.has(from)) return reply('Pehle wale sawal ka jawab do!')
      const [q, right, ...wrong] = pick(QUIZ)
      const opts = shuffle([right, ...wrong]); const ans = 'ABCD'[opts.indexOf(right)]
      const timer = setTimeout(() => { quiz.delete(from); reply(`⌛ Waqt khatam! Sahi jawab: *${ans}) ${right}*`) }, 30000)
      quiz.set(from, { ans, right, tried: new Set(), timer })
      await reply(`☪️ *Islamic Quiz*\n\n❓ ${q}\n\n${opts.map((o, i) => `${'ABCD'[i]}) ${o}`).join('\n')}\n\n⏱️ 30 second — A/B/C/D likho`)
    } },
  { name: 'jummah', aliases: ['jumma', 'jumuah'], category: 'islamic', desc: 'Jumma Mubarak + sunnatein',
    async run ({ reply }) {
      await reply(`🕌 *Jumma Mubarak* 🌙\n\n✨ Jumme ki sunnatein:\n• Ghusl karna\n• Saaf kapde aur khushbu\n• Surah Al-Kahf ki tilawat (.surah 18)\n• Durood Shareef kasrat se\n• Jaldi masjid jana\n• Asr se Maghrib tak dua (qabooliyat ki ghari)\n\n“Jo Jumme ke din Surah Kahf padhe, us ke liye do Jummon ke darmiyan noor roshan kar diya jata hai.” — Hakim/Baihaqi`)
    } },
  { name: 'jummahalert', aliases: ['jummaalert'], category: 'islamic', group: true, admin: true, desc: 'Har Jumme subah 10 baje yaad',
    run: (ctx) => toggleRun(ctx, { key: 'jummahalert', label: 'Jumma alert', on: '✅ Jumma alert ON — har Jumme subah 10 baje (PK time) yaad dilaunga.' }) }
]

// ---------- Jumma alert ----------
const socks = new Map()
let lastSent = ''
clearInterval(globalThis.__gmdJumma)
globalThis.__gmdJumma = setInterval(async () => {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', day: '2-digit', month: '2-digit' })
  const s = f.format(new Date())   // misal: "Fri 07/11, 10:00"
  if (!s.startsWith('Fri') || !s.endsWith('10:00') || lastSent === s) return
  lastSent = s
  for (const gid of Object.keys(store.get('jummahalert') || {})) {
    const sock = socks.get(gid)?.live?.()
    if (sock?.gmdOpen) await sock.sendMessage(gid, { text: '🕌 *Jumma Mubarak!*\n\nAaj Surah Al-Kahf padhna, ghusl karna aur Durood Shareef ki kasrat na bhoolna. 🤲\n(.jummah — sunnatein)' }).catch(() => {})
  }
}, 30000)

// hook: alert wale group ka sock + quiz jawab
export async function hook ({ from, isGroup, sock, sender, body, reply }) {
  if (isGroup && store.is('jummahalert', from)) socks.set(from, sock)
  const q = quiz.get(from)
  const t = (body || '').trim()
  if (!q || !/^[a-d]$/i.test(t)) return
  if (q.tried.has(num(sender))) return
  q.tried.add(num(sender))
  if (t.toUpperCase() !== q.ans) return
  clearTimeout(q.timer); quiz.delete(from)
  const all = store.obj('points'); const g = (all[from] ||= {})
  g[num(sender)] = (g[num(sender)] || 0) + 3; store.save()
  await reply(`✅ Sahi! *${q.ans}) ${q.right}*\n🎉 @${num(sender)} +3 points (kul ${g[num(sender)]})`, { mentions: [sender] })
}
