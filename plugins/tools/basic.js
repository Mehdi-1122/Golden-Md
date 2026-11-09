// Search / info / utility tools
export default [
  { name: 'calc', aliases: ['calculate'], category: 'tools', desc: 'Hisaab: .calc 2+2*3',
    async run ({ text, reply }) {
      if (!/^[-+*/.()\d\s]+$/.test(text)) return reply('Sirf numbers aur + - * / ( )')
      try { await reply('🧮 ' + Function('"use strict";return (' + text + ')')()) }
      catch { await reply('Ghalat hisaab.') }
    } },
  { name: 'wa', aliases: ['wame'], category: 'tools', desc: 'wa.me link',
    async run ({ args, reply }) { const n = (args[0] || '').replace(/\D/g, ''); if (!n) return reply('Number dein.'); await reply('https://wa.me/' + n) } }
]
