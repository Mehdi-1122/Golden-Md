# Golden MD — Node + ffmpeg (sab platforms pe chalta hai)
FROM node:20-slim

# ffmpeg (stickers, .boost, downloaders ke liye zaroori) + yt-dlp (.ig .fb .pin)
RUN apt-get update && apt-get install -y ffmpeg python3 curl git && rm -rf /var/lib/apt/lists/*  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp  && chmod +x /usr/local/bin/yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

# Mini-bot (pairing website) ke liye: npm run web
# Single number bot ke liye niche wali line "npm start" kar do.
CMD ["npm", "run", "web"]
