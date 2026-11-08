// Voice/Audio booster — reply kiye hue voice/audio ki awaz loud karo (ffmpeg)
import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { getQuoted } from '../lib/helpers.js'

const tmp = (ext) => path.join(os.tmpdir(), `gfx_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`)
const clean = (...f) => f.forEach(x => { try { fs.unlinkSync(x) } catch {} })

const runFF = (inp, out, af) => new Promise((res, rej) => {
  const ff = spawn('ffmpeg', ['-y', '-i', inp, '-af', af, '-ar', '44100', out])
  ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg fail')))
  ff.on('error', rej)
})

// reply kiya hua audio nikaalo
function quotedAudio (msg) {
  const q = getQuoted(msg)
  const a = q?.message?.audioMessage
  if (!a) return null
  return { key: q.key, message: { audioMessage: a } }
}

async function process (ctx, af) {
  const { sock, msg, from, reply } = ctx
  const qa = quotedAudio(msg)
  if (!qa) { await reply('Kisi *voice note / audio* pe reply kar ke command likhein.'); return }
  const inp = tmp('ogg'), out = tmp('mp3')
  try {
    const buf = await downloadMediaMessage(qa, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
    fs.writeFileSync(inp, buf)
    await runFF(inp, out, af)
    await sock.sendMessage(from, { audio: fs.readFileSync(out), mimetype: 'audio/mpeg' }, { quoted: msg })
  } catch (e) { await reply('⚠️ ' + e.message) }
  finally { clean(inp, out) }
}

export default [
  { name: 'boost', aliases: ['loud', 'volup'], category: 'media',
    desc: 'Voice/audio ki awaz loud karo (.boost 6)',
    async run (ctx) {
      let lvl = parseFloat(ctx.args[0])
      if (!(lvl > 0)) lvl = 4            // default
      if (lvl > 12) lvl = 12             // had
      // volume + halka sa dynamic normalize taake saaf aur zor se lage
      await process(ctx, `volume=${lvl},dynaudnorm=f=150:g=15`)
    } },
  { name: 'bass', aliases: ['bassboost'], category: 'media',
    desc: 'Bass boost audio',
    async run (ctx) {
      let g = parseFloat(ctx.args[0]); if (!(g > 0)) g = 12; if (g > 25) g = 25
      await process(ctx, `bass=g=${g},volume=2`)
    } },
  { name: 'slow', category: 'media', desc: 'Audio slow (reply)', async run (ctx) { await process(ctx, 'atempo=0.75') } },
  { name: 'fast', aliases: ['speed'], category: 'media', desc: 'Audio fast (reply)', async run (ctx) { await process(ctx, 'atempo=1.5') } },
  { name: 'nightcore', category: 'media', desc: 'Nightcore effect (reply)', async run (ctx) { await process(ctx, 'asetrate=44100*1.25,aresample=44100,atempo=1.06') } },
  { name: 'deep', aliases: ['deepvoice'], category: 'media', desc: 'Deep/heavy voice (reply)', async run (ctx) { await process(ctx, 'asetrate=44100*0.8,aresample=44100,atempo=1.1') } },
  { name: 'reverb', aliases: ['echo'], category: 'media', desc: 'Echo effect (reply)', async run (ctx) { await process(ctx, 'aecho=0.8:0.9:1000:0.3') } }
]
