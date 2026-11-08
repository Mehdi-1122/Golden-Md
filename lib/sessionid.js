// SESSION_ID — do forms:
//  SHORT: "GMD~<host>~<id>"  -> creds generator server se fetch (chhoti, 2-3 lines)
//  LONG : "GOLDEN~<base64>"   -> creds khud string mein (lambi, self-contained)
import fs from 'fs'
import path from 'path'

const LONG = 'GOLDEN~'
const SHORT = 'GMD~'

export async function restoreFromId (dir, id) {
  id = (id || '').trim()   // sirf jo caller de; web mode mein env wali ID har naye number par na lage
  if (!id) return false
  const creds = path.join(dir, 'creds.json')
  if (fs.existsSync(creds)) return false      // pehle se session hai
  try {
    let data
    if (id.startsWith(SHORT)) {
      const [host, sid] = id.slice(SHORT.length).split('~')
      if (!host || !sid) return false
      const proto = /^(localhost|127\.|0\.0\.0\.0)/.test(host) ? 'http' : 'https'
      const r = await fetch(`${proto}://${host}/session/${sid}`)
      if (!r.ok) return false
      data = await r.text()
    } else {
      const b64 = id.startsWith(LONG) ? id.slice(LONG.length) : id
      data = Buffer.from(b64, 'base64').toString('utf8')
    }
    JSON.parse(data)                          // valid check
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(creds, data)
    return true
  } catch { return false }
}

// Lambi (self-contained) ID — single-mode console ke liye
export function makeId (dir) {
  const creds = path.join(dir, 'creds.json')
  if (!fs.existsSync(creds)) return null
  return LONG + Buffer.from(fs.readFileSync(creds)).toString('base64')
}
