// Shared registry — plugins aur engine dono yahan se import karte hain.
// (index.js se import karne par circular deadlock ho jata tha, is liye alag.)
import 'dotenv/config'

export const config = {
  name: process.env.BOT_NAME || 'Golden MD',
  prefix: process.env.PREFIX || '.',
  owner: (process.env.OWNER_NUMBER || '').replace(/\D/g, ''),
  pairing: (process.env.PAIRING_NUMBER || '').replace(/\D/g, ''),
  mode: process.env.MODE || 'public',
  start: Date.now()
}

export const commands = new Map()   // name/alias -> command
export const hooks = []             // har message par chalne wale passive hooks
export const groupHooks = []        // group join/leave par chalne wale hooks (plugin: export onGroup)
export const stats = { cmds: 0, by: {} }   // is run mein kitni commands chali
