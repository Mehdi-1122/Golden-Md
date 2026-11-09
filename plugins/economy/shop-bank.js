// Shop, bank, gamble, level system (sirf mazay ke coins, asli paisa nahi)
import store from '../../lib/store.js'
import { num, getContextInfo } from '../../lib/helpers.js'
import { renderRank } from '../../lib/logo.js'
import { toggleRun } from '../../lib/buttons.js'

const SHOP = {
  chai: ['☕ Chai', 50], biryani: ['🍛 Biryani', 200], mobile: ['📱 Mobile', 2000], bike: ['🏍️ Bike', 8000],
  car: ['🚗 Car', 60000], house: ['🏠 Ghar', 300000], crown: ['👑 Taj', 1000000]
}

function wallet (jid) {
  const all = store.obj('coins')
  const w = (all[num(jid)] ||= { bal: 0, daily: 0, work: 0 })
  w.bank ??= 0; w.items ??= {}
  return w
}
const amount = (arg, max) => (arg || '').toLowerCase() === 'all' ? max : parseInt(arg)

// level: 100, 400, 900, 1600 ... XP par
const levelOf = (xp) => Math.floor(Math.sqrt(xp / 100))
const xpFor = (level) => level * level * 100

export default [
  { name: 'shop', aliases: ['store2', 'dukaan'], category: 'economy', desc: 'Dukaan ki list',
    async run ({ reply, config }) {
      await reply(`🛒 *Golden Shop*\n\n${Object.entries(SHOP).map(([k, [n, p]]) => `${n} — ${p.toLocaleString()} coins\n   ${config.prefix}buy ${k}`).join('\n')}`)
    } },
  { name: 'buy', aliases: ['kharido'], category: 'economy', desc: 'Dukaan se khareedo (.buy chai)',
    async run ({ sender, args, reply }) {
      const k = (args[0] || '').toLowerCase()
      if (!Object.hasOwn(SHOP, k)) return reply('Ye cheez dukaan mein nahi. List: .shop')
      const [n, p] = SHOP[k]; const w = wallet(sender)
      if (w.bal < p) return reply(`❌ ${p.toLocaleString()} coins chahiye. Tumhare paas ${w.bal.toLocaleString()} hain.`)
      w.bal -= p; w.items[k] = (w.items[k] || 0) + 1; store.save()
      await reply(`✅ ${n} khareed liya!\n💰 Baqi: ${w.bal.toLocaleString()}`)
    } },
  { name: 'inventory', aliases: ['inv', 'items'], category: 'economy', desc: 'Tumhara saman',
    async run ({ sender, reply }) {
      const list = Object.entries(wallet(sender).items).filter(([k, c]) => c > 0 && SHOP[k])
      await reply(list.length ? '🎒 *Saman*\n\n' + list.map(([k, c]) => `${SHOP[k][0]} × ${c}`).join('\n') : 'Saman khali hai. Dekho: .shop')
    } },
  { name: 'bank', aliases: ['bankbal'], category: 'economy', desc: 'Bank balance',
    async run ({ sender, reply }) {
      const w = wallet(sender)
      await reply(`🏦 *Bank*\n\n👛 Wallet: ${w.bal.toLocaleString()}\n🏦 Bank: ${w.bank.toLocaleString()}\n\n.deposit 100  •  .withdraw 100`)
    } },
  { name: 'deposit', aliases: ['dep'], category: 'economy', desc: 'Bank mein jama (.deposit 100 / all)',
    async run ({ sender, args, reply }) {
      const w = wallet(sender); const n = amount(args[0], w.bal)
      if (!(n > 0)) return reply('.deposit 100   ya   .deposit all')
      if (n > w.bal) return reply(`❌ Wallet mein sirf ${w.bal.toLocaleString()} hain.`)
      w.bal -= n; w.bank += n; store.save()
      await reply(`🏦 ${n.toLocaleString()} jama. Bank: ${w.bank.toLocaleString()}`)
    } },
  { name: 'withdraw', aliases: ['wd'], category: 'economy', desc: 'Bank se nikalo (.withdraw 100 / all)',
    async run ({ sender, args, reply }) {
      const w = wallet(sender); const n = amount(args[0], w.bank)
      if (!(n > 0)) return reply('.withdraw 100   ya   .withdraw all')
      if (n > w.bank) return reply(`❌ Bank mein sirf ${w.bank.toLocaleString()} hain.`)
      w.bank -= n; w.bal += n; store.save()
      await reply(`💸 ${n.toLocaleString()} nikal liye. Wallet: ${w.bal.toLocaleString()}`)
    } },
  { name: 'gamble', aliases: ['bet'], category: 'economy', desc: 'Coins ki baazi (.gamble 100 / all)',
    async run ({ sender, args, reply }) {
      const w = wallet(sender); const n = amount(args[0], w.bal)
      if (!(n > 0)) return reply('.gamble 100   ya   .gamble all')
      if (n > w.bal) return reply(`❌ Wallet mein sirf ${w.bal.toLocaleString()} hain.`)
      const win = Math.random() < 0.45
      w.bal += win ? n : -n; store.save()
      await reply(win ? `🎉 Jeet gaye *+${n.toLocaleString()}*\n💰 ${w.bal.toLocaleString()}` : `💀 Haar gaye *-${n.toLocaleString()}*\n💰 ${w.bal.toLocaleString()}`)
    } },
  { name: 'rank', aliases: ['level', 'mylevel'], category: 'economy', desc: 'Level aur rank card',
    async run ({ sock, from, msg, sender, reply }) {
      const ci = getContextInfo(msg)
      const who = ci.mentionedJid?.[0] || ci.participant || sender
      const all = store.obj('xp')
      const xp = all[num(who)]?.xp || 0
      const level = levelOf(xp)
      const position = Object.values(all).filter(x => x.xp > xp).length + 1
      const base = xpFor(level), next = xpFor(level + 1)
      const name = who === sender ? msg.pushName : num(who)
      try {
        const image = await renderRank({ name, level, xp: xp - base, need: next - base, position })
        await sock.sendMessage(from, { image, caption: `🏅 @${num(who)} — Level ${level}`, mentions: [who] }, { quoted: msg })
      } catch { await reply(`🏅 @${num(who)}\nLevel: *${level}*\nXP: ${xp}/${next}\nRank: #${position}`, { mentions: [who] }) }
    } },
  { name: 'toplevel', aliases: ['toprank', 'levels'], category: 'economy', desc: 'Sab se zyada level',
    async run ({ reply }) {
      const top = Object.entries(store.obj('xp')).sort((a, b) => b[1].xp - a[1].xp).slice(0, 10)
      if (!top.length) return reply('Abhi kisi ka level nahi.')
      await reply('🏆 *Top Levels*\n\n' + top.map(([n, x], i) => `${i + 1}. @${n} — Level ${levelOf(x.xp)}`).join('\n'), { mentions: top.map(([n]) => n + '@s.whatsapp.net') })
    } },
  { name: 'levelup', aliases: ['levelmsg'], category: 'economy', group: true, admin: true, desc: 'Level barhne par group mein elaan',
    run: (ctx) => toggleRun(ctx, { key: 'levelup', label: 'Level-up elaan' }) }
]

// har message par XP (30 second mein ek dafa, taake spam se level na barhe)
export async function hook ({ msg, from, sender, body, isGroup, reply }) {
  if (msg.key.fromMe || !sender || !body) return
  const all = store.obj('xp')
  const me = (all[num(sender)] ||= { xp: 0, t: 0 })
  if (Date.now() - me.t < 30000) return
  const before = levelOf(me.xp)
  me.xp += 10 + Math.floor(Math.random() * 11); me.t = Date.now(); store.save()
  const after = levelOf(me.xp)
  if (after > before && isGroup && store.is('levelup', from)) {
    await reply(`🎉 @${num(sender)} ab *Level ${after}* par hai!`, { mentions: [sender] })
  }
}
