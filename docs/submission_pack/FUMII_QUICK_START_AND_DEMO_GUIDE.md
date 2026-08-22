# fumii — Quick Start & Hackathon Demo Guide

This guide is designed for judges and evaluators who want to test the full software companion, memory provenance confirmation flows, multi-provider LLM router, and hardware bridges.

---

## 1. Zero-Install Windows Quick Start (Fastest)

1. Download the pre-built installer: [**`fumii-2.0.0-windows-setup.exe`**](https://github.com/h55n/fumii/releases/download/v2.0.0/fumii-2.0.0-windows-setup.exe) (or use the portable zip [**`fumii-2.0.0-windows-portable.zip`**](https://github.com/h55n/fumii/releases/download/v2.0.0/fumii-2.0.0-windows-portable.zip)).
2. Run the installer and launch fumii.
3. The transparent pixel sprite appears floating in the bottom-right of your screen.
4. Press `Ctrl+Shift+D` to open the Management Dashboard.

---

## 2. Developer Quick Start from Source

```bash
# 1. Clone the repository
git clone https://github.com/h55n/fumii.git
cd fumii

# 2. Install dependencies
npm install

# 3. Start development server (Sprite + Dashboard)
npm run dev

# 4. (Optional) Start with hardware bridges (MQTT Broker + WebSocket Audio)
npm run dev:hardware
```

---

## 3. Step-by-Step Hackathon Feature Walkthrough

### Test 1: Memory Provenance Badges
1. Open the Dashboard (`Ctrl+Shift+D`) and navigate to the **Memory** page.
2. If you've had conversations, notice the blue **`cited X×`** badges next to memories that have actively shaped past LLM responses.

### Test 2: Single Memory Deletion (`ProvenanceSheet`)
1. Click the `delete` button on any memory entry.
2. Notice the **slide-up Provenance Confirmation Sheet** that appears from the bottom.
3. Observe the disclosed origin date, citation count ("shaped responses X×"), last-used timestamp, topic tags, and context consequence explanation.
4. Click `keep it` to cancel, or `forget it` to confirm deletion.

### Test 3: Complete Knowledge Erasure (`ProvenanceAuditModal`)
1. Click the `clear all memories` button at the bottom of the Memory page.
2. Notice the **full-screen Provenance Lineage Audit Modal**.
3. Inspect the aggregate statistics: total memories, total days of context span, timeline comparison (oldest to most recent), top knowledge topics, and the memory influence depth meter.
4. Click `go back` to safely cancel, or `erase everything` to perform the reset.

### Test 4: Multi-Provider LLM & Voice Testing
1. Navigate to **Settings → LLM Providers**.
2. Save your API key for Groq, OpenAI, Anthropic, Gemini, Mistral, or start local Ollama.
3. Click "Test Connection" to verify real-time latency.
4. Go to **Settings → Voice & STT** to test Microsoft Neural Edge TTS voices (`Jenny`, `Aria`, `Ana`, etc.) with instant audio preview.

### Test 5: Automated Diagnostic Self-Test
1. Navigate to **Settings → System Diagnostics** (or `/system-test`).
2. Click **Run All Tests**.
3. Watch the 9 automated tests execute across the Memory Engine, TF-IDF Search, Fact Extraction, SQLite Database, LLM Providers, Whisper STT, OS Keychain, and **Test 9: Memory Provenance & Lineage**.
