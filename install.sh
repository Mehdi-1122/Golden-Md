#!/usr/bin/env bash
# Golden MD: Termux par ek command se install, pairing code aur bot start.
# Chalane ka tareeqa:
#   bash <(curl -fsSL https://raw.githubusercontent.com/Mehdi-1122/Golden-Md/main/install.sh)

GOLD='\033[1;33m'; GREEN='\033[1;32m'; RED='\033[1;31m'; OFF='\033[0m'
say () { printf "\n${GOLD}==> %s${OFF}\n" "$1"; }
die () { printf "\n${RED}✖ %s${OFF}\n" "$1"; exit 1; }

# 03001234567 aur +92 300 1234567 dono ko 923001234567 banao
normalize () {
  local n="${1//[^0-9]/}"
  case "$n" in
    00*) n="${n#00}" ;;
    03*) [ "${#n}" -eq 11 ] && n="92${n#0}" ;;
  esac
  printf '%s' "$n"
}

ask_number () {
  local n="$1"
  [ -n "$n" ] || { [ -t 0 ] || exec </dev/tty; }
  while :; do
    if [ -z "$n" ]; then
      printf "${GOLD}📱 Apna WhatsApp number likho (misal 03001234567): ${OFF}" >&2
      read -r n || die "Number nahi mila."
    fi
    n="$(normalize "$n")"
    if [ "${#n}" -ge 10 ] && [ "${#n}" -le 15 ]; then printf '%s' "$n"; return; fi
    printf "${RED}Number sahi nahi, dobara likho.${OFF}\n" >&2
    n=""
  done
}

write_env () {
  local number="$1" old=""
  [ -f .env ] || : > .env
  old="$(sed -n 's/^PAIRING_NUMBER=//p' .env | head -n 1)"
  # number badla to purana session is number ka nahi raha
  if [ -n "$old" ] && [ "$old" != "$number" ]; then rm -rf session; fi
  sed -i '/^SESSION_ID=/d;/^OWNER_NUMBER=/d;/^PAIRING_NUMBER=/d' .env
  grep -q '^BOT_PREFIX=' .env || printf '\nBOT_PREFIX=.' >> .env
  grep -q '^MODE=' .env || printf '\nMODE=public' >> .env
  printf '\nOWNER_NUMBER=%s\nPAIRING_NUMBER=%s\n' "$number" "$number" >> .env
}

main () {
  command -v pkg >/dev/null 2>&1 || die "Yeh script sirf Termux ke liye hai."

  printf "\n${GOLD}👑 GOLDEN MD INSTALLER 👑${OFF}\n\n"
  local number; number="$(ask_number "${1:-}")"
  printf "${GREEN}✔ Number: %s${OFF}\n" "$number"

  termux-wake-lock 2>/dev/null || true

  say "Zaroori packages install ho rahe hain (kuch minute lagenge)"
  pkg upgrade -y -o Dpkg::Options::=--force-confold </dev/null || die "pkg upgrade fail ho gaya."
  pkg install -y git nodejs-lts ffmpeg python </dev/null || die "Packages install nahi hue."
  pip install -U "yt-dlp[default]" </dev/null || pip install -U yt-dlp </dev/null \
    || printf "${RED}yt-dlp nahi laga, gaane aur video nahi chalenge.${OFF}\n"

  say "Bot ka code la rahe hain"
  cd "$HOME" || die "Home folder nahi mila."
  if [ -d Golden-Md/.git ]; then
    git -C Golden-Md pull --ff-only </dev/null || die "Code update nahi hua."
  else
    git clone --depth 1 https://github.com/Mehdi-1122/Golden-Md.git </dev/null || die "Code download nahi hua."
  fi
  cd Golden-Md || die "Golden-Md folder nahi mila."

  say "Bot ki libraries install ho rahi hain"
  npm install --omit=dev --ignore-scripts --no-audit --no-fund </dev/null || die "npm install fail ho gaya."

  write_env "$number"

  printf "\n${GREEN}✔ Sab tayyar hai. Ab Pairing code aayega.${OFF}\n"
  printf "WhatsApp: Linked Devices > Link a Device > Link with phone number instead\n\n"
  exec npm start
}

main "$@"
