// AI plus — photo samjho, photo se text (OCR), kahani, letter/application, naam ka matlab
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { askAI } from '../../lib/ai.js'
import { getQuoted, getType } from '../../lib/helpers.js'


// reply ki hui (ya caption wali) photo -> Claude image block
async function imageBlock (sock, msg) {
  const q = getQuoted(msg)
  const target = q?.message?.imageMessage ? q : msg
  if (getType(target) !== 'imageMessage') return null
  const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
  const type = target.message.imageMessage.mimetype?.split(';')[0] || 'image/jpeg'
  return { type: 'image', source: { type: 'base64', media_type: type, data: buf.toString('base64') } }
}

const visionCmd = (name, aliases, desc, ask, system) => ({
  name, aliases, category: 'ai', desc,
  async run ({ sock, msg, text, reply }) {
    try {
      const img = await imageBlock(sock, msg)
      if (!img) return reply(`Kisi photo ko reply kar ke .${name} likho`)
      await reply('🔍 Dekh raha hoon...')
      await reply(await askAI([img, { type: 'text', text: text || ask }], { system, max: 900 }))
    } catch (e) { await reply('⚠️ ' + e.message) }
  }
})

const textCmd = (name, aliases, desc, usage, system, max = 800) => ({
  name, aliases, category: 'ai', desc,
  async run ({ text, reply }) {
    if (!text) return reply(usage)
    try { await reply(await askAI(text, { system, max })) } catch (e) { await reply('⚠️ ' + e.message) }
  }
})

export default [
  visionCmd('imgai', ['whatisthis', 'photoai', 'describe'], 'Photo mein kya hai (AI)',
    'Is photo mein kya hai? Chhota sa bayan karo.',
    'User ki photo dekh kar usi zubaan mein jawab do jis mein sawal hai (default Roman Urdu). Chhota aur saaf jawab.'),
  visionCmd('ocr', ['totext', 'readtext'], 'Photo se text nikaalo',
    'Is photo mein jo bhi likha hai, bilkul waisa hi text nikaal do.',
    'Photo mein likha text hubahu (exact) nikaalo, lines aur tarteeb wahi rakho. Sirf text do, koi tabsira nahi. Agar koi text na ho to "Koi text nahi mila" likho.'),
  textCmd('story', ['kahani', 'kahaani'], 'Chhoti kahani (AI)',
    '.story <topic>   misal: .story ek imandar rickshaw wala',
    'Diye gaye topic par ek dilchasp chhoti kahani likho (150-250 alfaaz), Roman Urdu mein (agar user English mein likhe to English). Title *bold* mein, aakhir mein ek line ka sabaq.', 900),
  textCmd('letter', ['application', 'darkhwast'], 'Application / letter (AI)',
    '.letter <kis cheez ki>   misal: .letter school se 3 din chhutti, bukhar',
    'Diye gaye maqsad ke liye ek formal application/letter likho. Agar user Urdu/Roman Urdu mein likhe to bhi letter English mein likho (Pakistan mein yahi rivaaj hai) jab tak wo Urdu na maange. [Name], [Date] jaise placeholders rakho jo user ne nahi diye.', 900),
  textCmd('namemeaning', ['naam', 'nameinfo'], 'Naam ka matlab',
    '.namemeaning Ayesha',
    'Diye gaye naam ka matlab, zubaan ka asal (Arabi/Farsi/Urdu waghera), Urdu likhai, aur 1-2 mashhoor shakhsiyat jinka yahi naam ho — Roman Urdu mein, chhota. Agar pakka pata na ho to saaf kaho.', 400)
]
