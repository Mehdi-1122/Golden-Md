import { commands } from '../lib/core.js'
import { fmtUptime, num } from '../lib/helpers.js'

// === FIXED — ye yahin hardcoded hai, env ya command se koi change nahi kar sakta ===
const OWNER_NAME = '⎯꯭ͯ𓆩꯭᪴〬𝐌꯭𝗲꯭̽𝗵꯭͡𝗱𝆭𝝸𝆭-𝆭͢𓆪𝐤꯭𝆭𝝸𝝶̚𝗴᪳𓆪꯭᪴⟵'
const CHANNEL = 'https://whatsapp.com/channel/0029VbE2Rbj0gcfMoVR1H642'

export default [
  {
    name: 'menu', aliases: ['help', 'list', 'cmd'], category: 'general',
    desc: 'Saara menu',
    async run ({ reply, config }) {
      const uniq = new Set([...commands.values()])
      const cats = {}
      for (const c of uniq) (cats[c.category || 'misc'] ||= []).push(c.name)
      let t = `╭──── *${config.name}* ────\n│ Owner: ${OWNER_NAME}\n│ Prefix: ${config.prefix}  •  Mode: ${config.mode}\n│ Uptime: ${fmtUptime(config.start)}\n│ Total cmds: ${uniq.size}\n╰───────────────\n`
      for (const [cat, list] of Object.entries(cats))
        t += `\n*${cat.toUpperCase()}*\n` + list.map(n => `${config.prefix}${n}`).join('  ') + '\n'
      t += `\n╭───────────────\n│ 📢 Channel:\n│ ${CHANNEL}\n│ 🤴 ${OWNER_NAME}\n╰───────────────`
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
