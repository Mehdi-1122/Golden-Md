# ⚙️ Golden MD Setup

[← Wapas](README.md)

## 🚀 Deploy

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

## 📱 Termux par (Android)

```bash
pkg update -y && pkg upgrade -y
pkg install -y nodejs-lts git ffmpeg
# downloads (.play .song .video) chahiyen to:  pkg install -y python && pip install -U yt-dlp
git clone https://github.com/Mehdi-1122/Golden-Md.git
cd Golden-Md
npm install
cp .env.example .env
nano .env        # OWNER_NUMBER aur (AI ke liye) ANTHROPIC_API_KEY bharo — save: Ctrl+X, Y, Enter
node index.js    # QR/pairing se link karo
```

Mini-bot website Termux par chalani ho to `npm run web` likho.

> **Repo private hai?** `git clone` login maangega. GitHub se ek **Personal Access Token** banao aur aise clone karo:
> `git clone https://<TOKEN>@github.com/Mehdi-1122/Golden-Md.git`

> Phone band/screen off par bot ruk sakta hai. Chalu rakhne ke liye Termux mein `termux-wake-lock` chalao, aur battery settings mein Termux ko "no restrictions" do.

<details>
<summary><b>🌐 Mini-bot website (log khud connect karein)</b></summary>

<br>

```bash
npm run web     # http://localhost:3000
```

User apna number daalta hai, phir **QR code ya pairing code** mein se jo chahe chun kar link karta hai, aur us ke number par bot chal jata hai. `PUBLIC_URL` set karne par use chhoti `GMD~` SESSION_ID bhi milti hai jo wo apni deploy par laga sakta hai.

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
| `AI_MODEL` | AI model ka naam (default `claude-haiku-5-5`) |
| `CHATBOT_MODEL` | Sirf chatbot ka model (khali = `claude-opus-5-5`; sasta: `claude-sonnet-5-5` / `claude-haiku-5-5`) |
| `CHATBOT_EFFORT` | Chatbot kitna soch kar jawab de: `low` / `medium` (default) / `high` |
| `CHATBOT_WEB` | `0` = chatbot internet search na kare |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` / `MISTRAL_API_KEY` | `.gpt` / `.gemini` / `.mistral` ke liye (khali = free AI) |
| `SELF_CHAT_PN` | `1` = "Message yourself" purane number wale address se (agar anti-delete/status messages na khulein) |
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

## 🙏 Credits

[Baileys](https://github.com/WhiskeySockets/Baileys) • [FFmpeg](https://ffmpeg.org) • [yt-dlp](https://github.com/yt-dlp/yt-dlp) • Fonts [Google Fonts](https://fonts.google.com) se, SIL Open Font License ke tehat
