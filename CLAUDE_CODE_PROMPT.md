# fumii — Claude Code Initialization Prompt

Paste this whole file as your first message in Claude Code, in the root of
this project. It's written to be self-contained: what fumii is, what's
already built across all three phases, what's real vs. scaffolded, and the
exact next steps in order.

---

## 1. What you're picking up

fumii is a desktop AI companion + physical device (Electron/React desktop
app + ESP32-S3 firmware). This zip covers **all three phases** from the
master PRD:

- **Phase 1** (software, always on): sprite overlay, chat, local memory,
  6-page dashboard, LLM fallback router — fully working, zero setup.
- **Phase 2** (hardware, opt-in): ESP32-S3 firmware, MQTT broker, WebSocket
  audio streaming, Whisper.cpp + Kokoro TTS integration points, Device
  dashboard page — code is complete and PRD-accurate, but **untested
  against real hardware** since none exists yet.
- **Phase 3** (launch): not code-shaped (it's PCBA sourcing, injection
  moulding, retail packaging) — see §6 below for what's actually left.

Read `fumii_master_prd.md` and `FUMII_DESIGN.md` first (in the project's
Claude.ai Project files, not this zip) — they're the source of truth for
product decisions. This codebase follows both closely; don't re-derive
product decisions from scratch.

## 2. How the phases are switched on

Phase 1 always runs. Phases 2+ are gated by environment variables in
`electron/main.ts` so a laptop with no device/Python/Ollama installed still
boots a fully working app:

```bash
npm run dev                # Phase 1 only — sprite, chat, memory, dashboard
npm run dev:hardware       # + MQTT broker, WebSocket audio server (ENABLE_HARDWARE=1)
npm run dev:full-stack     # + real Supermemory & LiteLLM child processes too
```

Nothing in Phase 1 changes behavior based on these flags — they purely add
services on top.

## 3. What's real vs. scaffolded, by phase

### Phase 1 — fully real, not stubs

- Electron shell, SQLite, IPC contract (`preload.ts` matches PRD §21 exactly)
- LLM fallback router (`LLMService.ts`): real streaming fetch calls across
  Ollama -> Mistral -> OpenAI -> Anthropic -> Gemini -> cached fallback phrases.
  Also checks for a real LiteLLM proxy on `:4000` first and uses it
  transparently if `USE_REAL_LITELLM=1` started one (see §4).
- Memory service (`MemoryService.ts`): talks to real Supermemory at
  `:6767` if `USE_REAL_SUPERMEMORY=1` started one, otherwise a local
  JSON-file store with keyword search. Identical method signatures either way.
- Prompt builder (LAC-compliant, PRD §19), all 6 dashboard pages, sprite +
  chat overlay with Web Speech STT/TTS, pet system + CLI.

### Phase 2 — code-complete, hardware-untested

**Firmware** (`firmware/`, PlatformIO/C++, targets ESP32-S3):
- `main.cpp` — full setup()/loop(), wires every module together
- `DisplayManager` — sprite-buffered TFT face rendering, all 10 face states
  drawn as geometry (no image assets needed)
- `AudioCapture` / `AudioPlayback` — I2S mic capture and speaker playback,
  WebSocket streaming to/from desktop
- `MQTTHandler` — full topic table from PRD §28, LWT-based offline detection
- `ModeSwitch` — EC11 rotary encoder, NVS-persisted, debounced
- `HapticController`, `LEDRing` — DRV2605L patterns, WS2812B pulse animation
- `WiFiProvisioning` — stub, see `firmware/README.md` gap #2
- Not implemented: wake-word detection (gap #1 in `firmware/README.md`) —
  this is the one piece with no working code, because it needs a trained
  model file (Porcupine or microWakeWord) that can't ship in a source zip.
  Everything downstream of "wake word fired" is fully wired and ready.

**Desktop hardware services** (`electron/services/`):
- `MQTTBroker.ts` — real `aedes` broker, the firmware connects to this
- `AudioStreamer.ts` — real WebSocket server (`ws` package) with the exact
  `/audio/input` + `/audio/output` protocol from PRD §29, naive silence-based
  VAD (see gap note in the file — swap for real VAD when tuning)
- `WhisperService.ts` — shells out to a whisper.cpp binary; binary + model
  not bundled (150MB+), throws a clear error until installed
- `KokoroTTSService.ts` + `scripts/kokoro_synth.py` — same pattern; the
  Python script is an intentionally-failing stub with the exact setup
  steps in its docstring
- `hardwareHandlers.ts` + `src/dashboard/pages/Device.tsx` — full Device
  page (battery, wifi, mode toggle, identify, restart), shows a clean
  "no device connected" state when hardware mode is off or nothing's paired

### Phase 3 — no code to write here

Phase 3 per PRD §30 is JLCPCB assembly, injection-moulded enclosures, retail
packaging, and an OTA update system. The one code item —
`electron-updater` for the desktop auto-updater — is in `package.json` as
a dependency but not yet wired into `main.ts`; see §6.

## 4. Closing the two "opt-in real backend" gaps

Both of these already work end-to-end — they're gated off by default, not
half-built:

- Real Supermemory: `SupermemoryService.ts` spawns `npx supermemory local`,
  generates/stores its API key via keytar, health-checks it. Set
  `USE_REAL_SUPERMEMORY=1` and run `npm run dev:full-stack`.
  `MemoryService.ts` needs zero changes — it already prefers the real
  server whenever `/health` responds.
- Real LiteLLM: `LiteLLMService.ts` writes the exact yaml config from PRD
  §8 to `~/.fumii` (userData) and spawns `litellm --config ... --port 4000`
  (needs `pip install litellm[proxy]` in the environment first).
  `LLMService.chatStream()` already checks port 4000 first and uses it
  transparently if up.

## 5. Firmware — what to do before flashing real hardware

Full checklist is in `firmware/README.md`. Short version, in priority order:
1. Pick and integrate a wake-word library (Porcupine or microWakeWord) —
   the one real gap; three lines to wire once you have it (marked in
   `main.cpp`'s `loop()`).
2. Replace `WiFiProvisioning`'s stub SoftAP with `WiFiManager` or a real
   captive portal.
3. Wire a real battery ADC read instead of the hardcoded 100%.
4. First compile + flash will surface library version drift — the ESP32
   Arduino core and its libraries move fast; `platformio.ini` pins
   reasonable versions but expect to bump a few.
5. Set `ENABLE_HARDWARE=1` on the desktop side before trying to pair —
   otherwise there's no broker for the device to find.

## 6. What's left for Phase 3 / polish

- Auto-updater: `electron-updater` is installed but not wired — add a small
  `updater.ts` that checks a GitHub Releases feed on startup.
- Real sprite art: still just `pet.json`, no `spritesheet.webp` — see
  `assets/MISSING_ASSETS.md`.
- macOS packaging: `electron-builder.json` has a `mac` target already;
  untested, needs a real Apple notarization cert to ship.
- PCB/enclosure/retail: physical-world work, not code — PRD §25-26 has
  the BOM and wiring diagrams to hand to a fabricator.

## 7. Design note — the old cream/indigo dashboard mockup

Hassan shared a video of an earlier dashboard concept using a cream
background with an indigo accent — different from the amber/dark theme
locked in `FUMII_DESIGN.md` and used throughout this build. Kept amber/dark
since it's the documented system; a light theme is a token-file addition
(`src/styles/tokens.css`), not a rebuild, if you want to revisit it.

## 8. Things that are correct on purpose — don't "fix" these

- Dashboard window `close` hides instead of destroying (avoids reload cost).
- `disableHardwareAcceleration()` / `disable-gpu` — required for transparent
  window stability on Windows.
- Sprite window never sets `backgroundColor` — breaks transparency if set.
- API keys only ever touch `keytar` — never SQLite, IPC payload, or renderer.
- Hardware services are off by default — intentional resource discipline,
  not an oversight.

## 9. File map for orientation

```
electron/main.ts                      boot sequence, phase gating — start here
electron/services/LLMService.ts       provider fallback + LiteLLM passthrough
electron/services/MemoryService.ts    Supermemory client + local fallback
electron/services/MQTTBroker.ts       Phase 2 — broker the firmware connects to
electron/services/AudioStreamer.ts    Phase 2 — WebSocket audio protocol
electron/services/WhisperService.ts   Phase 2 — local STT (needs binary+model)
electron/services/KokoroTTSService.ts Phase 2 — local TTS (needs Python+model)
electron/ipc/hardwareHandlers.ts      Device page backend
src/dashboard/pages/Device.tsx        Device page frontend
firmware/src/main.cpp                 firmware entry point — trace from here
firmware/README.md                    firmware-specific gaps and flash steps
cli/index.ts                          npx fumii — pet installer CLI
```

Ship Phase 1 to real users first regardless — PRD §30 makes that a hard
gate before Phase 2 hardware work starts for a reason: prove the character
and memory land before soldering anything.
