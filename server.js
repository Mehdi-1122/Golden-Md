// Mini-bot server — user number daale, pairing code le, WhatsApp link kare, bot chalu.
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import http from 'http'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { startSession, stopSession, sessions } from './lib/session.js'
import { num } from './lib/helpers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
const SESS = path.join(__dirname, 'sessions')
const VAULT = path.join(SESS, '.vault')   // creds ki chhoti-id storage (sessions wali disk par, redeploy par na mite)
fs.mkdirSync(VAULT, { recursive: true })

const SID_FILE = '.sid'           // is number ki short id
const SENT_FILE = '.sid-sent'     // SESSION_ID WhatsApp par ja chuki
const MOVED_FILE = '.moved'       // user ne apni deploy par chala li, yahan resume nahi karna

const pairTokens = new Map()      // number -> { token, exp } (sirf code lene wale browser ke paas)
const pending = new Set()         // jin numbers ki pairing chal rahi hai
const MAX_PENDING = 20
const PAIR_WINDOW = 180000        // pairing code ki taqreeban umar

// Har IP se 10 minute mein zyada se zyada 5 pairing requests
const hits = new Map()
function rateLimited (req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim()
  const now = Date.now()
  if (hits.size > 5000) hits.clear()
  const list = (hits.get(ip) || []).filter(t => now - t < 600000)
  list.push(now); hits.set(ip, list)
  return list.length > 5
}

const readSid = (dir) => {
  try {
    const s = fs.readFileSync(path.join(dir, SID_FILE), 'utf8').trim()
    return /^[a-f0-9]{32}$/.test(s) ? s : null
  } catch { return null }
}

// number ka short-id dhoondo ya naya banao (creds vault mein copy kar ke)
function makeShort (dir) {
  const credsFile = path.join(dir, 'creds.json')
  if (!fs.existsSync(credsFile)) return null
  let sid = readSid(dir)
  if (!sid) { sid = crypto.randomBytes(16).toString('hex'); fs.writeFileSync(path.join(dir, SID_FILE), sid) }
  fs.writeFileSync(path.join(VAULT, sid + '.json'), fs.readFileSync(credsFile))
  return sid
}

const publicHost = (req) => process.env.PUBLIC_URL
  ? process.env.PUBLIC_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')
  : req?.headers.host

// Short SESSION_ID banao + user ko uske apne WhatsApp pe sirf EK dafa bhej do
const onOpen = (dir) => async (sock) => {
  const sid = makeShort(dir)
  const sent = path.join(dir, SENT_FILE)
  if (!sid || fs.existsSync(sent)) return
  const me = num(sock.user.id) + '@s.whatsapp.net'
  const host = publicHost()
  const line = host ? `\n\nGMD~${host}~${sid}` : '\n\n(SESSION_ID website se copy karein)'
  await sock.sendMessage(me, { text: `🔑 *Golden MD — SESSION_ID*${line}\n\nIse apni deploy ke *SESSION_ID* env mein daal do — bot kahin bhi khud chal jayega, dobara scan nahi.\n⚠️ Kisi ko mat dena.` })
  fs.writeFileSync(sent, '1')
}

const callbacks = (dir) => ({
  multi: true,
  onOpen: onOpen(dir),
  // user ne SESSION_ID apni deploy par laga di: yahan dobara chala kar usay mat nikaalo
  onReplaced: () => fs.writeFileSync(path.join(dir, MOVED_FILE), '1'),
  // logout: vault se bhi creds hatao
  onLoggedOut: () => { const s = readSid(dir); if (s) fs.rmSync(path.join(VAULT, s + '.json'), { force: true }) }
})

const isLinked = (dir) => {
  try { return !!JSON.parse(fs.readFileSync(path.join(dir, 'creds.json'), 'utf8')).account && !fs.existsSync(path.join(dir, MOVED_FILE)) }
  catch { return false }
}

// Server start hone par purane (linked) sessions dobara chalao
for (const d of fs.readdirSync(SESS)) {
  if (!/^\d+$/.test(d)) continue
  const dir = path.join(SESS, d)
  if (isLinked(dir)) startSession({ dir, owner: d, ...callbacks(dir) }).catch(e => console.error('resume:', d, e.message))
}

const json = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)) }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')

  // Pairing: number -> 8-digit code
  if (req.method === 'POST' && url.pathname === '/pair') {
    if (rateLimited(req)) return json(res, 429, { error: 'Bohot zyada koshishen. 10 minute baad dobara karein.' })
    let body = ''
    req.on('data', c => { body += c; if (body.length > 2048) req.destroy() })
    req.on('end', async () => {
      let number = ''
      let started = false
      try {
        number = String(JSON.parse(body || '{}').number || '').replace(/\D/g, '')
        if (number.length < 10 || number.length > 15) return json(res, 400, { error: 'Sahi number dein (country code ke saath).' })
        const dir = path.join(SESS, number)
        if (sessions.get(dir)?.authState?.creds?.account) return json(res, 200, { already: true })
        if (pending.has(number)) return json(res, 429, { error: 'Is number ka code pehle hi ban chuka hai. 3 minute baad dobara koshish karein.' })
        if (pending.size >= MAX_PENDING) return json(res, 503, { error: 'Server busy hai, thori der baad koshish karein.' })
        pending.add(number); started = true
        setTimeout(() => pending.delete(number), PAIR_WINDOW)
        stopSession(dir, { wipe: true })   // purani adhoori ya moved session saaf
        const code = await new Promise((resolve, reject) => {
          const t = setTimeout(() => reject(new Error('Code time out — dobara koshish karein.')), 30000)
          startSession({ dir, owner: number, pairingNumber: number, ...callbacks(dir), onPair: (c, e) => { clearTimeout(t); e ? reject(e) : resolve(c) } })
            .catch(reject)
        })
        const token = crypto.randomBytes(16).toString('hex')
        if (pairTokens.size > 1000) pairTokens.clear()
        pairTokens.set(number, { token, exp: Date.now() + 3600000 })
        json(res, 200, { code: code.match(/.{1,4}/g)?.join('-') || code, token })
      } catch (e) {
        if (started) { pending.delete(number); stopSession(path.join(SESS, number), { wipe: true }) }
        json(res, 500, { error: e.message })
      }
    })
    return
  }

  // Short-id se creds (deploy par bot yahan se laata hai). id 128-bit secret hai.
  if (req.method === 'GET' && url.pathname.startsWith('/session/')) {
    const sid = url.pathname.split('/').pop()
    const fp = path.join(VAULT, sid + '.json')
    if (/^[a-f0-9]{32}$/.test(sid) && fs.existsSync(fp)) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(fs.readFileSync(fp)) }
    return json(res, 404, { error: 'not found' })
  }

  // Status: sirf usi browser ko jis ne code liya (token ke saath)
  if (req.method === 'GET' && url.pathname.startsWith('/status/')) {
    const n = url.pathname.split('/').pop().replace(/\D/g, '')
    const t = pairTokens.get(n)
    if (!t || t.exp < Date.now() || t.token !== url.searchParams.get('token')) return json(res, 403, { error: 'forbidden' })
    const dir = path.join(SESS, n)
    const connected = !!sessions.get(dir)?.gmdOpen
    const sid = connected ? readSid(dir) : null
    return json(res, 200, { connected, sessionId: sid ? `GMD~${publicHost(req)}~${sid}` : null })
  }

  // Static: pairing page
  const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1)
  const fp = path.join(__dirname, 'public', path.normalize(file).replace(/^(\.\.(\/|\\|$))+/, ''))
  if (fp.startsWith(path.join(__dirname, 'public')) && fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    const ext = path.extname(fp).slice(1)
    const types = { html: 'text/html', css: 'text/css', js: 'text/javascript', png: 'image/png' }
    res.writeHead(200, { 'content-type': types[ext] || 'text/plain' })
    return res.end(fs.readFileSync(fp))
  }
  res.writeHead(404); res.end('Not found')
})

server.listen(PORT, () => console.log(`🌐 Mini-bot server: http://localhost:${PORT}`))
