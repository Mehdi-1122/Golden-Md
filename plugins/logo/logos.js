// Logo commands: .goldlogo Mehdi  (har style ki apni command)
import { renderLogo } from '../../lib/logo.js'

export const STYLES = {
  gold: { font: 'CinzelDecorative-Bold.ttf', bg: ['#1A1206', '#000000'], fill: ['#FFF6C0', '#B8860B'], stroke: '#3A2500', glow: '#FFB300', frame: '#FFD24A' },
  neon: { font: 'Monoton-Regular.ttf', bg: ['#05010F', '#160038'], fill: ['#FF7BF6', '#5CE1FF'], stroke: '#2A0050', glow: '#FF2BD6', grid: '#7B2CFF', strokeRatio: 0.012, glowSize: 22 },
  fire: { font: 'Anton-Regular.ttf', bg: ['#2A0500', '#000000'], fill: ['#FFE259', '#FF2200'], stroke: '#3A0A00', glow: '#FF4500', glowSize: 24 },
  ice: { font: 'Audiowide-Regular.ttf', bg: ['#00172B', '#00456F'], fill: ['#FFFFFF', '#66D9FF'], stroke: '#00314F', glow: '#33B5FF', stars: true },
  blood: { font: 'Creepster-Regular.ttf', bg: ['#000000', '#340000'], fill: ['#FF5A5A', '#D00000'], stroke: '#140000', glow: '#FF0000' },
  galaxy: { font: 'Righteous-Regular.ttf', bg: ['#0B0033', '#4A0080'], fill: ['#FFFFFF', '#C7A6FF'], stroke: '#1A0040', glow: '#9D4EDD', stars: true, glowSize: 22 },
  matrix: { font: 'PressStart2P-Regular.ttf', bg: ['#000000', '#002A0B'], fill: ['#B5FFC6', '#00C853'], stroke: '#001A07', glow: '#00FF66', grid: '#00FF66', strokeRatio: 0.02 },
  gamer: { font: 'BlackOpsOne-Regular.ttf', bg: ['#101820', '#0A2A43'], fill: ['#00FFD1', '#00A3FF'], stroke: '#00141F', glow: '#00E5FF', grid: '#00E5FF' },
  royal: { font: 'GreatVibes-Regular.ttf', upper: false, bg: ['#34104A', '#0F0216'], fill: ['#FFF6C0', '#D4A017'], stroke: '#1E0730', glow: '#D4A017', frame: '#D4A017', strokeRatio: 0.015 },
  graffiti: { font: 'SedgwickAveDisplay-Regular.ttf', upper: false, bg: ['#FF0080', '#7928CA'], fill: ['#FFFFFF', '#FFE600'], stroke: '#000000', glow: '#000000', strokeRatio: 0.05, glowSize: 10 },
  glitch: { font: 'RubikGlitch-Regular.ttf', bg: ['#0A0A0A', '#222222'], fill: ['#FFFFFF', '#BFFCFF'], stroke: '#000000', glow: '#00F0FF', strokeRatio: 0.012 },
  horror: { font: 'MetalMania-Regular.ttf', bg: ['#0D0D0D', '#2A2A2A'], fill: ['#FFFFFF', '#D01010'], stroke: '#000000', glow: '#900000' },
  retro: { font: 'Bungee-Regular.ttf', bg: ['#FF7E5F', '#6A0572'], fill: ['#FFF3B0', '#FF9F1C'], stroke: '#2B0A3D', glow: '#2B0A3D', strokeRatio: 0.045, glowSize: 8 },
  love: { font: 'Pacifico-Regular.ttf', upper: false, bg: ['#FF9A9E', '#D6336C'], fill: ['#FFFFFF', '#FFE3EC'], stroke: '#A61E4D', glow: '#FF4D88', strokeRatio: 0.025 },
  ocean: { font: 'Lobster-Regular.ttf', upper: false, bg: ['#006994', '#001F3F'], fill: ['#E0F7FA', '#4DD0E1'], stroke: '#00263F', glow: '#00B4D8' },
  samurai: { font: 'Shojumaru-Regular.ttf', bg: ['#1A1A1A', '#8A0000'], fill: ['#FFFFFF', '#FFD6D6'], stroke: '#000000', glow: '#FF1A1A', strokeRatio: 0.03 },
  comic: { font: 'Bangers-Regular.ttf', bg: ['#FFB000', '#FF5A00'], fill: ['#FFFFFF', '#FFF3B0'], stroke: '#000000', glow: '#000000', strokeRatio: 0.05, glowSize: 8 },
  steel: { font: 'BebasNeue-Regular.ttf', bg: ['#232526', '#515558'], fill: ['#FFFFFF', '#7B8794'], stroke: '#101214', glow: '#C0CCDA', frame: '#9AA5B1', glowSize: 10 },
  sunset: { font: 'Lobster-Regular.ttf', upper: false, bg: ['#F83600', '#7B2FF7'], fill: ['#FFF9C4', '#FFD166'], stroke: '#4A0E4E', glow: '#FF7A00' },
  toxic: { font: 'Creepster-Regular.ttf', bg: ['#0B1F00', '#000000'], fill: ['#D4FF3A', '#39B500'], stroke: '#0A1A00', glow: '#7CFF00', glowSize: 22 }
}

const MAX_NAME = 24

const logoCmd = (key, style) => ({
  name: key + 'logo', category: 'logo', desc: `${key} style logo`,
  async run ({ text, sock, from, msg, reply, config }) {
    const name = (text || '').replace(/\s+/g, ' ').trim()
    if (!name) return reply(`${config.prefix}${key}logo <apna naam>\nMisal: ${config.prefix}${key}logo Mehdi`)
    if (name.length > MAX_NAME) return reply(`Naam ${MAX_NAME} harf se chhota rakhein.`)
    if (!/^[\x20-\x7E]+$/.test(name)) return reply('Logo ke liye naam English harfon mein likhein.')
    await reply('🎨 Logo ban raha hai...')
    const image = await renderLogo(style, name)
    await sock.sendMessage(from, { image, caption: `✨ *${name}* — ${key} logo` }, { quoted: msg })
  }
})

export default [
  { name: 'logo', aliases: ['logos', 'logolist'], category: 'logo', desc: 'Saare logo styles',
    async run ({ reply, config }) {
      await reply(`🎨 *Logo Styles (${Object.keys(STYLES).length})*\n\n${Object.keys(STYLES).map(k => `✦ ${config.prefix}${k}logo <naam>`).join('\n')}\n\nMisal: ${config.prefix}goldlogo Mehdi`)
    } },
  ...Object.entries(STYLES).map(([k, s]) => logoCmd(k, s))
]
