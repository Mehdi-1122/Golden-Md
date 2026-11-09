import { commands } from '../lib/core.js'
import { fmtUptime, num } from '../lib/helpers.js'

// === FIXED — ye yahin hardcoded hai, env ya command se koi change nahi kar sakta ===
const OWNER_NAME = '⎯꯭ͯ𓆩꯭᪴〬𝐌꯭𝗲꯭̽𝗵꯭͡𝗱𝆭𝝸𝆭-𝆭͢𓆪𝐤꯭𝆭𝝸𝝶̚𝗴᪳𓆪꯭᪴⟵'
const CHANNEL = 'https://whatsapp.com/channel/0029VbE2Rbj0gcfMoVR1H642'

// Menu ke sections: tarteeb aur emoji (nayi category khud aakhir mein aa jati hai)
const CATS = { general: '🏠', ai: '🤖', download: '📥', media: '🎬', text: '✍️', tools: '🛠️', convert: '🔁', islamic: '🕌', group: '👥', safety: '🛡️', games: '🎮', fun: '😂', economy: '💰', owner: '👑' }

// A-Z aur 0-9 ko bold unicode mein (sirf headings ke liye; commands saade rehte hain taake copy ho sakein)
const bold = (s) => [...String(s).toUpperCase()].map(ch => {
  const c = ch.charCodeAt(0)
  if (c >= 65 && c <= 90) return String.fromCodePoint(0x1D5D4 + c - 65)
  if (c >= 48 && c <= 57) return String.fromCodePoint(0x1D7EC + c - 48)
  return ch
}).join('')

const pkNow = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date())

export default [
  {
    name: 'menu', aliases: ['help', 'list', 'cmd'], category: 'general',
    desc: 'Saara menu',
    async run ({ reply, config }) {
      const uniq = new Set([...commands.values()])
      const cats = {}
      for (const c of uniq) (cats[c.category || 'misc'] ||= []).push(c.name)
      let t = `╭━━━〔 👑 ${bold(config.name)} 👑 〕━━━⬣\n` +
        `┃ 🤴 ${bold('Owner')}: ${OWNER_NAME}\n` +
        `┃ ⚡ ${bold('Prefix')}: [ ${config.prefix} ]\n` +
        `┃ 🌍 ${bold('Mode')}: ${config.mode}\n` +
        `┃ ⏱️ ${bold('Uptime')}: ${fmtUptime(config.start)}\n` +
        `┃ 🧩 ${bold('Commands')}: ${uniq.size}\n` +
        `┃ 📅 ${pkNow()}\n` +
        `╰━━━━━━━━━━━━━━━━⬣\n`
      for (const cat of new Set([...Object.keys(CATS), ...Object.keys(cats)])) {
        if (!cats[cat]) continue
        t += `\n╭─❍ ${CATS[cat] || '✨'} ${bold(cat)} (${cats[cat].length})\n` +
          cats[cat].map(n => `│ ✦ ${config.prefix}${n}`).join('\n') +
          `\n╰────────────⬡\n`
      }
      t += `\n╭━━━〔 📢 ${bold('Channel')} 〕━━━⬣\n┃ ${CHANNEL}\n┃ 🤴 ${OWNER_NAME}\n╰━━━━━━━━━━━━━━━━⬣\n\n> ✨ ${bold(config.name)} — ${bold('Golden Power')} ✨`
      await reply(t.trim())
    }
  },
  { name: 'ping', category: 'general', desc: 'Speed check',
    async run ({ reply, config }) {
      const s = Date.now()
      await reply('🏓 Pong!')
      await reply(`⚡ Speed: ${Date.now() - s} ms`)
    } },
  { name: 'alive', aliases: ['test'], category: 'general', desc: 'Bot status',
    async run ({ reply, config }) { await reply(`✅ ${config.name} zinda hai!\n⏱️ ${fmtUptime(config.start)}`) } },
  { name: 'runtime', aliases: ['uptime'], category: 'general', desc: 'Uptime',
    async run ({ reply, config }) { await reply('⏱️ ' + fmtUptime(config.start)) } },
  { name: 'owner', category: 'general', desc: 'Owner info',
    async run ({ reply, config }) {
      await reply(`${OWNER_NAME}\n📱 wa.me/${config.owner}\n📢 Channel: ${CHANNEL}`)
    } },
  { name: 'botinfo', aliases: ['info'], category: 'general', desc: 'Bot info',
    async run ({ reply, config }) {
      await reply(`🤖 *${config.name}*\nLibrary: Baileys MD\nPrefix: ${config.prefix}\nMode: ${config.mode}\nCommands: ${new Set([...commands.values()]).size}\nUptime: ${fmtUptime(config.start)}`)
    } }
]
