// Economy — coins: daily, work, balance, give, rich (sirf mazay ke liye, asli paisa nahi)
import store from '../../lib/store.js'
import { num, getContextInfo } from '../../lib/helpers.js'

const DAY = 86400000, HOUR = 3600000
const JOBS = ['Biryani ki dukaan chalayi 🍛', 'Rickshaw chalaya 🛺', 'Website banayi 💻', 'Bachon ko tuition di 📚',
  'Chai ka dhaba chalaya ☕', 'Mobile repair kiye 📱', 'Darzi ka kaam kiya 🧵', 'Delivery ki 🛵', 'Shaadi mein DJ bane 🎧']

const wallet = (jid) => { const all = store.obj('coins'); return (all[num(jid)] ||= { bal: 0, daily: 0, work: 0 }) }
const wait = (ms) => { const h = Math.floor(ms / HOUR), m = Math.ceil(ms % HOUR / 60000); return h ? `${h}h ${m}m` : `${m}m` }
const target = (msg) => { const ci = getContextInfo(msg); return ci.mentionedJid?.[0] || ci.participant || null }

export default [
  { name: 'daily', aliases: ['roz', 'claim'], category: 'economy', desc: 'Roz ke free coins',
    async run ({ sender, reply }) {
      const w = wallet(sender); const left = w.daily + DAY - Date.now()
      if (left > 0) return reply(`⏳ Daily le chuke ho. Dobara ${wait(left)} baad.`)
      const n = 100 + Math.floor(Math.random() * 201)
      w.bal += n; w.daily = Date.now(); store.save()
      await reply(`🎁 Daily: *+${n} coins*\n💰 Balance: ${w.bal}`)
    } },
  { name: 'work', aliases: ['kaam', 'job'], category: 'economy', desc: 'Kaam karo, coins kamao (har ghante)',
    async run ({ sender, reply }) {
      const w = wallet(sender); const left = w.work + HOUR - Date.now()
      if (left > 0) return reply(`😮‍💨 Thak gaye ho! ${wait(left)} baad dobara kaam.`)
      const n = 20 + Math.floor(Math.random() * 81)
      w.bal += n; w.work = Date.now(); store.save()
      await reply(`👷 ${JOBS[Math.floor(Math.random() * JOBS.length)]}\n*+${n} coins* • 💰 ${w.bal}`)
    } },
  { name: 'balance', aliases: ['bal', 'wallet', 'coins'], category: 'economy', desc: 'Coins check',
    async run ({ msg, sender, reply }) {
      const who = target(msg) || sender
      await reply(`💰 @${num(who)}: *${wallet(who).bal} coins*`, { mentions: [who] })
    } },
  { name: 'give', aliases: ['pay', 'transfer'], category: 'economy', desc: 'Coins do (.give @user 50)',
    async run ({ msg, sender, args, reply }) {
      const to = target(msg); const n = parseInt(args.find(a => /^\d+$/.test(a)))
      if (!to || !(n > 0)) return reply('.give @user 50')
      if (num(to) === num(sender)) return reply('Apne aap ko? 😅')
      const w = wallet(sender)
      if (w.bal < n) return reply(`❌ Itne coins nahi. Balance: ${w.bal}`)
      w.bal -= n; wallet(to).bal += n; store.save()
      await reply(`✅ @${num(sender)} ne @${num(to)} ko *${n} coins* diye.`, { mentions: [sender, to] })
    } },
  { name: 'rich', aliases: ['richlist', 'ameer'], category: 'economy', desc: 'Sab se ameer kaun',
    async run ({ sock, from, isGroup, reply }) {
      let list = Object.entries(store.obj('coins')).filter(([, w]) => w.bal > 0)
      if (isGroup) {
        const meta = await sock.groupMetadata(from)
        const here = new Set(meta.participants.flatMap(p => [p.id, p.jid, p.lid]).filter(Boolean).map(num))
        list = list.filter(([n]) => here.has(n))
      }
      list = list.sort((a, b) => b[1].bal - a[1].bal).slice(0, 10)
      if (!list.length) return reply('Abhi sab gareeb hain 😄  .daily se shuru karo.')
      const medal = ['🥇', '🥈', '🥉']
      await reply('🤑 *Ameer Log*\n\n' + list.map(([n, w], i) => `${medal[i] || (i + 1) + '.'} @${n} — ${w.bal} coins`).join('\n'),
        { mentions: list.map(([n]) => n + '@s.whatsapp.net') })
    } }
]
