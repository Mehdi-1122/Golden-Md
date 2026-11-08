// Owner plus — backup, stats, autostatus, autotyping
import fs from 'fs'
import store from '../lib/store.js'
import { commands, stats } from '../lib/core.js'
import { fmtUptime } from '../lib/helpers.js'
import { toggleRun } from '../lib/buttons.js'

export default [
  { name: 'backup', aliases: ['getdata', 'databackup'], category: 'owner', owner: true, desc: 'data.json (settings/coins/warns) owner ko',
    async run ({ sock, msg, config, reply }) {
      if (config.multi) return reply('🔒 Website mode mein backup band hai (file mein sab users ka data hota hai).')
      store.save()
      await new Promise(r => setTimeout(r, 500))   // save() 300ms baad likhta hai
      if (!fs.existsSync(store.file)) return reply('Abhi koi data nahi.')
      const to = config.owner + '@s.whatsapp.net'
      await sock.sendMessage(to, { document: fs.readFileSync(store.file), mimetype: 'application/json', fileName: `golden-md-backup-${new Date().toISOString().slice(0, 10)}.json` }, { quoted: msg })
      await reply('✅ Backup owner ke inbox mein bhej diya.')
    } },
  { name: 'stats', aliases: ['botstats', 'usage'], category: 'owner', owner: true, desc: 'Bot ke groups, users, commands',
    async run ({ sock, config, reply }) {
      const groups = Object.keys(await sock.groupFetchAllParticipating()).length
      const users = new Set([...Object.keys(store.obj('coins')), ...Object.values(store.obj('activity')).flatMap(Object.keys)]).size
      const top = Object.entries(stats.by).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, c]) => `${config.prefix}${n} (${c})`).join(', ')
      const mem = (process.memoryUsage().rss / 1048576).toFixed(0)
      await reply(`📊 *${config.name} Stats*\n\n👥 Groups: ${groups}\n🙋 Users (data mein): ${users}\n🧩 Commands: ${new Set([...commands.values()]).size}\n▶️ Is run mein chali: ${stats.cmds}\n🔥 Top: ${top || '-'}\n⏱️ Uptime: ${fmtUptime(config.start)}\n💾 RAM: ${mem} MB`)
    } },
  { name: 'autostatus', aliases: ['autoview', 'statusview'], category: 'owner', owner: true, desc: 'Sab ke status khud dekh lo',
    run: (ctx) => toggleRun(ctx, { key: 'autostatus', id: ctx.config.scope('global'), label: 'Auto status view', perm: 'owner' }) },
  { name: 'autotyping', aliases: ['typing'], category: 'owner', owner: true, desc: 'Command par "typing..." dikhao',
    run: (ctx) => toggleRun(ctx, { key: 'autotyping', id: ctx.config.scope('global'), label: 'Auto typing', perm: 'owner' }) }
]
