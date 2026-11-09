// Welcome / Goodbye — apni marzi ka message (.setwelcome / .setgoodbye), on/off: .welcome / .goodbye
import store from '../../lib/store.js'
import { num } from '../../lib/helpers.js'
import { toggleRun } from '../../lib/buttons.js'

const DEF = {
  welcome: '👋 Assalam-o-Alaikum @user!\n*{group}* mein khush aamdeed 🌹\nAap hamare {count}ve member ho.',
  goodbye: '👋 @user group chhod gaye. Allah Hafiz!\nAb hum {count} members hain.'
}
const HELP = `Ye lafz khud badal jayenge:
@user = naye/jaane wale member ka tag
{group} = group ka naam
{count} = kul members
{desc} = group description
{date} = aaj ki date • {time} = waqt`

const pkNow = (o) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', ...o }).format(new Date())

function fill (tpl, jid, meta) {
  return tpl
    .replace(/@user/gi, '@' + num(jid))
    .replace(/\{group\}/gi, meta.subject || '')
    .replace(/\{count\}/gi, meta.participants.length)
    .replace(/\{desc\}/gi, meta.desc || '')
    .replace(/\{date\}/gi, pkNow({ day: '2-digit', month: 'short', year: 'numeric' }))
    .replace(/\{time\}/gi, pkNow({ hour: '2-digit', minute: '2-digit', hour12: true }))
}

// welcome/goodbye bhejo (pic on ho to member ki DP ke saath)
async function greet (sock, gid, jid, kind) {
  const meta = await sock.groupMetadata(gid)
  const text = fill(store.obj(kind + 'msg')[gid] || DEF[kind], jid, meta)
  if (store.is('welcomepic', gid)) {
    const url = await sock.profilePictureUrl(jid, 'image').catch(() => null)
    if (url) return sock.sendMessage(gid, { image: { url }, caption: text, mentions: [jid] })
  }
  await sock.sendMessage(gid, { text, mentions: [jid] })
}

const setter = (kind, label) => async ({ from, text, reply, config }) => {
  if (!text) return reply(`*${config.prefix}set${kind} <message>*\n\nMisal:\n${config.prefix}set${kind} ${DEF[kind]}\n\n${HELP}`)
  store.obj(kind + 'msg')[from] = text; store.on(kind, from)
  await reply(`✅ ${label} message set aur ON ho gaya.\nDekhne ke liye: ${config.prefix}test${kind}`)
}

export default [
  { name: 'setwelcome', aliases: ['welcomemsg'], category: 'group', group: true, admin: true, desc: 'Apna welcome message',
    run: setter('welcome', 'Welcome') },
  { name: 'setgoodbye', aliases: ['byemsg', 'setbye'], category: 'group', group: true, admin: true, desc: 'Apna goodbye message',
    run: setter('goodbye', 'Goodbye') },
  { name: 'resetwelcome', aliases: ['delwelcome'], category: 'group', group: true, admin: true, desc: 'Welcome default par wapas',
    async run ({ from, reply }) { delete store.obj('welcomemsg')[from]; store.save(); await reply('✅ Welcome message default ho gaya.') } },
  { name: 'resetgoodbye', aliases: ['delgoodbye'], category: 'group', group: true, admin: true, desc: 'Goodbye default par wapas',
    async run ({ from, reply }) { delete store.obj('goodbyemsg')[from]; store.save(); await reply('✅ Goodbye message default ho gaya.') } },
  { name: 'testwelcome', category: 'group', group: true, admin: true, desc: 'Welcome kaisa dikhega',
    async run ({ sock, from, sender }) { await greet(sock, from, sender, 'welcome') } },
  { name: 'testgoodbye', aliases: ['testbye'], category: 'group', group: true, admin: true, desc: 'Goodbye kaisa dikhega',
    async run ({ sock, from, sender }) { await greet(sock, from, sender, 'goodbye') } },
  { name: 'welcomepic', aliases: ['welcomedp'], category: 'group', group: true, admin: true, desc: 'Welcome/goodbye mein member ki DP',
    run: (ctx) => toggleRun(ctx, { key: 'welcomepic', label: 'Welcome DP', on: '✅ Ab welcome/goodbye member ki profile photo ke saath jayega.' }) }
]

export async function onGroup (sock, { id, participants, action }) {
  const kind = action === 'add' ? 'welcome' : action === 'remove' ? 'goodbye' : null
  if (!kind || !store.is(kind, id)) return
  for (const p of participants) {
    const jid = typeof p === 'string' ? p : (p.phoneNumber || p.id)
    if (num(jid) === num(sock.user?.id)) continue
    await greet(sock, id, jid, kind)
  }
}
