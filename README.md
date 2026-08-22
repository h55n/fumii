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

[![Release](https://img.shields.io/github/v/release/h55n/fumii?style=for-the-badge&color=2563EB)](https://github.com/h55n/fumii/releases/tag/v2.0.0)
[![Windows](https://img.shields.io/badge/Windows-x64-blue?style=for-the-badge&logo=windows)](https://github.com/h55n/fumii/releases/download/v2.0.0/fumii-2.0.0-windows-setup.exe)
[![Linux](https://img.shields.io/badge/Linux-x64-orange?style=for-the-badge&logo=linux)](https://github.com/h55n/fumii/releases/download/v2.0.0/fumii-1.0.0-linux-x64.tar.gz)
[![ESP32-S3](https://img.shields.io/badge/Firmware-ESP32--S3-green?style=for-the-badge&logo=espressif)](https://github.com/h55n/fumii/releases/download/v2.0.0/fumii-2.0.0-esp32s3-firmware.zip)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---
 
### 📹 Demo Video
 
[![fumii Demo](https://img.youtube.com/vi/OoZZ1LDStHE/maxresdefault.jpg)](https://youtu.be/OoZZ1LDStHE?si=KOBHb7X4dHyW35cv)
 
> ▶ *Click the thumbnail above to watch the demo on YouTube*
 
<br/>
### 📁 [**Project Files — Google Drive**](https://drive.google.com/drive/folders/17kJrMC85nZk7DcOUeabH6yuBQqmyWgyE?usp=sharing)

> *Full project files, assets, CAD & PCB files and build on Google Drive*
 
---

### 👥 Team

| Name | Role |
|------|------|
| **Mrunmayee Daware** | AI / LLM Integration & Emotion Engine |
| **Hassan Rehman** | Software & Desktop App Architecture |
| **Yash Gadhave** | Hardware & PCB Engineering |
| **Tanishq Mhetras** | ESP32-S3 Firmware & Protocol Bridges |

**Track:** Agentic Autonomous Systems

---

</div>

## 🏆 Hackathon Challenge: Provenance: Confirmation Step

> **Challenge Requirement:** *Extend the MVP with a capability related to origin and lineage of important information. Specifically, add a confirmation step for important actions affected by this concept. Teams should be free to decide the implementation approach while demonstrating a complete user flow.*

### 🔍 How We Solved & Integrated It

In **fumii**, memory and conversational history form the core intelligence graph that shapes every response. Previously, memory usage was silent and actions were either unconfirmed or used raw browser prompts. We replaced this with a full **provenance lineage engine** and dedicated **confirmation components** that make the origin and influence of remembered information transparent and actionable before any destructive or behavioral action is taken.

```
                                PROVENANCE DATA FLOW
                                
   User Message ──▶ Memory Engine (profile search)
                          │
                          ▼
            [Assembled Memory Context] ──────────┐
                          │                      │
                          ▼                      ▼
            LLM Prompt Builder (LAC)    recordMemoryCitations() (Fire-and-forget)
                          │                      │
                          ▼                      ▼
               Streaming Tokens         memory_interactions Table
                                        (cite_count, first_cited, last_cited)
                                                 │
                          ┌──────────────────────┴──────────────────────┐
                          ▼                                             ▼
                 Single Memory Delete                          Clear All Memories
                          │                                             │
                          ▼                                             ▼
                 [ ProvenanceSheet ]                         [ ProvenanceAuditModal ]
         - Origin Date / Creation Timestamp           - Total memories & days of context
         - Citation Frequency: "shaped responses X×"   - Oldest to most recent timeline span
         - Context consequence explanation            - Top knowledge tags & influence bar
         - "keep it" vs "forget it"                   - Optional "why starting over?" input
```

### 🛡️ Provenance Architecture & User Flows

1. **Memory Lineage & Citation Tracking Engine (`electron/db/schema.ts`, `electron/db/queries.ts`)**:
   - Added a migration-safe `memory_interactions` table tracking `memory_id`, `cite_count`, `first_cited`, and `last_cited`.
   - As memories are retrieved and injected into prompt context during `memory.profile()`, citations are recorded asynchronously via `recordMemoryCitations()` without blocking real-time token streaming.
   - Built query helpers `getMemoryProvenance()` and `getMemorySummary()` providing granular citation metrics and aggregate memory distribution analytics.

2. **Single Memory Delete Confirmation (`src/dashboard/components/ProvenanceSheet.tsx`)**:
   - Replaced raw browser `confirm()` calls with a dedicated slide-up bottom sheet.
   - Discloses:
     - The exact memory content and creation date.
     - How many conversation turns and responses this specific memory has influenced (`shaped responses X×`).
     - The last timestamp it was drawn upon in context.
     - Relevant topic tags and an explanation of the context lost if deleted.
     - Dual confirmation actions: `keep it` vs `forget it`.

3. **Full Knowledge Erasure Lineage Audit (`src/dashboard/components/ProvenanceAuditModal.tsx`)**:
   - Replaced uninformative clearing with a full-screen lineage audit modal before wiping the memory graph.
   - Displays:
     - Memory count, days of context span, and total prompt citation depth.
     - Timeline comparison between the oldest remembered memory and most recent interaction.
     - Top topics fumii knows about the user.
     - Memory influence depth bar chart.
     - Optional "why are you starting over?" input.
     - Dual confirmation actions: `go back` vs `erase everything`.

4. **Visual Memory Badges (`src/dashboard/pages/Memory.tsx`)**:
   - Memory cards in the dashboard dynamically surface a `cited X×` badge for memories that have actively shaped past conversations.

5. **Diagnostic Verification (`electron/ipc/systemTestHandlers.ts`)**:
   - Added Test 9 (`Memory Provenance & Lineage`) to the automated self-test suite validating database citation increments, summary aggregation, and cascade deletion.

---

## 📦 Downloads & Releases (v2.0.0)

Direct standalone binaries available on the [**GitHub Releases Page**](https://github.com/h55n/fumii/releases/tag/v2.0.0):

| Platform | Package | Description | Download Link |
|----------|---------|-------------|---------------|
| **Windows** | Setup Installer (`.exe`) | Full 1-Click / Assisted NSIS Setup with Desktop Shortcuts | [Download Setup](https://github.com/h55n/fumii/releases/download/v2.0.0/fumii-2.0.0-windows-setup.exe) |
| **Windows** | Portable Archive (`.zip`) | Zero-install standalone directory build | [Download Portable](https://github.com/h55n/fumii/releases/download/v2.0.0/fumii-2.0.0-windows-portable.zip) |
| **Linux** | Tarball (`.tar.gz`) | Standalone Linux x64 executable archive | [Download Tarball](https://github.com/h55n/fumii/releases/download/v2.0.0/fumii-1.0.0-linux-x64.tar.gz) |
| **Linux** | Zip Package (`.zip`) | Linux distribution directory | [Download Zip](https://github.com/h55n/fumii/releases/download/v2.0.0/fumii-1.0.0-linux-x64.zip) |
| **ESP32-S3** | Firmware (`.zip`) | Complete PlatformIO firmware source for physical device | [Download Firmware](https://github.com/h55n/fumii/releases/download/v2.0.0/fumii-2.0.0-esp32s3-firmware.zip) |

---

## Table of Contents

- [What fumii Is](#what-fumii-is)
- [The Problem](#the-problem)
- [The Hardware Device](#the-hardware-device)
- [System Architecture](#system-architecture)
- [The Memory & Provenance System](#the-memory--provenance-system)
- [Multi-Provider AI Router](#multi-provider-ai-router)
- [Local Speech & Audio Engine](#local-speech--audio-engine)
- [The Desktop Companion Dashboard](#the-desktop-companion-dashboard)
- [Hardware Firmware & Communication](#hardware-firmware--communication)
- [Design System](#design-system)
- [Security & Privacy Model](#security--privacy-model)
- [Getting Started & Development](#getting-started--development)

---

## What fumii Is

<div align="center">

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   fumii is a palm-sized physical AI companion               ║
║   that lives on your desk.                                   ║
║                                                              ║
║   She has a face. She listens. She remembers you.            ║
║   She is always there.                                       ║
║                                                              ║
║   Not a chatbot.  Not a smart speaker.  Not an app.         ║
║   A companion.                                               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

</div>

fumii is a **physical AI companion** that bridges tangible hardware presence with an intelligent local memory engine:
- **The Physical Device** — ESP32-S3 microcontroller, 1.54" IPS TFT animated pixel face, rotary mode collar, INMP441 I2S microphone, MAX98357A I2S speaker, WS2812B LED mood ring, and DRV2605L haptic motor.
- **The Desktop Brain** — An Electron desktop application featuring an always-on-top transparent floating sprite, a rich 7-page management dashboard, an in-process TF-IDF & SQLite memory graph, and a multi-provider fallback LLM router.

```
  What fumii says:                    What fumii never says:

  "hey, you doing okay?"              "I understand your emotional state."
  "that sounds really hard"           "As an AI, I want to help."
  "you got through that exam thing,   "Great question! Here are 5 tips:"
   you'll get through this too"
  "is this about the supervisor thing?"
```

---

## The Problem

People who work or study alone for long hours often lack a genuine emotional anchor. Smartphones cause distraction. Corporate smart speakers lack persistent memory, warmth, or personality.

fumii fills the void by offering:
> **A persistent, warm, physically present companion that actually remembers your journey.**

---

## System Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                           THE FUMII ECOSYSTEM                                 │
│                                                                               │
│  ┌─────────────────────────┐              ┌──────────────────────────────┐   │
│  │   FUMII DEVICE          │              │   FUMII DESKTOP APP          │   │
│  │   (ESP32-S3)            │◄────WiFi────►│   (Electron · Win/Mac/Linux) │   │
│  │                         │   MQTT+WS    │                              │   │
│  │  1.54" TFT face         │              │  Sprite window + Dashboard   │   │
│  │  INMP441 mic (I2S)      │              │  SQLite + Memory Provenance  │   │
│  │  MAX98357A speaker      │              │  Multi-Provider LLM Router   │   │
│  │  EC11 rotary collar     │              │  Whisper STT + Edge TTS      │   │
│  │  WS2812B LED ring       │              │  MQTT Broker (aedes)         │   │
│  │  DRV2605L haptics       │              │  WebSocket Audio Server      │   │
│  └─────────────────────────┘              │  Keytar OS Keychain          │   │
│                                           └──────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## The Memory & Provenance System

fumii utilizes **Least Available Context (LAC)**: raw memory databases never leave the local machine. Only assembled prompt snippets are sent during inference.

### Memory Storage Layers
1. **Autobiographical Core Facts**: Static user traits extracted automatically from conversation ("studies computer science", "lives in Pune").
2. **Dynamic Episodic Memory**: Keyword-indexed conversation snippets stored locally in SQLite with fast TF-IDF similarity search.
3. **7-Day Emotional Weather Log**: Daily mood signals (`stressed`, `happy`, `tired`, `neutral`, `excited`) calibrating conversational empathy.
4. **Provenance Interactions (`memory_interactions`)**: Citation frequencies and timestamp records measuring memory influence across all interactions.

---

## Multi-Provider AI Router

fumii implements an automatic fallback cascade. If a local model is unavailable, it gracefully routes to cloud providers or cached in-character fallbacks without breaking the conversation:

```
Ollama (Local Qwen 2.5) ──▶ Groq (Llama 3.3) ──▶ NVIDIA NIM ──▶ Mistral AI ──▶ OpenAI ──▶ Anthropic ──▶ Google Gemini ──▶ Cached In-Character Fallback
```

- **Companion Mode (Temperature 0.87)**: Philosophical depth, emotional warmth, empathetic solidarity.
- **Assistant Mode (Temperature 0.67)**: Concise, task-oriented execution.
- **Strict Character Voice**: Lowercase sentences, under 30 words per response, zero corporate AI clichés.

---

## Local Speech & Audio Engine

- **Whisper STT Manager (`electron/services/WhisperService.ts`)**: In-process model management supporting `tiny.en`, `base.en`, `small.en`, and multilingual ggml binaries.
- **Microsoft Neural Edge TTS (`electron/services/EdgeTTSService.ts`)**: Zero-cost, high-fidelity neural voice synthesis with 7 calibrated soothing voices (`Jenny`, `Aria`, `Ana`, `Sonia`, `Michelle`, `Guy`, `Ryan`).

---

## The Desktop Companion Dashboard

The desktop application includes a full 7-page suite:
1. **Home (`/home`)**: Today's mood status, quick message input, daily reflection summary.
2. **Memory Graph (`/memory`)**: Memory list with search, topic tags, **provenance badges (`cited X×`)**, **`ProvenanceSheet`** deletion confirmation, and **`ProvenanceAuditModal`** full audit.
3. **Mood Timeline (`/mood`)**: 7-day emotional wave visualization with mood frequency breakdown.
4. **Conversations (`/conversations`)**: Session list and full message transcripts.
5. **Hardware Device (`/device`)**: Real-time telemetry (Battery %, WiFi SSID, RSSI), Zero-Friction LAN Pairing with CSPRNG token security, mode testing, LED ring color picker, haptic triggers.
6. **Pet Sprites (`/pets`)**: Pet switcher and integration with the `npx fumii` Codex Pet registry.
7. **Settings & Diagnostics (`/settings`, `/system-test`)**: LLM provider API key vault (OS keychain via `keytar`), Whisper STT downloader, Neural Voice picker, and a 9-step automated system self-test suite.

---

## Hardware Firmware & Communication

The `firmware/` directory contains a complete PlatformIO C++ project for the ESP32-S3:
- **DisplayManager**: Smooth double-buffered TFT rendering for 10 facial emotional states (`idle`, `listening`, `thinking`, `speaking`, `happy`, `concerned`, `excited`, `sleepy`, `waving`, `provisioning`).
- **AudioCapture & AudioPlayback**: Real-time 16kHz PCM audio streaming over WebSocket (`:8765`).
- **MQTTHandler**: PubSubClient wrapper connecting to the desktop Aedes broker (`:1883`) with Last Will & Testament (LWT) for offline detection.
- **ModeSwitch**: Rotary encoder hardware interrupt debouncing and NVS state persistence.
- **LEDRing & HapticController**: FastLED ambient animations and DRV2605L tactile pattern feedback.

---

## Design System

Designed around **Pixel Warmth Meets Soft Modernism**:
- **Tokens (`src/styles/tokens.css`)**: Warm ivory surfaces (`#FAFAF7`, `#F1F1EB`), deep charcoal text (`#1E2022`), electric cobalt accents (`#2563EB`), and emerald signals (`#10B981`).
- **Typography**: Space Grotesk (UI / body) + Departure Mono / DM Mono (data, provenance tags, timestamps).
- **Aesthetic Principles**: Lowercase typography, thinking-dots animations, subtle micro-animations, zero raw hex values in components.

---

## Security & Privacy Model

| Concern | Security Implementation |
|---------|-------------------------|
| **API Keys** | Stored exclusively in OS Keychain via `keytar`. Never written to disk or sent over IPC. |
| **Memory Data** | Kept 100% local on SQLite. Assembled prompts strictly follow Least Available Context (LAC). |
| **Renderer Process** | `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true` across all windows. |
| **Hardware Pairing** | CSPRNG 256-bit token authentication on local MQTT. Unpaired network devices are denied control. |

---

## Getting Started & Development

### Prerequisites
- **Node.js 20+**
- **npm**

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/h55n/fumii.git
cd fumii

# 2. Install dependencies
npm install

# 3. Start development server (Sprite + Dashboard)
npm run dev

# 4. Start with hardware backend bridges (MQTT + WebSocket Audio)
npm run dev:hardware
```

### Packaging & Distribution
```bash
# Windows Installer & Portable Build
npm run build:win

# Linux AppImage & Debian Package
npm run build:linux

# macOS DMG & Zip Bundle
npm run build:mac
```

---

<div align="center">

*fumii is built on the belief that the best technology disappears into the background —*  
*not because it's invisible, but because it feels like it belongs.*

<br/>

**fumii** · *you're never really alone*

</div>
