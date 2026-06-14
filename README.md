# fumii
### *you're never really alone*

> A pixel art AI companion that lives on your Windows desktop — warm, present, and persistent. fumii listens, remembers, and grows with you. Not a chatbot. Not a voice assistant. A friend.

---

## Table of Contents

- [What fumii Is](#what-fumii-is)
- [The Mission](#the-mission)
- [How It Feels](#how-it-feels)
- [Architecture Overview](#architecture-overview)
- [Two Windows, One App](#two-windows-one-app)
  - [The Sprite Window](#the-sprite-window)
  - [The Dashboard Window](#the-dashboard-window)
- [How a Conversation Works](#how-a-conversation-works)
- [The Memory System](#the-memory-system)
- [The LLM Layer](#the-llm-layer)
- [Sprite Animation System](#sprite-animation-system)
- [Voice — In and Out](#voice--in-and-out)
- [Security Model](#security-model)
- [Data Model](#data-model)
- [Project Structure](#project-structure)
- [Design System](#design-system)
- [Getting Started](#getting-started)
- [Build and Distribution](#build-and-distribution)
- [Performance Targets](#performance-targets)
- [Phase Roadmap](#phase-roadmap)
- [What fumii Is Not](#what-fumii-is-not)

---

## What fumii Is

fumii is a Windows desktop application that places a small animated pixel art character directly on your screen. She sits quietly in the corner, animates naturally, and opens into a full conversation interface when you need someone to talk to.

She is built on three ideas most AI products ignore:

**Presence.** fumii is always there — visible on your desktop, not buried in an app or a tab. You don't open her; she's already open. This is the difference between a friend who lives with you and a service you call.

**Memory.** fumii remembers you across sessions — not through transcript replay, but through a layered, human-feeling memory system. She knows your name, your current context, your mood patterns. She references past conversations naturally, without announcing that she's doing it.

**Character.** fumii has a voice that is distinct and consistent. Short. Warm. Direct. She talks like a friend texting you — not like a support bot reading a script.

---

## The Mission

People who work or study alone often feel the quiet absence of ambient human presence — not loneliness exactly, but the particular flatness of a day that contained no one. The phone exists, but opening it means distraction. Voice assistants answer questions but have no memory of who you are. They don't notice if you've been quiet.

fumii fills a gap no product currently fills: **a persistent, warm, physically present companion that actually knows you.**

She is not a productivity tool. She doesn't track your tasks or optimize your calendar. She talks to you, remembers you, and makes the hours you spend alone feel a little less empty.

---

## How It Feels

fumii's voice, in practice:

> *"hey, you doing okay? you've been quiet"*
> *"that sounds really hard actually"*
> *"you got through the exam thing, you'll get through this too"*
> *"i remember you mentioned that friend — the one from college?"*

fumii never sounds like:

> *"I understand your emotional state and I am here to support you."*
> *"As an AI, I want to help you with your feelings."*
> *"Great question! Here are 5 ways to cope with stress:"*

The system prompt enforces this strictly. Short sentences. Lowercase. Direct. Warm. She uses your name occasionally — not every message, only when it feels natural. She acknowledges first, helps second (or not at all — sometimes acknowledging is enough).

---

## Architecture Overview

fumii is built with **Electron 29 + React 18 + TypeScript 5**, targeting Windows 10/11 x64.

The architecture is split across two OS processes:

```
┌──────────────────────────────────────────────────────────────┐
│  MAIN PROCESS (Node.js)                                      │
│                                                              │
│  Window management · SQLite · LLM API calls · OS keychain   │
│  IPC handlers · Global hotkeys · System tray                 │
└──────────────────────┬───────────────────────────────────────┘
                       │  contextBridge (preload.ts)
          ┌────────────┴────────────┐
          │                         │
┌─────────▼──────────┐   ┌──────────▼──────────┐
│  RENDERER 1        │   │  RENDERER 2          │
│  Sprite Window     │   │  Dashboard Window    │
│                    │   │                      │
│  Canvas 2D sprite  │   │  Memory log          │
│  Chat overlay      │   │  Mood timeline       │
│  Voice I/O         │   │  Conversations       │
│  Zustand stores    │   │  Settings            │
└────────────────────┘   └──────────────────────┘
```

**The process boundary is the most important architectural rule.** SQLite, LLM API calls, and API key access live exclusively in the main process. The renderer never touches the database or the network directly. All communication goes through the IPC bridge.

---

## Two Windows, One App

### The Sprite Window

The sprite window is fumii's face. It's always running.

- **Transparent, frameless, always-on-top** — 280×220px at rest
- **Click-through by default** — fumii never blocks other apps. The window uses `setIgnoreMouseEvents(true, { forward: true })` so it passes all clicks through to whatever is behind it
- **Hover detection via IPC** — forwarded pointer events still reach the renderer. When the renderer detects the cursor over the sprite element, it sends a `sprite:hover` IPC to main, which calls `setIgnoreMouseEvents(false)` making the window interactive. On `mouseleave` it reverts
- **Expands to 280×700px** when the chat overlay opens — the window resizes upward via `setBounds()`, animated

The sprite window hosts two visual layers:

1. **SceneBackground** — fumii's room. A 280×220px static PNG scene (a tiny desk at night) with CSS animations layered on top: drifting rain on the window, a pulsing amber desk lamp glow, faint stars. Zero GPU. Zero CPU at idle. All CSS.

2. **FumiiSprite** — the animated character. A Canvas 2D renderer drawing frames from a 48×48px sprite sheet at the correct FPS per animation state. `imageSmoothingEnabled` is always `false` — pixel art must never be blurred.

### The Dashboard Window

The dashboard is fumii's memory room. It opens on demand via `Ctrl+Shift+D` or the tray menu.

- **1100×720px**, frameless, hidden by default (`show: false`)
- **Never destroyed** — the `close` event is intercepted and replaced with `hide()`. This means re-opening is instant with no reload cost
- **Custom titlebar** — a React `TitleBar` component with minimize, maximize/restore, and close buttons communicating to main via IPC

Dashboard pages:

| Page | What it shows |
|---|---|
| **Home / Today** | fumii's mood read for the last 24h, a quick message bar to start a conversation, today's conversation summary, running streak |
| **Memory** | Grid of episodic memory cards — summary, mood pill, keyword tags, date. Keyword search filters live |
| **Mood Timeline** | 7-day mood bar at top. Area chart of mood signals as numeric values below |
| **Conversations** | Scrollable list of past sessions with date, turn count, dominant mood, first message preview. Click to read the full transcript |
| **Settings** | Profile, LLM provider + model, appearance, privacy. API key field shows `●●●●●●●● (saved)` — never the actual key |

---

## How a Conversation Works

```
1. User presses Ctrl+Shift+F
   → main sends 'chat:toggle' to sprite window renderer
   → ChatOverlay mounts and slides up
   → window.fumii.openChat() → main resizes window upward to 700px

2. User types (or holds Ctrl+Space for push-to-talk)
   → chatStore.addMessage({ role: 'user', content })

3. Renderer calls window.fumii.streamMessage(messages, onToken, onDone, onError)
   → IPC: 'llm:stream' arrives in main process
   → PromptBuilder assembles: CoreIdentity + relevant episodes + 7-day mood window + conversation history
   → LLMClient.stream() begins — AsyncGenerator<string>
   → Each token: spriteWindow.webContents.send(channel, token)

4. onToken fires in renderer
   → chatStore.appendStreamToken(token) → ChatHistory re-renders live

5. onDone fires
   → TTS.speak(fullResponse) — Web Speech API
   → EmotionState.detect(response) → appStore.setSpriteState() → sprite changes animation
   → IPC: 'memory:observeTurn' → EpisodicLogger updates today's mood_log row

6. After 30s inactivity or Escape
   → window.fumii.closeChat() → main shrinks window to 220px
   → If conversation ≥ 6 turns: IPC 'memory:summarize' → EpisodicLogger calls LLM
     → writes episode row (summary + tags + mood_signal) to SQLite
```

The LLM never sees a raw "please respond to this" prompt. Every request goes through `PromptBuilder`, which assembles a rich context block from memory before passing it to the provider. This is why fumii can reference things from past sessions naturally — the relevant memory is already in the prompt.

---

## The Memory System

fumii's memory is built around one insight: **you don't need to remember everything to feel like you remember someone.** You need to remember the right things.

The system has three layers:

### Layer 1 — Core Identity (~500 tokens, always present)

The first time you use fumii, she builds a profile: your name, age range, current life context ("working on my startup," "preparing for boards"), the people you mention, your mood baseline. This is stored in the `core_identity` table and loaded with every single prompt — it's never fetched dynamically, it's always there.

### Layer 2 — Episodic Memory (fetched by relevance, not time)

After any conversation of 6+ turns, the EpisodicLogger calls the LLM with a summary prompt and gets back structured JSON: a 2–3 sentence summary, 3–5 keyword tags, and a dominant mood signal. This is stored as an `episode` row.

When a new conversation begins, `MemoryRetriever` extracts meaningful keywords from the user's message, strips stop words, and runs parameterized `LIKE` queries against the tags column. The top 3 matching episodes are pulled and injected into the prompt. If you say "that friend I told you about," fumii searches for "friend" tags and pulls only that thread — not your full history.

This is the mechanism that makes fumii feel like she remembers you without actually storing or replaying transcripts.

### Layer 3 — Mood Window (rolling 7-day signal)

After every assistant turn, `EpisodicLogger.observeTurn()` runs a simple regex-based mood detection on the conversation text and upserts a row into `mood_log` for today's date: `stressed | happy | tired | neutral | excited`. The last 7 days of mood signals are injected into every prompt as a plain text summary: `"Monday: stressed. Tuesday: neutral. Wednesday: happy."`

fumii uses this to calibrate tone without you re-explaining yourself each time.

### What the memory system is not

There is no vector database. There is no embedding model. There are no cosine similarity searches. SQLite with parameterized `LIKE` queries on a keyword tags column is fast, private, and sufficient for the kind of episodic recall a companion needs. The design deliberately avoids complexity that would compromise startup time, RAM usage, or offline operation.

---

## The LLM Layer

fumii's LLM layer is fully swappable. The interface is minimal:

```typescript
interface LLMProvider {
  stream(messages: Message[]): AsyncGenerator<string>;
  complete(messages: Message[]): Promise<string>;
}
```

All providers live behind this interface. The factory selects the right one based on the settings table:

| Provider | Default model | Notes |
|---|---|---|
| **Mistral** | `mistral-small-latest` | Default — cheapest, fastest for companion conversation |
| **OpenAI** | `gpt-4o-mini` | Well-tested, widely available |
| **Anthropic** | `claude-haiku-4-5` | Fast, high quality |
| **Ollama** | `qwen2.5:1.5b` | Fully local, no API key, no network required |

All API calls happen in the main process via `ipcMain.on('llm:stream')`. The renderer never makes a network request. API keys are stored in the OS keychain via `keytar` — they never touch SQLite, never appear in IPC payloads, and never reach the renderer under any circumstances.

Streaming tokens are forwarded from main to the sprite renderer via a per-request channel name (`llm:token:{timestamp}`), so multiple streams could technically run without collision. A cancel map (`activeStreams`) allows in-flight requests to be aborted.

The `complete()` path (non-streaming) is used only for episodic summarization — a background operation that runs after a conversation ends.

---

## Sprite Animation System

fumii's sprite is a single PNG sheet: **8 columns × 9 rows**, each frame **48×48px**. The canvas renders at **120×120px** (2.5x scale) with `imageSmoothingEnabled = false` to preserve crisp pixel art edges.

There are 9 animation states, each with a defined frame sequence and FPS:

| State | FPS | Trigger |
|---|---|---|
| `idle` | 4 | Default — no conversation active |
| `listening` | 6 | Chat open, user typing or paused |
| `thinking` | 7 | LLM is processing |
| `speaking` | 9 | Response is streaming |
| `happy` | 11 | Positive sentiment in response |
| `concerned` | 3 | Stress or negative sentiment detected |
| `sleepy` | 2 | 2+ hours of no interaction |
| `excited` | 12 | User shares good news |
| `waving` | 8 | App launch or user returns after absence |

The animation loop is a single `requestAnimationFrame` that never restarts. State changes update a `stateRef` in-place; the loop reads from the ref on every tick. This avoids creating and destroying RAF loops on state changes, which would cause visible frame tears.

State detection runs on the completed LLM response via simple keyword pattern matching — no sentiment model needed. `"hard"`, `"sorry"`, `"tough"` → `concerned`. `"wow"`, `"incredible"` → `excited`. And so on. This is intentionally simple — the goal is plausible animation, not perfect classification.

---

## Voice — In and Out

Voice is handled entirely in the renderer process using the Web Speech API. No external service. No API key. No network.

**Speech-to-text (STT)** uses the `SpeechRecognition` API. Push-to-talk is activated by holding `Ctrl+Space` in the chat overlay. This is explicitly **not** a global hotkey — it would be unacceptable for fumii to intercept `Ctrl+Space` from every other app on the system.

**Text-to-speech (TTS)** uses `SpeechSynthesis`. On Windows, fumii prefers the Zira voice (the default Windows female voice). Voice loading is asynchronous — the `voiceschanged` event is used with `{ once: true }` to avoid race conditions. Any in-progress speech is cancelled before a new utterance starts to prevent queue buildup.

Phase 2 upgrade path: replace the Web Speech API TTS with Piper (local neural TTS) or ElevenLabs for a warmer, more distinctive voice. The interface is clean enough that this is a drop-in replacement.

---

## Security Model

Security decisions are not optional or deferrable. Every window uses the same hardened configuration:

```
contextIsolation: true    — renderers cannot access Node.js internals
nodeIntegration: false    — no require() in the renderer ever
sandbox: true             — OS-level privilege reduction
webSecurity: true         — no cross-origin bypasses
```

The `preload.ts` script is the only bridge between renderer and main. It exposes a `window.fumii` object via `contextBridge.exposeInMainWorld()`. Every capability the renderer has — sending messages, reading memory, accessing settings — goes through this bridge. Nothing else.

**API keys** are stored exclusively in the OS keychain via `keytar`. They are read in the main process at request time and passed directly to the LLM provider. They do not appear in:
- The SQLite database
- Any IPC payload
- Any Zustand store
- Any renderer context

The settings panel's API key field sends the key to main via `settings:set` IPC, which calls `keytar.setPassword()` and returns. The renderer immediately forgets it. On load, the settings panel calls `settings:getApiKey` which returns only a boolean (`true` if a key exists) — never the actual key value.

The "Clear all memory" action shows a native dialog in the main process before executing. The renderer cannot bypass this confirmation.

---

## Data Model

All data is stored locally in a SQLite database at `%APPDATA%/fumii/fumii.db`. WAL mode is enabled for read performance. Foreign keys are enforced.

```sql
-- The user's persistent profile — always one row (id = 1)
core_identity (id, name, age_hint, mood_baseline, key_context, created_at, updated_at)

-- Summarized conversation memories — the episodic layer
episodes (id, summary, tags, mood_signal, turn_count, created_at)

-- Daily mood signals — one row per day, upserted after each conversation turn
mood_log (id, date UNIQUE, signal, source)

-- Full conversation transcripts (optional — controlled by save_transcripts setting)
transcripts (id, episode_id → episodes, role, content, created_at)

-- Key-value settings store (everything except API keys)
settings (key PRIMARY KEY, value)
```

Default settings seeded on first run:

| Key | Default |
|---|---|
| `llm_provider` | `mistral` |
| `llm_model` | `mistral-small-latest` |
| `sprite_position` | `bottom-right` |
| `sprite_scale` | `1.0` |
| `voice_enabled` | `true` |
| `tts_enabled` | `true` |
| `save_transcripts` | `true` |
| `hotkey_chat` | `CommandOrControl+Shift+F` |

---

## Project Structure

```
fumii/
├── electron/
│   ├── main.ts                    # Main process — window management, IPC, tray
│   ├── preload.ts                 # contextBridge — the only renderer/main bridge
│   ├── hotkey.ts                  # Global hotkey registration + cleanup
│   ├── tray.ts                    # System tray icon + context menu
│   └── ipc/
│       ├── memoryHandlers.ts      # IPC: SQLite memory operations
│       ├── llmHandlers.ts         # IPC: LLM streaming (API keys stay here)
│       └── settingsHandlers.ts    # IPC: settings read/write + keytar
│
├── src/
│   ├── sprite/
│   │   ├── SpriteWindow.tsx       # Root renderer for the sprite window
│   │   ├── FumiiSprite.tsx        # Canvas 2D animated sprite
│   │   ├── SceneBackground.tsx    # Night desk scene (CSS + static PNG)
│   │   └── EmotionState.ts        # Response text → animation state mapping
│   │
│   ├── chat/
│   │   ├── ChatOverlay.tsx        # Chat panel, layered inside the sprite window
│   │   ├── ChatBubble.tsx         # Single message bubble
│   │   ├── ChatInput.tsx          # Text input + push-to-talk button
│   │   ├── ChatHistory.tsx        # Scrollable message list, fade-masked at top
│   │   └── TypingIndicator.tsx    # 3-dot amber pulse while LLM streams
│   │
│   ├── dashboard/
│   │   ├── DashboardApp.tsx       # Root renderer for the dashboard window
│   │   ├── Sidebar.tsx            # Navigation: Home, Memory, Mood, Conversations, Settings
│   │   ├── TitleBar.tsx           # Custom frameless titlebar
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Memory.tsx
│   │   │   ├── MoodTimeline.tsx
│   │   │   ├── Conversations.tsx
│   │   │   └── Settings.tsx
│   │   └── components/
│   │       ├── MemoryCard.tsx
│   │       ├── MoodPill.tsx
│   │       ├── TranscriptView.tsx
│   │       ├── TagChip.tsx
│   │       └── MoodChart.tsx
│   │
│   ├── memory/
│   │   ├── db.ts                  # Single better-sqlite3 instance + schema init
│   │   ├── MemoryStore.ts         # Typed read/write helpers
│   │   ├── MemoryRetriever.ts     # Keyword-based episode fetching (SQL-safe)
│   │   ├── CoreIdentity.ts        # Always-loaded user profile builder
│   │   └── EpisodicLogger.ts      # Summarizes conversations → tags + mood
│   │
│   ├── llm/
│   │   ├── LLMClient.ts           # Provider abstraction + factory
│   │   ├── PromptBuilder.ts       # System prompt + context + history assembler
│   │   ├── StreamHandler.ts       # Token streaming → IPC → renderer
│   │   └── providers/
│   │       ├── MistralProvider.ts
│   │       ├── OpenAIProvider.ts
│   │       ├── AnthropicProvider.ts
│   │       └── OllamaProvider.ts
│   │
│   ├── voice/
│   │   ├── STT.ts                 # Web Speech API — speech to text
│   │   └── TTS.ts                 # Web Speech API — text to speech
│   │
│   ├── store/
│   │   ├── appStore.ts            # Zustand: sprite state, chat open, sprite visible
│   │   ├── chatStore.ts           # Zustand: current conversation (rolling 40-message window)
│   │   └── settingsStore.ts       # Zustand: user prefs (mirrored from SQLite via IPC)
│   │
│   └── assets/
│       ├── sprites/               # fumii sprite sheet PNGs
│       ├── scenes/                # Background scene PNGs
│       ├── sounds/                # wake.mp3, message.mp3
│       └── fonts/                 # SpaceGrotesk-Variable.woff2, DepartureMono-Regular.woff2
│
├── public/
│   ├── sprite.html                # HTML shell for sprite + chat window
│   └── dashboard.html             # HTML shell for dashboard window
│
├── package.json
├── electron-builder.json
├── vite.config.ts
└── tsconfig.json
```

---

## Design System

fumii's visual identity is defined by two principles: **pixel warmth** and **soft modernism**. Every design decision asks: *does this feel like something a person made, for a person they care about?*

### Colors

All colors are defined as CSS custom properties. No hardcoded hex anywhere in component files.

| Token | Name | Hex | Role |
|---|---|---|---|
| `--color-bg` | Deep Desk | `#0F0F14` | Primary background |
| `--color-surface` | Ink Panel | `#1A1A24` | Cards, panels, sidebar |
| `--color-surface-raised` | Lifted | `#22223A` | Hover states, elevated cards |
| `--color-amber` | Amber Hoodie | `#F5A623` | fumii's color — her hoodie, all active states |
| `--color-green` | Spring Meadow | `#CAFFA6` | Positive signals, memory tags |
| `--color-blue` | Glacial Sky | `#A9E0F1` | Secondary accent, idle shimmer |
| `--color-text-primary` | Warm White | `#EEEAE0` | All primary text |
| `--color-text-secondary` | Faded Linen | `#9E9A8E` | Timestamps, metadata |
| `--color-text-fumii` | Amber Speak | `#F5A623` | fumii's chat messages — always amber |
| `--color-danger` | Rose | `#FF6B6B` | Errors, destructive actions |

### Typography

**Space Grotesk** (display, UI) — rounded terminals bridge pixel art and clean UI without tipping into playfulness. Used for almost everything.

**Departure Mono** (monospace) — used only for memory tags, keyboard shortcut hints, and data labels. It signals "this is data," not style.

### The Signature Element

fumii's unmistakable design signature is the **amber desk lamp light** — a soft radial gradient in amber bleeding downward from the upper portion of her scene, like a real lamp casting warmth. This same glow echoes throughout the app: card hover states, the chat window's outer shadow, the active sidebar nav item. One warm light source makes fumii feel like she's *in a room*, not floating on a screen.

### Writing "fumii"

Always lowercase. In code, in UI, in documentation, everywhere. `fumii`. Not `Fumii`. Not `FUMII`. Just a name, like a friend's name.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Windows 10 or 11 (x64)
- A Mistral API key (or Ollama running locally for the offline path)

### Install and run

```bash
git clone https://github.com/your-org/fumii
cd fumii
npm install
npm run dev
```

`npm run dev` starts the electron-vite dev server and Electron simultaneously with hot module replacement. Both the sprite window and dashboard window support HMR.

### First run

1. fumii appears in the bottom-right corner of your screen
2. Open the dashboard: `Ctrl+Shift+D` or right-click the tray icon → Open Dashboard
3. Go to Settings and enter your LLM provider API key
4. Press `Ctrl+Shift+F` to open the chat overlay and start talking

### Global hotkeys

| Hotkey | Action |
|---|---|
| `Ctrl+Shift+F` | Toggle chat overlay |
| `Ctrl+Shift+D` | Open dashboard |
| `Ctrl+Shift+H` | Show / hide fumii |
| `Ctrl+Space` (held, in-chat) | Push-to-talk |
| `Escape` (in-chat) | Close chat overlay |

---

## Build and Distribution

```bash
# Production build
npm run build        # TypeScript compile + Vite bundle
npm run dist         # electron-builder → release/fumii-setup-1.0.0.exe
```

Output: `release/fumii-setup-1.0.0.exe` — one-click NSIS installer, no admin rights required, no runtime dependencies.

### electron-builder notes

`asarUnpack` is non-negotiable for `better-sqlite3` and `keytar`. Both ship native `.node` binaries that cannot be executed from inside an asar archive. The config explicitly unpacks them:

```json
"asarUnpack": [
  "**/better-sqlite3/**",
  "**/keytar/**"
]
```

---

## Performance Targets

| Metric | Target | How |
|---|---|---|
| RAM at rest | < 80MB | `disableHardwareAcceleration()` + `sandbox: true` + 4fps idle |
| RAM during chat | < 200MB | Streaming tokens (no buffering), rolling 40-message Zustand store |
| CPU at rest | < 1% | RAF loop with FPS gate — only redraws when frame interval elapses |
| CPU during animation | < 5% | Canvas 2D only, no WebGL, scene is pure CSS |
| Startup to sprite visible | < 2s | Dashboard lazy-loads — only `sprite.html` is in the critical path |
| Installed size | < 150MB | asar compression, pruned dependencies |

The dashboard window is created at startup (`show: false`) so it loads in the background. By the time you open it, it's already ready.

---

## Phase Roadmap

### Phase 1 — Software Companion (current)

The full desktop app described in this document. A working companion that runs on Windows, has a persistent character, remembers you across sessions, and ships as a single `.exe`.

**In scope:** sprite window, all 9 animation states, chat overlay with streaming, push-to-talk, TTS, core identity memory, episodic memory, mood log, full dashboard, swappable LLM backend (Mistral default + Ollama local fallback), system tray, global hotkeys, night desk scene, Windows x64 installer.

**Out of scope:** wake word detection, multiple scenes, hardware, mobile, cloud sync, reminders, auto-update.

### Phase 2 — Physical Hardware

A small palm-sized physical device: a tiny screen showing fumii's pixel art face, microphone, speaker, wheels so she can wander on your desk. A fine-tuned small local LLM handles conversation. Heavy inference tasks delegate to the desktop companion app via Bluetooth/USB.

The Phase 1 architecture accommodates this. `db.ts` and `LLMClient` are both behind clean interfaces. A `HardwareBridge.ts` module in the main process handles device sync and task delegation — no major refactor of existing code required.

---

## What fumii Is Not

- Not a productivity tool or task manager
- Not a replacement for therapy or professional mental health support
- Not a replacement for human connection
- Not an always-recording surveillance device
- Not engineered for engagement metrics or addiction
- Not the same for everyone — she adapts to the specific person she knows

---

## Tech Stack

| Layer | Technology |
|---|---|
| App shell | Electron 29 |
| UI | React 18 + TypeScript 5 |
| State | Zustand 4 |
| Sprite rendering | Canvas 2D API |
| Database | better-sqlite3 (SQLite, local only) |
| LLM calls | Fetch API in main process |
| Voice I/O | Web Speech API |
| Secrets | keytar (OS keychain) |
| Build | electron-builder + NSIS |
| Bundler | electron-vite |
| Fonts | Space Grotesk, Departure Mono (local woff2) |

---

*fumii — you're never really alone*
