<div align="center">

<img src="assets/readme/hero.svg" alt="Golden MD: WhatsApp multi-device bot, 292 commands" width="100%">

<img src="assets/readme/stats.svg" alt="292 commands, 20 logo styles, 16 categories, 1 command setup" width="100%">

<a href="#-termux-par-ek-command"><img src="assets/readme/btn-termux.svg" alt="Termux par chalao" width="48%"></a>
<a href="https://whatsapp.com/channel/0029VbE2Rbj0gcfMoVR1H642"><img src="assets/readme/btn-channel.svg" alt="WhatsApp Channel join karo" width="48%"></a>
<a href="https://github.com/Mehdi-1122/Golden-Md/stargazers"><img src="assets/readme/btn-star.svg" alt="GitHub par star do" width="48%"></a>
<a href="https://github.com/Mehdi-1122/Golden-Md/fork"><img src="assets/readme/btn-fork.svg" alt="Repo fork karo" width="48%"></a>

<img src="assets/readme/divider.svg" alt="" width="100%">

## ✨ Bot mein kya hai

<img src="assets/readme/features.svg" alt="Logo maker, group security, AI chatbot, Islamic tools, downloader, games aur coins, poll settings, mini-bot website" width="100%">

<br><br>

<img src="assets/logo-styles.jpg" alt="20 logo styles ki jhalak" width="100%">

<img src="assets/readme/divider.svg" alt="" width="100%">

## 📱 Termux par ek command

<img src="assets/readme/terminal.svg" alt="Command chalao, number likho, pairing code lo, bot connect" width="100%">

</div>

Yeh command Termux mein paste karo. Bot apna number poochega, sab khud install karega aur pairing code de dega:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Mehdi-1122/Golden-Md/main/install.sh)
```

1. Number likho, misal `03001234567`.
2. Terminal par `🔗 Pairing code` aayega.
3. WhatsApp kholo: **Linked Devices → Link a Device → Link with phone number instead**, aur code daal do.

Agli dafa chalane ke liye: `cd ~/Golden-Md && npm start`

> Termux par `sharp` library nahi banti, is liye sticker wali kuch commands shayad na chalein. Baqi bot chalta rahega.

<div align="center">

<img src="assets/readme/divider.svg" alt="" width="100%">

## 🚀 Ek click deploy

<a href="https://www.heroku.com/deploy?template=https://github.com/Mehdi-1122/Golden-Md"><img src="assets/readme/btn-heroku.svg" alt="Deploy on Heroku" width="48%"></a>
<a href="https://app.koyeb.com/deploy?type=git&builder=dockerfile&repository=github.com/Mehdi-1122/Golden-Md&branch=main&name=golden-md&dockerfile=Dockerfile&service_type=worker&command=npm&args=start&env[OWNER_NUMBER]=&env[PAIRING_NUMBER]=&env[MODE]=public"><img src="assets/readme/btn-koyeb.svg" alt="Deploy on Koyeb" width="48%"></a>
<a href="https://render.com/deploy?repo=https://github.com/Mehdi-1122/Golden-Md"><img src="assets/readme/btn-render.svg" alt="Deploy on Render" width="48%"></a>
<a href="#-vps-ya-pc-par"><img src="assets/readme/btn-vps.svg" alt="VPS ya PC par chalao" width="48%"></a>

</div>

**Heroku aur Koyeb:** `OWNER_NUMBER` aur `PAIRING_NUMBER` mein apna number likho (`923001234567`). Deploy ke baad app ke **Logs** mein pairing code aayega.

**Render:** yeh button mini-bot website chalata hai, aur persistent disk ke liye paid plan chahiye.

> Hosting restart par session mit sakti hai. Dobara pair karne se bachne ke liye `SESSION_ID` env mein daal do. Termux par `cd ~/Golden-Md && PRINT_SESSION_ID=1 npm start` se milti hai. Phir Termux wala bot band kar do, ek session do jagah nahi chalti.

> Data center ke IP ko YouTube block kar sakta hai. Aisa ho to hosting par gaane aur video download nahi chalenge, baqi bot chalta rahega.

## 💻 VPS ya PC par

Node.js 20+, ffmpeg aur [yt-dlp](https://github.com/yt-dlp/yt-dlp) zaroori hain.

```bash
git clone https://github.com/Mehdi-1122/Golden-Md.git
cd Golden-Md
npm install
cp .env.example .env     # OWNER_NUMBER apna likho
npm start
```

`PAIRING_NUMBER` khali ho to terminal par QR code aata hai, likha ho to pairing code.

<details>
<summary><b>🌐 Mini-bot website (log khud connect karein)</b></summary>

<br>

```bash
npm run web     # http://localhost:3000
```

User apna number daalta hai, pairing code se link karta hai, aur us ke number par bot chal jata hai. `PUBLIC_URL` set karne par use chhoti `GMD~` SESSION_ID bhi milti hai jo wo apni deploy par laga sakta hai.

> ⚠️ Is mode mein sab users ki WhatsApp sessions aap ke server par hoti hain. Sirf bharosemand server par chalao.

</details>

<details>
<summary><b>⚙️ Settings (.env)</b></summary>

<br>

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

</details>

<details>
<summary><b>🧩 Nayi command banao</b></summary>

<br>

`plugins/` ke andar sahi folder mein nayi file daalo aur bot dobara chalao:

```js
export default [
  { name: 'hello', aliases: ['hi'], category: 'fun', desc: 'Salam',
    async run ({ reply }) { await reply('Salam!') } }
]
```

Options: `group: true` (sirf group), `admin: true` (sirf admin), `owner: true` (sirf owner).

</details>

## ⚠️ Zaroori baatein

- Ye WhatsApp ka **unofficial** tareeqa hai. Spam ya bohot tez bulk messages se number **ban** ho sakta hai. Behtar hai alag number use karo.
- `.gcss` jaisi bulk commands sirf apni communities mein, soch samajh kar chalao.
- `.antidelete`, `.antiviewonce` aur `.vv` doosron ki privacy se juri hain. Zimmedari se use karo.
- `.env`, `session/`, `sessions/` aur SESSION_ID **kabhi share ya upload mat karo**, ye aap ke WhatsApp ki chaabi hain.

<div align="center">

<img src="assets/readme/divider.svg" alt="" width="100%">

[Baileys](https://github.com/WhiskeySockets/Baileys) • [FFmpeg](https://ffmpeg.org) • [yt-dlp](https://github.com/yt-dlp/yt-dlp) • Fonts [Google Fonts](https://fonts.google.com) se, SIL Open Font License ke tehat

**Pasand aaya to ⭐ zaroor do**

Made with 💛 by **Mehdi**

</div>
