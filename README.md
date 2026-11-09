<div align="center">

<img src="assets/banner.jpg" alt="Golden MD" width="100%">

# 👑 Golden MD

**WhatsApp multi-device bot — 292 commands, 20 logo styles, group security, Islamic tools aur bohot kuch.**

[![Commands](https://img.shields.io/badge/Commands-292-FFD24A?style=for-the-badge&logo=whatsapp&logoColor=white)](#-saari-commands)
[![Node](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Baileys](https://img.shields.io/badge/Baileys-6.7.24-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![Termux](https://img.shields.io/badge/Termux-Ready-000000?style=for-the-badge&logo=android&logoColor=white)](#-termux-par-chalao)

[![Stars](https://img.shields.io/github/stars/Mehdi-1122/Golden-Md?style=social)](https://github.com/Mehdi-1122/Golden-Md/stargazers)
[![Forks](https://img.shields.io/github/forks/Mehdi-1122/Golden-Md?style=social)](https://github.com/Mehdi-1122/Golden-Md/network/members)

[**📢 WhatsApp Channel**](https://whatsapp.com/channel/0029VbE2Rbj0gcfMoVR1H642) • [**🚀 Shuru karo**](#-termux-par-chalao) • [**📜 Commands**](#-saari-commands)

</div>

---

## ✨ Khaas baatein

| | |
|---|---|
| 🖌️ **Logo Maker** | Naam likho, 20 styles mein logo image pao (`.goldlogo Mehdi`) |
| 🛡️ **Group Security** | Antilink, anti-badword, anti-spam, anti-fake, anti-bot, warn system, slow mode, member mute |
| 🤖 **AI** | Sawal jawab, photo samjhna, OCR, voice note, aur baat samajh kar funny chatbot |
| 🕌 **Islamic** | Quran, tafseer, namaz alert, Qibla, sehri/iftar alert, roz ki ayat aur hadith |
| 📥 **Downloader** | YouTube, TikTok, Instagram, Facebook, Twitter/X, Pinterest, Spotify, MediaFire, Google Drive |
| 🎮 **Games + Economy** | Tic-tac-toe, quiz, hangman, guess the song, coins, shop, bank, level aur rank card |
| 🔘 **On/Off polls** | Har setting poll se badlo, sirf admin ka vote chalta hai |
| 🌐 **Mini-bot website** | Log apna number daal kar pairing code se bot chala sakte hain |

<div align="center">

### 🎨 Logo styles ki jhalak

<img src="assets/logo-styles.jpg" alt="Logo styles" width="100%">

</div>

## 📱 Termux par chalao

Apna number country code ke saath likho (`923001234567` ki jagah), phir poora paste karo:

```bash
termux-wake-lock
pkg update -y &&
pkg install -y git nodejs-lts ffmpeg python &&
(pip install yt-dlp || true) &&
cd ~ &&
git clone https://github.com/Mehdi-1122/Golden-Md.git &&
cd Golden-Md &&
npm install --omit=dev --ignore-scripts --no-audit --no-fund &&
printf '%s\n' 'BOT_PREFIX=.' 'OWNER_NUMBER=923001234567' 'PAIRING_NUMBER=923001234567' 'MODE=public' > .env &&
npm start
```

Terminal par `🔗 Pairing code` aayega. WhatsApp mein **Linked Devices → Link a Device → Link with phone number instead** par daal do.

Agli dafa chalane ke liye: `cd ~/Golden-Md && npm start`

> Termux par `sharp` library nahi banti, is liye sticker wali commands shayad na chalein. Baqi bot chalta rahega.

## 💻 PC ya VPS par chalao

Node.js 20+ aur ffmpeg zaroori hain. `.ig`, `.fb`, `.twitter` waghera ke liye [yt-dlp](https://github.com/yt-dlp/yt-dlp) bhi.

```bash
git clone https://github.com/Mehdi-1122/Golden-Md.git
cd Golden-Md
npm install
cp .env.example .env     # OWNER_NUMBER apna likho
npm start
```

`PAIRING_NUMBER` khali ho to terminal par QR code aata hai, likha ho to pairing code.

## 🌐 Mini-bot website (log khud connect karein)

```bash
npm run web     # http://localhost:3000
```

User apna number daalta hai, pairing code se link karta hai, aur us ke number par bot chal jata hai. `PUBLIC_URL` set karne par use chhoti `GMD~` SESSION_ID bhi milti hai jo wo apni deploy par laga sakta hai.

Docker aur Render ke liye `Dockerfile` aur `render.yaml` maujood hain. Render par persistent disk zaroori hai, warna restart par sessions mit jate hain.

> ⚠️ Is mode mein sab users ki WhatsApp sessions aap ke server par hoti hain. Sirf bharosemand server par chalao.

## ⚙️ Settings (`.env`)

| Naam | Kaam |
|---|---|
| `OWNER_NUMBER` | Bot owner ka number, country code ke saath |
| `PAIRING_NUMBER` | Pairing code login ke liye bot ka number (khali = QR) |
| `SESSION_ID` | Pehle se bani session (`GOLDEN~` ya `GMD~`) |
| `BOT_PREFIX` | Command ka nishan, default `.` |
| `BOT_NAME` | Bot ka naam |
| `MODE` | `public` ya `private` |
| `ANTHROPIC_API_KEY` | AI commands ke liye (chatbot bina key bhi chalta hai) |
| `AI_MODEL` | AI model ka naam |
| `CRICKET_API_KEY` | `.cricket` ke liye |
| `REMOVEBG_API_KEY` | `.removebg` ke liye |
| `YTDLP` | yt-dlp ka poora path, agar PATH par na ho |
| `PUBLIC_URL` | Mini-bot website ka public link |
| `DATA_FILE` | Settings file ki jagah (hosting ki persistent disk) |
| `PRINT_SESSION_ID` | `1` = SESSION_ID terminal par dikhao |
| `DEBUG` | `1` = har message ka haal terminal par |
| `STICKER_PACK`, `STICKER_AUTHOR` | Sticker ka naam |

## 📜 Saari commands

| | Category | Commands |
|---|---|---|
| 👥 | **Group** | 54 |
| 🛡️ | **Group Security** | 14 |
| 📥 | **Download** | 17 |
| 🎬 | **Media** | 19 |
| 🎨 | **Sticker** | 7 |
| 🖌️ | **Logo Maker** | 21 |
| 🤖 | **AI** | 17 |
| 🕌 | **Islamic** | 24 |
| 🛠️ | **Tools** | 27 |
| ✍️ | **Text Style** | 8 |
| 🔁 | **Converter** | 7 |
| 🎮 | **Games** | 14 |
| 😂 | **Fun** | 21 |
| 💰 | **Economy** | 15 |
| 🏠 | **General** | 9 |
| 👑 | **Owner** | 18 |
| | **Total** | **292** |

Har category par click karo:

<details>
<summary><b>👥 Group (54)</b></summary>

| Command | Kaam |
|---|---|
| `.setallname` | Sab groups ka naam set (jahan bot admin hai) |
| `.setalldesc` | Sab groups ki description set |
| `.gcss` | Reply ki hui cheez / text sab groups pe bhejo |
| `.rules` | Group ke rules |
| `.setrules` | Rules set (naye member ko khud jayenge) |
| `.delrules` | Rules hatao |
| `.inactive` | Jo N din se chup hain (.inactive 30) |
| `.kickinactive` | Chup members nikaalo (confirm ke saath) |
| `.autoreply` | Lafz par auto jawab (.autoreply hi = salam) |
| `.delautoreply` | Auto jawab hatao |
| `.autoreplylist` | Auto jawab ki list |
| `.gcinfo` | Group ki info |
| `.listadmin` | Admins ki list |
| `.del` | Reply kiya msg delete |
| `.tagall` | Sab ko tag |
| `.hidetag` | Bina @ sab ko msg |
| `.kick` | Member nikaalo |
| `.add` | Number add karo |
| `.promote` | Admin banao (sirf bot owner) |
| `.demote` | Admin hatao (sirf bot owner) |
| `.warn` | Warning do (3 par kick) |
| `.unwarn` | Warnings saaf |
| `.warns` | Kis ki kitni warnings |
| `.tempclose` | Kuch der group band (.tempclose 30m) |
| `.poll` | Poll banao (.poll Sawal \| A \| B) |
| `.topactive` | Sab se zyada messages kis ke |
| `.afk` | AFK set (koi tag kare to bata dega) |
| `.setppgc` | Group ki photo (image pe reply) |
| `.setname` | Group ka naam |
| `.setdesc` | Group description |
| `.close` | Sirf admin message |
| `.open` | Sab message karein |
| `.grouplink` | Invite link |
| `.revoke` | Link reset |
| `.mute` | Member mute (.mute @user 10m) ya poora group band |
| `.unmute` | Member unmute ya poora group khol do |
| `.slowmode` | Har banda N second mein ek message (.slowmode 30) |
| `.groupstats` | Group ka report card |
| `.note` | Note save/dekho (.note wifi = 1234) |
| `.notes` | Saare notes |
| `.delnote` | Note hatao |
| `.schedule` | Message waqt par bhejo (.schedule 9pm text) |
| `.schedules` | Scheduled messages ki list |
| `.delschedule` | Scheduled message hatao |
| `.report` | Admins ko private shikayat |
| `.tagadmins` | Sirf admins ko tag |
| `.vcf` | Sab members ke contacts (.vcf file) |
| `.setwelcome` | Apna welcome message |
| `.setgoodbye` | Apna goodbye message |
| `.resetwelcome` | Welcome default par wapas |
| `.resetgoodbye` | Goodbye default par wapas |
| `.testwelcome` | Welcome kaisa dikhega |
| `.testgoodbye` | Goodbye kaisa dikhega |
| `.welcomepic` | Welcome/goodbye mein member ki DP |

</details>

<details>
<summary><b>🛡️ Group Security (14)</b></summary>

| Command | Kaam |
|---|---|
| `.adminlock` | Sirf bot owner admin bana/hata sake |
| `.antifake` | Bahar ke numbers join par kick (.fakecode 92) |
| `.fakecode` | Antifake ke allowed country codes |
| `.antibadword` | Gaali wala msg delete + warn |
| `.addbadword` | Gaali list mein lafz daalo |
| `.delbadword` | Gaali list se lafz hatao |
| `.antispam` | Tez messages par warning |
| `.antilink` | Links auto-delete |
| `.welcome` | Welcome msg |
| `.goodbye` | Goodbye msg |
| `.antidelete` | Deleted msg wapas (group + inbox) |
| `.antiviewonce` | View-once open |
| `.gclock` | Sirf bot owner commands chalaye |
| `.antibot` | Doosre bots ke messages delete |

</details>

<details>
<summary><b>📥 Download (17)</b></summary>

| Command | Kaam |
|---|---|
| `.ig` | Instagram reel/video |
| `.fb` | Facebook video |
| `.twitter` | Twitter/X video |
| `.threads` | Threads video |
| `.pin` | Pinterest pin (link) ya search |
| `.mediafire` | MediaFire file (100MB tak) |
| `.gdrive` | Google Drive file (100MB tak, public) |
| `.lyrics` | Gaane ke lyrics |
| `.apk` | Android app (APK) — search, phir package se download |
| `.play` | Gaana naam se |
| `.ytmp3` | YouTube link → mp3 |
| `.ytmp4` | YouTube link → video (360p) |
| `.yts` | Naam se YouTube par dhoondo |
| `.vid` | Naam se video download |
| `.drama` | Drama/episode naam se (file) |
| `.spotify` | Spotify link ya naam se gaana |
| `.tiktok` | TikTok bina watermark |

</details>

<details>
<summary><b>🎬 Media (19)</b></summary>

| Command | Kaam |
|---|---|
| `.boost` | Voice/audio ki awaz loud karo (.boost 6) |
| `.bass` | Bass boost audio |
| `.slow` | Audio slow (reply) |
| `.fast` | Audio fast (reply) |
| `.nightcore` | Nightcore effect (reply) |
| `.deep` | Deep/heavy voice (reply) |
| `.reverb` | Echo effect (reply) |
| `.tomp3` | Video → mp3 (reply) |
| `.tovn` | Audio/video → voice note (reply) |
| `.togif` | Video → GIF (chhota, reply) |
| `.tovideo` | Sticker se video (reply) |
| `.compress` | Photo ya video ka size kam (reply) |
| `.crop` | Photo crop (.crop square / wide / story) |
| `.hd` | Image HD/clear (reply) |
| `.removebg` | Photo ka background hatao |
| `.blur` | Photo blur |
| `.grayscale` | Photo black & white |
| `.meme` | Random meme (.meme / .meme &lt;subreddit&gt;) |
| `.vv` | View-once media kholo (reply karke) |

</details>

<details>
<summary><b>🎨 Sticker (7)</b></summary>

| Command | Kaam |
|---|---|
| `.emojimix` | Do emoji mila kar sticker (.emojimix 😂+🔥) |
| `.brat` | Brat style text sticker |
| `.circle` | Gol sticker (photo) |
| `.sticker` | Image/video → sticker (apne naam ka) |
| `.take` | Sticker ka pack naam badlo |
| `.toimg` | Sticker → image |
| `.ttp` | Text → sticker |

</details>

<details>
<summary><b>🖌️ Logo Maker (21)</b></summary>

| Command | Kaam |
|---|---|
| `.logo` | Saare logo styles |
| `.goldlogo` | gold style logo |
| `.neonlogo` | neon style logo |
| `.firelogo` | fire style logo |
| `.icelogo` | ice style logo |
| `.bloodlogo` | blood style logo |
| `.galaxylogo` | galaxy style logo |
| `.matrixlogo` | matrix style logo |
| `.gamerlogo` | gamer style logo |
| `.royallogo` | royal style logo |
| `.graffitilogo` | graffiti style logo |
| `.glitchlogo` | glitch style logo |
| `.horrorlogo` | horror style logo |
| `.retrologo` | retro style logo |
| `.lovelogo` | love style logo |
| `.oceanlogo` | ocean style logo |
| `.samurailogo` | samurai style logo |
| `.comiclogo` | comic style logo |
| `.steellogo` | steel style logo |
| `.sunsetlogo` | sunset style logo |
| `.toxiclogo` | toxic style logo |

</details>

<details>
<summary><b>🤖 AI (17)</b></summary>

| Command | Kaam |
|---|---|
| `.ai` | AI se sawal |
| `.chatbot` | Funny chatbot on/off (is chat mein) |
| `.img` | AI se image banao |
| `.ssweb` | Website ka screenshot |
| `.shayari` | Shayari (AI ya built-in) |
| `.summary` | Lambe msg ka khulasa |
| `.fix` | Grammar/spelling theek karo |
| `.caption` | Insta/TikTok caption + hashtags |
| `.cv` | Chhota CV / profile bio |
| `.homework` | Sawal ka step-by-step hal |
| `.imgai` | Photo mein kya hai (AI) |
| `.ocr` | Photo se text nikaalo |
| `.story` | Chhoti kahani (AI) |
| `.letter` | Application / letter (AI) |
| `.namemeaning` | Naam ka matlab |
| `.tts` | Text se voice note (.tts en hello) |
| `.trvoice` | Translate + voice note (.trv en salam) |

</details>

<details>
<summary><b>🕌 Islamic (24)</b></summary>

| Command | Kaam |
|---|---|
| `.randomayah` | Koi bhi ayat tarjume ke saath |
| `.randomhadith` | Koi bhi hadith (Bukhari, English) |
| `.dailyislam` | Roz subah 8 baje ayat + hadith |
| `.sehrialert` | Ramzan mein sehri/iftar alert (.sehrialert Lahore) |
| `.tasbih` | Tasbih counter (.tasbih / .tasbih 33 / .tasbih reset) |
| `.tafseer` | Ayat ki tafseer (.tafseer 2:255 / en) |
| `.duaai` | Masle ke liye masnoon dua (AI) |
| `.islamicquiz` | Islamic quiz (+3 points) |
| `.jummah` | Jumma Mubarak + sunnatein |
| `.jummahalert` | Har Jumme subah 10 baje yaad |
| `.surahlist` | 114 surahon ki list |
| `.surah` | Koi bhi surah |
| `.ayah` | Ek ayat (jaise 2:255) |
| `.asma` | Allah ke 99 naam |
| `.namaz` | Namaz times (.namaz Lahore) |
| `.dua` | Masnoon dua |
| `.tasbeeh` | Tasbeehat |
| `.hadith` | Random hadith |
| `.qibla` | Qibla direction (.qibla Lahore) |
| `.hijri` | Aaj ki Islamic date |
| `.ramadan` | Sehri/iftar time + Ramzan countdown |
| `.kalma` | 6 Kalme (.kalma 1-6) |
| `.azkar` | Subah/shaam ke azkar |
| `.namazalert` | Har namaz ke waqt group mein yaad (.namazalert Lahore / off) |

</details>

<details>
<summary><b>🛠️ Tools (27)</b></summary>

| Command | Kaam |
|---|---|
| `.calc` | Hisaab: .calc 2+2*3 |
| `.wa` | wa.me link |
| `.news` | Taza khabrein (.news ya .news cricket) |
| `.imdb` | Film ya drama ki info |
| `.time` | Kisi shehar ka waqt (.time Dubai) |
| `.whois` | Domain ki maloomat (.whois google.com) |
| `.qr` | Text → QR code |
| `.weather` | Mausam (.weather Lahore) |
| `.translate` | Translate (.trt ur hello) |
| `.define` | Word ka matlab (English) |
| `.shorten` | URL chhota karo |
| `.currency` | Currency rate (.currency 100 usd pkr) |
| `.gold` | Sone/chandi ka rate (PKR) |
| `.cricket` | Live cricket score |
| `.bill` | Bijli/gas bill check link |
| `.password` | Strong password (.password 16) |
| `.age` | Umar (.age 2000-05-12) |
| `.countdown` | Eid/14 Aug/date tak kitne din |
| `.zakat` | Zakat hisaab (.zakat 500000) |
| `.bmi` | BMI (.bmi 70 175  = kg cm) |
| `.wiki` | Wikipedia khulasa |
| `.github` | GitHub profile info |
| `.pdfadd` | Photo PDF list mein daalo (reply) |
| `.pdf` | Photos se PDF (.pdf naam) |
| `.pdfclear` | PDF list khali karo |
| `.remind` | Yaad dilao: .remind 10m text |
| `.tourl` | Media → link (reply karke) |

</details>

<details>
<summary><b>✍️ Text Style (8)</b></summary>

| Command | Kaam |
|---|---|
| `.fancy` | Text ko bohot saare stylish fonts |
| `.mock` | sPoNgEbOb text |
| `.reverse` | Ulta text |
| `.upper` | CAPITAL |
| `.lower` | small |
| `.spaceout` | s p a c e |
| `.clap` | word👏by👏word |
| `.count` | Ginti |

</details>

<details>
<summary><b>🔁 Converter (7)</b></summary>

| Command | Kaam |
|---|---|
| `.base64` | Text → base64 |
| `.unbase64` | base64 → text |
| `.binary` | Text → binary |
| `.unbinary` | Binary → text |
| `.morse` | Text → morse |
| `.unmorse` | Morse → text |
| `.hash` | MD5 + SHA256 |

</details>

<details>
<summary><b>🎮 Games (14)</b></summary>

| Command | Kaam |
|---|---|
| `.ttt` | Tic-tac-toe (.ttt @user ya bot se) |
| `.quiz` | Pakistan GK quiz (+3 points) |
| `.math` | Tez hisaab game (+2 points) |
| `.wordchain` | Word chain game (+1 har lafz) |
| `.leaderboard` | Games ke points |
| `.rps` | Stone paper scissor |
| `.slot` | Slot machine |
| `.lottery` | Lucky number |
| `.pick` | Options mein se ek chuno |
| `.guess` | Bot ka number guess (1-5) |
| `.hangman` | Harf se lafz dhoondo (+5) |
| `.flagquiz` | Jhanda pehchano (+3) |
| `.wordguess` | Ulte harf se lafz banao (+3) |
| `.guesssong` | Gaana sun kar naam batao (+5) |

</details>

<details>
<summary><b>😂 Fun (21)</b></summary>

| Command | Kaam |
|---|---|
| `.joke` | Joke |
| `.quote` | Quote |
| `.fact` | Random fact |
| `.roll` | Dice |
| `.flip` | Coin |
| `.8ball` | Sawal ka jawab |
| `.rate` | Rate out of 100 |
| `.ship` | Love % |
| `.truth` | Truth sawal |
| `.dare` | Dare task |
| `.advice` | Random advice |
| `.quotes` | Motivational quote |
| `.catfact` | Billi ke baare mein fact |
| `.bored` | Bore ho? ye karo |
| `.trivia` | Trivia sawal (jawab 30 second baad) |
| `.wyr` | Would you rather |
| `.nhie` | Never have I ever |
| `.riddle` | Paheli (jawab 30 second baad) |
| `.pickup` | Pickup line |
| `.compliment` | Tareef |
| `.roast` | Halka roast (mazak) |

</details>

<details>
<summary><b>💰 Economy (15)</b></summary>

| Command | Kaam |
|---|---|
| `.daily` | Roz ke free coins |
| `.work` | Kaam karo, coins kamao (har ghante) |
| `.balance` | Coins check |
| `.give` | Coins do (.give @user 50) |
| `.rich` | Sab se ameer kaun |
| `.shop` | Dukaan ki list |
| `.buy` | Dukaan se khareedo (.buy chai) |
| `.inventory` | Tumhara saman |
| `.bank` | Bank balance |
| `.deposit` | Bank mein jama (.deposit 100 / all) |
| `.withdraw` | Bank se nikalo (.withdraw 100 / all) |
| `.gamble` | Coins ki baazi (.gamble 100 / all) |
| `.rank` | Level aur rank card |
| `.toplevel` | Sab se zyada level |
| `.levelup` | Level barhne par group mein elaan |

</details>

<details>
<summary><b>🏠 General (9)</b></summary>

| Command | Kaam |
|---|---|
| `.menu` | Saara menu |
| `.ping` | Speed check |
| `.alive` | Bot status |
| `.runtime` | Uptime |
| `.owner` | Owner info |
| `.botinfo` | Bot info |
| `.getpp` | Profile pic |
| `.jid` | Chat/user ka JID |
| `.getbio` | Kisi ki WhatsApp bio |

</details>

<details>
<summary><b>👑 Owner (18)</b></summary>

| Command | Kaam |
|---|---|
| `.mode` | public/private |
| `.setbio` | Bot number ki bio/about |
| `.setbotname` | Bot ka profile naam |
| `.block` | User block |
| `.unblock` | User unblock |
| `.join` | Group link se join |
| `.leave` | Group chhodo |
| `.gcantidel` | Anti-delete har jagah on/off |
| `.restart` | Bot restart |
| `.listgc` | Sab groups ki list |
| `.setpp` | Bot ki profile pic (SIRF asal owner) |
| `.backup` | data.json (settings/coins/warns) owner ko |
| `.stats` | Bot ke groups, users, commands |
| `.autostatus` | Sab ke status khud dekh lo |
| `.autotyping` | Command par "typing..." dikhao |
| `.addsudo` | Bot kisi aur ko share (max 5) |
| `.delsudo` | Sudo user hatao |
| `.listsudo` | Sudo users ki list |

</details>

## 🧩 Nayi command banao

`plugins/` ke andar sahi folder mein nayi file daalo aur bot dobara chalao:

```js
export default [
  { name: 'hello', aliases: ['hi'], category: 'fun', desc: 'Salam',
    async run ({ reply }) { await reply('Salam!') } }
]
```

Options: `group: true` (sirf group), `admin: true` (sirf admin), `owner: true` (sirf owner).

## ⚠️ Zaroori baatein

- Ye WhatsApp ka **unofficial** tareeqa hai. Spam ya bohot tez bulk messages se number **ban** ho sakta hai. Behtar hai alag number use karo.
- `.gcss` jaisi bulk commands sirf apni communities mein, soch samajh kar chalao.
- `.antidelete`, `.antiviewonce` aur `.vv` doosron ki privacy se juri hain. Zimmedari se use karo.
- `.env`, `session/`, `sessions/` aur SESSION_ID **kabhi share ya upload mat karo**, ye aap ke WhatsApp ki chaabi hain.

## 🙏 Credits

[Baileys](https://github.com/WhiskeySockets/Baileys) • [FFmpeg](https://ffmpeg.org) • [yt-dlp](https://github.com/yt-dlp/yt-dlp) • Fonts [Google Fonts](https://fonts.google.com) se, SIL Open Font License ke tehat (`assets/fonts/`)

<div align="center">

**Pasand aaya to ⭐ zaroor do**

Made with 💛 by **Mehdi**

</div>
