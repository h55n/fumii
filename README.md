# fumii

> *you're never really alone*

fumii is a Windows desktop AI companion — a persistent pixel art character that lives on your screen, listens when you need her, remembers who you are, and grows with you over time.

---

## What is this

A Phase 1 Electron + React + TypeScript application that:
- Places a pixel art sprite directly on your Windows desktop (transparent overlay, always-on-top)
- Opens a chat panel when you press `Ctrl+Shift+F` or click the sprite
- Has real streaming conversations via Mistral, OpenAI, Anthropic, or local Ollama
- Remembers you — your name, past conversations, your emotional patterns
- Shows a dashboard where you can see everything fumii knows

---

## Quick Start

```bash
# Prerequisites: Node 20+, npm

# Install dependencies
npm install

# Add your API key (Mistral recommended)
# Copy .env.example to .env (optional — key is set in the app Settings)

# Run in dev mode
npm run dev
```

The sprite window will appear in the bottom-right corner of your screen.

**Hotkeys:**
| Key | Action |
|-----|--------|
| `Ctrl+Shift+F` | Toggle chat |
| `Ctrl+Shift+D` | Open dashboard |
| `Ctrl+Shift+H` | Hide/show sprite |
| `Ctrl+Space` (hold) | Push-to-talk voice input |
| `Escape` | Close chat |

---

## Setting Up Your LLM

1. Open the dashboard (`Ctrl+Shift+D`) → Settings
2. Choose a provider (Mistral AI recommended)
3. Paste your API key — it's stored in your OS keychain, never in plain files
4. Set the model name (default is pre-filled)

**Recommended for best experience:**
- **Mistral** (`mistral-small-latest`) — fast, cheap, excellent for companion conversation
- **Ollama** (no API key needed) — fully local, private, works offline

**For Ollama:**
1. Install Ollama: https://ollama.ai
2. Run: `ollama pull qwen2.5:1.5b`
3. In Settings, choose Ollama + set model to `qwen2.5:1.5b`

---

## Building for Distribution

```bash
npm run build  # compile TypeScript + bundle React
npm run dist   # creates fumii-setup-1.0.0.exe in /release
```

Output: a single `.exe` installer, no admin required.

---

## Sprite Sheet

fumii uses a pixel art sprite sheet at `src/assets/sprites/fumii_sheet.png`.

The sheet is 8 columns × N rows, each frame 48×48px, arranged as:

| Row | State | Description |
|-----|-------|-------------|
| 0 | idle | slow blink, gentle bob |
| 1 | listening | attentive posture |
| 2 | thinking | head tilt |
| 3 | speaking | mouth movement |
| 4 | happy | bounce + big eyes |
| 5 | concerned | soft expression |
| 6 | sleepy | half-closed eyes |
| 7 | excited | faster + sparkle |
| 8 | waving | wave on startup |

**For the hackathon:** The app ships a placeholder silhouette renderer if no sprite sheet is present. To add a real sprite:
1. Create or download a suitable pixel art character (see `FUMII_DESIGN.md` for recommendations)
2. Arrange frames in the sheet format above
3. Save as `src/assets/sprites/fumii_sheet.png`

**Recommended free starting point:** [Hooded Protagonist by Penzilla](https://penzilla.itch.io/hooded-protagonist) — matches fumii's amber hoodie look. Free on itch.io.

---

## Architecture

```
fumii/
├── electron/          # Main process (Node.js context)
│   ├── main.ts        # Window management, tray, IPC
│   ├── preload.ts     # Secure bridge to renderers
│   ├── hotkey.ts      # Global hotkeys
│   ├── tray.ts        # System tray
│   └── ipc/           # IPC handlers for memory, LLM, settings
├── src/
│   ├── sprite/        # Sprite window (transparent overlay)
│   ├── chat/          # Chat overlay (slides up from sprite)
│   ├── dashboard/     # Dashboard app (5 pages)
│   ├── memory/        # SQLite-backed memory system
│   ├── llm/           # Swappable LLM provider layer
│   ├── voice/         # STT + TTS via Web Speech API
│   └── store/         # Zustand global state
└── public/            # HTML shells for both windows
```

Two Electron windows:
1. **Sprite window** — 280×220px, transparent, always-on-top, click-through when idle
2. **Dashboard window** — 1100×720px, standard window, hidden until opened

---

## Memory System

fumii uses three layers stored in SQLite (`~/.config/fumii/fumii.db` on Windows):

- **Core identity** — your name, patterns, key context (always loaded)
- **Episodic memory** — summarized conversation sessions with keyword tags (fetched by relevance)
- **Mood log** — rolling 7-day emotional state signals (loaded per conversation)

Privacy: everything stays local. Nothing is sent anywhere except the LLM API calls you configure.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| App shell | Electron 29 |
| UI | React 18 + TypeScript |
| State | Zustand |
| Sprite rendering | Canvas 2D API |
| Database | better-sqlite3 |
| LLM | Fetch API (streaming) |
| Voice in/out | Web Speech API |
| Secrets | keytar (OS keychain) |
| Build | electron-builder |
| Dev bundler | Vite + electron-vite |

---

## Phase 2 (Future)

Phase 2 adds a physical fumii device — palm-sized, with a tiny screen, microphone, speaker, and wheels. The Phase 1 desktop app is designed to receive it: add `HardwareBridge.ts` to sync memory and delegate heavy LLM calls from device → desktop.

---

*fumii — lowercase always.*
