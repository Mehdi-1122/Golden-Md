// Roz ki ayat + hadith, sehri/iftar alert, tasbih counter
import store from '../../lib/store.js'
import { num } from '../../lib/helpers.js'
import { toggleRun } from '../../lib/buttons.js'

async function getJSON (url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error('API ' + r.status)
  return r.json()
}

const rnd = (n) => 1 + Math.floor(Math.random() * n)

export async function randomAyah () {
  const [ar, ur] = (await getJSON(`https://api.alquran.cloud/v1/ayah/${rnd(6236)}/editions/quran-uthmani,ur.jalandhry`)).data
  return `📖 *${ar.surah.englishName} ${ar.surah.number}:${ar.numberInSurah}*\n\n${ar.text}\n\n🇵🇰 ${ur.text}`
}

export async function randomHadith () {
  for (let i = 0; i < 3; i++) {
    try {
      const j = await getJSON(`https://hadithapi.pages.dev/api/bukhari/${rnd(7500)}`)
      const body = (j.hadith_english || '').replace(/\s+/g, ' ').trim()
      if (body) return `🌙 *Sahih Bukhari ${j.id}*\n\n${(j.header || '').trim()}\n${body.length > 1200 ? body.slice(0, 1200) + '...' : body}`
    } catch {}
  }
  throw new Error('Hadith abhi nahi mil saki, dobara try karo.')
}

const cityArg = (text) => {
  const [city, country = 'Pakistan'] = (text || '').split(',').map(s => s.trim())
  return { city, country }
}
const timingsUrl = (city, country) => `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=1`
const minus = (hhmm, m) => {
  const [h, mi] = hhmm.slice(0, 5).split(':').map(Number)
  const t = (h * 60 + mi - m + 1440) % 1440
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

export default [
  { name: 'randomayah', aliases: ['ayat', 'dailyayah'], category: 'islamic', desc: 'Koi bhi ayat tarjume ke saath',
    async run ({ reply }) { await reply(await randomAyah()) } },
  { name: 'randomhadith', aliases: ['dailyhadith'], category: 'islamic', desc: 'Koi bhi hadith (Bukhari, English)',
    async run ({ reply }) { await reply(await randomHadith()) } },
  { name: 'dailyislam', aliases: ['dailyreminder'], category: 'islamic', group: true, admin: true, desc: 'Roz subah 8 baje ayat + hadith',
    run: (ctx) => toggleRun(ctx, { key: 'dailyislam', label: 'Roz ki ayat/hadith', on: '✅ ON — roz subah 8 baje (PK time) ayat aur hadith aayegi.' }) },
  { name: 'sehrialert', aliases: ['iftaralert', 'ramzanalert'], category: 'islamic', group: true, admin: true, desc: 'Ramzan mein sehri/iftar alert (.sehrialert Lahore)',
    async run ({ text, from, sock, reply }) {
      const all = store.obj('sehrialert')
      if (!text) return reply(`Sehri/Iftar alert: ${all[from] ? 'ON (' + all[from] + ')' : 'OFF'}\nUse: .sehrialert Lahore   ya   .sehrialert off`)
      if (text.toLowerCase() === 'off') { delete all[from]; store.save(); return reply('🔕 Sehri/Iftar alert OFF.') }
      const { city, country } = cityArg(text)
      await getJSON(timingsUrl(city, country))
      all[from] = `${city},${country}`; store.save()
      socks.set(from, sock)
      await reply(`🌙 Alert ON — *${city}*. Ramzan mein sehri se 15 minute pehle aur iftar ke waqt yaad dilaunga.`)
    } },
  { name: 'tasbih', aliases: ['counter', 'tasbihcount'], category: 'islamic', desc: 'Tasbih counter (.tasbih / .tasbih 33 / .tasbih reset)',
    async run ({ sender, args, reply }) {
      const all = store.obj('tasbih'); const me = num(sender)
      const v = (args[0] || '').toLowerCase()
      if (v === 'reset') { delete all[me]; store.save(); return reply('📿 Counter 0 ho gaya.') }
      const add = parseInt(v)
      if (v && !(add > 0 && add <= 10000)) return reply('.tasbih   ya   .tasbih 33   ya   .tasbih reset')
      all[me] = (all[me] || 0) + (add || 1); store.save()
      await reply(`📿 Tasbih: *${all[me]}*`)
    } }
]

// ---------- engines ----------
const socks = new Map()
const live = (gid) => { const s = socks.get(gid)?.live?.(); return s?.gmdOpen ? s : null }
const pkParts = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]))
  return { day: `${p.day}-${p.month}-${p.year}`, time: `${p.hour}:${p.minute}` }
}

let dailyDone = ''
async function dailyTick () {
  const { day, time } = pkParts()
  if (time !== '08:00' || dailyDone === day) return
  dailyDone = day
  const groups = Object.keys(store.get('dailyislam') || {})
  if (!groups.length) return
  const body = await Promise.all([randomAyah(), randomHadith()]).then(a => `🌅 *Subah Bakhair*\n\n${a.join('\n\n━━━━━━━━━\n\n')}`).catch(() => null)
  if (!body) return
  for (const gid of groups) await live(gid)?.sendMessage(gid, { text: body }).catch(() => {})
}

const timingCache = new Map()      // key -> { day, tz, month, imsak, maghrib }
const alerted = new Set()
const inZone = (tz) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date())
async function timesFor (key) {
  const today = pkParts().day
  const c = timingCache.get(key)
  if (c?.fetched === today) return c
  const [city, country] = key.split(',')
  const d = (await getJSON(timingsUrl(city, country))).data
  const v = { fetched: today, tz: d.meta.timezone, month: +d.date.hijri.month.number, imsak: d.timings.Imsak, maghrib: d.timings.Maghrib, day: d.date.gregorian.date }
  timingCache.set(key, v)
  return v
}
async function ramzanTick () {
  for (const [gid, key] of Object.entries(store.obj('sehrialert'))) {
    const sock = live(gid)
    if (!sock) continue
    try {
      const c = await timesFor(key)
      if (c.month !== 9) continue
      const now = inZone(c.tz), city = key.split(',')[0]
      const send = async (kind, text) => {
        const id = `${gid}|${c.day}|${kind}`
        if (alerted.has(id)) return
        alerted.add(id)
        await sock.sendMessage(gid, { text })
      }
      if (now === minus(c.imsak, 15)) await send('sehri', `🍽️ *Sehri ke 15 minute baqi* (${city})\nSehri khatam: ${c.imsak.slice(0, 5)}`)
      if (now === c.maghrib.slice(0, 5)) await send('iftar', `🌅 *Iftar ka waqt ho gaya* (${city})\nAllah roza qubool farmaye. 🤲`)
    } catch {}
  }
  if (alerted.size > 500) alerted.clear()
}

clearInterval(globalThis.__gmdDaily)
globalThis.__gmdDaily = setInterval(() => { dailyTick().catch(() => {}); ramzanTick().catch(() => {}) }, 30000)

// hook: alert wale group ka socket yaad rakho
export async function hook ({ isGroup, from, sock }) {
  if (isGroup && (store.is('dailyislam', from) || store.obj('sehrialert')[from])) socks.set(from, sock)
}
