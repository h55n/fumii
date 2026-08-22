# fumii — Executive Summary & Project Pitch

**Tagline:** *you're never really alone.*  
**Track:** Agentic Autonomous Systems  
**Domain:** Physical AI Companion, Affective Computing, Embedded Edge Intelligence  

---

## 1. Executive Summary

**fumii** is a palm-sized physical AI companion robot and desktop intelligence ecosystem designed to alleviate loneliness and cognitive isolation for students, developers, and remote knowledge workers. Unlike transactional voice assistants or screen-locked chatbot apps, fumii combines:
- **Tangible Desktop Presence:** A custom hardware robot with an animated 1.54" TFT face, digital microphone/speaker, rotary mode collar, ambient LED mood ring, and haptic feedback.
- **Local-First Emotional Memory:** An in-process TF-IDF & SQLite memory graph adhering to Least Available Context (LAC), ensuring intimate user memories never leak to third-party databases.
- **Provenance & Lineage Transparency:** A transparent confirmation system disclosing the origin, frequency of citation, and contextual impact of memories before any destructive or behavioral action is taken.
- **Multi-Provider LLM Fallback Cascade:** Resilient conversation routing across local Ollama instances and cloud inference engines (Groq, NVIDIA NIM, Mistral, OpenAI, Anthropic, Gemini).

---

## 2. The Market Opportunity

| Market Metric | Industry Data |
|---------------|---------------|
| **Global AI Companion Market (2024)** | ~$28 Billion USD |
| **Projected Market Size (2030)** | ~$140 Billion USD (~30% CAGR) |
| **Engagement Uplift from Companion Dynamics** | +120% dialogue turn increase vs utility chatbots |
| **Products Combining Physical Form + Local Memory + Provenance** | **0 (fumii is the first)** |

---

## 3. Why Existing Solutions Fail vs. fumii's Moat

1. **Rabbit R1 / Humane AI Pin:** Attempted to replace smartphones with broken, high-latency cloud agents lacking personality or emotional presence.
   - *fumii's Moat:* Complements your existing workflow. Lives as an ambient physical companion on your desk with an expressive animated face and instant local response.
2. **Generic Chatbots (Character.ai, Replika):** Trapped inside web tabs or mobile apps with noisy notifications and subscription paywalls.
   - *fumii's Moat:* Physical embodiment, open-source architecture, zero monthly subscription fees, and local-first data privacy.
3. **Smart Speakers (Amazon Alexa, Google Home):** Cold, transactional, and forget who you are every 5 minutes.
   - *fumii's Moat:* Deep episodic memory, 7-day emotional weather log, and provenance-aware interaction design.

---

## 4. Key Subsystem Highlights

1. **ESP32-S3 Physical Companion:** Full PlatformIO C++ firmware with double-buffered TFT face animations (10 emotional states), 16kHz I2S audio capture, 48kHz neural TTS playback, EC11 mode switch, WS2812B LED ring, and DRV2605L haptics.
2. **Multi-Platform Desktop Suite:** Electron 29 + React 18 companion featuring a floating transparent pixel sprite, 7 management pages (Home, Memory, Mood, Conversations, Device, Pets, Settings), and a 9-point automated system diagnostic suite.
3. **Local Voice & Speech:** Integrated local Whisper.cpp STT engine + zero-cost Microsoft Neural Edge TTS (7 soothing voice presets).
4. **Hackathon Provenance Innovation:** Dedicated `ProvenanceSheet` (single memory deletion) and `ProvenanceAuditModal` (full lineage audit) providing true transparency over AI memory lineage.
