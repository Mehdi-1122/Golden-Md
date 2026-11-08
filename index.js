// Single-session mode — ek number pe bot (QR ya pairing).
// Multi-user "mini bot" ke liye: npm run web  (server.js)
import 'dotenv/config'
import { startSession, loadPlugins } from './lib/session.js'
import { makeId } from './lib/sessionid.js'
import { config, commands, hooks } from './lib/core.js'

export { commands, hooks, config }  // tests/tools ke liye

let idShown = false

if (process.env.NO_CONNECT) {
  await loadPlugins()
} else {
  await startSession({
    dir: './session',
    owner: config.owner,
    sessionId: process.env.SESSION_ID || null,
    pairingNumber: config.pairing || null,
    printQR: !config.pairing && !process.env.SESSION_ID,
    onPair: (code, err) => {
      if (err) return console.error('Pairing code nahi mila:', err.message)
      console.log('\n🔗 Pairing code: ' + (code.match(/.{1,4}/g)?.join('-') || code) + '\n')
    },
    onOpen: () => {
      // SESSION_ID poore account ki chaabi hai: hosting logs mein na jaye, sirf terminal par ek dafa
      if (idShown || process.env.SESSION_ID) return
      if (!process.stdout.isTTY && process.env.PRINT_SESSION_ID !== '1') return
      idShown = true
      const id = makeId('./session')
      if (id) console.log('\n🔑 SESSION_ID (sambhaal lo — kisi bhi deploy ke SESSION_ID env mein daal sakte ho):\n' + id + '\n')
    }
  })
}
