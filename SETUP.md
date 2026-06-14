# fumii — Setup Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | https://nodejs.org |
| npm | 10+ | comes with Node |
| Git | any | https://git-scm.com |

For a local AI (no API key needed):
| Ollama | latest | https://ollama.ai |

---

## Step 1 — Install dependencies

```bash
cd fumii
npm install
```

This installs Electron, React, better-sqlite3, keytar, and all dev tools.
Native modules (better-sqlite3, keytar) are compiled for your Node version automatically.

---

## Step 2 — Add your LLM API key

**Option A — In the app (recommended)**
1. Run `npm run dev`
2. The sprite appears in the bottom-right corner
3. Press `Ctrl+Shift+D` to open the dashboard
4. Go to **Settings → fumii's brain**
5. Choose a provider and paste your API key
6. Click **save** — the key goes into your OS keychain

**Option B — Ollama (local, free, no account needed)**
1. Install Ollama: https://ollama.ai
2. `ollama pull qwen2.5:1.5b`  (small, fast, ~1GB)
3. In Settings, set provider = Ollama, model = `qwen2.5:1.5b`
4. No API key needed

---

## Step 3 — Talk to fumii

1. Press `Ctrl+Shift+F` — chat panel slides up
2. Type or hold `Ctrl+Space` to speak
3. Press `Escape` to close the panel

---

## Hotkeys

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+F` | Toggle chat panel |
| `Ctrl+Shift+D` | Open dashboard |
| `Ctrl+Shift+H` | Hide / show fumii |
| `Ctrl+Space` (hold) | Push-to-talk voice input |
| `Escape` | Close chat |
| `Enter` | Send message |
| `Shift+Enter` | New line in message |

---

## Adding a Sprite Sheet

The app works without a sprite sheet — it renders a placeholder amber circle with facial expressions.

To add a real pixel art sprite:

1. Get a sprite sheet (see README for recommendations)
2. Arrange frames in 8-column rows at 48×48px each:
   - Row 0: idle (blink loop)
   - Row 1: listening
   - Row 2: thinking
   - Row 3: speaking
   - Row 4: happy
   - Row 5: concerned
   - Row 6: sleepy
   - Row 7: excited
   - Row 8: waving
3. Export as PNG with transparency
4. Save to: `src/assets/sprites/fumii_sheet.png`
5. Restart the app

---

## Building the Installer

```bash
npm run build   # compile + bundle
npm run dist    # creates release/fumii-setup-1.0.0.exe
```

The installer is ~120–150MB and requires no admin privileges.

---

## Troubleshooting

**Sprite window is invisible**
- Make sure hardware acceleration flags are set (they are by default in `main.ts`)
- Try moving the window: right-click tray icon → Show fumii

**"Speech recognition not available"**
- Electron uses Chromium's speech API — it requires internet access for Google's STT service
- Use text input instead, or switch to Ollama which can run fully offline

**API key not working**
- Verify the key is for the selected provider
- Mistral keys start with... no specific format, just paste exactly as given
- Check Settings — the masked display (●●●●1234) confirms it's saved

**App crashes on startup**
- Check Node version: `node -v` — must be 20+
- Try: `npm rebuild` (re-compiles native modules)
- Check the log: Dev Tools → Console (press `Ctrl+Shift+I` in dev mode)

**Memory not persisting between sessions**
- The DB lives at: `C:\Users\<you>\AppData\Roaming\fumii\fumii.db`
- If the DB gets corrupted, you can delete it and it will be recreated fresh

---

## Where data lives

| Data | Location |
|------|----------|
| Conversations, mood, profile | `%APPDATA%\fumii\fumii.db` |
| API keys | Windows Credential Manager (via keytar) |
| Preferences | `%APPDATA%\fumii\fumii.db` → settings table |
| Logs (dev) | Electron DevTools console |

Everything is local. Nothing is synced or sent anywhere except your configured LLM API.
