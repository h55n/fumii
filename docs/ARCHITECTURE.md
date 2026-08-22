# fumii — Master Reference
### you're never really alone
**The single source of truth for this project — product, architecture, hardware, data flows, build state, and what's left. Read this before any other doc in the repo.**

---

## Table of Contents

1. [What fumii Is](#1-what-fumii-is)
2. [Build Status — What's Real, What's Left](#2-build-status)
3. [What You Need to Download / Install](#3-what-you-need-to-download--install)
4. [System Architecture — The Full Picture](#4-system-architecture)
5. [Software Architecture — Desktop App](#5-software-architecture)
6. [Hardware Architecture — The Device](#6-hardware-architecture)
7. [Data Flows](#7-data-flows)
8. [Memory System](#8-memory-system)
9. [LLM Architecture](#9-llm-architecture)
10. [Design System](#10-design-system)
11. [Directory Structure](#11-directory-structure)
12. [IPC Contract](#12-ipc-contract)
13. [MQTT Protocol](#13-mqtt-protocol)
14. [Security & Privacy Model](#14-security--privacy-model)
15. [Build & Run Instructions](#15-build--run-instructions)
16. [fumii's Voice — Character Rules](#16-fumiis-voice)
17. [Team & Roles](#17-team--roles)

---

## 1. What fumii Is

fumii is a palm-sized physical AI companion that lives on your desk. She has
a face, she listens, she remembers you, she's always there. Not a chatbot,
not a smart speaker, not an app — a companion.

Two halves working together:
- **The Device** — ESP32-S3, oval body, rotary mode collar, pixel-art face
  screen, mic, speaker, haptic motor, LED ring. WiFi-connected to the desktop.
- **The Desktop App** — one Electron app that is the brain, memory, and
  management interface. Handles all AI, all memory, all conversation, all
  hardware communication. Runs a floating sprite on-screen plus a full
  dashboard.

**Target user:** students / young professionals, 18–28, working or studying
alone for long hours. India first, then global. **Market:** AI companion
market ~$28B (2024) → ~$140B (2030 projected), ~30% CAGR — no existing
product combines physical presence + persistent memory + real personality.

**Always build:** API-first via a unified LLM gateway · local-only memory ·
LAC (Least Available Context — only assembled prompts ever leave the
machine) · API keys in OS keychain only · graceful degradation at every
layer · sub-₹5,000 device.

**Never build:** cloud memory storage · subscriptions · engagement/streak
mechanics · audio recording without explicit activation · phone-as-brain ·
"Fumii"/"FUMII" anywhere in UI (always lowercase).

---

## 2. Build Status

Legend: ✅ real & working · 🟡 code-complete, not yet installed/tested · ⛔ not implemented

| Layer | Status | Notes |
|---|---|---|
| Electron shell (windows, tray, hotkeys, SQLite) | ✅ | Runs today, zero setup |
| LLM fallback router (Ollama→Mistral→OpenAI→Anthropic→Gemini→cached) | ✅ | Real streaming fetch calls |
| Memory service (local JSON fallback) | ✅ | Real keyword search, works out of the box |
| Dashboard — all 7 pages | ✅ | Home, Memory, Mood, Conversations, Device, Pets, Settings |
| Sprite overlay + chat + Web Speech STT/TTS | ✅ | Desktop-only voice path |
| `npx fumii` pet CLI | ✅ | Talks to codex-pets.net registry |
| `codex-pets-react` sprite renderer | 🟡 | Package may not resolve on `npm install` — has a CSS-face fallback either way |
| Real sprite art (spritesheet.webp) | ⛔ | Only `pet.json` metadata exists — see §3 |
| Real Supermemory server | 🟡 | `SupermemoryService.ts` spawns it; needs `USE_REAL_SUPERMEMORY=1` + the binary available via `npx` |
| Real LiteLLM proxy | 🟡 | `LiteLLMService.ts` spawns it; needs `USE_REAL_LITELLM=1` + `pip install litellm[proxy]` |
| ESP32-S3 firmware (display, audio I/O, MQTT, encoder, haptics, LEDs) | 🟡 | Compiles against the documented libraries; **never flashed to real hardware** |
| Wake-word detection | ⛔ | Needs a trained model file (Porcupine/microWakeWord) — the one real code gap in firmware |
| WiFi provisioning (captive portal) | 🟡 | Stub SoftAP only, no real web form yet |
| MQTT broker (desktop side) | 🟡 | Real `aedes` broker, needs `ENABLE_HARDWARE=1` + the actual device to talk to |
| WebSocket audio streaming (desktop side) | 🟡 | Real `ws` server, same gating |
| Whisper.cpp transcription | ⛔ | Service code is real; binary + model (~150MB+) not bundled |
| Kokoro TTS synthesis | ⛔ | Service code is real; Python script is an intentionally-failing stub, no model wired |
| Physical PCB / enclosure / BOM sourcing | ⛔ | Not code — see §6, hand the BOM to a fabricator |
| Auto-updater | ⛔ | `electron-updater` installed as a dependency, not wired into `main.ts` yet |
| Retail packaging / launch | ⛔ | Phase 3, not a code task |

---

## 3. What You Need to Download / Install

### To run the app at all (Phase 1)
```bash
npm install
npm run dev
```
Nothing else required — every service degrades gracefully with nothing installed.

### For the fully local/private LLM experience
- **Ollama** — https://ollama.com, then `ollama pull qwen2.5:1.5b`
  (model size scales with your RAM/VRAM — see table below)

| Your hardware | Model to pull | Speed |
|---|---|---|
| 8GB RAM, no GPU | `qwen2.5:0.5b-q4` | ~6 tok/s |
| 8GB RAM, 4GB VRAM | `qwen2.5:1.5b-q4` | ~25 tok/s |
| 16GB RAM, 6GB VRAM | `qwen2.5:3b-q4` | ~35 tok/s |
| 16GB+ RAM, 8GB+ VRAM | `qwen3:8b-q4` | ~45 tok/s |

### For cloud LLM fallback (no local model)
Add any of these API keys in the dashboard Settings page (stored in OS
keychain, never in a file): **Mistral**, **OpenAI**, **Anthropic**, **Gemini**.

### For the literal PRD architecture (optional — app works without these)
- **Real Supermemory**: `npx supermemory local` needs to resolve — no
  extra install if you have Node/npx; run with `USE_REAL_SUPERMEMORY=1`
- **Real LiteLLM**: `pip install litellm[proxy]` — needs a Python environment; run with `USE_REAL_LITELLM=1`

### For hardware (Phase 2)
- **PlatformIO** (VS Code extension or CLI) to build/flash `firmware/`
- An actual **ESP32-S3-WROOM-1 (N16R8)** dev board + the components in the
  BOM (§6) — nothing to flash to until you have the board wired per the
  GPIO map
- A **wake-word model**: pick **Porcupine** (https://picovoice.ai/, has a
  free tier + ESP32 SDK) or **microWakeWord** (open source, ESP-IDF
  native) — this is the one piece of firmware with no code yet, because
  the model file itself has to be trained/downloaded, not written
- **whisper.cpp** binary + a `ggml-base.en.bin` model
  (https://github.com/ggerganov/whisper.cpp) — drop into
  `~/.fumii/whisper/` (path `WhisperService.ts` expects)
- **Kokoro TTS**: `pip install kokoro-onnx soundfile numpy` + the
  `kokoro-v0_19.onnx` + `voices.bin` model files
  (https://github.com/thewh1teagle/kokoro-onnx) — then fill in the
  `scripts/kokoro_synth.py` stub per its own docstring

### For real sprite art
See `assets/MISSING_ASSETS.md` — spritesheet, icons, fonts, sounds, all
listed with sourcing suggestions. None of these block running the app.

### For packaging a distributable installer
```bash
npm run build:win   # or build:mac — mac needs an Apple notarization cert to actually ship
```

---

## 4. System Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                           THE FUMII ECOSYSTEM                                 │
│                                                                               │
│  ┌─────────────────────────┐              ┌──────────────────────────────┐   │
│  │   FUMII DEVICE          │              │   FUMII DESKTOP APP          │   │
│  │   (ESP32-S3)            │◄────WiFi────►│   (Electron · Win/Mac/Linux) │   │
│  │                         │   MQTT+WS    │                              │   │
│  │  1.54" TFT face          │              │  Sprite window + Dashboard  │   │
│  │  INMP441 mic (I2S)       │              │                              │   │
│  │  MAX98357A speaker       │              │  Supermemory local           │   │
│  │  EC11 rotary collar      │              │  LLM fallback router          │   │
│  │  WS2812B LED ring        │              │  Whisper.cpp / Kokoro TTS     │   │
│  │  DRV2605L haptic         │              │  MQTT broker (aedes)          │   │
│  │  LiPo + TP4056 + boost   │              │  WebSocket audio server       │   │
│  └─────────────────────────┘              │  SQLite + keytar               │   │
│                                            └──────────────────────────────┘   │
│                                                         │                     │
│                                                   Local machine               │
│                                          (nothing leaves except assembled     │
│                                           LLM prompts — see §14 LAC)          │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Division of intelligence:**

| On the device (ESP32-S3) | On the desktop (Electron) |
|---|---|
| Wake word detection | All LLM inference (via router) |
| Microphone capture (I2S) | All memory storage (Supermemory local) |
| Audio streaming → desktop | Whisper.cpp transcription |
| Speaker playback | MQTT broker |
| Face animation (TFT) | WebSocket audio server |
| LED ring, haptic feedback | Dashboard UI |
| Mode switching (rotary collar) | Settings + API key management |
| Battery + WiFi management | Pet sprite management |

---

## 5. Software Architecture

### Process model

```
MAIN PROCESS
  Window Manager: SpriteWindowManager, DashboardWindowManager, Tray, Hotkeys
  Services: LLMService, MemoryService, PetManager,
            (opt-in) SupermemoryService, LiteLLMService,
            (opt-in, hardware) MQTTBroker, AudioStreamer, WhisperService, KokoroTTSService
  IPC Handlers: llmHandlers, memoryHandlers, settingsHandlers, petHandlers, hardwareHandlers
  DB: SQLite (better-sqlite3) + keytar (OS keychain)

── preload.ts (contextBridge, window.fumii) ──

RENDERER 1 — Sprite Window          RENDERER 2 — Dashboard Window
  SpriteWindow.tsx                    DashboardApp.tsx
  SceneBackground.tsx                 Sidebar.tsx / TitleBar.tsx
  PetWidget.tsx                       pages/: Home, Memory, MoodTimeline,
  ChatOverlay / ChatBubble /                  Conversations, Device, Pets,
    ChatInput / ChatHistory                   Settings
  EmotionState.ts                     zustand stores: appStore, chatStore,
  zustand: appStore, chatStore                settingsStore, petStore, deviceStore
  sandbox: true, nodeIntegration: false, contextIsolation: true — always, both windows
```

**Hard security rules (never violated):** SQLite and keytar live in the
main process only. LLM calls happen in the main process only. MQTT broker
runs in the main process only. Renderers receive only what `contextBridge`
explicitly exposes.

### Windows

- **Sprite window** — transparent, frameless, always-on-top. 280×220px at
  rest, 280×700px with chat open. Bottom-right, 20px margin. Click-through
  until hovered.
- **Dashboard window** — frameless with custom TitleBar. 1100×720, min
  860×560. `close` hides rather than destroys (avoids reload cost).

---

## 6. Hardware Architecture

### Form factor
Palm-sized oval/barrel shape, 3D printed enclosure, stepped base. Rotary
collar physically switches companion ↔ assistant mode. Oval bezel for the
TFT screen, pinhole mic port, speaker grille on back, USB-C on base.

### Component summary

| Component | Part | Interface | Role |
|---|---|---|---|
| MCU | ESP32-S3-WROOM (N16R8) | — | Brain of device |
| Display | 1.54" IPS TFT 240×240 ST7789 | SPI | fumii's face |
| Microphone | INMP441 MEMS | I2S | Voice capture |
| Amplifier | MAX98357A | I2S | Digital audio amp |
| Speaker | 2W 4Ω 40mm | wire | Audio output |
| Mode switch | EC11 rotary encoder | GPIO | Companion ↔ Assistant |
| Haptic motor | ERM 10mm coin | wire | Tactile feedback |
| Haptic driver | DRV2605L | I2C | Programmable patterns |
| LED ring | WS2812B 8px 37mm | GPIO | Ambient mood light |
| Battery | LiPo 1000mAh 503450 | wire | Power source |
| Charger | TP4056 USB-C module | USB-C | Charging circuit |
| Regulator | TPS63020 buck-boost | wire | Stable 3.3V rail |

### GPIO map (ESP32-S3)

```
SPI — ST7789 TFT:        MOSI 11 · SCK 12 · CS 10 · DC 9 · RST 46 · BLK 3
I2S mic (INMP441):       WS 4 · SCK 5 · SD 6
I2S speaker (MAX98357A): BCLK 7 · LRC 8 · DIN 17
I2C haptic (DRV2605L):   SDA 18 · SCL 19
EC11 encoder:            CLK 20 · DT 21 · SW 22 (10kΩ pull-ups)
WS2812B LED ring:        DIN 48 (through 100Ω series resistor, needs 5V not 3.3V)
GPIO total used: 19 of 45 available
```

### Bill of materials (single unit, ~₹2,900 total)

| Component | Unit Cost (₹) |
|---|---|
| ESP32-S3 DevKit-C N16R8 | 480 |
| 1.54" IPS TFT 240×240 ST7789 | 300 |
| INMP441 MEMS microphone | 150 |
| MAX98357A I2S amp breakout | 180 |
| 2W 4Ω speaker | 90 |
| EC11 rotary encoder | 45 |
| ERM coin vibration motor | 80 |
| DRV2605L haptic driver | 160 |
| WS2812B LED ring 8px | 90 |
| LiPo 1000mAh | 220 |
| TP4056 charging module | 65 |
| TPS63020 regulator | 95 |
| Passives + connectors + wire | ~195 |
| PCB fab (JLCPCB, 2-layer) | 350 |
| 3D printed enclosure | 400 |
| **Total** | **~₹2,900** |

**Retail target:** ₹3,999–4,499. At 50 units: ~₹3,400/unit COGS. At 500
units: ~₹2,200/unit COGS (injection moulded enclosure). No subscription —
device cost only, users bring their own LLM API keys.

### Power rail

```
USB-C → TP4056 (charging) → LiPo 1000mAh → TPS63020 → 3.3V rail
                                                       (ESP32, TFT, mic, amp, haptic)
                                            → separate 5V boost → WS2812B ring
```

### Firmware structure (`firmware/`)

```
platformio.ini            PlatformIO build config, pinned library versions
include/config.h          GPIO map + DeviceConfig struct (NVS-backed WiFi/mode)
src/main.cpp              setup()/loop() — wires every module together
src/DisplayManager.*      Sprite-buffered TFT face rendering, 10 states, all geometry (no images)
src/AudioCapture.*        I2S mic capture → WebSocket streaming to desktop
src/AudioPlayback.*       WebSocket receive → I2S speaker playback, 3-chunk prebuffer
src/MQTTHandler.*         PubSubClient wrapper, full topic table (§13), LWT offline detection
src/ModeSwitch.*          EC11 encoder, debounced, NVS-persisted
src/HapticController.*    DRV2605L pattern playback
src/LEDRing.*              WS2812B pulse/identify patterns via FastLED
src/WiFiProvisioning.*    First-boot SoftAP (stub — needs a real captive portal)
```

Firmware has **not been run against real hardware** — it compiles against
the documented library APIs and follows the protocol tables exactly, but
treat first flash as a debugging session (pin conflicts, I2S timing,
library version drift are all likely). See `firmware/README.md`.

---

## 7. Data Flows

### Flow A — Desktop chat (no hardware)

```
User types in ChatInput → chatStore.addMessage()
  → window.fumii.streamMessage() → IPC 'llm:stream'
  → llmHandlers.ts (main process):
      keytar.getPassword(provider) → apiKey
      memory.profile({ q: userMessage }) → { profile, searchResults }
      promptBuilder.build(mode, profile, searchResults, history, userMessage)
      LLMService.chatStream() → streaming tokens over IPC
  → chatStore.appendStreamToken() per token, UI re-renders live
  → onDone: Web Speech API TTS speaks it, EmotionState.detect() sets sprite state
  → memory.add(turn), SQLite mood_log upsert
```

### Flow B — Hardware conversation

```
User says wake word → ESP32 (once wake-word lib is wired in)
  → LED pulses amber, TFT → 'listening', MQTT publish fumii/device/wake
  → AudioCapture streams I2S mic PCM over WebSocket (/audio/input)
  → AudioStreamer.ts buffers, ~700ms silence → 'utterance-complete' event
  → WhisperService.transcribe() → text
  → IPC 'device:transcribed' → same LLM pipeline as Flow A
  → After response: KokoroTTSService.synthesize() → PCM
  → AudioStreamer.sendAudioChunk() → device WebSocket (/audio/output)
  → ESP32 AudioPlayback buffers 3 chunks → plays via MAX98357A
  → MQTT fumii/desktop/face = 'speaking' during playback, 'idle' after
```

### Flow C — Mode switch via device

```
User rotates EC11 collar → ModeSwitch::toggle() → NVS save
  → MQTT publish fumii/device/mode
  → hardwareHandlers.ts: SQLite update, IPC 'device:modeChanged' to renderers
  → Desktop replies: fumii/desktop/leds (amber/blue), /haptic (pattern 1), /face ('waving')
  → promptBuilder now uses the new mode's system prompt on next call
```

### Flow D — Fallback cascades

- **Device offline** → MQTT LWT fires → dashboard Device page shows
  disconnected → desktop chat/memory/LLM completely unaffected.
- **Supermemory down** → `memory.profile()` throws → prompt sent with
  cached last-known profile or no memory context → response quality
  degrades gracefully, never blocks the reply.
- **All LLM providers fail** → cached in-character fallback phrases used,
  no error surfaced to the user.
- **Desktop app crashes** → device shows offline face (sleepy moon icon),
  queues up to 5 wake events locally, resyncs on reconnect.

---

## 8. Memory System

**MemoryService.ts** talks to a real Supermemory server (`localhost:6767`)
if `USE_REAL_SUPERMEMORY=1` started one via `SupermemoryService.ts`,
otherwise transparently uses a local JSON-file store
(`userData/memory/graph.json`) with keyword-overlap search. Identical
method signatures either way — nothing else in the app knows which is active.

**Container strategy:** single container tag `'fumii-user'` — fumii is a
single-user system, so all memories live in one graph, enabling unified
`profile()` and cross-session contradiction resolution.

**What Supermemory (real) handles automatically:** contradiction
resolution ("I moved to Mumbai" supersedes "I live in Pune"), temporal
expiry, LLM-powered fact extraction, noise filtering, semantic search.

**SQLite handles app-level state only** — not memory:
```sql
settings(key, value)                                  -- LLM config, UI prefs, mode
mood_log(id, date, signal, source)                     -- daily mood signal
sessions(id, started_at, ended_at, mode, turn_count)    -- session metadata
transcripts(id, session_id, role, content, created_at)  -- optional, user-toggleable
```

---

## 9. LLM Architecture

**LLMService.ts** implements the PRD's fallback chain directly in
TypeScript: **Ollama local → Mistral → OpenAI → Anthropic → Gemini →
cached fallback phrases**. Real streaming fetch calls per provider (NDJSON
for Ollama, SSE for the rest).

Before walking that chain, it checks `localhost:4000/health/liveliness` —
if a real LiteLLM proxy is running (`USE_REAL_LITELLM=1` via
`LiteLLMService.ts`), it sends one OpenAI-compatible request there instead
and lets LiteLLM's own router config handle fallback.

**Prompt structure (LAC-compliant, always):**
```
[System]  fumii's voice rules + identity summary (~200 tok) +
          recent context (~100 tok) + 3 relevant memories (~300 tok) +
          current mode (companion | assistant)
[History] rolling last 20 messages
[User]    current message
```
Total added context: ~600–800 tokens per request.

---

## 10. Design System

All colors via CSS custom properties (`src/styles/tokens.css`) — zero
hardcoded hex in any component, ever.

| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#0F0F14` | Primary background |
| `--color-surface` | `#1A1A24` | Cards, panels |
| `--color-surface-raised` | `#22223A` | Hover states |
| `--color-amber` | `#F5A623` | fumii's signature color |
| `--color-green` | `#CAFFA6` | Positive signals, memory tags |
| `--color-blue` | `#A9E0F1` | Assistant mode, links |
| `--color-danger` | `#FF6B6B` | Errors only, never buttons at rest |
| `--color-text-primary` | `#EEEAE0` | All primary text |
| `--color-text-secondary` | `#9E9A8E` | Timestamps, metadata |

**Typography:** Space Grotesk (UI/body), Departure Mono (data/tags/timestamps only).

**Rules:** fumii's words always amber · lowercase "fumii" everywhere,
always · one glowing element per screen at a time · no emoji in UI · no
loading spinners (use the thinking-dots animation instead).

> Note: an earlier dashboard concept used a cream background with an
> indigo accent (seen in a reference video) — different from the amber/dark
> system above, which is what's actually implemented throughout. A light
> theme would be a token-file addition, not a rebuild, if ever wanted.

---

## 11. Directory Structure

```
fumii/
├── electron/                       MAIN PROCESS
│   ├── main.ts                     boot sequence, phase gating (ENABLE_HARDWARE etc.)
│   ├── preload.ts                  contextBridge — window.fumii API surface
│   ├── tray.ts / hotkey.ts
│   ├── windows/                    SpriteWindowManager, DashboardWindowManager
│   ├── services/
│   │   ├── LLMService.ts           fallback router + LiteLLM passthrough
│   │   ├── MemoryService.ts        Supermemory client + local fallback
│   │   ├── PetManager.ts           chokidar watcher on ~/.fumii/pets/
│   │   ├── SupermemoryService.ts   spawns real supermemory local (opt-in)
│   │   ├── LiteLLMService.ts       spawns real litellm proxy (opt-in)
│   │   ├── MQTTBroker.ts           Phase 2 — aedes broker
│   │   ├── AudioStreamer.ts        Phase 2 — WebSocket audio protocol
│   │   ├── WhisperService.ts       Phase 2 — local STT
│   │   └── KokoroTTSService.ts     Phase 2 — local TTS
│   ├── ipc/                        llmHandlers, memoryHandlers, settingsHandlers,
│   │                               petHandlers, hardwareHandlers
│   ├── db/                         schema.ts, queries.ts
│   └── promptBuilder.ts            LAC-compliant prompt assembly
├── src/                            RENDERER (React + TypeScript)
│   ├── sprite/                     SpriteWindow, SceneBackground, EmotionState
│   ├── chat/                       ChatOverlay, ChatBubble, ChatInput, ChatHistory
│   ├── pet/                        PetWidget (codex-pets-react wrapper + CSS fallback)
│   ├── dashboard/                  DashboardApp, Sidebar, TitleBar
│   │   └── pages/                  Home, Memory, MoodTimeline, Conversations,
│   │                               Device, Pets, Settings
│   ├── store/                      appStore, chatStore, settingsStore, petStore, deviceStore
│   └── styles/tokens.css
├── firmware/                       ESP32-S3 PlatformIO/C++ (see §6)
├── cli/                            npx fumii — pet installer CLI
├── assets/                         pet.json + MISSING_ASSETS.md (art not bundled)
├── scripts/                        check-ollama.js, kokoro_synth.py (stub)
├── CLAUDE_CODE_PROMPT.md           continuation prompt for Claude Code
└── README.md
```

---

## 12. IPC Contract

Full surface exposed via `window.fumii` in `preload.ts` — every method has
a matching `ipcMain.handle` (audited, zero orphans):

```
LLM:         streamMessage
Memory:      getProfile, searchMemories, deleteMemory, clearAllMemories
Mood:        getMoodLog, getTodayMood
Sessions:    getSessions, getTranscripts
Settings:    getAllSettings, getSetting, setSetting, setApiKey, hasApiKey, testConnection
Mode:        getMode, setMode
Hardware:    getDeviceStatus, setDeviceMode, sendLEDCommand, identifyDevice, restartDevice
Pets:        getInstalledPets, getActivePet, setActivePet, removeInstalledPet
Windows:     openChat, closeChat, openDashboard, minimizeDashboard,
             maximizeDashboard, closeDashboard
Events (on): chat:toggled, device:wake, device:transcribed, device:modeChanged,
             device:disconnected, pet:updated
```

---

## 13. MQTT Protocol

Broker on `localhost:1883` (aedes, main process). QoS 0 for frequent
events, QoS 1 for mode changes.

**Device → Desktop:** `fumii/device/status` (LWT: "offline") ·
`/heartbeat` (3s) · `/wake` · `/mode` · `/battery` (5min) · `/button` · `/wifi`

**Desktop → Device:** `fumii/desktop/status` · `/face` (idle, listening,
thinking, speaking, happy, concerned, excited, sleepy, waving) · `/leds`
(`{color, pattern}`) · `/haptic` (`{pattern: 1-4}`) · `/tts_start` ·
`/tts_end` · `/identify`

**Haptic pattern IDs:** 1 = mode switch confirm · 2 = wake confirm ·
3 = shutdown rumble · 4 = error

**Audio (WebSocket, port 8765):** `/audio/input` (device→desktop mic PCM,
512-byte chunks) · `/audio/output` (desktop→device TTS PCM, 3-chunk
prebuffer before playback)

---

## 14. Security & Privacy Model

| Concern | Implementation |
|---|---|
| API keys | `keytar` → OS keychain only. Never SQLite, IPC payload, or renderer. |
| Node in renderer | `nodeIntegration: false` — always, no exceptions |
| Renderer sandbox | `sandbox: true`, `contextIsolation: true` on all windows |
| SQLite | Main process only |
| Audio | Whisper.cpp local — no audio bytes ever leave the machine |
| MQTT / WebSocket | Bound to local network only, not internet-exposed |

**LAC — Least Available Context.** Inspired by Least Privilege. Only the
minimum context needed for a good response ever leaves the machine:

```
STAYS LOCAL ALWAYS:              LEAVES (assembled prompt only, cloud LLM):
  Full memory graph                 Identity summary (compressed, ~200 tok)
  All audio (Whisper.cpp)           3 memory snippets (retrieved, not full graph)
  Full transcripts                  7-day mood signals (signals, not transcripts)
  SQLite database                   Rolling 20-message window (current session)
  API keys                          Current user message
  Raw history beyond the window

NEVER LEAVES, EVEN IN THE PROMPT:
  Raw memory graph data · audio in any form · full transcripts · API keys
```

If Ollama is running locally, nothing leaves the machine at all.

---

## 15. Build & Run Instructions

```bash
# Phase 1 — software only, zero setup
npm install
npm run dev

# Phase 2 — add hardware backend services
npm run dev:hardware        # MQTT broker + WebSocket audio server
npm run dev:full-stack      # + real Supermemory & LiteLLM processes

# Firmware
cd firmware
pio run                     # build
pio run -t upload           # flash over USB-C
pio device monitor          # serial log

# Package a distributable
npm run build:win           # or build:mac
```

---

## 16. fumii's Voice

Every LLM response follows these rules, always:
- Lowercase, always, no exceptions.
- 1–2 sentences usually, 3 max. Under 30 words per sentence.
- Acknowledge first, help second (or not at all).
- Never: "I understand", "As an AI", "Great question!", bullet points.
- Reference memory naturally, never announce it.
- Companion mode: can initiate conversation, references mood naturally.
- Assistant mode: direct, task-focused, still lowercase, still concise.

```
fumii says:                          fumii never says:
"hey, how'd the interview go?"       "I understand your emotional state."
"that sounds really hard actually"   "As an AI, I want to help you."
"three late nights this week.        "I have detected stress in your message."
 you okay?"
```

---

## 17. Team & Roles

- **Hassan Rehman** — Software (desktop app, MQTT)
- **Yash Gadhave** — Hardware (PCB, enclosure)
- **Tanishq Mhetras** — Firmware
- **Mrunmayee Daware** — Desktop / emotion logic

---

*fumii is built on the belief that the best technology disappears into the
background — not because it's invisible, but because it feels like it
belongs.*

**fumii** · *you're never really alone*
