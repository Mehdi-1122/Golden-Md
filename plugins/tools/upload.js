// .tourl — reply ki hui media (pic/video/audio/sticker) ko link bana do (catbox.moe, free)
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { getQuoted, getType } from '../../lib/helpers.js'

const EXT = { imageMessage: 'jpg', videoMessage: 'mp4', audioMessage: 'mp3', stickerMessage: 'webp', documentMessage: 'bin' }

export default [
  { name: 'tourl', aliases: ['url', 'upload', 'geturl'], category: 'tools',
    desc: 'Media → link (reply karke)',
    async run ({ sock, msg, reply }) {
      const q = getQuoted(msg)
      const target = q || msg
      const t = getType(target)
      if (!EXT[t]) return reply('Kisi image/video/audio/sticker pe reply kar ke .tourl likhein.')
      await reply('⬆️ Upload ho raha hai...')
      try {
        const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
        const fd = new FormData()
        fd.append('reqtype', 'fileupload')
        fd.append('fileToUpload', new Blob([buf]), 'file.' + EXT[t])
        const r = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: fd })
        const url = (await r.text()).trim()
        if (url.startsWith('http')) await reply('🔗 ' + url)
        else await reply('Upload nahi ho saka.')
      } catch (e) { await reply('⚠️ ' + e.message) }
    } }
]
