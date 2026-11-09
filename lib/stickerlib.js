// wa-sticker-formatter sirf zaroorat par load hoti hai. Is ki sharp library Termux/Android
// par aksar nahi chalti; tab sirf sticker commands band hon, poora bot nahi.
const FAIL = 'Sticker library is device par nahi chal rahi (sharp install nahi hua).'
let lib = null
let failed = false

export async function stickerLib () {
  if (lib) return lib
  if (failed) throw new Error(FAIL)
  try {
    const wsf = (await import('wa-sticker-formatter')).default
    lib = { Sticker: wsf.Sticker || wsf.default?.Sticker, StickerTypes: wsf.StickerTypes || wsf.default?.StickerTypes }
    return lib
  } catch (e) {
    failed = true
    console.error('sticker library load fail:', String(e.message).split('\n')[1] || e.message)
    throw new Error(FAIL)
  }
}
