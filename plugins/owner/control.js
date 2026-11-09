// Owner-only controls
import store from '../../lib/store.js'
import { toggleRun, sendToggle } from '../../lib/buttons.js'
import { num, getContextInfo } from '../../lib/helpers.js'

const tgt = (msg, args) => {
  const ci = getContextInfo(msg)
  if (ci.mentionedJid?.length) return ci.mentionedJid[0]
  if (ci.participant) return ci.participant
  if (args[0] && /\d{6,}/.test(args[0])) return args[0].replace(/\D/g, '') + '@s.whatsapp.net'
  return null
}

// mode store mein bhi rakho, warna reconnect par wapas env wala ho jata hai
const setMode = (config, v) => { config.mode = v; store.obj('modes')[config.scope('global')] = v; store.save() }

export default [
  { name: 'mode', category: 'owner', owner: true, desc: 'public/private',
    async run (ctx) {
      const { args, reply, config } = ctx
      const v = (args[0] || '').toLowerCase()
      if (v === 'public' || v === 'private') { setMode(config, v); return reply('✅ Mode: ' + v) }
      await sendToggle(ctx, { label: 'Bot mode', perm: 'owner', options: ['🌍 Public', '🔒 Private'], state: config.mode,
        apply: (pub) => setMode(config, pub ? 'public' : 'private') })
    } },
  { name: 'setbio', aliases: ['ib', 'setstatus', 'setabout'], category: 'owner', owner: true,
    desc: 'Bot number ki bio/about',
    async run ({ sock, text, reply }) {
      if (!text) return reply('Bio likhein: .setbio Hello from Golden MD')
      await sock.updateProfileStatus(text)
      await reply('✅ Bio update ho gayi.')
    } },
  { name: 'setbotname', aliases: ['botname'], category: 'owner', owner: true,
    desc: 'Bot ka profile naam',
    async run ({ sock, text, reply }) {
      if (!text) return reply('Naam likhein.')
      await sock.updateProfileName(text)
      await reply('✅ Profile naam set.')
    } },
  { name: 'block', category: 'owner', owner: true, desc: 'User block',
    async run ({ sock, msg, args, reply }) {
      const t = tgt(msg, args); if (!t) return reply('Tag/reply/number dein.')
      await sock.updateBlockStatus(t, 'block'); await reply('🚫 Blocked ' + num(t))
    } },
  { name: 'unblock', category: 'owner', owner: true, desc: 'User unblock',
    async run ({ sock, msg, args, reply }) {
      const t = tgt(msg, args); if (!t) return reply('Tag/reply/number dein.')
      await sock.updateBlockStatus(t, 'unblock'); await reply('✅ Unblocked ' + num(t))
    } },
  { name: 'join', category: 'owner', owner: true, desc: 'Group link se join',
    async run ({ sock, args, reply }) {
      const code = (args[0] || '').split('chat.whatsapp.com/').pop()
      if (!code) return reply('Invite link dein.')
      await sock.groupAcceptInvite(code); await reply('✅ Join ho gaya.')
    } },
  { name: 'leave', aliases: ['out'], category: 'owner', owner: true, group: true, desc: 'Group chhodo',
    async run ({ sock, from, reply }) { await reply('👋 Bye!'); await sock.groupLeave(from) } },
  { name: 'gcantidel', category: 'owner', owner: true, desc: 'Anti-delete har jagah on/off',
    run: (ctx) => toggleRun(ctx, { key: 'antidelete', id: ctx.config.scope('global'), label: 'Global anti-delete', perm: 'owner' }) },
  { name: 'restart', category: 'owner', owner: true, desc: 'Bot restart',
    async run ({ reply, config }) {
      if (config.multi) return reply('🔒 Website mode mein restart band hai (sab users ke bot isi server par hain).')
      await reply('♻️ Restarting...'); process.exit(0)
    } }
]
