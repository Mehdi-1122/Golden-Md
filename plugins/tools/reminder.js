// Reminder — .remind 10m <message>  (bot yaad dila dega)
// Note: in-memory hai, bot restart par pending reminders mit jate hain.
const UNITS = { s: 1000, m: 60000, h: 3600000, d: 86400000 }

export default [
  { name: 'remind', aliases: ['reminder', 'remindme'], category: 'tools',
    desc: 'Yaad dilao: .remind 10m text',
    async run ({ args, sock, from, msg, reply, sender }) {
      const d = /^(\d+)(s|m|h|d)$/.exec((args[0] || '').toLowerCase())
      if (!d) return reply('.remind 10m <message>\nmisal: .remind 1h namaz padhni hai\n(s=sec, m=min, h=hour, d=day)')
      const ms = (+d[1]) * UNITS[d[2]]
      if (ms > 86400000) return reply('Max 24 ghante (24h) tak.')
      const note = args.slice(1).join(' ') || 'Reminder!'
      await reply(`⏰ Theek hai — *${args[0]}* baad yaad dila dunga.`)
      setTimeout(() => {
        sock.live().sendMessage(from, { text: `⏰ *Reminder:* ${note}`, mentions: sender ? [sender] : [] }, { quoted: msg }).catch(() => {})
      }, ms)
    } }
]
