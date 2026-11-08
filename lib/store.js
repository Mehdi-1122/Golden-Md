// Simple JSON settings store
import 'dotenv/config'
import fs from 'fs'

// DATA_FILE se persistent disk par rakh sakte ho (misal Render)
const FILE = process.env.DATA_FILE || './data.json'
const def = { antilink: {}, welcome: {}, goodbye: {}, gclock: {}, adminlock: {}, antidelete: {}, antiviewonce: {}, chatbot: {}, sudo: [], blocked: [] }

let data = { ...def }
try {
  if (fs.existsSync(FILE)) data = { ...def, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) }
} catch (e) {
  // kharab file ko khali data se overwrite mat karo, sambhaal lo
  console.error('data file kharab hai, backup bana kar naya shuru:', e.message)
  try { fs.renameSync(FILE, `${FILE}.corrupt-${Date.now()}`) } catch {}
}

let timer = null
function writeNow () {
  timer = null
  try {
    // pehle temp file: likhte waqt crash ho to asal file kharab na ho
    fs.writeFileSync(FILE + '.tmp', JSON.stringify(data))
    fs.renameSync(FILE + '.tmp', FILE)
  } catch (e) { console.error('data save fail:', e.message) }
}
// busy groups mein bhi har 300ms mein save ho (timer reset nahi hota)
function save () { if (!timer) timer = setTimeout(writeNow, 300) }

export default {
  get: (k) => data[k],
  // per-chat toggle helpers
  on: (k, id) => { data[k] = data[k] || {}; data[k][id] = true; save() },
  off: (k, id) => { data[k] = data[k] || {}; delete data[k][id]; save() },
  is: (k, id) => !!(data[k] && data[k][id]),
  // per-key object (warns, coins, points...) — badlo phir save() karo
  obj: (k) => (data[k] ||= {}),
  // sudo users: web mode mein har bot ke apne
  sudoList: (cfg) => cfg?.multi ? ((data.sudoBy ||= {})[cfg.owner] ||= []) : (data.sudo ||= []),
  raw: data,
  file: FILE,
  save
}
