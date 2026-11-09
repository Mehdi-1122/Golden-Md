// Logo engine: naam ko font se naap kar canvas par fit karta hai, phir ffmpeg se image banata hai.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import opentype from 'opentype.js'
import { tmp, clean, ff } from './media-tools.js'

const FONT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'fonts')
const W = 1024
const H = 576

const fonts = new Map()
function loadFont (file) {
  if (!fonts.has(file)) {
    const b = fs.readFileSync(path.join(FONT_DIR, file))
    fonts.set(file, opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)))
  }
  return fonts.get(file)
}

// ffmpeg filter ke andar path (Windows ka ":" escape)
const esc = (p) => p.replace(/\\/g, '/').replace(/:/g, '\\:')
const hex = (c) => c.replace('#', '0x')

// Lamba naam do lines mein, aur har naam canvas ke hisaab se sab se bara fit
function layout (font, text) {
  const words = text.split(/\s+/).filter(Boolean)
  let lines = [words.join(' ')]
  if (words.length > 1 && text.length > 12) {
    let best = Infinity
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ')
      const w = Math.max(a.length, b.length)
      if (w < best) { best = w; lines = [a, b] }
    }
  }
  const widest = Math.max(...lines.map(l => font.getAdvanceWidth(l, 100)))
  const size = Math.floor(Math.min((W * 0.82) / widest * 100, (H * 0.62) / (lines.length * 1.18), 230))
  const capRatio = (font.tables.os2?.sCapHeight || font.ascender * 0.72) / font.unitsPerEm
  const gap = size * 1.18
  const first = H / 2 - (lines.length - 1) * gap / 2 + capRatio * size / 2
  return { lines, size, baselines: lines.map((_, i) => Math.round(first + i * gap)) }
}

const gradient = (c0, c1, diagonal = true) =>
  `gradients=s=${W}x${H}:c0=${hex(c0)}:c1=${hex(c1)}:x0=0:y0=0:x1=${diagonal ? W : 0}:y1=${H}:nb_colors=2:speed=0.00001:r=1`

function background (s) {
  let g = `${gradient(s.bg[0], s.bg[1])},format=rgb24`
  if (s.grid) g += `,drawgrid=w=64:h=64:t=1:c=${hex(s.grid)}@0.28`
  g += ',vignette=PI/5'
  if (s.frame) g += `,drawbox=x=20:y=20:w=${W - 40}:h=${H - 40}:c=${hex(s.frame)}@0.85:t=4,drawbox=x=32:y=32:w=${W - 64}:h=${H - 64}:c=${hex(s.frame)}@0.45:t=1`
  if (s.stars) {
    for (let i = 0; i < 90; i++) {
      const size = Math.random() < 0.15 ? 3 : 2
      g += `,drawbox=x=${Math.floor(Math.random() * W)}:y=${Math.floor(Math.random() * H)}:w=${size}:h=${size}:c=white@${(0.4 + Math.random() * 0.6).toFixed(2)}:t=fill`
    }
  }
  return `${g}[bg]`
}

export async function renderLogo (style, name) {
  const font = loadFont(style.font)
  const text = style.upper === false ? name : name.toUpperCase()
  const { lines, size, baselines } = layout(font, text)
  const files = lines.map(() => tmp('txt'))
  const out = tmp('jpg')
  try {
    lines.forEach((l, i) => fs.writeFileSync(files[i], l))
    const fontPath = esc(path.join(FONT_DIR, style.font))
    const draw = (extra) => lines.map((_, i) =>
      `drawtext=fontfile='${fontPath}':textfile='${esc(files[i])}':expansion=none:fontsize=${size}:x=(w-text_w)/2:y=${baselines[i]}-ascent:${extra}`).join(',')
    const clear = `color=c=black@0.0:s=${W}x${H}:r=1,format=rgba`
    const sw = Math.max(2, Math.round(size * (style.strokeRatio ?? 0.035)))

    const graph = [
      background(style),
      `${clear},${draw(`fontcolor=${hex(style.glow)}:borderw=${sw * 2}:bordercolor=${hex(style.glow)}`)},gblur=sigma=${style.glowSize ?? 16}[glow]`,
      `${clear},${draw(`fontcolor=${hex(style.stroke)}:borderw=${sw}:bordercolor=${hex(style.stroke)}:shadowx=${Math.round(sw * 1.4)}:shadowy=${Math.round(sw * 1.4)}:shadowcolor=black@0.55`)}[stroke]`,
      `color=black:s=${W}x${H}:r=1,${draw('fontcolor=white')},format=gray[mask]`,
      `${gradient(style.fill[0], style.fill[1], false)},format=rgba[fill]`,
      '[fill][mask]alphamerge[txt]',
      '[glow]split[g1][g2]',
      '[bg][g1]overlay=format=auto[a]',
      '[a][g2]overlay=format=auto[a2]',
      '[a2][stroke]overlay=format=auto[b]',
      '[b][txt]overlay=format=auto,format=yuvj420p[out]'
    ].join(';')

    await ff(['-filter_complex', graph, '-map', '[out]', '-frames:v', '1', '-q:v', '2', out])
    return fs.readFileSync(out)
  } finally { clean(...files, out) }
}

// Rank card (.rank)
export async function renderRank ({ name, level, xp, need, position }) {
  const font = 'Righteous-Regular.ttf'
  const fontPath = esc(path.join(FONT_DIR, font))
  const safe = (name || '').replace(/[^\x20-\x7E]/g, '').trim() || 'Player'
  const shown = safe.length > 18 ? safe.slice(0, 18) : safe
  const bar = { x: 70, y: 400, w: W - 140, h: 44 }
  const fill = Math.max(8, Math.round(bar.w * Math.min(1, need ? xp / need : 0)))
  const rows = [
    { text: shown, size: Math.min(86, Math.floor((W * 0.8) / (loadFont(font).getAdvanceWidth(shown, 100)) * 100)), y: 130, color: '#FFFFFF' },
    { text: `LEVEL ${level}`, size: 64, y: 250, color: '#FFD24A' },
    { text: `RANK #${position}`, size: 44, y: 330, color: '#8BE9FD' },
    { text: `${xp} / ${need} XP`, size: 34, y: 465, color: '#E0E0E0' }
  ]
  const files = rows.map(() => tmp('txt'))
  const out = tmp('jpg')
  try {
    rows.forEach((r, i) => fs.writeFileSync(files[i], r.text))
    const texts = rows.map((r, i) => `drawtext=fontfile='${fontPath}':textfile='${esc(files[i])}':expansion=none:fontsize=${r.size}:x=70:y=${r.y}:fontcolor=${hex(r.color)}:shadowx=3:shadowy=3:shadowcolor=black@0.6`).join(',')
    const graph = `${gradient('#141E30', '#3A0CA3')},format=rgb24,vignette=PI/5,` +
      `drawbox=x=20:y=20:w=${W - 40}:h=${H - 40}:c=0xFFD24A@0.8:t=3,` +
      `drawbox=x=${bar.x}:y=${bar.y}:w=${bar.w}:h=${bar.h}:c=0xFFFFFF@0.18:t=fill,` +
      `drawbox=x=${bar.x}:y=${bar.y}:w=${fill}:h=${bar.h}:c=0xFFD24A:t=fill,${texts},format=yuvj420p[out]`
    await ff(['-filter_complex', graph, '-map', '[out]', '-frames:v', '1', '-q:v', '2', out])
    return fs.readFileSync(out)
  } finally { clean(...files, out) }
}
