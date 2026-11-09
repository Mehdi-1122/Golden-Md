# Golden MD — WhatsApp Bot (Baileys)

Plugin-based WhatsApp multi-device bot. Har command ek chhoti file hai, is liye
naye commands add karna bohot aasan — 350+ tak le ja sakte ho.

## 1. Zaruriyat
- Node.js 20+
- Ek **alag** WhatsApp number (apna main number mat use karo)
- Stickers ke liye **ffmpeg** installed hona chahiye
- (Optional) AI ke liye Anthropic API key
- (Optional) `.ig` `.fb` `.pin` ke liye **yt-dlp** (`pip install yt-dlp`)
- (Optional) `.cricket` ke liye free `CRICKET_API_KEY` (cricketdata.org)
- (Optional) `.removebg` ke liye free `REMOVEBG_API_KEY` (remove.bg/api)

## 2. Setup
```bash
npm install
cp .env.example .env
# .env ko edit karo: OWNER_NUMBER apna daalo
npm start
```

## 3. Login
- **QR:** `.env` mein `PAIRING_NUMBER` khali chhodo → terminal mein QR aayega →
  WhatsApp > Linked Devices > Link a Device se scan karo.
- **Pairing code:** `PAIRING_NUMBER` mein bot wala number likho → terminal pe
  8-digit code aayega → WhatsApp > Linked Devices > Link with phone number.

Login ke baad `session/` folder banega — **yeh kisi ko mat dena**, yeh tumhare
WhatsApp ki chaabi hai.

## 4. Commands ka system
Har plugin `plugins/` folder mein hai. Ek command aisa dikhta hai:
```js
export default [
  { name: 'hello', aliases: ['hi'], category: 'fun', desc: 'Salam',
    async run ({ reply }) { await reply('Salam!') } }
]
```
Options:
- `group: true`  → sirf group mein chale
- `admin: true`  → sirf group admin chalaye
- `owner: true`  → sirf bot owner chalaye

Commands category ke folders mein hain: `plugins/group`, `download`, `media`, `sticker`, `ai`, `islamic`,
`tools`, `text`, `games`, `fun`, `economy`, `general`, `owner`. Naya command banane ke liye sahi folder mein
nayi file daal do, `npm start` dobara. Folder ke andar import `../../lib/...` se hota hai.

## 5. Khaas features
- **`.gcss`** — kisi message/photo/video ko *reply* kar ke `.gcss` likho (ya text
  do) → wahi cheez bot ke **saare groups** pe chali jati hai.
- **`.setallname <naam>`** — jitne groups mein bot admin hai, sab ka naam ek saath set.
- **`.adminlock on`** — sirf bot owner admin bana/hata sakta hai; koi aur admin
  kisi ko promote/demote kare to bot change **wapas palat** deta hai aur us actor
  ko **khud bhi admin se hata** deta hai.
- **`.gclock on`** — us group mein sirf bot owner hi commands chala sake.
- **`.antidelete on`** — deleted messages wapas dikhaye. Group mein likho to us group ke liye; inbox mein owner likhe to saare inbox ke liye (wapas message owner ke "Message yourself" mein aata hai).
- **`.antiviewonce on`** — view-once media khol de.
- **`.antilink on`** — group mein WhatsApp links auto-delete.

### Naye commands
- **Islamic:** `.qibla` `.hijri` `.ramadan` `.kalma` `.azkar` `.namazalert <shehar>` (har namaz par group mein yaad)
- **Group:** `.warn` (3 par kick) `.unwarn` `.warns` `.antibadword` `.addbadword` `.antispam` `.tempclose 30m` `.poll` `.topactive` `.afk`
- **Download:** `.ig` `.fb` `.pin` `.lyrics` `.apk`
- **AI:** `.summary` `.fix` `.caption` `.cv` `.homework` (message ko reply kar ke bhi chalte hain)
- **Tools:** `.currency` `.gold` `.cricket` `.bill` `.password` `.age` `.countdown` `.zakat` `.bmi` `.wiki` `.github`
- **Games (points):** `.ttt` `.quiz` `.math` `.wordchain` `.leaderboard`
- **Economy:** `.daily` `.work` `.balance` `.give` `.rich` (sirf mazay ke coins)
- **Group plus:** `.rules` `.setrules` `.delrules` `.antifake` `.fakecode 92` `.inactive 30` `.kickinactive 30 confirm` `.autoreply hi = salam` `.delautoreply` `.autoreplylist`
- **Islamic plus:** `.tafseer 2:255` (Urdu, `en` = English) `.duaai` `.islamicquiz` `.jummah` `.jummahalert`
- **AI plus:** `.imgai` `.ocr` (photo reply) `.story` `.letter` `.namemeaning`
- **Media plus:** `.removebg` `.emojimix 😂+🔥` `.brat` `.blur` `.grayscale` `.circle` `.meme`
- **Owner plus:** `.backup` `.stats` `.autostatus` `.autotyping`

### Logo Maker
`.logo` se saare styles dekho. Misal: `.goldlogo Mehdi`, `.neonlogo Mehdi`, `.firelogo Golden King` (20 styles, naam English harfon mein).
Fonts `assets/fonts/` mein hain, har font ka license saath hai (SIL OFL).

### Aur commands
- **Group:** `.mute @user 10m` `.unmute` `.slowmode 30` `.antibot` `.groupstats`
- **Download:** `.spotify` `.twitter` `.threads` `.mediafire` `.gdrive`
- **Media:** `.tovideo` `.compress` `.crop square`
- **AI:** `.tts` (voice note) `.trv en salam`
- **Islamic:** `.randomayah` `.randomhadith` `.dailyislam` `.sehrialert Lahore` `.tasbih`
- **Games:** `.hangman` `.flagquiz` `.wordguess` `.guesssong`
- **Economy:** `.shop` `.buy` `.inventory` `.bank` `.deposit` `.withdraw` `.gamble` `.rank` `.toplevel` `.levelup`
- **Tools:** `.news` `.imdb` `.time Dubai` `.whois google.com` `.pdfadd` `.pdf`

### Welcome / Goodbye (apni marzi ka)
- `.setwelcome <message>` / `.setgoodbye <message>` — set karte hi ON ho jata hai
- Message mein ye lafz khud badal jate hain: `@user` (tag), `{group}`, `{count}`, `{desc}`, `{date}`, `{time}`
  misal: `.setwelcome Khush aamdeed @user! {group} mein aap {count}ve member ho 🌹`
- `.testwelcome` / `.testgoodbye` — dekho kaisa dikhega • `.resetwelcome` / `.resetgoodbye` — default
- `.welcomepic` — member ki profile photo ke saath bhejo • on/off: `.welcome` / `.goodbye`

### Group tools
- `.note wifi = 1234` (sirf admin save) → koi bhi `#wifi` likhe to note aa jata hai • `.notes` `.delnote`
- `.schedule 9pm <text>` / `.schedule 21:30 <text>` / `.schedule 30m <text>` (PK time) • `.schedules` `.delschedule 1`
- `.report <shikayat>` — admins ko private mein • `.tagadmins` — sirf admins ko tag
- `.vcf` — group ke saare numbers ki contact file

### On/Off buttons
Har on/off command (`.antilink` `.welcome` `.antibadword` `.chatbot` `.autostatus` waghera) ko **bina on/off ke**
likho → bot **✅ ON / ❌ OFF poll** bhejta hai. Admin (ya owner-only cmds mein owner) vote kare to setting
turant badal jati hai. Aam member ka vote nahi chalta. `.antilink on` jaisa likhna bhi chalta hai.
Bot restart ke baad purane poll kaam nahi karte — command dobara chalao.

Note: `.namazalert`, `.schedule` aur `.tempclose` ke timers bot restart par ruk jate hain; namaz alert aur schedule us group mein agle message ke baad khud dobara chalu ho jate hain.

## 6. Zaroori baatein (padho)
- Yeh WhatsApp ka **unofficial** tareeqa hai. Spam ya bohot tez bulk messages
  bhejne se number **ban** ho sakta hai. Naya number lo, kuch din normal chalao,
  phir bot lagao. `.bcgc` (sab groups ko announcement) soch samajh ke, apni hi
  communities ke liye use karo.
- **`.antidelete` aur `.antiviewonce`** doosron ke privacy choice (delete /
  view-once) ko tod'te hain. Group members ko bura lag sakta hai — zimmedari se
  use karo.
- Crash/bug/mass-report jaise features jaan-boojh ke nahi daale — wo ban aur
  (Pakistan mein PECA ke tehat) legal masla laate hain.

## 7. Mini-bot mode (users khud connect karein)
Agar tum chahte ho ke log apna number daal ke, pairing code se, apna WhatsApp
link karein aur bot khud chal jaye (jaise aaj kal ke mini bots):

```bash
npm run web        # server + pairing page: http://localhost:3000
```
- User page kholta hai → apna number daalta hai → 8-digit code aata hai.
- Code WhatsApp > Linked Devices > Link with phone number mein daalta hai.
- Bot us number pe khud chalna shuru — har user ka apna session `sessions/<number>/`.
- Server restart pe saare purane sessions khud resume ho jate hain.

⚠️ Is mode mein har user ki WhatsApp session **tumhare server** par hoti hai —
ye bhari zimmedari hai (sab ki chaabi tumhare paas). Trusted hosting + acha
server (RAM/net) chahiye, aur ek number ka galat use baaki pe asar daal sakta hai.

Website mode mein `.restart` aur `.backup` band hain, aur har user ke sudo users alag hain.
SESSION_ID sirf usi browser ko dikhti hai jis ne code liya, aur user ke apne WhatsApp par ek dafa jati hai.

## 8. SESSION_ID (apni deploy khud lagao)
User khud apni jagah (Render/VPS) pe deploy kar sake, bina baar baar scan kiye:

1. Pairing site (`npm run web`) pe number daal ke connect karo.
2. Site ek **chhoti SESSION_ID** dikha degi — jaise:
   `GMD~golden-md.onrender.com~0123456789abcdef0123456789abcdef`  (sirf ~60 characters)
   Ye user ke apne WhatsApp par bhi chali jati hai ("Message yourself").
3. Us SESSION_ID ko apni deploy ke `SESSION_ID` env mein daal do.
4. `npm start` → bot khud connect, dobara scan nahi.

Kaise: chhoti ID generator server ko point karti hai; deploy par bot usi server
se apni creds le leta hai. Isliye **generator server online rehna chahiye**, aur
uska URL `PUBLIC_URL` env mein set karo (taake WhatsApp par poori ID bheji ja sake).

SESSION_ID apni deploy par chalte hi website wala bot us number ke liye khud band ho jata hai,
kyunki ek hi session do jagah nahi chal sakti.

Chhoti ID ke muqable **lambi self-contained ID** bhi hai: single-mode (`npm start`)
`PRINT_SESSION_ID=1` lagane par connect hote hi terminal mein `GOLDEN~...` print karta hai
(koi server nahi chahiye, par 2000+ characters lambi). Security ke liye ye default band hai.
Jo chahiye use karo.
⚠️ SESSION_ID aapke WhatsApp ki chaabi hai — kisi ko mat do.

## 9. 24/7 hosting
Railway / Render / koi VPS pe daal do. `session/` (ya `sessions/`) folder persist
hona chahiye warna har deploy pe dobara login karna parega. Settings bhi bachani hon
to `DATA_FILE` ko persistent disk ke path par set karo.
