// Group settings + toggles (antilink, welcome, goodbye, owner-lock, antidelete, antiviewonce)
import store from '../../lib/store.js'
import { toggleRun } from '../../lib/buttons.js'
import { botIsAdmin } from '../../lib/helpers.js'

// .cmd on / off — ya sirf .cmd likho to ON/OFF poll button aata hai
const toggle = (key, label) => ({
  run: (ctx) => toggleRun(ctx, { key, label })
})

export default [
  { name: 'antilink', category: 'safety', group: true, admin: true, desc: 'Links auto-delete', ...toggle('antilink', 'Antilink') },
  { name: 'welcome', category: 'safety', group: true, admin: true, desc: 'Welcome msg', ...toggle('welcome', 'Welcome') },
  { name: 'goodbye', aliases: ['bye'], category: 'safety', group: true, admin: true, desc: 'Goodbye msg', ...toggle('goodbye', 'Goodbye') },
  { name: 'antidelete', aliases: ['antidel'], category: 'safety', admin: true, desc: 'Deleted msg wapas (group + inbox)',
    run (ctx) {
      if (ctx.isGroup) return toggleRun(ctx, { key: 'antidelete', label: 'Anti-delete' })
      if (!ctx.isOwner) return ctx.reply('👑 Inbox ka anti-delete sirf owner badal sakta hai.')
      return toggleRun(ctx, { key: 'antidelete', id: ctx.config.scope('inbox'), label: 'Inbox anti-delete', perm: 'owner',
        on: '✅ Inbox anti-delete ON — koi bhi inbox mein message delete karega to wo aap ke "Message yourself" mein aa jayega.' })
    } },
  { name: 'antiviewonce', aliases: ['antivo'], category: 'safety', group: true, admin: true, desc: 'View-once open', ...toggle('antiviewonce', 'Anti-viewonce') },

  // owner-lock: sirf bot owner commands chala sake is group mein
  { name: 'gclock', aliases: ['lockcmd'], category: 'safety', group: true, admin: true,
    desc: 'Sirf bot owner commands chalaye',
    run: (ctx) => toggleRun(ctx, { key: 'gclock', label: 'Owner-lock',
      on: '🔒 Ab sirf bot owner commands chala sakta hai.', off: '🔓 Sab admins commands chala sakte hain.' }) },

  // group subject/desc/settings
  { name: 'setname', aliases: ['setsubject', 'gcname'], category: 'group', group: true, admin: true,
    desc: 'Group ka naam',
    async run ({ sock, from, text, reply }) { if (!text) return reply('Naya naam likhein.'); await sock.groupUpdateSubject(from, text); await reply('✅ Naam set.') } },
  { name: 'setdesc', aliases: ['gcdesc'], category: 'group', group: true, admin: true,
    desc: 'Group description',
    async run ({ sock, from, text, reply }) { await sock.groupUpdateDescription(from, text); await reply('✅ Description set.') } },
  { name: 'close', aliases: ['lock'], category: 'group', group: true, admin: true,
    desc: 'Sirf admin message',
    async run ({ sock, from, reply }) { await sock.groupSettingUpdate(from, 'announcement'); await reply('🔒 Group locked (sirf admins).') } },
  { name: 'open', aliases: ['unlock'], category: 'group', group: true, admin: true,
    desc: 'Sab message karein',
    async run ({ sock, from, reply }) { await sock.groupSettingUpdate(from, 'not_announcement'); await reply('🔓 Group open.') } },
  { name: 'grouplink', aliases: ['link', 'gclink'], category: 'group', group: true, admin: true,
    desc: 'Invite link',
    async run ({ sock, from, reply }) { const c = await sock.groupInviteCode(from); await reply('🔗 https://chat.whatsapp.com/' + c) } },
  { name: 'revoke', aliases: ['resetlink'], category: 'group', group: true, admin: true,
    desc: 'Link reset',
    async run ({ sock, from, reply }) { await sock.groupRevokeInvite(from); await reply('✅ Link reset ho gaya.') } }
]

// passive hook: antilink
export async function hook (ctx) {
  const { body, from, isGroup, sender, sock, msg, isOwner, store: st } = ctx
  if (!isGroup || !st.is('antilink', from)) return
  if (!/chat\.whatsapp\.com\/[0-9A-Za-z]{10,}/.test(body)) return
  if (isOwner) return
  try {
    const meta = await sock.groupMetadata(from)
    if (botIsAdmin(meta, sock)) {
      await sock.sendMessage(from, { delete: msg.key })
      await sock.sendMessage(from, { text: `⚠️ @${sender.split('@')[0]} links allowed nahi.`, mentions: [sender] })
    }
  } catch {}
}
