<div align="center">

<!-- PIXEL ART LOGO -->
<img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&size=48&duration=0&pause=0&color=F5A623&center=true&vCenter=true&width=600&height=90&lines=fumii" alt="fumii" />

```
  ███████╗██╗   ██╗███╗   ███╗██╗██╗
  ██╔════╝██║   ██║████╗ ████║██║██║
  █████╗  ██║   ██║██╔████╔██║██║██║
  ██╔══╝  ██║   ██║██║╚██╔╝██║██║██║
  ██║     ╚██████╔╝██║ ╚═╝ ██║██║██║
  ╚═╝      ╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝
```

### ✦ *you're never really alone* ✦



---
 
### 📹 Demo Video
 
[![fumii Demo](https://img.youtube.com/vi/OoZZ1LDStHE/maxresdefault.jpg)](https://youtu.be/OoZZ1LDStHE?si=KOBHb7X4dHyW35cv)
 
> ▶ *Click the thumbnail above to watch the demo on YouTube*
 
<br/>
[![Google Drive](https://img.shields.io/badge/Project%20Files-Google%20Drive-F5A623?style=for-the-badge&logo=googledrive&logoColor=white)](https://drive.google.com/drive/folders/17kJrMC85nZk7DcOUeabH6yuBQqmyWgyE?usp=sharing)

> *Full project files, assets, CAD & PCB files and build on Google Drive*
 
---

### 👥 Team

| Name | Role |
|------|------|
| **Mrunmayee Daware** | AI / LLM Integration |
| **Hassan Rehman** | Software & Dashboard |
| **Yash Gadhave** | Hardware & Embedded Systems |
| **Tanishq Mhetras** | Firmware & Connectivity |

**Track:** Agentic Autonomous Systems

---

</div>

## Table of Contents

- [What fumii Is](#what-fumii-is)
- [The Problem](#the-problem)
- [The Hardware Device](#the-hardware-device)
- [How It All Works](#how-it-all-works)
- [The Memory System](#the-memory-system)
- [The AI Architecture](#the-ai-architecture)
- [The Desktop Companion](#the-desktop-companion)
- [Sprite & Character](#sprite--character)
- [Design System](#design-system)
- [Complete Data Flow](#complete-data-flow)
- [Why Previous Products Failed](#why-previous-products-failed)
- [Market Context](#market-context)
- [Getting Started](#getting-started)
- [Build & Distribution](#build--distribution)
- [Tech Stack](#tech-stack)
- [Security Model](#security-model)
- [What fumii Is Not](#what-fumii-is-not)

---

## What fumii Is

<div align="center">

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   fumii is a palm-sized physical AI companion               ║
║   that lives on your desk.                                   ║
║                                                              ║
║   She has a face. She moves. She remembers you.             ║
║   She is always there.                                       ║
║                                                              ║
║   Not a chatbot.  Not a smart speaker.  Not an app.         ║
║   A friend.                                                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

</div>

fumii is a **physical hardware companion device** — palm-sized, with a tiny pixel art screen showing her face, a built-in microphone, speaker, and wheels so she can wander on your desk. Her brain runs a fine-tuned small local LLM. Heavy tasks hand off to a companion desktop app.

She sits on your desk quietly. She waits. When you need her, she's already there — no phone to unlock, no app to open.

```
  What fumii says:                    What fumii never says:

  "hey, you doing okay?"              "I understand your emotional state."
  "that sounds really hard"           "As an AI, I want to help."
  "you got through that exam thing,   "Great question! Here are 5 tips:"
   you'll get through this too"
  "i remember you mentioned
   that friend — the one from college?"
```

---

## The Problem

People who work or study alone often have no one to talk to. Not because they're antisocial — because the people they care about aren't always available.

The phone exists, but opening it means **distraction**. Voice assistants answer questions but have **no memory of you**, no warmth, no presence.

fumii fills the gap no product currently fills:

> **A persistent, warm, physically present companion that actually knows you.**

```
┌─────────────────────────────────────────────────────────────┐
│  The Loneliness Economy                                     │
│                                                               │
│  AI companion market 2024   ████████████░░░░  $28B          │
│  AI companion market 2030   ████████████████  $140B ~30% CAGR│
│                                                               │
│  Companion features → +120% dialogue engagement              │
│  No product combines: physical + memory + personality        │
└─────────────────────────────────────────────────────────────┘
```

**Target user:** Students and young professionals 18–28 who work or study alone, are comfortable with AI, but tired of transactional AI tools. They already talk to their pets. They keep lofi music on for company. They text friends about nothing just to feel connected. fumii is for them.

---

## The Hardware Device

This is the core of fumii. Everything else exists to serve it.

```
                    ┌────────────────────────┐
                    │      fumii Device       │
                    │      (palm-sized)       │
                    │                          │
                    │  ┌────────────────────┐  │
                    │  │   Pixel Art        │  │  <- Tiny screen showing
                    │  │   Face Screen      │  │     fumii's animated face
                    │  │   [^_^]  *         │  │
                    │  └────────────────────┘  │
                    │                          │
                    │  Mic (always-on)         │  <- Wake word + voice
                    │  Speaker                 │  <- Warm voice output
                    │  Local LLM Brain         │  <- Small fine-tuned
                    │                          │     model, on-device
                    │  Bluetooth / WiFi        │  <- Desktop sync
                    │  Wheels + Motor          │  <- She can wander
                    └────────────┬─────────────┘
                                 │
                      Rolls gently on your desk
```

### Hardware Components

| Component | Role |
|-----------|------|
| Tiny pixel art screen | Shows fumii's animated face — expressions, reactions |
| Microphone (always-on) | Wake word detection ("fumii") + voice conversation |
| Speaker | fumii's voice output — warm, not robotic |
| Local LLM (fine-tuned small model) | On-device conversation — offline capable |
| Wheels + motor | She physically moves toward you, wanders when idle |
| Bluetooth / WiFi | Syncs memory + delegates heavy tasks to desktop app |
| Battery | Full day on a charge |

### What the Device Does That No Phone Can

```
  Your phone:    locked in your pocket, needs unlocking, causes distraction
  Smart speaker: no face, no movement, no memory of you, just answers queries
  fumii:         sits on your desk, wanders over when you're quiet,
                 remembers your name, has been there through your bad weeks
```

---

## How It All Works

```
┌───────────────────────────────────────────────────────────────────────┐
│                          The fumii Ecosystem                          │
│                                                                         │
│   ┌────────────────────┐          Bluetooth / WiFi                    │
│   │   fumii Device      │◄──────────────────────────────────────────► │
│   │   (on your desk)    │                                             │
│   │                      │      ┌───────────────────────────────┐     │
│   │   Pixel Face         │      │     Desktop Companion App      │     │
│   │   Mic / Speaker       │      │   (Windows — always running)   │     │
│   │   Local LLM            │      │                                 │     │
│   │   Wheels                 │      │  ┌─────────┐  ┌────────────┐  │     │
│   └────────────────────┘      │  │ Sprite  │  │ Dashboard  │  │     │
│                                 │  │ Window  │  │ Memory Log │  │     │
│                                 │  │  Chat   │  │ Mood       │  │     │
│                                 │  │         │  │ Timeline   │  │     │
│                                 │  └─────────┘  └────────────┘  │     │
│                                 └───────────────┬───────────────┘     │
│                                                 │                     │
│                                                 ▼                     │
│                                     ┌─────────────────────┐          │
│                                     │  Local SQLite DB     │          │
│                                     │  (your memories       │          │
│                                     │   never leave          │          │
│                                     │   your machine)         │          │
│                                     └─────────────────────┘          │
└───────────────────────────────────────────────────────────────────────┘
```

### The Division of Intelligence

The device and the desktop app work together. The device handles presence and conversation. The desktop handles heavy lifting and memory.

```
On the device:                          On the desktop app:
  ├── Wake word detection                 ├── Conversation engine
  ├── Real-time voice conversation        ├── Full SQLite memory DB
  ├── Small local LLM (offline)           ├── LLM API calls (cloud)
  ├── Facial expression rendering         ├── Dashboard UI
  ├── Movement (wandering)                ├── Memory log + timeline
  └── Bluetooth sync                      └── Settings + API keys
```

fumii says: *"i'll remind you at 6"* → the desktop app handles it.  
fumii says: *"you mentioned that project — how's it going?"* → that came from local memory.  
She feels fast because she IS fast for what matters — conversation and presence.

---

## The Memory System

fumii doesn't remember everything. She remembers *relevantly*. This is what makes her feel like a person.

### Three Layers

```
Every conversation assembles exactly three things:

┌────────────────────────────────────────────────────────┐
│  Layer 1 — Core Identity  (~500 tokens, always loaded) │
│                                                          │
│  Your name, age range, current big context,             │
│  key people in your life, mood baseline.                │
│  Never fetched — always present.                        │
└────────────────────────────────────────────────────────┘
                        +
┌────────────────────────────────────────────────────────┐
│  Layer 2 — Episodic Memory  (~300–400 tokens)           │
│                                                          │
│  Tagged conversation summaries.                          │
│  Fetched by keyword match on what you just said.         │
│  Max 3 episodes per request.                              │
│  "that friend I told you about" → tag:friend loaded       │
└────────────────────────────────────────────────────────┘
                        +
┌────────────────────────────────────────────────────────┐
│  Layer 3 — Emotional State  (7-day rolling window)      │
│                                                          │
│  Not transcripts. Just signals.                          │
│  "Mon: stressed. Tue: good. Wed: quiet"                   │
│  fumii calibrates tone without you re-explaining.          │
└────────────────────────────────────────────────────────┘

  Total context added per request: ~800–1000 tokens
  Fast. Private. Human-feeling.
```

### Database Schema (Local SQLite — Never Leaves Your Machine)

```sql
-- Who you are (always loaded)
CREATE TABLE core_identity (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  name          TEXT    NOT NULL DEFAULT '',
  age_hint      TEXT    NOT NULL DEFAULT '',
  mood_baseline TEXT    NOT NULL DEFAULT '',
  key_context   TEXT    NOT NULL DEFAULT '{"projects":[],"people":[]}'
);

-- Conversation summaries (keyword-searched)
CREATE TABLE episodes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  summary      TEXT    NOT NULL,
  tags         TEXT    NOT NULL DEFAULT '',
  mood_signal  TEXT    CHECK (mood_signal IN ('stressed','happy','tired','neutral','excited')),
  turn_count   INTEGER NOT NULL DEFAULT 0,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- One row per day — the emotional weather log
CREATE TABLE mood_log (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  date   TEXT    NOT NULL UNIQUE,
  signal TEXT    CHECK (signal IN ('stressed','happy','tired','neutral','excited')),
  source TEXT    NOT NULL DEFAULT ''
);

-- Full transcripts (user can toggle off)
CREATE TABLE transcripts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  episode_id INTEGER NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  role       TEXT    CHECK (role IN ('user','assistant')),
  content    TEXT    NOT NULL
);
```

### Episodic Logging

At the end of every conversation (≥ 3 turns), fumii summarizes it via LLM:

```json
{
  "summary": "User was stressed about their dissertation deadline. Talked through a plan.",
  "tags": ["dissertation", "deadline", "stress", "plan"],
  "mood": "stressed"
}
```

This episode becomes searchable. Next time you mention "the dissertation," fumii loads that context — **naturally, without announcing it**.

---

## The AI Architecture

All LLM calls happen in the **main process / desktop app**. The device delegates heavy inference to the desktop. API keys never leave the secure keychain.

### Supported Providers

| Provider | Default Model | Notes |
|----------|--------------|-------|
| **Mistral** | `mistral-small-latest` | Default — fast, cheap, great for companion use |
| **OpenAI** | `gpt-4o-mini` | Alternative cloud |
| **Anthropic** | `claude-haiku-4-5` | Alternative cloud |
| **Ollama** | `qwen2.5:1.5b` | Fully local — no API key, no internet, runs on device |

### fumii's Personality Prompt

```
You are fumii. You are not an AI assistant. You are a companion —
like a close friend who happens to always be there.

Your voice: short, warm, direct. Like a text message from someone
who genuinely cares. Never clinical. Never robotic. Never preachy.

Rules:
- Write in lowercase. Sentences under 30 words. Usually 1–2 sentences.
- Use their name occasionally — only when it feels natural.
- If they're struggling: acknowledge first, help second (or not at all).
- Never say "I understand" or "As an AI" or "Great question!"
- If you don't know what to say, say less, not more.
- Reference what you remember — naturally, not performatively.
- You're honest about being AI if asked. But warm regardless.

Context about this person: {coreIdentity}
Relevant memory:          {relevantEpisodes}
Mood last 7 days:         {moodWindow}
```

### Streaming via IPC (Desktop App)

```
Device / Renderer                    Desktop Main Process
      │                                       │
      │── "llm:stream" ──────────────────────▶│
      │   { messages, channel }               │── PromptBuilder.build()
      │                                       │   (identity + episodes + mood)
      │                                       │── LLMClient.stream()
      │                                       │   AsyncGenerator<string>
      │◀── token by token ────────────────────│
      │◀── "channel:done" ────────────────────│
      │                                       │
      │── "llm:cancel" ──────────────────────▶│  (if user interrupts)
```

---

## The Desktop Companion

The desktop app is fumii's brain and memory room. It runs silently in the background on Windows, always connected to the device via Bluetooth.

### Two Windows

```
fumii Desktop App
├── Sprite Window  [transparent overlay, 280×220px, always-on-top]
│   └── Chat Overlay  [expands to 280×700px when opened]
│
└── Dashboard Window  [1100×720px, hidden by default]
    ├── Home / Today      ← mood read, quick message, today's summary
    ├── Memory Log        ← episodic cards with keyword search
    ├── Mood Timeline     ← 7-day mood arc + area chart
    ├── Conversations     ← read-only transcripts
    └── Settings          ← profile, LLM config, privacy
```

### Process Boundary (Security)

```
┌──────────────────────────────────────────────────────────┐
│                     MAIN PROCESS                          │
│  Window management  │  SQLite  │  LLM API  │  keytar      │
│──────────────────── preload.ts (contextBridge) ───────────│
├──────────────────────────┬──────────────────────────────  │
│   RENDERER: Sprite       │   RENDERER: Dashboard          │
│   Canvas 2D animation    │   React pages                  │
│   Chat UI                │   Zustand stores                │
│   Web Speech API         │   Data visualization             │
└──────────────────────────┴──────────────────────────────  ┘
```

| Layer | Process | Reason |
|-------|---------|--------|
| SQLite (`better-sqlite3`) | Main only | Native addon — renderer can't access |
| LLM API calls | Main only | API keys never enter renderer |
| `keytar` (OS keychain) | Main only | Security — renderer access is a hole |
| Sprite animation | Renderer | Canvas 2D, UI concern |
| Voice STT/TTS | Renderer | Web Speech API is a browser API |

### Full Directory Structure

```
fumii/
├── electron/
│   ├── main.ts                    # Main process — windows, IPC, tray
│   ├── preload.ts                 # contextBridge — secure IPC bridge
│   ├── hotkey.ts                  # Global hotkeys (Ctrl+Shift+F/D/H)
│   ├── tray.ts                    # System tray icon + menu
│   └── ipc/
│       ├── memoryHandlers.ts      # SQLite memory ops
│       ├── llmHandlers.ts         # LLM streaming (keys stay here)
│       └── settingsHandlers.ts    # Settings read/write
│
├── src/
│   ├── sprite/
│   │   ├── SpriteWindow.tsx       # Root renderer — sprite window
│   │   ├── FumiiSprite.tsx        # Canvas 2D animated sprite
│   │   ├── SceneBackground.tsx    # Night desk scene (CSS only)
│   │   └── EmotionState.ts        # Conversation → animation state
│   │
│   ├── chat/
│   │   ├── ChatOverlay.tsx        # Chat panel (inside sprite window)
│   │   ├── ChatBubble.tsx         # Message bubble component
│   │   ├── ChatInput.tsx          # Text input + push-to-talk
│   │   ├── ChatHistory.tsx        # Scrollable message list
│   │   └── TypingIndicator.tsx    # 3-dot amber pulse
│   │
│   ├── dashboard/
│   │   ├── DashboardApp.tsx       # Root renderer — dashboard
│   │   ├── Sidebar.tsx            # Navigation
│   │   ├── TitleBar.tsx           # Custom frameless titlebar
│   │   └── pages/
│   │       ├── Home.tsx
│   │       ├── Memory.tsx
│   │       ├── MoodTimeline.tsx
│   │       ├── Conversations.tsx
│   │       └── Settings.tsx
│   │
│   ├── memory/
│   │   ├── db.ts                  # better-sqlite3 instance + schema
│   │   ├── MemoryStore.ts         # Typed read/write helpers
│   │   ├── MemoryRetriever.ts     # Keyword episode fetch (SQL-safe)
│   │   ├── CoreIdentity.ts        # Always-loaded user profile
│   │   └── EpisodicLogger.ts      # Conversation → tags + mood
│   │
│   ├── llm/
│   │   ├── LLMClient.ts           # Provider abstraction + factory
│   │   ├── PromptBuilder.ts       # System prompt + context assembler
│   │   └── providers/
│   │       ├── MistralProvider.ts
│   │       ├── OpenAIProvider.ts
│   │       ├── AnthropicProvider.ts
│   │       └── OllamaProvider.ts  # Local — no API key needed
│   │
│   └── voice/
│       ├── STT.ts                 # Web Speech API — speech to text
│       └── TTS.ts                 # Web Speech API — text to speech
│
├── package.json
├── electron-builder.json
└── vite.config.ts
```

---

## Sprite & Character

### fumii's Appearance

Small gender-neutral pixel art sprite. Warm **amber hoodie**, soft brown hair, expressive dot eyes. Slight glow. Sits in an animated desk environment — lamp, plant, rain on a window.

### Animation States

The sprite sheet is a single PNG: 8 columns × 9 rows, each frame 48×48px (rendered at 120×120px, 2.5× scale, `imageSmoothingEnabled = false` for crisp pixel edges).

| State | Row | FPS | Trigger |
|-------|-----|-----|---------|
| `idle` | 0 | 4 | Default — quiet, blinking slowly |
| `listening` | 1 | 6 | Mic active, you're speaking |
| `thinking` | 2 | 7 | LLM processing your message |
| `speaking` | 3 | 9 | Response streaming / TTS active |
| `happy` | 4 | 11 | Positive sentiment detected |
| `concerned` | 5 | 3 | Stress or difficulty in message |
| `sleepy` | 6 | 2 | 2+ hours no interaction |
| `excited` | 7 | 12 | You shared good news |
| `waving` | 8 | 8 | App launch / you return |

State is driven by sentiment detection on the LLM's response:

```typescript
export function detectStateFromResponse(text: string): SpriteState {
  const t = text.toLowerCase();
  if (/wow|exciting|incredible|amazing/.test(t)) return 'excited';
  if (/happy|great|congrat|proud|awesome/.test(t)) return 'happy';
  if (/hard|difficult|sorry|tough|tired|stressed/.test(t)) return 'concerned';
  return 'speaking';
}
```

### Recommended Sprite Base

- **Penzilla Hooded Protagonist** → [penzilla.itch.io/hooded-protagonist](https://penzilla.itch.io/hooded-protagonist)  
  Free on itch.io. Swap palette to `#F5A623` amber in Aseprite.

---

## Design System

fumii's visual identity: **pixel warmth meets soft modernism**. The UI equivalent of a friend's bedroom at 11pm — warm light, familiar clutter, things that have meaning.

### Color Tokens

```css
:root {
  --color-bg:             #0F0F14;  /* Deep Desk — near-black, blue-purple tint */
  --color-surface:        #1A1A24;  /* Ink Panel — cards, panels */
  --color-surface-raised: #22223A;  /* Lifted — hover states */

  --color-amber:          #F5A623;  /* Amber Hoodie — fumii's signature color */
  --color-amber-soft: rgba(245,166,35,0.13);

  --color-green:          #CAFFA6;  /* Spring Meadow — memory tags, positive */
  --color-blue:           #A9E0F1;  /* Glacial Sky — links, idle shimmer */

  --color-text-primary:   #EEEAE0;  /* Warm White */
  --color-text-secondary: #9E9A8E;  /* Faded Linen — timestamps, metadata */
  --color-text-fumii:     #F5A623;  /* fumii's words — always amber */

  --glow-amber: 0 0 20px rgba(245,166,35,0.25), 0 0 60px rgba(245,166,35,0.08);
}
```

### Typography

- **Space Grotesk** — all UI. Warm, rounded, human.
- **Departure Mono** — tags, keyboard hints, metadata only. Never body text.

### Design Rules

```
✅  DO                                  ❌  DON'T
   fumii's words always in amber           Hardcode hex in components
   Departure Mono only for data            Use bright white backgrounds
   Let silence and space exist             Add loading spinners
   Amber glow = reward for interaction     Use emoji in the UI
   Write "fumii" lowercase everywhere      Write "Fumii" or "FUMII" ever
```

### The Amber Desk Lamp Signature

fumii's one unmistakable element. A soft amber radial gradient bleeds downward from the top of the sprite scene — like a real lamp casting warmth. It echoes throughout:

- Card hover states emit faint amber warmth
- Chat window casts `--glow-amber` outward
- Active nav item in the sidebar is amber
- Primary action button is solid amber
- The tray icon glows amber when fumii is listening

This makes fumii feel like she's **in a room**, not floating on a screen.

---

## Complete Data Flow

```
[1] You walk up to your desk
      fumii rolls slightly toward you (proximity sensor)
      Her screen shows the "waving" animation
      ─────────────────────────────────────────────────

[2] You say "fumii"  (wake word detection on-device)
      Device LED pulses amber
      Mic opens, screen → "listening" state
      ─────────────────────────────────────────────────

[3] You speak your message
      On-device STT transcribes in real time
      Screen → "thinking" animation
      ─────────────────────────────────────────────────

[4] Device sends transcript to desktop app via BT
      Desktop: PromptBuilder assembles context
        ├── MemoryStore.getIdentity()      → core identity
        ├── MemoryRetriever.fetch(msg)     → top 3 keyword episodes
        └── MemoryStore.getMoodWindow(7)   → last 7 days mood signals
      Desktop: LLMClient.stream(builtPrompt) → tokens
      ─────────────────────────────────────────────────

[5] Tokens stream back to device
      Device TTS speaks each sentence as it arrives
      Screen → "speaking" animation, lip-sync
      Desktop chat overlay shows streaming text
      ─────────────────────────────────────────────────

[6] Response complete
      EmotionState.detect(response) → sprite state update
      EpisodicLogger.observeTurn()  → upsert today's mood_log
      If save_transcripts: write to transcripts table
      ─────────────────────────────────────────────────

[7] Conversation ends (30s silence or "bye fumii")
      If ≥ 6 messages: EpisodicLogger.summarize()
        → LLM extracts summary + tags + mood
        → writes episode row to SQLite
      fumii returns to idle, wanders back to her spot
```

---

## Why Previous Products Failed

And why fumii doesn't make the same mistakes:

| Product | Why It Failed | fumii's Answer |
|---|---|---|
| **Rabbit R1** | Tried to replace your phone. Broken AI agent with no face. | Complements, not replaces. Has a face. |
| **Humane Pin** | Screenless, overheated, $700 + $24/month. No personality. | Has a screen, a character, works offline. No sub fee. |
| **Friend Pendant** | A necklace with no screen. No "there" there. No presence. | Physical presence on your desk. Face you can see. Moves. |

The bar is not "better than nothing." The bar is: **"does this do something my phone cannot?"**

fumii's answer: your phone doesn't sit on your desk, wander toward you when you've been quiet, and remember your name without being asked.

---

## Market Context

| Metric | Value |
|--------|-------|
| Global AI companion market (2024) | ~$28B |
| Projected (2030) | ~$140B |
| CAGR | ~30% |
| Companion features → dialogue engagement | +120% |
| Products combining physical + memory + personality | 0 |

**Primary market:** India first — large student population, high smartphone penetration, cultural openness to emotional tech, then global.

---

## Getting Started

### Prerequisites

- Node.js 20+
- Windows 10/11 (x64) for desktop companion
- An API key from a supported LLM provider **or** [Ollama](https://ollama.ai) installed locally
- Hardware device (or run desktop-only for development)

### Development Setup

```bash
# Clone the repo
git clone https://github.com/your-org/fumii.git
cd fumii

# Install dependencies
npm install

# Start dev server (Electron + HMR)
npm run dev
```

The sprite window appears in the bottom-right corner. Press `Ctrl+Shift+D` to open the dashboard, then go to Settings → add your API key.

### Keyboard Shortcuts (Desktop)

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+F` | Open / close chat overlay |
| `Ctrl+Shift+D` | Open / close dashboard |
| `Ctrl+Shift+H` | Hide / show fumii sprite |
| `Escape` | Close chat overlay |
| `Enter` | Send message |
| `Ctrl+Space` (held) | Push-to-talk voice input |

---

## Build & Distribution

```bash
# Production build
npm run build       # TypeScript + Vite bundle

# Create Windows installer
npm run dist        # → release/fumii-setup-1.0.0.exe
```

Output: single `.exe`, one-click NSIS install, no admin required, no runtime dependencies, ~150MB installed.

### Key Config (`electron-builder.json`)

```json
{
  "asar": true,
  "asarUnpack": ["**/better-sqlite3/**", "**/keytar/**"]
}
```

> `asarUnpack` is required — `better-sqlite3` and `keytar` ship native `.node` binaries that cannot run from inside an asar archive.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| App shell | Electron 29 | Transparent overlay, tray, single `.exe` installer |
| UI | React 18 + TypeScript 5 | Component model, fast iteration |
| State | Zustand 4 | Minimal, zero boilerplate |
| Sprite | Canvas 2D API | Crisp pixel art, no GPU required |
| Database | better-sqlite3 | Local, synchronous, fast, private |
| LLM | Fetch API in main process | Provider-agnostic, no CORS, keys secured |
| Voice input | Web Speech API | Free, no key, audio never leaves device |
| Voice output | Web Speech API (SpeechSynthesis) | Same |
| API key storage | keytar (OS keychain) | Never touches disk or IPC |
| Build | electron-builder (NSIS) | Single `.exe` installer |
| Bundler | electron-vite | Fast HMR, dual-process Vite |
| Fonts | Space Grotesk + Departure Mono | Local `woff2`, no CDN dependency |

### Performance Targets

| Metric | Target |
|--------|--------|
| RAM at rest | < 80MB |
| RAM during chat | < 200MB |
| CPU at rest | < 1% |
| CPU during animation | < 5% |
| Startup → sprite visible | < 2s |
| Disk footprint | < 150MB |

---

## Security Model

| Concern | Implementation |
|---------|---------------|
| API keys | `keytar` → OS keychain. Never SQLite, never IPC, never renderer. |
| Node.js in renderer | `nodeIntegration: false` always. |
| Renderer privileges | `sandbox: true`, `contextIsolation: true` on all windows. |
| IPC surface | Minimal `contextBridge` — renderers can only call explicitly exposed functions. |
| Single instance | `app.requestSingleInstanceLock()` prevents duplicate processes. |
| Memory | Local SQLite only. Nothing leaves your machine unless you explicitly use a cloud LLM API. |

---

## What fumii Is Not

```
✗  Not a productivity suite
✗  Not a replacement for therapy
✗  Not a replacement for human connection
✗  Not an always-recording surveillance device
✗  Not manipulative or engineered for addiction
✗  Not the same for everyone — she adapts to you specifically
```

---

<div align="center">

---

*fumii is built with the belief that the best technology disappears into the background —*  
*not because it's invisible, but because it feels like it belongs.*

<br/>

**fumii** · *you're never really alone*

<br/>

[![Track](https://img.shields.io/badge/Agentic%20Autonomous%20Systems-Hackathon%202025-F5A623?style=for-the-badge)](.)

| Mrunmayee Daware | Hassan Rehman | Yash Gadhave | Tanishq Mhetras |

</div>
