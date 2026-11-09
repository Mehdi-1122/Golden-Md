// Translate: pehle Google, wo busy ho (429) to MyMemory ki free API
const UA = { 'user-agent': 'Mozilla/5.0' }

async function viaGoogle (text, lang) {
  const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(text)}`, { headers: UA })
  if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return null
  return (await r.json())[0].map(x => x[0]).join('')
}

async function viaMyMemory (text, lang) {
  const r = await fetch(`https://api.mymemory.translated.net/get?langpair=${encodeURIComponent('Autodetect|' + lang)}&q=${encodeURIComponent(text.slice(0, 500))}`, { headers: UA })
  if (!r.ok) return null
  const j = await r.json()
  return j.responseStatus === 200 ? j.responseData?.translatedText : null
}

export async function translate (text, lang) {
  const out = (await viaGoogle(text, lang).catch(() => null)) || (await viaMyMemory(text, lang).catch(() => null))
  if (!out) throw new Error('Translate abhi busy hai, thori der baad try karo.')
  return out
}
