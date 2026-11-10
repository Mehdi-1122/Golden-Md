import fs from 'fs'
import { commands } from '../../lib/core.js'
import { fmtUptime, num } from '../../lib/helpers.js'
import { ytAudioClip } from '../download/youtube-tiktok.js'

// === FIXED — ye yahin hardcoded hai, env ya command se koi change nahi kar sakta ===
const OWNER_NAME = '⎯꯭ͯ𓆩꯭᪴〬𝐌꯭𝗲꯭̽𝗵꯭͡𝗱𝆭𝝸𝆭-𝆭͢𓆪𝐤꯭𝆭𝝸𝝶̚𝗴᪳𓆪꯭᪴⟵'
const CHANNEL = 'https://whatsapp.com/channel/0029VbE2Rbj0gcfMoVR1H642'

// Menu ke sections: tarteeb aur emoji (nayi category khud aakhir mein aa jati hai)
const CATS = { group: ['👥', 'Group'], safety: ['🛡️', 'Group Security'], download: ['📥', 'Download'], media: ['🎬', 'Media'], sticker: ['🎨', 'Sticker'], logo: ['🖌️', 'Logo Maker'], ai: ['🤖', 'AI'], islamic: ['🕌', 'Islamic'], tools: ['🛠️', 'Tools'], text: ['✍️', 'Text Style'], convert: ['🔁', 'Converter'], games: ['🎮', 'Games'], fun: ['😂', 'Fun'], economy: ['💰', 'Economy'], general: ['🏠', 'General'], owner: ['👑', 'Owner'] }

// A-Z aur 0-9 ko stylish unicode mein (sirf headings ke liye; commands saade rehte hain taake copy ho sakein)
const FANCY_BMP = { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' }
const fancy = (s) => [...String(s).toUpperCase()].map(ch => {
  const c = ch.charCodeAt(0)
  if (c >= 65 && c <= 90) return FANCY_BMP[ch] || String.fromCodePoint(0x1D538 + c - 65)
  if (c >= 48 && c <= 57) return String.fromCodePoint(0x1D7D8 + c - 48)
  return ch
}).join('')
const mono = (s) => '```' + s + '```'

// assets ki file; na mile to null (menu phir bhi chalta hai)
const asset = (name) => { try { return fs.readFileSync(new URL('../../assets/' + name, import.meta.url)) } catch { return null } }
const banner = asset('banner.jpg')          // menu ke upar GOLDEN MD logo

// Menu ka gaana: Jatt Di Ego (Sandeep Sukh ft. Singga). Pehle .menu par download, phir memory se.
const MENU_SONG_URL = 'https://www.youtube.com/watch?v=a-gEn_xwC1g'
const MENU_SONG_SECONDS = 60
let songClip = null, songJob = null, songRetryAt = 0

function getMenuSong () {
  if (songClip) return songClip
  if (Date.now() < songRetryAt) return null   // fail hua to har .menu par dobara koshish nahi
  songJob ||= ytAudioClip(MENU_SONG_URL, MENU_SONG_SECONDS)
    .then(b => (songClip = b))
    .catch(e => { songRetryAt = Date.now() + 10 * 60 * 1000; console.error('menu song fail:', e.message); return null })
    .finally(() => { songJob = null })
  return songJob
}
getMenuSong()   // bot start hote hi tayyar, taake .menu par gaana foran jaye

const CHANNEL_NAME = 'Golden Teach'
let channelJid

// "View channel" tag ke liye channel ki id; link se ek dafa pata karke yaad rakhte hain
async function channelContext (sock) {
  try {
    channelJid ||= (await Promise.race([
      sock.live().newsletterMetadata('invite', CHANNEL.split('/').pop()),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))
    ]))?.id
  } catch (e) { console.error('channel lookup fail:', e.message) }
  return channelJid
    ? { forwardingScore: 1, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: channelJid, newsletterName: CHANNEL_NAME, serverMessageId: -1 } }
    : {}
}

const pkNow = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date())

export default [
  {
    name: 'menu', aliases: ['help', 'list', 'cmd'], category: 'general',
    desc: 'Saara menu',
    async run ({ reply, config, sock, from, msg }) {
      const uniq = new Set([...commands.values()])
      const cats = {}
      for (const c of uniq) (cats[c.category || 'misc'] ||= []).push(c.name)

      // 1) logo + bot ki info (commands alag message mein, taake caption ki had na aaye)
      const head = `╔═══❰ 👑 ${fancy(config.name)} 👑 ❱═══╗\n` +
        `║ 🤴 ${fancy('Owner')} ⟿ ${OWNER_NAME}\n` +
        `║ ⚡ ${fancy('Prefix')} ⟿ ❰ ${config.prefix} ❱\n` +
        `║ 🌍 ${fancy('Mode')} ⟿ ${config.mode}\n` +
        `║ ⏱️ ${fancy('Uptime')} ⟿ ${fmtUptime(config.start)}\n` +
        `║ 🧩 ${fancy('Commands')} ⟿ ${uniq.size}\n` +
        `║ 📅 ${pkNow()}\n` +
        `╚══════════════════╝`
      const contextInfo = await channelContext(sock)
      if (banner) await sock.live().sendMessage(from, { image: banner, caption: head, contextInfo }, { quoted: msg })
      else await reply(head, { contextInfo })

      // 2) commands
      let t = ''
      for (const cat of new Set([...Object.keys(CATS), ...Object.keys(cats)])) {
        if (!cats[cat]) continue
        const [icon, title] = CATS[cat] || ['✨', cat]
        t += `╔══❰ ${icon} ${fancy(title)} ❱══ ⟪${fancy(cats[cat].length)}⟫\n` +
          cats[cat].map(n => `║ ◈ ${mono(config.prefix + n)}`).join('\n') +
          `\n╚══════════════════\n\n`
      }
      t += `> ⚡ ${fancy('Powered By')} ${OWNER_NAME}`
      await reply(t.trim())

      // 3) channel: lambe menu mein link tap nahi hota, is liye alag chhote message mein
      await reply(`╔═══❰ 📢 ${fancy('Join Channel')} ❱═══╗\n\n👇 Link par tap karke Follow karein\n${CHANNEL}\n\n╚══════════════════╝\n\n> ⚡ ${fancy('Powered By')} ${OWNER_NAME}`, {
        contextInfo: {
          externalAdReply: {
            title: `${config.name} Channel`,
            body: 'Tap karke channel join karein',
            sourceUrl: CHANNEL,
            mediaType: 1,
            ...(banner ? { thumbnail: banner } : {})
          }
        }
      })

      // 4) gaana sab se aakhir mein, taake pehli dafa ke download se menu na ruke
      const song = await getMenuSong()
      if (song) {
        await sock.live().sendMessage(from, { audio: song, mimetype: 'audio/mpeg', fileName: 'Jatt Di Ego.mp3' }, { quoted: msg })
          .catch(e => console.error('menu song send fail:', e.message))
      }
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
