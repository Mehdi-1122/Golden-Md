// ffmpeg aur temp files ke chhote helpers
import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

export const tmp = (ext) => path.join(os.tmpdir(), `gmd_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`)
export const clean = (...files) => files.forEach(f => { try { fs.unlinkSync(f) } catch {} })

export const ff = (args) => new Promise((resolve, reject) => {
  const p = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args])
  let err = ''
  p.stderr.on('data', d => { if (err.length < 2000) err += d })
  p.on('close', c => c === 0 ? resolve() : reject(new Error('ffmpeg fail: ' + err.trim().split('\n').pop())))
  p.on('error', () => reject(new Error('ffmpeg install nahi hai')))
})
