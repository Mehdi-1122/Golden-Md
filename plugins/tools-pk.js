// Pakistan tools — currency, gold, cricket, bill, password, age, countdown, zakat, bmi, wiki, github
import crypto from 'crypto'

async function getJSON (url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error('API ' + r.status)
  return r.json()
}
const pkr = (n) => 'Rs ' + Math.round(n).toLocaleString('en-PK')
const usdRates = async () => (await getJSON('https://open.er-api.com/v6/latest/USD')).rates

const BILLS = {
  lesco: 'Lahore', iesco: 'Islamabad', fesco: 'Faisalabad', gepco: 'Gujranwala', mepco: 'Multan',
  pesco: 'Peshawar', hesco: 'Hyderabad', sepco: 'Sukkur', qesco: 'Quetta', tesco: 'Tribal'
}

// hijri date -> gregorian Date (Eid/Ramzan ke liye)
async function hijriToDate (day, month) {
  const now = new Date()
  const dd = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`
  const h = (await getJSON('https://api.aladhan.com/v1/gToH/' + dd)).data.hijri
  for (const y of [+h.year, +h.year + 1]) {
    const [D, M, Y] = (await getJSON(`https://api.aladhan.com/v1/hToG/${day}-${month}-${y}`)).data.gregorian.date.split('-').map(Number)
    const d = new Date(Y, M - 1, D)
    if (d > now) return d
  }
}
const nextYearly = (m, d) => {
  const now = new Date(); const t = new Date(now.getFullYear(), m - 1, d)
  return t > now ? t : new Date(now.getFullYear() + 1, m - 1, d)
}
const EVENTS = {
  eid: ['Eid-ul-Fitr', () => hijriToDate(1, 10)], eidulfitr: ['Eid-ul-Fitr', () => hijriToDate(1, 10)],
  eidadha: ['Eid-ul-Adha', () => hijriToDate(10, 12)], bakraeid: ['Eid-ul-Adha', () => hijriToDate(10, 12)],
  ramadan: ['Ramzan', () => hijriToDate(1, 9)], ramzan: ['Ramzan', () => hijriToDate(1, 9)],
  '14august': ['Youm-e-Azadi 🇵🇰', () => nextYearly(8, 14)], azadi: ['Youm-e-Azadi 🇵🇰', () => nextYearly(8, 14)],
  newyear: ['New Year', () => nextYearly(1, 1)], '23march': ['Youm-e-Pakistan', () => nextYearly(3, 23)]
}

export default [
  { name: 'currency', aliases: ['convert', 'dollar', 'exchange'], category: 'tools', desc: 'Currency rate (.currency 100 usd pkr)',
    async run ({ args, reply }) {
      const rates = await usdRates()
      if (!args.length) {
        const list = ['USD', 'SAR', 'AED', 'GBP', 'EUR', 'CAD', 'MYR'].map(c => `${c}: ${pkr(rates.PKR / rates[c])}`).join('\n')
        return reply(`💱 *Aaj ke rate (PKR)*\n\n${list}\n\nConvert: .currency 100 usd pkr`)
      }
      let [amt, from, to = 'PKR'] = args
      if (isNaN(amt)) { to = from || 'PKR'; from = amt; amt = 1 }
      from = (from || '').toUpperCase(); to = to.toUpperCase()
      if (!rates[from] || !rates[to]) return reply('Currency code ghalat. Misal: USD, PKR, SAR, AED, GBP, EUR')
      const out = (+amt / rates[from]) * rates[to]
      await reply(`💱 ${(+amt).toLocaleString()} ${from} = *${out.toLocaleString('en', { maximumFractionDigits: 2 })} ${to}*`)
    } },
  { name: 'gold', aliases: ['sona', 'goldrate'], category: 'tools', desc: 'Sone/chandi ka rate (PKR)',
    async run ({ reply }) {
      const [au, ag, rates] = await Promise.all([getJSON('https://api.gold-api.com/price/XAU'), getJSON('https://api.gold-api.com/price/XAG'), usdRates()])
      const perGram = (p) => p / 31.1035 * rates.PKR
      const tola = 11.6638
      const g = perGram(au.price)
      await reply(`🪙 *Gold Rate (International se andaza)*\n\n24K 1 tola: *${pkr(g * tola)}*\n22K 1 tola: ${pkr(g * tola * 0.9167)}\n21K 1 tola: ${pkr(g * tola * 0.875)}\n24K 10 gram: ${pkr(g * 10)}\n\n🥈 Chandi 1 tola: ${pkr(perGram(ag.price) * tola)}\n\n🌍 $${au.price.toFixed(2)}/oz • $1 = ${pkr(rates.PKR)}\n_Local sarafa market ka rate thora mukhtalif ho sakta hai._`)
    } },
  { name: 'cricket', aliases: ['score', 'livescore'], category: 'tools', desc: 'Live cricket score',
    async run ({ reply }) {
      const key = process.env.CRICKET_API_KEY
      if (!key) return reply('⚠️ .env mein CRICKET_API_KEY daalein.\nFree key: https://cricketdata.org (sign up → API key)')
      const j = await getJSON(`https://api.cricapi.com/v1/currentMatches?apikey=${key}&offset=0`)
      if (j.status !== 'success') return reply('⚠️ ' + (j.reason || 'API error'))
      const live = (j.data || []).filter(m => m.matchStarted && !m.matchEnded)
      const list = (live.length ? live : j.data || []).slice(0, 5)
      if (!list.length) return reply('Abhi koi match nahi.')
      const t = list.map(m => `🏏 *${m.name}*\n${(m.score || []).map(s => `${s.inning}: ${s.r}/${s.w} (${s.o})`).join('\n')}\n📢 ${m.status}`).join('\n\n')
      await reply((live.length ? '🔴 *LIVE*\n\n' : '🏏 *Matches*\n\n') + t)
    } },
  { name: 'bill', aliases: ['bijli', 'billcheck'], category: 'tools', desc: 'Bijli/gas bill check link',
    async run ({ args, reply }) {
      const c = (args[0] || '').toLowerCase()
      if (Object.hasOwn(BILLS, c)) return reply(`⚡ *${c.toUpperCase()}* (${BILLS[c]}) bill:\nhttps://bill.pitc.com.pk/${c}bill\n\nWahan 14-digit reference number daalein.`)
      if (c === 'ke' || c === 'kelectric') return reply('⚡ *K-Electric* bill:\nhttps://www.ke.com.pk')
      if (c === 'sngpl') return reply('🔥 *SNGPL* gas bill:\nhttps://www.sngpl.com.pk')
      if (c === 'ssgc') return reply('🔥 *SSGC* gas bill:\nhttps://www.ssgc.com.pk')
      await reply('🧾 *.bill <company>*\n\n⚡ ' + Object.keys(BILLS).join(', ') + ', ke\n🔥 sngpl, ssgc\n\nMisal: .bill lesco')
    } },
  { name: 'password', aliases: ['pass', 'genpass'], category: 'tools', desc: 'Strong password (.password 16)',
    async run ({ args, reply }) {
      const n = Math.min(Math.max(parseInt(args[0]) || 16, 8), 64)
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?'
      const p = Array.from(crypto.randomBytes(n), b => chars[b % chars.length]).join('')
      await reply(`🔐 Password (${n}):\n\n${p}`)
    } },
  { name: 'age', aliases: ['umar', 'dob'], category: 'tools', desc: 'Umar (.age 2000-05-12)',
    async run ({ text, reply }) {
      const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec((text || '').trim()) || /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec((text || '').trim())
      if (!m) return reply('.age 2000-05-12   ya   .age 12-05-2000')
      const [y, mo, d] = m[1].length === 4 ? [+m[1], +m[2], +m[3]] : [+m[3], +m[2], +m[1]]
      const b = new Date(y, mo - 1, d); const now = new Date()
      if (isNaN(b) || b > now) return reply('Date ghalat hai.')
      let Y = now.getFullYear() - y, M = now.getMonth() - (mo - 1), D = now.getDate() - d
      if (D < 0) { M--; D += new Date(now.getFullYear(), now.getMonth(), 0).getDate() }
      if (M < 0) { Y--; M += 12 }
      const days = Math.floor((now - b) / 86400000)
      const nb = nextYearly(mo, d); const left = Math.ceil((nb - now) / 86400000)
      await reply(`🎂 Umar: *${Y} saal ${M} mahine ${D} din*\n📅 Kul ${days.toLocaleString()} din\n🎉 Agli saalgirah: ${left} din baad`)
    } },
  { name: 'countdown', aliases: ['kitnedin', 'daysleft'], category: 'tools', desc: 'Eid/14 Aug/date tak kitne din',
    async run ({ text, reply }) {
      const k = (text || '').toLowerCase().replace(/[\s-]/g, '')
      let label, date
      if (Object.hasOwn(EVENTS, k)) { label = EVENTS[k][0]; date = await EVENTS[k][1]() }
      else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test((text || '').trim())) { label = text.trim(); const [y, m, d] = text.trim().split('-').map(Number); date = new Date(y, m - 1, d) }
      else return reply('.countdown eid | eidadha | ramzan | 14august | 23march | newyear\nYa date: .countdown 2026-12-25')
      const ms = date - Date.now()
      if (ms <= 0) return reply('Ye date guzar chuki hai.')
      const d = Math.floor(ms / 86400000), h = Math.floor(ms % 86400000 / 3600000)
      await reply(`⏳ *${label}*\n📅 ${date.toDateString()}\n\n*${d} din ${h} ghante* baqi${label.startsWith('Eid') || label === 'Ramzan' ? '\n_Chand ke hisaab se 1 din aage peeche ho sakta hai._' : ''}`)
    } },
  { name: 'zakat', aliases: ['zakaat'], category: 'tools', desc: 'Zakat hisaab (.zakat 500000)',
    async run ({ args, reply }) {
      const amt = parseFloat((args[0] || '').replace(/,/g, ''))
      if (!(amt > 0)) return reply('.zakat <kul maal rupay mein>   misal: .zakat 500000')
      let nisab = ''
      try {
        const [ag, rates] = await Promise.all([getJSON('https://api.gold-api.com/price/XAG'), usdRates()])
        const n = ag.price / 31.1035 * rates.PKR * 612.36   // 52.5 tola chandi
        nisab = `\n📏 Nisab (52.5 tola chandi): ~${pkr(n)}\n${amt >= n ? '✅ Aap par zakat farz hai (agar saal guzar gaya).' : '❌ Maal nisab se kam hai — zakat farz nahi.'}`
      } catch {}
      await reply(`🕌 *Zakat (2.5%)*\n\n💰 Maal: ${pkr(amt)}\n🤲 Zakat: *${pkr(amt * 0.025)}*${nisab}`)
    } },
  { name: 'bmi', category: 'tools', desc: 'BMI (.bmi 70 175  = kg cm)',
    async run ({ args, reply }) {
      const kg = parseFloat(args[0]), cm = parseFloat(args[1])
      if (!(kg > 0 && cm > 0)) return reply('.bmi <wazan kg> <qad cm>   misal: .bmi 70 175')
      const b = kg / ((cm / 100) ** 2)
      const s = b < 18.5 ? 'Kam wazan 🥗' : b < 25 ? 'Normal ✅' : b < 30 ? 'Zyada wazan ⚠️' : 'Motapa 🚨'
      await reply(`⚖️ BMI: *${b.toFixed(1)}* — ${s}`)
    } },
  { name: 'wiki', aliases: ['wikipedia'], category: 'tools', desc: 'Wikipedia khulasa',
    async run ({ text, reply }) {
      if (!text) return reply('.wiki <topic>   misal: .wiki Allama Iqbal')
      const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(text.trim().replace(/\s+/g, '_')))
      if (!r.ok) return reply('Nahi mila.')
      const j = await r.json()
      await reply(`📚 *${j.title}*\n\n${j.extract}\n\n🔗 ${j.content_urls?.desktop?.page || ''}`)
    } },
  { name: 'github', aliases: ['gh', 'gituser'], category: 'tools', desc: 'GitHub profile info',
    async run ({ text, reply }) {
      if (!text) return reply('.github <username>')
      const r = await fetch('https://api.github.com/users/' + encodeURIComponent(text.trim()))
      if (!r.ok) return reply('User nahi mila.')
      const u = await r.json()
      await reply(`🐙 *${u.name || u.login}*\n${u.bio || ''}\n\n📦 Repos: ${u.public_repos}\n👥 Followers: ${u.followers} • Following: ${u.following}\n📍 ${u.location || '-'}\n🔗 ${u.html_url}`)
    } }
]
