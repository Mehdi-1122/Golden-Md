// Sudo users — owner apna bot 5 aur bando ko share kar sake (owner-level access)
import store from '../../lib/store.js'
import { num, getContextInfo } from '../../lib/helpers.js'

const MAX = 5

const target = (msg, args) => {
  const ci = getContextInfo(msg)
  if (ci.mentionedJid?.length) return num(ci.mentionedJid[0])
  if (ci.participant) return num(ci.participant)
  if (args[0] && /\d{6,}/.test(args[0])) return args[0].replace(/\D/g, '')
  return null
}

// sirf ASAL owner sudo manage kare (sudo users khud aur sudo na bana saken)
const realOwner = (ctx) => ctx.isRealOwner

export default [
  { name: 'addsudo', aliases: ['setsudo', 'sharebot'], category: 'owner', owner: true,
    desc: 'Bot kisi aur ko share (max 5)',
    async run (ctx) {
      if (!realOwner(ctx)) return ctx.reply('👑 Sirf asal owner sudo add kar sakta hai.')
      const n = target(ctx.msg, ctx.args)
      if (!n) return ctx.reply('Kisi ko tag/reply karein ya number dein: .addsudo 923001234567')
      const list = store.sudoList(ctx.config)
      if (list.includes(n)) return ctx.reply('Ye pehle se sudo hai.')
      if (list.length >= MAX) return ctx.reply(`❌ Max ${MAX} sudo users ho sakte hain. Pehle kisi ko .delsudo karein.`)
      list.push(n); store.save()
      await ctx.reply(`✅ ${n} ab sudo hai — ye owner-level commands chala sakta hai.\n(${list.length}/${MAX})`)
    } },
  { name: 'delsudo', aliases: ['rmsudo', 'unsudo'], category: 'owner', owner: true,
    desc: 'Sudo user hatao',
    async run (ctx) {
      if (!realOwner(ctx)) return ctx.reply('👑 Sirf asal owner sudo hata sakta hai.')
      const n = target(ctx.msg, ctx.args)
      if (!n) return ctx.reply('Kisko hatana hai? tag/reply/number dein.')
      const list = store.sudoList(ctx.config)
      const i = list.indexOf(n)
      if (i === -1) return ctx.reply('Ye sudo mein nahi.')
      list.splice(i, 1); store.save()
      await ctx.reply(`✅ ${n} sudo se hata diya. (${list.length}/${MAX})`)
    } },
  { name: 'listsudo', aliases: ['sudolist', 'getsudo'], category: 'owner', owner: true,
    desc: 'Sudo users ki list',
    async run (ctx) {
      const list = store.sudoList(ctx.config)
      if (!list.length) return ctx.reply('Koi sudo user nahi. .addsudo se add karein.')
      await ctx.reply(`👥 *Sudo users (${list.length}/${MAX}):*\n` + list.map((n, i) => `${i + 1}. ${n}`).join('\n'))
    } }
]
