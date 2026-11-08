// Islamic commands (surah/ayah/asma/namaz internet se; dua/hadith/tasbeeh offline)
const pick = a => a[Math.floor(Math.random() * a.length)]

async function getJSON (url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error('API ' + r.status)
  return r.json()
}

const DUAS = [
  ['Rizq ki dua', 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ', 'Ya Allah! Halal rizq de kar mujhe haram se bacha.'],
  ['Pareshani ki dua', 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', 'Allah hamein kaafi hai aur wo behtareen kaarsaaz hai.'],
  ['Maghfirat', 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ', 'Ae mere Rab! Mujhe bakhsh de aur meri toba qubool kar.']
]
const TASBEEH = ['سُبْحَانَ اللَّه (33x)', 'الْحَمْدُ لِلَّه (33x)', 'اللَّهُ أَكْبَر (34x)',
  'لَا إِلَٰهَ إِلَّا اللَّه', 'أَسْتَغْفِرُ اللَّه', 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّه']
const HADITH = [
  '“Aamaal ka daromadar niyyat par hai.” — Bukhari',
  '“Tum mein behtareen wo hai jo Quran seekhe aur sikhaye.” — Bukhari',
  '“Musalman wo hai jiske haath aur zuban se doosre mehfooz rahein.” — Bukhari'
]

export default [
  { name: 'surahlist', aliases: ['qlist', 'surahs'], category: 'islamic', desc: '114 surahon ki list',
    async run ({ reply }) {
      const d = await getJSON('https://api.alquran.cloud/v1/surah')
      let t = '📖 *Quran — Surahs:*\n\n'
      for (const s of d.data) t += `${s.number}. ${s.englishName} (${s.numberOfAyahs})\n`
      t += '\n.surah <number> ya .ayah 2:255'
      await reply(t.trim())
    } },
  { name: 'surah', aliases: ['quran'], category: 'islamic', desc: 'Koi bhi surah',
    async run ({ args, reply }) {
      const n = parseInt(args[0])
      if (!(n >= 1 && n <= 114)) return reply('.surah <1-114>  (list ke liye .surahlist)')
      const d = await getJSON(`https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,en.sahih`)
      const [ar, en] = d.data
      let t = `📖 *${ar.englishName}* — ${ar.name}\n${ar.englishNameTranslation} • ${ar.numberOfAyahs} ayaat • ${ar.revelationType}\n\n`
      const limit = ar.numberOfAyahs <= 11 ? ar.numberOfAyahs : 7
      for (let i = 0; i < limit; i++) t += `${i + 1}. ${ar.ayahs[i].text}\n_${en.ayahs[i].text}_\n\n`
      if (limit < ar.numberOfAyahs) t += `... poori surah ke liye .ayah ${n}:<ayah> use karein.`
      await reply(t.trim())
    } },
  { name: 'ayah', aliases: ['verse'], category: 'islamic', desc: 'Ek ayat (jaise 2:255)',
    async run ({ args, reply }) {
      const ref = (args[0] || '').replace(/\s/g, '')
      if (!/^\d+:\d+$/.test(ref)) return reply('.ayah 2:255  (surah:ayah)')
      const d = await getJSON(`https://api.alquran.cloud/v1/ayah/${ref}/editions/quran-uthmani,en.sahih,ur.jalandhry`)
      const [ar, en, ur] = d.data
      await reply(`📖 *${ar.surah.englishName} ${ref}*\n\n${ar.text}\n\n🇬🇧 ${en.text}\n\n🇵🇰 ${ur.text}`)
    } },
  { name: 'asma', aliases: ['99names', 'asmaulhusna'], category: 'islamic', desc: 'Allah ke 99 naam',
    async run ({ args, reply }) {
      const d = await getJSON('https://api.aladhan.com/v1/asmaAlHusna')
      if (args[0] && /^\d+$/.test(args[0])) {
        const x = d.data[parseInt(args[0]) - 1]
        if (!x) return reply('1-99 ke beech number dein.')
        return reply(`${x.number}. ${x.name}\n${x.transliteration} — ${x.en.meaning}`)
      }
      let t = '🕋 *Asma-ul-Husna (99 Names):*\n\n'
      for (const x of d.data) t += `${x.number}. ${x.name} — ${x.transliteration}\n`
      await reply(t.trim())
    } },
  { name: 'namaz', aliases: ['salah', 'prayer'], category: 'islamic', desc: 'Namaz times (.namaz Lahore)',
    async run ({ text, reply }) {
      if (!text) return reply('.namaz Lahore   ya   .namaz Karachi,Pakistan')
      const [city, country = 'Pakistan'] = text.split(',').map(s => s.trim())
      const d = await getJSON(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=1`)
      const t = d.data.timings
      await reply(`🕌 *Namaz — ${city}, ${country}*\n📅 ${d.data.date.readable}\n\nFajr: ${t.Fajr}\nDhuhr: ${t.Dhuhr}\nAsr: ${t.Asr}\nMaghrib: ${t.Maghrib}\nIsha: ${t.Isha}\n\nSunrise: ${t.Sunrise}`)
    } },
  { name: 'dua', category: 'islamic', desc: 'Masnoon dua',
    async run ({ reply }) { const [name, ar, tr] = pick(DUAS); await reply(`🤲 *${name}*\n\n${ar}\n\n_${tr}_`) } },
  { name: 'tasbeeh', aliases: ['zikr'], category: 'islamic', desc: 'Tasbeehat',
    async run ({ reply }) { await reply('📿 *Tasbeehat:*\n\n' + TASBEEH.map(x => '• ' + x).join('\n')) } },
  { name: 'hadith', category: 'islamic', desc: 'Random hadith',
    async run ({ reply }) { await reply('🌙 ' + pick(HADITH)) } }
]
