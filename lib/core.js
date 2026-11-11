// Shared registry — plugins aur engine dono yahan se import karte hain.
// (index.js se import karne par circular deadlock ho jata tha, is liye alag.)
import 'dotenv/config'

// Termux khud PREFIX variable rakhta hai (/data/data/com.termux/files/usr) aur dotenv usay
// badalta nahi. Is liye BOT_PREFIX pehle, aur path jaisa PREFIX ignore.
function readPrefix () {
  const p = (process.env.BOT_PREFIX || process.env.PREFIX || '').trim()
  return p && p.length <= 3 && !p.includes('/') ? p : '.'
}

export const config = {
  name: process.env.BOT_NAME || 'Golden MD',
  prefix: readPrefix(),
  owner: (process.env.OWNER_NUMBER || '').replace(/\D/g, ''),
  pairing: (process.env.PAIRING_NUMBER || '').replace(/\D/g, ''),
  mode: process.env.MODE || 'public',
  start: Date.now()
}

export const commands = new Map()   // name/alias -> command
export const hooks = []             // har message par chalne wale passive hooks
export const groupHooks = []        // group join/leave par chalne wale hooks (plugin: export onGroup)
export const socketHooks = []       // har naye socket par ek dafa (plugin: export onSocket) — call events, timers
export const stats = { cmds: 0, by: {} }   // is run mein kitni commands chali
