// Bulk group actions + admin-lock (sirf bot owner admins control kare)
import store from '../../lib/store.js'
import { toggleRun } from '../../lib/buttons.js'
import { getQuoted } from '../../lib/helpers.js'

const sleep = ms => new Promise(r => setTimeout(r, ms))

export default [
  // Saare groups pe ek saath naam set
  { name: 'setallname', aliases: ['allname', 'setallsubject'], category: 'group', owner: true,
    desc: 'Sab groups ka naam set (jahan bot admin hai)',
    async run ({ sock, text, reply }) {
      if (!text) return reply('Naam likhein: .setallname My Community')
      const all = await sock.groupFetchAllParticipating()
      let ok = 0, fail = 0
      for (const jid of Object.keys(all)) {
        try { await sock.groupUpdateSubject(jid, text); ok++; await sleep(1200) }
        catch { fail++ }
      }
      await reply(`✅ Naam set: ${ok} groups\n❌ Nahi hua (bot admin nahi?): ${fail}`)
    } },

  // Saare groups pe ek saath description set
  { name: 'setalldesc', category: 'group', owner: true,
    desc: 'Sab groups ki description set',
    async run ({ sock, text, reply }) {
      const all = await sock.groupFetchAllParticipating()
      let ok = 0, fail = 0
      for (const jid of Object.keys(all)) {
        try { await sock.groupUpdateDescription(jid, text); ok++; await sleep(1200) } catch { fail++ }
      }
      await reply(`✅ Description set: ${ok}\n❌ Fail: ${fail}`)
    } },

  // gcss: quoted message/media (ya text) sab groups pe bhej do
  { name: 'gcss', aliases: ['bcgc', 'broadcastgc', 'gcstatus'], category: 'group', owner: true,
    desc: 'Reply ki hui cheez / text sab groups pe bhejo',
    async run ({ sock, msg, text, reply }) {
      const q = getQuoted(msg)
      let payload
      if (q) payload = { forward: q }                       // kisi bhi type ko forward karo
      else if (text) payload = { text: '📢 ' + text }
      else return reply('Kisi message/photo/video ko *reply* kar ke .gcss likho, ya text do.')

      const all = await sock.groupFetchAllParticipating()
      const ids = Object.keys(all)
      await reply(`📣 ${ids.length} groups pe lagaya ja raha hai...`)
      let ok = 0
      for (const jid of ids) {
        try { await sock.sendMessage(jid, payload); ok++; await sleep(1800) } catch {}
      }
      await reply(`✅ ${ok}/${ids.length} groups pe ho gaya.`)
    } },

  // Admin-lock toggle (is group mein)
  { name: 'adminlock', aliases: ['lockadmin'], category: 'safety', group: true, owner: true,
    desc: 'Sirf bot owner admin bana/hata sake',
    run: (ctx) => toggleRun(ctx, { key: 'adminlock', id: ctx.config.scope(ctx.from), label: 'Admin-lock', perm: 'owner',
      on: '🔒 Admin-lock ON. Ab sirf bot owner admin bana/hata sakta hai; aur koi admin kare to bot revert kar dega.', off: '🔓 Admin-lock OFF.' }) }
]
