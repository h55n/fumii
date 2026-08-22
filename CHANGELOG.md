# fumii Changelog

All notable changes to this project during the development sessions will be documented in this file in chronological order.

---

## [2026-08-22] — Provenance & Lineage Architecture: Memory-Sourced Confirmation Steps

### 🔍 Provenance & Memory Lineage System
- **Database Schema Extension (`electron/db/schema.ts`)**:
  - Added `memory_interactions` table (`memory_id`, `cite_count`, `first_cited`, `last_cited`) with migration-safe initialization.
- **Lineage Tracking Engine (`electron/db/queries.ts`, `electron/ipc/llmHandlers.ts`)**:
  - Implemented `recordMemoryCitations`: Fire-and-forget prompt citation tracking that updates memory usage frequency and lineage timestamps without blocking token streaming.
  - Implemented `getMemoryProvenance`: Resolves single-memory citation counts and timestamps.
  - Implemented `getMemorySummary`: Computes aggregate timeline statistics, days of context, top topic distributions, and total prompt citation influence.
  - Implemented `deleteMemoryProvenance`: Guarantees cascade cleanup on memory deletion.
- **IPC & Preload Bridge (`electron/preload.ts`, `electron/ipc/memoryHandlers.ts`)**:
  - Registered `memory:getProvenance` and `memory:getSummary` IPC channels.
  - Typed `FumiiAPI` interface in `src/global.d.ts` and updated `src/mockFumiiApi.ts` for full browser-mode testing.

### 🛡️ Provenance-Driven Confirmation User Flows
- **`ProvenanceSheet` (`src/dashboard/components/ProvenanceSheet.tsx`)**:
  - Replaced raw browser `confirm()` on single memory deletion with a slide-up confirmation sheet.
  - Discloses memory origin, creation date, prompt citation count ("shaped responses X×"), last-used timestamp, topic tags, and context explanation before confirming deletion.
- **`ProvenanceAuditModal` (`src/dashboard/components/ProvenanceAuditModal.tsx`)**:
  - Replaced raw `confirm()` on "Clear All Memories" with a full lineage audit modal.
  - Presents memory count, days of context, total citation depth, timeline span (oldest to most recent), top knowledge tags, memory influence bar, and optional reason-for-reset input.
- **Memory UI Badges (`src/dashboard/pages/Memory.tsx`)**:
  - Memory cards now display a dynamic `cited X×` badge for memories that have actively shaped past conversations.

### 🧪 Diagnostics & Self-Test
- **System Test Suite (`electron/ipc/systemTestHandlers.ts`)**:
  - Added Test 9: "Memory Provenance & Lineage" validating database citation tracking, summary aggregation, and cleanup.

---

## [2026-08-16] — Cross-Platform Distribution, Comprehensive System Audit & Stability Hardening

### 📦 Cross-Platform Multi-OS Native Packaging
- **Multi-OS Target Configuration (`electron-builder.json`)**:
  - **Windows**: Configured 1-click NSIS installer (`fumii-${version}-windows-setup.exe`) and unpacked portable directory targets with custom branding and metadata patching.
  - **macOS**: Configured `.dmg` and `.zip` distribution bundles targeting `universal`, `x64`, and `arm64` Apple Silicon architectures with entitlements and hardened runtime support.
  - **Linux**: Configured standalone `.AppImage` and Debian `.deb` distribution packages with proper utility categorisation and desktop metadata.
- **Dedicated Build Scripts (`package.json`)**:
  - Added dedicated per-OS packaging commands: `npm run build:win`, `npm run build:mac`, and `npm run build:linux` (alongside `publish:win`, `publish:mac`, and `publish:linux`).

### 🛠️ System Integrity Audit & Bug Fixes
- **OS Keychain Safety Fix (`electron/ipc/systemTestHandlers.ts`)**: Fixed an issue in the diagnostic self-test suite where testing keytar round-trip could clobber an existing user OpenAI API key; updated the test to back up any existing key first and guarantee restoration in a `finally` block.
- **TTS IPC Error Logging Fix (`electron/ipc/ttsHandlers.ts`)**: Corrected logging prefix typo from `[IPC ttts:synthesize]` to `[IPC tts:synthesize]`.
- **End-to-End Subsystem Validation**:
  - Validated all 8 core subsystems: SQLite Database & schema, in-process TF-IDF Memory Engine, Multi-Provider LLM streaming (Ollama, Groq, NVIDIA, Mistral, OpenAI, Anthropic, Gemini), Whisper STT manager, Edge TTS voice synthesis, Hardware MQTT/WebSocket bridges, and IPC preload channels.
  - Executed automated full feature tests (42/42 tests passing) and conversational personality verification suite (18/18 scenarios passing).
- **TypeScript Typecheck**: Verified zero type errors (`npm run typecheck` exit code 0) across both `tsconfig.node.json` and `tsconfig.web.json`.

---

## [2026-08-16] — Companion Behavioral Specification & Psychological Intelligence Architecture Integration

### 🧠 Companion Behavioral Architecture (`docs/fumii_SKILL.md` Integration)
- **Core Voice Rules (`electron/promptBuilder.ts`)**:
  - Enforced strict brevity: 1–3 short sentences default, hard cap under 80 words for punchy, authentic conversation.
  - Natural cadence: Contractions always, lowercase where natural, no em dashes, no semicolons, no bullet points, no numbered lists, no markdown formatting (except code blocks in assistant mode), and no emoji.
  - **Curiosity First**: Configured immediate curious solidarity on conversational starters ("nothing is working out" → "i am here for you tell me").
  - **One-Question Limit**: Maximum of one question per response (usually zero), positioned only after emotional reflection.
- **Psychological & Philosophical Principles**:
  - **Solidarity & Motivation**: Uses "we" language and steps into the ring with the user when they feel hopeless ("we will pass this stage as well you have come so far").
  - **Philosophical Depth**: Injects emotional, philosophical perspectives on life rather than transactional tips ("life never had a point it was never logical it was always emotional, emotionally lived, felt").
  - **Reflection First & Emotion Coaching**: Sits in primary emotion before offering any problem-solving or questions; strictly prohibits unsolicited advice in the first 3 turns.
  - **Secure Attachment**: Unconditionally available, non-punishing of user absence or silence, zero guilt-tripping upon return.
  - **Memory as Knowing**: Casual knowing ("is this the supervisor thing?"), strictly banning database-style citation announcements.
  - **Narrative Therapy Externalisation**: Externalises struggles ("the anxiety is loud today" vs "you are an anxious person").
- **Safety Escalation Protocol**:
  - Two-level non-clinical, warm referral triggered on 3+ helplessness/permanence/withdrawal signals or explicit distress. No robotic helpline dumps or surveillance language.
- **Hard Prohibitions**:
  - Filter and explicit instructions against corporate AI clichés ("Great question!", "Certainly!", "I totally understand", "As an AI", "I want to help you", "I hope this helps", "Let me know if you need anything", uppercase "Fumii/FUMII").

### 🧩 Memory Engine & Context Architecture (`electron/services/MemoryService.ts`)
- **Relationship Arc**: Added dynamic relationship stage calculation (`new` 0–10 turns, `familiar` 10–50 turns, `close` 50+ turns) scaling memory depth and conversational intimacy.
- **Expanded Fact Extraction**: Added automated autobiographical and emotional fact extraction for studies, careers, boss/supervisors, friends/partners, projects, deadlines, and personal struggles.
- **Structured Context Assembly**: Emits `WHO THIS PERSON IS`, `WHAT'S BEEN HAPPENING LATELY`, and `RELEVANT CONTEXT` blocks adhering to Least Available Context (LAC).

### ⚡ Generation & Routing Calibration (`electron/services/LLMService.ts`, `electron/ipc/llmHandlers.ts`)
- **Mode-Calibrated Parameters**: Injected mode-appropriate temperatures:
  - `0.87` for Companion Mode (warmth, variance, philosophical depth, emotional presence).
  - `0.67` for Assistant Mode (directness, task focus, conciseness).
- **Token Windows**: Configured 250 max-token limit across Ollama, Groq, Mistral, OpenAI, Anthropic, and Gemini providers.
- **10-State Emotion Detection**: Upgraded emotional state taxonomy to recognize overwhelmed, anxious, lonely, flat/dissociated, excited, relieved, guilty, angry, quiet/testing, and ambivalent user signals.

---

## [2026-08-16] — Full Hardware Pairing Audit: Security, Robustness & Seamless UX

### 🔴 Security

- **Fixed `isAuthorized()` security hole (`firmware/src/MQTTHandler.cpp`)**: `isAuthorized()` previously returned `true` when the device was unpaired, meaning any desktop on the same LAN could control the display, LED ring, and haptics before a pairing handshake was established. Now correctly returns `false` for unpaired devices — only the explicit `fumii/desktop/pair` handler (processed first in `handleMessage`) can act without a token.

### 🔧 Firmware Fixes

- **SoftAP always torn down on provisioning exit (`firmware/src/WiFiProvisioning.cpp`)**: The captive portal previously left the SoftAP running if the 5-minute provisioning timeout expired. This caused `WIFI_AP_STA` interference when `connect()` tried to join the home network in STA-only mode. The portal now unconditionally calls `server.stop()` → `WiFi.softAPdisconnect(true)` → `WiFi.mode(WIFI_STA)` before returning, regardless of whether credentials were entered. Return type changed to `bool` (true = credentials saved, false = timed out).
- **LED ring & haptic command handlers added (`firmware/src/MQTTHandler.cpp`)**: `DESKTOP_LEDS` and `DESKTOP_HAPTIC` topics were subscribed in `reconnect()` but silently ignored in `handleMessage`. Added handlers that parse the JSON payload and forward to `led_ack`/`haptic_ack` relay topics consumed by `main.cpp`'s loop.
- **`publishWifi()` method added (`firmware/src/MQTTHandler.h/.cpp`)**: New `publishWifi(const char* ssid)` publishes `fumii/device/wifi` after WiFi connects, so the desktop telemetry tile shows the real connected SSID instead of `—`.
- **Provisioning display state (`firmware/include/DisplayManager.h`, `firmware/src/DisplayManager.cpp`)**: Added `FaceState::PROVISIONING` with an animated Wi-Fi signal bars animation (3 arcs cycling at ~0.67s per step). Shown during captive portal setup so the user knows the device is alive and waiting — previously showed the confusing moon/offline icon.
- **Explicit mDNS timeout (`firmware/src/main.cpp`)**: Changed `MDNS.queryHost("fumii-desktop")` to `MDNS.queryHost("fumii-desktop", 1000)` — avoids a needless 2-second blocking hang on boot when the desktop mDNS service is not yet advertising.
- **WiFi SSID published on boot (`firmware/src/main.cpp`)**: Calls `mqtt.publishWifi(WiFi.SSID().c_str())` immediately after MQTT connects so the desktop receives the connected network name on every boot.

### 🖥️ Desktop Fixes

- **Pairing race condition fixed (`electron/ipc/hardwareHandlers.ts`)**: The pairing confirmation previously resolved immediately if `rawDeviceStatus` was already `'online'` from a stale cached broker message — the new CSPRNG token never actually reached the device. Added `pairInitiatedAt` timestamp guard: only resolves once a heartbeat arrives **after** the pair command was sent (`status.lastSeen > pairInitiatedAt`), ensuring the token genuinely propagated before the desktop stores it.
- **Pairing timeout extended 4.5s → 12s (`electron/ipc/hardwareHandlers.ts`)**: The 4.5s window was too short for a device completing captive-portal provisioning, which can take 5–15s to re-join home Wi-Fi and reconnect MQTT. Extended to 12s with an improved timeout error message.
- **`fumii/device/wifi` payload properly stored (`electron/ipc/hardwareHandlers.ts`)**: The Wi-Fi SSID message now clears `apSsid` (SoftAP name no longer relevant once connected) and updates the `wifi` telemetry field.
- **`apSsid` field added to `DeviceStatus` (`electron/ipc/hardwareHandlers.ts`, `src/global.d.ts`)**: Tracks the provisioning AP SSID so the Device page wizard can show the real `fumii-setup-XXXX` SSID instead of a static placeholder.
- **`unpair()` now reloads real state (`src/store/deviceStore.ts`)**: Previously hardcoded `pairingStatus: 'found-unpaired'` after unpairing — incorrect when the device was offline. Now calls `load()` to get the authoritative post-unpair state from the main process.

### ✨ UX Improvements

- **Contextual initial test log (`src/dashboard/pages/Device.tsx`)**: Initial activity log now reads `"Companion hardware integration active."` when paired, or `"Waiting for Fumii device on local network…"` when not yet connected — replacing the misleading blanket "System ready" message.
- **Real SSID shown in setup wizard (`src/dashboard/pages/Device.tsx`)**: Step 2 of the first-time setup guide now shows `{status.apSsid || 'fumii-setup-XXXX'}` — once the device reports back, users see the exact network name to connect to.

### ✅ Verification
- TypeScript `--noEmit` typecheck: **0 errors**
- `electron-vite build`: **exit code 0** — main (97.3 kB), preload (6.6 kB), renderer (172.9 kB)

---

## [2026-08-16] — Code Review Hardening, Stream Cancellation Guards & Lifecycle Hygiene

### 🛡️ Code Quality & Robustness Improvements
- **LLM Stream Cancellation Protection (`electron/ipc/llmHandlers.ts`)**: Added `controller.signal.aborted` checks to immediately short-circuit post-response transcript commits, mood upserts, memory updates, and device TTS audio streaming when a chat generation is aborted or superseded by the user.
- **Hardware Heartbeat & Teardown Lifecycle (`electron/ipc/hardwareHandlers.ts`, `electron/main.ts`)**: Stored device heartbeat polling timer handles and wired clean teardown on `app.before-quit` alongside WebSocket Audio Streamer (`audioStreamer.stop()`), freeing all networking resources cleanly upon exit.
- **Preload Event Namespace Whitelisting (`electron/preload.ts`)**: Added namespace boundary validation (`device:`, `sprite:`, `chat:`, `pets:`, `whisper:`, `llm:`, `settings:`, `system:`, `updater:`) to `api.on` in preload, defending against arbitrary event channel registrations.
- **Production Build & Typecheck Verification**: Validated full TypeScript compilation and Vite SSR/renderer production bundling.

---

## [2026-08-15] — Zero-Friction Hardware Pairing, Microsoft Neural TTS, Transparent Companion, LifeCycle & Production Packaging

### 🔌 Zero-Friction 1-Click Hardware Pairing & Auto-Discovery
- **Always-On Backend Services**: Configured Electron (`electron/main.ts`) to unconditionally launch the local MQTT broker (port `1883`), WebSocket audio server (port `8765`), and mDNS advertisement on startup (`ENABLE_HARDWARE = process.env.DISABLE_HARDWARE !== '1'`) without requiring flags or dev commands.
- **Persistent Desktop Identity**: Seeded a persistent UUID v4 (`desktop_id`) in SQLite `settings` table on first launch for secure, deterministic pairing.
- **5-State Pairing Engine**: Implemented full state machine in `electron/ipc/hardwareHandlers.ts` (`none-found`, `found-unpaired`, `pairing`, `paired`, `paired-offline`) with 32-character CSPRNG token generation and live status broadcasts (`device:pairingStatusChanged`, `device:statusChanged`).
- **Firmware Security & Captive Portal (`firmware/`)**:
  - `WiFiProvisioning.h/.cpp`: Implemented SoftAP captive portal with MAC-based SSID (`fumii-setup-XXXX`), captive portal detection endpoints (`/generate_204`, `/hotspot-detect.html`, `/ncsi.txt`, `/connecttest.txt`), and live Wi-Fi network scanner dropdown.
  - `MQTTHandler.h/.cpp`: Added `fumii/desktop/pair` and `fumii/desktop/unpair` topic handlers with NVS non-volatile token persistence and `isAuthorized()` validation across all command topics.
  - `ModeSwitch.h/.cpp` & `main.cpp`: Added hardware button hold triggers: 5-second hold for unpairing (double-buzz feedback) and 10-second hold for factory reset (long buzz + reboot into SoftAP).
- **1-Click Device Dashboard UI**: Redesigned `src/dashboard/pages/Device.tsx` with 1-click **"Pair with Fumii →"** action, visual step-by-step setup guides, unpair confirmation modal, companion mode toggle, and live sensor/actuator test controls.
- **Hardware Simulator**: Updated `scripts/simulate-hardware.js` with full cryptographic handshake and token validation.

### 🗣️ Free & Unlimited Microsoft Edge Neural Text-to-Speech (TTS) Studio
- **Zero-Cost Neural Speech Engine**: Built `electron/services/EdgeTTSService.ts` using `msedge-tts` to stream studio-quality 24kHz audio from Microsoft's neural network with **zero API keys, credit cards, or accounts required**.
- **Curated Soothing Voices**: Added pre-configured natural voices:
  - `en-US-JennyNeural` (US): Calm, gentle, warm & friendly (*Default companion voice*)
  - `en-US-AriaNeural` (US): Warm, expressive & natural
  - `en-US-AnaNeural` (US): Soft, sweet & delicate
  - `en-GB-SoniaNeural` (UK): Calm, soothing & gentle British female
  - `en-US-MichelleNeural` (US): Warm, caring & relaxed conversational tone
  - `en-US-GuyNeural` (US): Relaxed, friendly & reassuring male voice
  - `en-GB-RyanNeural` (UK): Deep, calm & thoughtful British male tone
- **TTS Voice Studio in Settings (`src/dashboard/pages/Settings.tsx`)**:
  - Companion voice selector dropdown.
  - Speaking pace slider (`-20%` to `+20%`, default `-5%` for calm pacing).
  - Voice warmth & pitch slider (`-10Hz` to `+10Hz`).
  - Interactive **"▶ Preview Voice"** test button for instant live speech synthesis.
- **Chat Speech Integration**: Connected `src/chat/ChatOverlay.tsx` to `playSoothingTTS` with HTML5 Audio playback and seamless fallback.

### 🌸 100% Transparent Floating Companion & Window Polish
- **Removed All Background Clutter**: Stripped out ambient background auras, yellow radial gradients, lamp glows, and star dots from `src/sprite/SceneBackground.tsx`, ensuring pure transparency directly against the user's desktop.
- **Desktop Companion Optimization**: Configured `skipTaskbar: true`, `transparent: true`, `frame: false`, `hasShadow: false`, and `backgroundColor: '#00000000'` in `electron/windows/SpriteWindowManager.ts` so the companion floats naturally without taskbar clutter or preview cards.
- **Clean Curved Chat Overlay**: Removed diffuse `box-shadow` in `src/chat/ChatOverlay.tsx` to eliminate desktop shadow haze; added padding margins, crisp border (`1px solid rgba(0,0,0,0.12)`), `borderRadius: 22px`, and disabled OS step-stretching (`animate: false`).
- **Sidebar Navigation Uniformity**: Replaced mismatched navigation icons with a cohesive 16×16px inline SVG icon suite across all sidebar tabs.

### ⚡ Pet Click Glitch & State Ping-Pong Elimination
- **IPC Echo Loop Elimination**: Fixed state echo ping-pong loop in `src/store/appStore.ts` and `src/sprite/SpriteWindow.tsx` by adding state equality guards and applying local state updates directly on incoming IPC events.
- **Click Debounce Lock**: Added `clickLockRef` in `src/sprite/SpriteWindow.tsx` to lock interaction for 1.8s, preventing rapid re-triggers and background mood cadence interruptions.
- **Safe Frame Bounds Modulo**: Wrapped atlas frame calculations in `src/pet/PetWidget.tsx` (`currentFrame = frame % safeFrames`) to eliminate transient out-of-bounds frame flashing during animation row changes.
- **Emotional Cadence**: Reduced mood/memory emotional update interval from 15 minutes down to 4.5 minutes.

### 🛑 Clean Application Shutdown & Process Lifecycle
- **Fixed Background Zombie Processes**: Removed `e.preventDefault()` / `hide()` interception in `electron/windows/DashboardWindowManager.ts` and routed `window:closeDashboard` to `app.quit()`.
- **Graceful Resource Teardown**: Added `app.on('before-quit')` in `electron/main.ts` to stop the local MQTT broker (`broker.stop()`), close WebSocket audio sockets, and unregister file watchers, freeing all network ports immediately.

### 🏷️ Production Executable Stamping & Task Manager Branding
- **PE Binary Resource Stamping**: Created `scripts/patch-exe-metadata.js` using `rcedit` to stamp `assets/icon.ico`, `ProductName: 'fumii'`, `FileDescription: 'fumii — Desktop AI Companion'`, and `CompanyName: 'fumii'` directly into the `.exe` header.
- **Windows Identity**: Configured `app.setName('fumii')` and `app.setAppUserModelId('com.fumii.desktop')` in `electron/main.ts` so Task Manager and Windows Taskbar display the official Fumii logo and name instead of generic `Electron (5)`.

---

## [2026-08-13] — Initial Setup, Asset Integration & Build Stabilization

### Added
- **Hardware Simulator:** Created `scripts/simulate-hardware.js` to simulate the ESP32-S3 firmware. It mocks the MQTT wake-word trigger and tests WebSocket audio streaming to ensure Phase 2 hardware integration logic functions correctly locally.
- **Assets Integration:** Fetched final design assets from the GitHub repository (`https://github.com/h55n/fumii`) and placed them in the `assets/` directory:
  - `icon.png` (Application logo)
  - `tray-icon.png` (System tray icon)
  - `fonts/SpaceGrotesk-Variable.woff2`
  - `fonts/DepartureMono-Regular.woff2`
- **Windows Start Menu Shortcut:** Created a PowerShell script that generates a native Windows Start Menu shortcut (`fumii.lnk`) pointing to the local `LAUNCH.bat`. This bypasses `electron-builder` limitations and allows launching the dev environment directly via Windows Search.
- **SQLite Database:** Local relational database initialized via `better-sqlite3` for pets, sessions, transcripts, mood logs, and user settings.

### Changed
- **LAUNCH.bat:** Updated the hardcoded path from `f:\` to `d:\` and modified the launch command to use `npm run dev:hardware` so that MQTT and Audio Streamer services are enabled by default for testing.

### Fixed
- **Native Dependency Build Errors:** Resolved C++ compilation errors for `better-sqlite3` by utilizing `npx electron-builder install-app-deps` to fetch precompiled binaries instead of attempting to build from source via node-gyp.
- **Vite Bundler Crash:** Fixed a fatal `Internal server error` in the Electron renderer caused by `vite:import-analysis` failing to resolve the missing `codex-pets-react` package. The `try/catch` require block in `src/pet/PetWidget.tsx` was completely removed, allowing the app to successfully degrade to the CSS fallback face.
- **Broken Imports:** Fixed an invalid import path in `src/pet/PetWidget.tsx` where `EmotionState` was incorrectly imported from `./EmotionState` instead of `../sprite/EmotionState`.
- **Package Installation:** Removed the non-existent `codex-pets-react` package from `package.json` dependencies to prevent `npm install` from failing.
- **Orphaned Processes:** Resolved `EBUSY` and `Lock file` errors by aggressively terminating orphaned `electron.exe` and `node.exe` processes that were locking `better_sqlite3.node` during build attempts.
- **System Tray Icon:** The system tray icon is no longer invisible on Windows now that `assets/tray-icon.png` is properly bundled.

---

## [2026-08-14] — In-Process Memory, Handy STT Manager, Multi-LLM Providers & Launch Automation

### 🧠 In-Process Local Memory Engine (Zero Subprocess Architecture)
- **Embedded TypeScript Memory Core**: Replaced external subprocess-based memory with a 100% in-process TypeScript engine (`electron/services/MemoryService.ts`).
- **TF-IDF Semantic Search**: Implemented term-frequency inverse-document-frequency ranking with recency scoring for high-speed local memory retrieval without requiring an external vector database.
- **Automated Fact Extraction**: System automatically parses conversations for user preferences, facts, and personality context.
- **Local Persistence & Privacy**: Memory is serialized and persisted locally at `%APPDATA%/fumii/fumii-memory/local-memory.json` with debounced disk writes.
- **Cleaned Deprecated Spawners**: Removed legacy `SupermemoryService.ts` and `LiteLLMService.ts` subprocess runners.

### 🎙️ Handy-Style Local Transcription (STT) Manager
- **Visual Accuracy & Speed Meters**: Added 5-bar rating meters to models (`WhisperService.ts`, `global.d.ts`, `mockFumiiApi.ts`) for clear user insight into transcription performance.
- **Downloaded vs Available Sections**:
  - **Downloaded Models**: Shows the currently active model with a `✓ Active` badge, model size, accuracy/speed metrics, "Set Active", and "Delete" actions.
  - **Available to Download**: Displays cards with "Recommended" / "Fast" badges, RAM requirements, and one-click installation with live progress bars.
- **Search & Language Filters**: Added a search bar and language filter tabs (`All Languages`, `English`, `Multilingual`).
- **Filler Word Cleanup**: System prompt post-processing to eliminate filler words ("um", "uh", "like") and output clean, formatted text.

### 🌐 Expanded LLM Providers & Direct API Integration
- **Direct Multi-Provider Support**: Built direct TypeScript API clients for:
  - **Groq** (High-speed Llama 3 / Mixtral inference)
  - **NVIDIA NIM** (Accelerated enterprise & open-source models)
  - **Mistral AI** (Mistral Large, Mistral Small, Codestral)
  - **OpenAI** (GPT-4o, GPT-4o-mini)
  - **Anthropic** (Claude 3.5 Sonnet, Claude 3 Opus)
  - **Google Gemini** (Gemini 1.5 Pro / Flash)
  - **Ollama** (Fully local, zero-cloud offline models)
- **Unified Context & Conversation Format**: All providers use a standardized OpenAI-compatible interface with shared conversational context, system instructions, and memory injection.
- **Strict Connection Validation**: `testConnection` now strictly validates API keys and fails immediately with actionable error messages if a key is missing or empty.

### 🖥️ Simplified Hardware & Device UX
- **User-Friendly Component Naming**: Simplified technical sensor and hardware terminology in `Device.tsx` to plain English:
  - `Microphone (Hears your voice)`
  - `Speaker (Plays Fumii's voice)`
  - `Touch Sensor (Responds to tap)`
  - `Battery (94% Charged)`
  - `Wi-Fi (Connected)`
- **One-Click Diagnostic Triggers**: Added one-tap interactive actions (`Test Touch`, `Test Microphone`, `Test Speaker`, `Test Connection`).

### 🔍 System Diagnostics & Self-Test Suite
- **Automated Self-Test System**: Added `electron/ipc/systemTestHandlers.ts` and `src/dashboard/pages/SystemTest.tsx` for one-click verification of:
  - SQLite Database integrity and table schemas
  - In-process Memory persistence and recall
  - Active LLM connection and token streaming
  - Whisper local model directory and readiness
  - Hardware bridge and companion state

### 🪟 Windows Window Lifecycle & Launch Automation
- **Foreground Focus Fix**: Updated `DashboardWindowManager.ts` to automatically center and elevate the dashboard window above background windows upon launch or tray open.
- **Sprite Priority Normalization**: Adjusted `SpriteWindowManager.ts` `alwaysOnTop` level from `screen-saver` to `floating` so the companion overlay no longer suppresses dashboard focus.
- **One-Click "Update & Launch" ([UPDATE.bat](file:///d:/ANTIGRAVITY/fumii/UPDATE.bat))**:
  - Automatically terminates running instances and clears stale Chromium single-instance locks.
  - Compiles TypeScript and Vite in ~600ms (`npm run build`).
  - Packages fresh code into `release-fixed\win-unpacked`.
  - Launches `fumii.exe` cleanly.
- **Desktop Shortcuts**:
  - 🔨 **`fumii — Update & Launch`**: Recompiles, packages, and opens.
  - 🚀 **`fumii`**: Instant launcher.
- **Reliable Launch Scripts**: Fixed batch file timeout issues in [LAUNCH.bat](file:///d:/ANTIGRAVITY/fumii/LAUNCH.bat) and [LAUNCH_DEV.bat](file:///d:/ANTIGRAVITY/fumii/LAUNCH_DEV.bat) with cross-platform ping delays.
