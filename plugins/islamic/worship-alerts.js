// Islamic extra — qibla, hijri, ramadan, kalma, azkar, namaz alert (aladhan.com API)
import store from '../../lib/store.js'

async function getJSON (url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error('API ' + r.status)
  return r.json()
}

const cityArg = (text) => {
  const [city, country = 'Pakistan'] = (text || '').split(',').map(s => s.trim())
  return { city, country }
}
const timingsUrl = (city, country, date = '') =>
  `https://api.aladhan.com/v1/timingsByCity${date ? '/' + date : ''}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=1`

// Kaaba ki taraf bearing (degree, North se clockwise)
function qibla (lat, lng) {
  const r = Math.PI / 180, kLat = 21.4225 * r, dLng = (39.8262 - lng) * r
  const q = Math.atan2(Math.sin(dLng), Math.cos(lat * r) * Math.tan(kLat) - Math.sin(lat * r) * Math.cos(dLng))
  return (q / r + 360) % 360
}

const KALMA = [
  ['Pehla Kalma — Tayyab', 'لَا إِلٰهَ إِلَّا اللّٰهُ مُحَمَّدٌ رَّسُوْلُ اللّٰهِ',
    'Allah ke siwa koi ibadat ke laiq nahi, Muhammad ﷺ Allah ke Rasool hain.'],
  ['Doosra Kalma — Shahadat', 'أَشْهَدُ أَنْ لَّا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيْكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُوْلُهُ',
    'Main gawahi deta hoon ke Allah ke siwa koi mabood nahi, wo akela hai, uska koi shareek nahi, aur gawahi deta hoon ke Muhammad ﷺ uske bande aur Rasool hain.'],
  ['Teesra Kalma — Tamjeed', 'سُبْحَانَ اللّٰهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللّٰهُ وَاللّٰهُ أَكْبَرُ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِيِّ الْعَظِيْمِ',
    'Allah paak hai, sab tareef Allah ke liye hai, Allah ke siwa koi mabood nahi, Allah sab se bada hai, aur koi taaqat aur quwwat nahi magar Allah ki taraf se jo buland aur azmat wala hai.'],
  ['Chautha Kalma — Tauheed', 'لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيْكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِيْ وَيُمِيْتُ وَهُوَ حَيٌّ لَّا يَمُوْتُ أَبَدًا أَبَدًا ذُو الْجَلَالِ وَالْإِكْرَامِ بِيَدِهِ الْخَيْرُ وَهُوَ عَلٰى كُلِّ شَيْءٍ قَدِيْرٌ',
    'Allah ke siwa koi mabood nahi, wo akela hai, uska koi shareek nahi. Usi ki badshahi aur usi ki tareef hai. Wahi zinda karta aur maarta hai, wo hamesha zinda hai, kabhi nahi marega. Wo jalal aur ikraam wala hai, uske haath mein bhalai hai aur wo har cheez par qaadir hai.'],
  ['Paanchwan Kalma — Astaghfar', 'أَسْتَغْفِرُ اللّٰهَ رَبِّيْ مِنْ كُلِّ ذَنْبٍ أَذْنَبْتُهُ عَمَدًا أَوْ خَطَأً سِرًّا أَوْ عَلَانِيَةً وَّأَتُوْبُ إِلَيْهِ مِنَ الذَّنْبِ الَّذِيْ أَعْلَمُ وَمِنَ الذَّنْبِ الَّذِيْ لَا أَعْلَمُ إِنَّكَ أَنْتَ عَلَّامُ الْغُيُوْبِ وَسَتَّارُ الْعُيُوْبِ وَغَفَّارُ الذُّنُوْبِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِيِّ الْعَظِيْمِ',
    'Main Allah se maafi maangta hoon har us gunah ki jo maine jaan kar ya bhool kar, chhup kar ya khule aam kiya, aur uski taraf toba karta hoon — us gunah se jo main jaanta hoon aur jo nahi jaanta. Beshak tu ghaib ka jaanne wala, aib chhupane wala aur gunah bakhshne wala hai.'],
  ['Chhata Kalma — Radd-e-Kufr', 'اَللّٰهُمَّ إِنِّيْ أَعُوْذُ بِكَ مِنْ أَنْ أُشْرِكَ بِكَ شَيْئًا وَّأَنَا أَعْلَمُ بِهِ وَأَسْتَغْفِرُكَ لِمَا لَا أَعْلَمُ بِهِ تُبْتُ عَنْهُ وَتَبَرَّأْتُ مِنَ الْكُفْرِ وَالشِّرْكِ وَالْكِذْبِ وَالْغِيْبَةِ وَالْبِدْعَةِ وَالنَّمِيْمَةِ وَالْفَوَاحِشِ وَالْبُهْتَانِ وَالْمَعَاصِيْ كُلِّهَا وَأَسْلَمْتُ وَأَقُوْلُ لَا إِلٰهَ إِلَّا اللّٰهُ مُحَمَّدٌ رَّسُوْلُ اللّٰهِ',
    'Ya Allah! Main teri panaah maangta hoon is baat se ke jaan boojh kar kisi ko tera shareek banaun, aur jo anjaane mein ho uski maafi maangta hoon. Main kufr, shirk, jhoot, gheebat, bidat, chughli, behayai, bohtan aur har gunah se toba karta hoon. Main Islam laaya aur kehta hoon: Allah ke siwa koi mabood nahi, Muhammad ﷺ Allah ke Rasool hain.']
]

const AZKAR = {
  subah: [
    ['Ayat-ul-Kursi (1x)', 'Surah Baqarah 2:255 — padhne wala shaam tak hifazat mein. (.ayah 2:255)'],
    ['Sayyid-ul-Istighfar (1x)', 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ ...\nYaqeen se subah padhe aur us din fot ho to Jannati. — Bukhari'],
    ['3x', 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ\nKoi cheez nuqsan nahi de sakti. — Abu Dawood'],
    ['7x', 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ'],
    ['100x', 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ — gunah maaf, chahe samundar ki jhaag barabar hon. — Bukhari'],
    ['3x', 'Surah Ikhlas, Falaq, Naas — har cheez se kaafi. — Tirmizi']
  ],
  shaam: [
    ['Ayat-ul-Kursi (1x)', 'Surah Baqarah 2:255 — subah tak hifazat. (.ayah 2:255)'],
    ['Sayyid-ul-Istighfar (1x)', 'Yaqeen se raat ko padhe aur subah se pehle fot ho to Jannati. — Bukhari'],
    ['3x', 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ\nHar makhlooq ke shar se panaah. — Muslim'],
    ['3x', 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ ...'],
    ['3x', 'Surah Ikhlas, Falaq, Naas']
  ]
}

export default [
  { name: 'qibla', aliases: ['qiblah'], category: 'islamic', desc: 'Qibla direction (.qibla Lahore)',
    async run ({ text, reply }) {
      if (!text) return reply('.qibla Lahore   ya   .qibla London')
      const { city } = cityArg(text)
      const g = (await getJSON('https://geocoding-api.open-meteo.com/v1/search?count=1&name=' + encodeURIComponent(city))).results?.[0]
      if (!g) return reply('Shehar nahi mila.')
      const deg = qibla(g.latitude, g.longitude).toFixed(1)
      await reply(`🕋 *Qibla — ${g.name}, ${g.country}*
🧭 North se *${deg}°* (clockwise)

Compass mein North (0°) se ghoom kar ${deg}° par Qibla hai.
📍 https://qiblafinder.withgoogle.com`)
    } },
  { name: 'hijri', aliases: ['islamicdate', 'chand'], category: 'islamic', desc: 'Aaj ki Islamic date',
    async run ({ reply }) {
      const d = new Date()
      const dd = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
      const h = (await getJSON('https://api.aladhan.com/v1/gToH/' + dd)).data.hijri
      await reply(`🌙 *Hijri Date*\n\n${h.day} ${h.month.en} ${h.year} AH\n${h.weekday.ar} • ${h.month.ar}\n📅 ${dd}\n\n_Chand dekhne ke hisaab se 1 din ka farq ho sakta hai._`)
    } },
  { name: 'ramadan', aliases: ['ramzan', 'sehri', 'iftar'], category: 'islamic', desc: 'Sehri/iftar time + Ramzan countdown',
    async run ({ text, reply }) {
      const { city, country } = cityArg(text || 'Karachi')
      const d = await getJSON(timingsUrl(city, country))
      const t = d.data.timings
      const hy = +d.data.date.hijri.year
      const isRamadan = +d.data.date.hijri.month.number === 9
      let msg = `🌙 *Sehri / Iftar — ${city}*\n📅 ${d.data.date.readable}\n\n🍽️ Sehri khatam: *${t.Imsak}*\n🕌 Fajr: ${t.Fajr}\n🌅 Iftar (Maghrib): *${t.Maghrib}*`
      if (isRamadan) msg += `\n\n✨ Aaj Ramzan ka *${d.data.date.hijri.day}* roza hai.`
      else {
        const next = +d.data.date.hijri.month.number > 9 ? hy + 1 : hy
        const g = (await getJSON(`https://api.aladhan.com/v1/hToG/01-09-${next}`)).data.gregorian.date
        const [D, M, Y] = g.split('-').map(Number)
        const days = Math.ceil((new Date(Y, M - 1, D) - Date.now()) / 86400000)
        msg += `\n\n⏳ Ramzan ${next} AH: ~${g} (*${days} din* baqi)`
      }
      await reply(msg + `\n\n_Doosra shehar: .ramadan Lahore_`)
    } },
  { name: 'kalma', aliases: ['kalimah', 'kalme'], category: 'islamic', desc: '6 Kalme (.kalma 1-6)',
    async run ({ args, reply }) {
      const n = parseInt(args[0])
      const show = (k, i) => `*${i + 1}. ${k[0]}*\n${k[1]}\n_${k[2]}_`
      if (n >= 1 && n <= 6) return reply('☪️ ' + show(KALMA[n - 1], n - 1))
      await reply('☪️ *Chhe Kalme*\n\n' + KALMA.map(show).join('\n\n'))
    } },
  { name: 'azkar', aliases: ['adhkar', 'morningazkar'], category: 'islamic', desc: 'Subah/shaam ke azkar',
    async run ({ args, reply }) {
      const k = /^(sh|ev|sha)/i.test(args[0] || '') ? 'shaam'
        : /^(su|mo)/i.test(args[0] || '') ? 'subah'
        : (new Date().getHours() >= 15 ? 'shaam' : 'subah')
      const list = AZKAR[k].map(([c, t], i) => `${i + 1}. *${c}*\n${t}`).join('\n\n')
      await reply(`📿 *${k === 'subah' ? 'Subah' : 'Shaam'} ke Azkar*\n\n${list}\n\n_Doosre: .azkar ${k === 'subah' ? 'shaam' : 'subah'}_`)
    } },
  { name: 'namazalert', aliases: ['azanalert', 'prayeralert'], category: 'islamic', group: true, admin: true,
    desc: 'Har namaz ke waqt group mein yaad (.namazalert Lahore / off)',
    async run ({ text, from, reply, sock }) {
      const alerts = store.obj('namazalert')
      if (!text) return reply(`Namaz alert: ${alerts[from] ? 'ON (' + alerts[from] + ')' : 'OFF'}\nUse: .namazalert Lahore   ya   .namazalert off`)
      if (text.toLowerCase() === 'off') { delete alerts[from]; store.save(); return reply('🔕 Namaz alert OFF.') }
      const { city, country } = cityArg(text)
      await getJSON(timingsUrl(city, country))   // shehar sahi hai? check
      alerts[from] = `${city},${country}`; store.save()
      socks.set(from, sock)
      await reply(`🔔 Namaz alert ON — *${city}* ke waqt par har namaz ki yaad aayegi.`)
    } }
]

// ---------- namaz alert engine ----------
const socks = new Map()   // group -> sock (pehle message par yaad rakhte hain)
const cache = {}          // "city,country" -> { day, tz, timings }
const sent = new Set()
const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
const fmt = (tz, o) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, ...o }).format(new Date())

async function timingsFor (key) {
  const c = cache[key]
  const today = c ? fmt(c.tz, { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : ''
  if (c && c.day === today) return c
  const [city, country] = key.split(',')
  const d = await getJSON(timingsUrl(city, country, today))
  return (cache[key] = { day: d.data.date.gregorian.date, tz: d.data.meta.timezone, timings: d.data.timings })
}

async function tick () {
  for (const [gid, key] of Object.entries(store.obj('namazalert'))) {
    const sock = socks.get(gid)?.live?.()
    if (!sock?.gmdOpen) continue
    try {
      const c = await timingsFor(key)
      const now = fmt(c.tz, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      for (const p of PRAYERS) {
        const id = `${gid}|${c.day}|${p}`
        if (c.timings[p].slice(0, 5) !== now || sent.has(id)) continue
        sent.add(id)
        await sock.sendMessage(gid, { text: `🕌 *${p} ka waqt ho gaya hai* (${c.timings[p].slice(0, 5)} — ${key.split(',')[0]})\n\n“Beshak namaz momino par waqt muqarrar par farz hai.” — An-Nisa 4:103` })
      }
    } catch {}
  }
  if (sent.size > 500) sent.clear()
}

clearInterval(globalThis.__gmdNamaz)
globalThis.__gmdNamaz = setInterval(tick, 30000)

// hook: alert wale group ka sock yaad rakho (restart ke baad pehle message par)
export async function hook ({ isGroup, from, sock }) {
  if (isGroup && store.obj('namazalert')[from]) socks.set(from, sock)
}
