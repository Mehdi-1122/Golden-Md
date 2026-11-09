// Search / info / utility tools
export default [
  { name: 'calc', aliases: ['calculate'], category: 'tools', desc: 'Hisaab: .calc 2+2*3',
    async run ({ text, reply }) {
      if (!/^[-+*/.()\d\s]+$/.test(text)) return reply('Sirf numbers aur + - * / ( )')
      try { await reply('🧮 ' + Function('"use strict";return (' + text + ')')()) }
      catch { await reply('Ghalat hisaab.') }
    } },
  { name: 'tts', category: 'tools', desc: 'Text to speech link',
    async run ({ text, reply }) {
      if (!text) return reply('.tts <text>')
      await reply('🔊 https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ur&q=' + encodeURIComponent(text))
    } },
  { name: 'wa', aliases: ['wame'], category: 'tools', desc: 'wa.me link',
    async run ({ args, reply }) { const n = (args[0] || '').replace(/\D/g, ''); if (!n) return reply('Number dein.'); await reply('https://wa.me/' + n) } }
]
