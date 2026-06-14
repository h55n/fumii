# fumii — Phase 1 Build Plan
*Windows Desktop: Sprite Companion + Dashboard App*

---

## What Phase 1 Actually Is

Phase 1 is two things that work together:

**1. The Sprite Window** — fumii on your screen. A transparent, always-on-top pixel art character that sits on your Windows desktop, animates, and opens into a conversation when you need her. This is fumii's face.

**2. The Dashboard App** — a separate Electron window where you see everything fumii knows: your memory log, mood timeline, past conversations, and settings. This is fumii's memory room.

These two are one Electron application. The sprite is always visible. The dashboard opens when you want to review what fumii has learned about you.

---

## Architecture Summary

### The Three Entry Points
```
fumii Phase 1
├── Sprite Window (always running, transparent overlay)
│   └── Chat Overlay (slides up on demand, inside the same window)
└── Dashboard Window (opens from tray or Ctrl+Shift+D)
    ├── Home / Today
    ├── Memory Log
    ├── Mood Timeline
    ├── Conversations
    └── Settings
```

### Process Boundary — What Lives Where

This is the most important architectural rule:

| Layer | Process | Why |
|---|---|---|
| Window management | Main | Only main can create/control windows |
| SQLite (better-sqlite3) | Main only | Native addon, no renderer access |
| LLM API calls | Main only | API keys never enter renderer |
| keytar (OS keychain) | Main only | Native addon, renderer access is a security hole |
| Sprite animation | Renderer (sprite) | Canvas 2D, UI concern |
| Chat UI | Renderer (sprite) | UI concern |
| Voice STT/TTS | Renderer (sprite) | Web Speech API is a browser API |
| Dashboard UI | Renderer (dashboard) | UI concern |
| Zustand stores | Renderer (per window) | UI state — not shared across processes |

The IPC bridge (preload.ts) is the **only** communication channel between renderers and main. It is locked down with `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.

---

## Full Directory Structure

```
fumii/
├── electron/
│   ├── main.ts                    # Main process — window management, IPC, tray
│   ├── preload.ts                 # contextBridge — single preload for all windows
│   ├── hotkey.ts                  # Global hotkey registration + cleanup
│   ├── tray.ts                    # System tray icon + context menu
│   └── ipc/
│       ├── memoryHandlers.ts      # IPC: SQLite memory operations
│       ├── llmHandlers.ts         # IPC: LLM streaming (API keys stay here)
│       └── settingsHandlers.ts    # IPC: settings read/write
│
├── src/
│   ├── sprite/
│   │   ├── SpriteWindow.tsx       # Root renderer — sprite window entry point
│   │   ├── FumiiSprite.tsx        # Canvas 2D animated sprite
│   │   ├── SceneBackground.tsx    # Night desk scene (CSS animations)
│   │   └── EmotionState.ts        # Conversation state → animation state
│   │
│   ├── chat/
│   │   ├── ChatOverlay.tsx        # Chat panel — layered inside sprite window
│   │   ├── ChatBubble.tsx         # Single message bubble (user or fumii)
│   │   ├── ChatInput.tsx          # Text input + push-to-talk button
│   │   ├── ChatHistory.tsx        # Scrollable message list, fade-masked at top
│   │   └── TypingIndicator.tsx    # 3-dot amber pulse while LLM streams
│   │
│   ├── dashboard/
│   │   ├── DashboardApp.tsx       # Root renderer — dashboard window entry point
│   │   ├── Sidebar.tsx            # Nav: Home, Memory, Mood, Conversations, Settings
│   │   ├── TitleBar.tsx           # Custom frameless titlebar with window controls
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
│   │   ├── CoreIdentity.ts        # Always-loaded user profile (~500 tokens)
│   │   └── EpisodicLogger.ts      # Summarizes conversations → tags + mood
│   │
│   ├── llm/
│   │   ├── LLMClient.ts           # Provider abstraction + factory
│   │   ├── PromptBuilder.ts       # Assembles system prompt + context + history
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
│   │   ├── appStore.ts            # Zustand: spriteState, chatOpen, spriteVisible
│   │   ├── chatStore.ts           # Zustand: messages (rolling 20-turn window)
│   │   └── settingsStore.ts       # Zustand: user prefs (synced from SQLite via IPC)
│   │
│   ├── global.d.ts                # TypeScript declaration for window.fumii
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
├── vite.config.ts                 # electron-vite dual-entry config
└── tsconfig.json
```

---

## Window Management (main.ts)

```typescript
// electron/main.ts
import { app, BrowserWindow, ipcMain, screen, dialog } from 'electron';
import path from 'path';
import { createTray } from './tray';
import { registerHotkeys } from './hotkey';
import { registerMemoryHandlers } from './ipc/memoryHandlers';
import { registerLLMHandlers } from './ipc/llmHandlers';
import { registerSettingsHandlers } from './ipc/settingsHandlers';
import { initSchema } from '../src/memory/db';

// Disable GPU acceleration — essential for hitting <80MB RAM at rest
// and required for transparent windows to render correctly on Windows
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

// Single instance lock — prevent multiple fumii instances
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let spriteWindow: BrowserWindow | null = null;
let dashboardWindow: BrowserWindow | null = null;

const SPRITE_W = 280;
const SPRITE_H_CLOSED = 220;
const SPRITE_H_OPEN = 700;   // sprite + chat overlay combined height
const SPRITE_MARGIN = 20;    // distance from screen edge

function getSpritePosition(workArea: Electron.Rectangle, chatOpen: boolean) {
  return {
    x: workArea.x + workArea.width - SPRITE_W - SPRITE_MARGIN,
    y: workArea.y + workArea.height - (chatOpen ? SPRITE_H_OPEN : SPRITE_H_CLOSED) - SPRITE_MARGIN,
  };
}

function createSpriteWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const pos = getSpritePosition(workArea, false);

  spriteWindow = new BrowserWindow({
    width: SPRITE_W,
    height: SPRITE_H_CLOSED,
    x: pos.x,
    y: pos.y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: true,        // user can drag fumii to a new spot
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged,
    },
  });

  // Default: click-through. Mouse events are forwarded so the renderer
  // can detect hover and send 'sprite:hover' IPC back to us.
  spriteWindow.setIgnoreMouseEvents(true, { forward: true });

  if (process.env.VITE_DEV_SERVER_URL) {
    spriteWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/sprite.html`);
  } else {
    spriteWindow.loadFile(path.join(__dirname, '../dist/sprite.html'));
  }
}

function createDashboardWindow() {
  dashboardWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 860,
    minHeight: 560,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0F0F14',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    dashboardWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/dashboard.html`);
  } else {
    dashboardWindow.loadFile(path.join(__dirname, '../dist/dashboard.html'));
  }

  // Hide instead of close — prevents reload cost on re-open
  dashboardWindow.on('close', (e) => {
    e.preventDefault();
    dashboardWindow?.hide();
  });
}

app.whenReady().then(() => {
  // Init DB schema before anything else
  initSchema();

  createSpriteWindow();
  createDashboardWindow();

  // Register IPC handlers
  registerMemoryHandlers();
  registerLLMHandlers(spriteWindow);
  registerSettingsHandlers();

  // Sprite hover — toggle click-through
  ipcMain.on('sprite:hover', () => spriteWindow?.setIgnoreMouseEvents(false));
  ipcMain.on('sprite:leave', () => spriteWindow?.setIgnoreMouseEvents(true, { forward: true }));

  // Chat overlay open/close — resize + reposition window
  ipcMain.on('chat:open', () => {
    const { workArea } = screen.getPrimaryDisplay();
    const pos = getSpritePosition(workArea, true);
    spriteWindow?.setBounds({ x: pos.x, y: pos.y, width: SPRITE_W, height: SPRITE_H_OPEN }, true);
  });
  ipcMain.on('chat:close', () => {
    const { workArea } = screen.getPrimaryDisplay();
    const pos = getSpritePosition(workArea, false);
    spriteWindow?.setBounds({ x: pos.x, y: pos.y, width: SPRITE_W, height: SPRITE_H_CLOSED }, true);
  });

  // Dashboard window controls (from TitleBar.tsx)
  ipcMain.on('dashboard:minimize', () => dashboardWindow?.minimize());
  ipcMain.on('dashboard:maximize', () => {
    if (dashboardWindow?.isMaximized()) dashboardWindow.unmaximize();
    else dashboardWindow?.maximize();
  });
  ipcMain.on('dashboard:close', () => dashboardWindow?.hide());
  ipcMain.on('dashboard:open', () => {
    dashboardWindow?.show();
    dashboardWindow?.focus();
  });

  // Sprite window toggle
  ipcMain.on('sprite:toggle', () => {
    if (spriteWindow?.isVisible()) spriteWindow.hide();
    else spriteWindow?.show();
  });

  // Clear memory — confirmation dialog in main
  ipcMain.handle('memory:clearMemory', async () => {
    const { response } = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Cancel', 'Clear everything'],
      defaultId: 0,
      title: 'Clear fumii\'s memory',
      message: 'This will permanently delete all memories, mood logs, and conversations. fumii will not remember anything about you.',
    });
    if (response === 1) {
      const { db } = await import('../src/memory/db');
      db.exec('DELETE FROM episodes; DELETE FROM mood_log; DELETE FROM transcripts; DELETE FROM core_identity;');
      return true;
    }
    return false;
  });

  // Tray
  createTray(
    () => { spriteWindow?.show(); spriteWindow?.focus(); },
    () => { dashboardWindow?.show(); dashboardWindow?.focus(); },
    () => { dashboardWindow?.show(); dashboardWindow?.webContents.send('nav:settings'); },
    () => ipcMain.emit('memory:clearMemory')
  );

  // Global hotkeys
  registerHotkeys(
    () => spriteWindow?.webContents.send('chat:toggle'),
    () => { dashboardWindow?.show(); dashboardWindow?.focus(); },
    () => ipcMain.emit('sprite:toggle')
  );
});

app.on('window-all-closed', () => {
  // On Windows, keep the app alive in the tray even if all windows are closed
  // Only quit via tray "Quit" menu
});
```

---

## Data Flow

### Complete Conversation Flow

```
1. User presses Ctrl+Shift+F
       ↓
   main.ts: spriteWindow.webContents.send('chat:toggle')
       ↓
   SpriteWindow.tsx receives event → sets chatOpen = true in appStore
   ChatOverlay.tsx mounts → calls window.fumii.openChat()
   main.ts: window.setBounds() expands sprite window upward
       ↓
2. User types or holds Ctrl+Space (push-to-talk in renderer only)
       ↓
   chatStore.addMessage({ role: 'user', content })
       ↓
3. ChatInput calls window.fumii.streamMessage(messages, onToken, onDone, onError)
       ↓
   main.ts ipcMain.on('llm:stream'):
     ├── PromptBuilder.build():
     │     ├── MemoryStore.getIdentity()        → core identity (~500 tokens)
     │     ├── MemoryRetriever.fetch(msg)       → top 3 episodes by keyword
     │     └── MemoryStore.getMoodWindow(7)     → last 7 days of signals
     └── LLMClient.stream(builtMessages) → AsyncGenerator<string>
         For each token: spriteWindow.webContents.send(channel, token)
       ↓
4. onToken callback in renderer → chatStore updates → ChatHistory re-renders
       ↓
5. onDone fires:
     ├── TTS.speak(fullResponse)     → fumii's voice (Web Speech API)
     ├── EmotionState.detect()       → appStore.setSpriteState()
     └── IPC: ipcMain.invoke('memory:observeTurn', { userMsg, response })
             ├── EpisodicLogger.observe() → upsert today's mood_log row
             └── If save_transcripts=true: write to transcripts table
       ↓
6. After 30s inactivity OR Escape key:
     ├── window.fumii.closeChat() → main shrinks window
     ├── ChatOverlay slides down, appStore chatOpen = false
     └── If history.length >= 6:
           IPC: ipcMain.invoke('memory:summarize', history)
           EpisodicLogger.summarize() → LLM completion → writes episode row
```

### Dashboard Data Flow

```
Dashboard opens (dashboardWindow.show())
    ↓
DashboardApp mounts → reads all data via IPC on demand:
  Home:          window.fumii.getIdentity() + getMoodLog(1) + getEpisodes(1)
  Memory:        window.fumii.getEpisodes(50)
  MoodTimeline:  window.fumii.getMoodLog(30)
  Conversations: window.fumii.getEpisodes(100) + getTranscripts(id) on expand
  Settings:      window.fumii.getAllSettings()
    ↓
Settings changes:
  window.fumii.setSetting(key, value) → IPC → SQLite write
  For LLM provider/key: keytar write in main, LLMClient re-instantiated
    ↓
Live mood broadcast (when conversation is active):
  main.ts: dashboardWindow.webContents.send('mood:update', signal)
  Dashboard Home page: updates mood pill in real time
```

---

## Memory System

### db.ts — Schema (corrected)

```typescript
// src/memory/db.ts
// MAIN PROCESS ONLY — never import this from a renderer
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const DB_PATH = path.join(app.getPath('userData'), 'fumii.db');
export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS core_identity (
      id            INTEGER PRIMARY KEY CHECK (id = 1),
      name          TEXT    NOT NULL DEFAULT '',
      age_hint      TEXT    NOT NULL DEFAULT '',
      mood_baseline TEXT    NOT NULL DEFAULT '',
      key_context   TEXT    NOT NULL DEFAULT '{"projects":[],"people":[]}',
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS episodes (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      summary      TEXT    NOT NULL,
      tags         TEXT    NOT NULL DEFAULT '',
      mood_signal  TEXT    NOT NULL DEFAULT 'neutral'
                           CHECK (mood_signal IN ('stressed','happy','tired','neutral','excited')),
      turn_count   INTEGER NOT NULL DEFAULT 0,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mood_log (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      date   TEXT    NOT NULL UNIQUE,
      signal TEXT    NOT NULL DEFAULT 'neutral'
                     CHECK (signal IN ('stressed','happy','tired','neutral','excited')),
      source TEXT    NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS transcripts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      episode_id INTEGER NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
      role       TEXT    NOT NULL CHECK (role IN ('user','assistant')),
      content    TEXT    NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES
      ('user_name',        ''),
      ('llm_provider',     'mistral'),
      ('llm_model',        'mistral-small-latest'),
      ('sprite_position',  'bottom-right'),
      ('sprite_scale',     '1.0'),
      ('voice_enabled',    'true'),
      ('tts_enabled',      'true'),
      ('save_transcripts', 'true'),
      ('hotkey_chat',      'CommandOrControl+Shift+F');
  `);
}
```

### MemoryRetriever.ts — SQL injection safe

```typescript
// src/memory/MemoryRetriever.ts
import { db } from './db';

export interface Episode {
  id: number;
  summary: string;
  tags: string;
  mood_signal: string;
  turn_count: number;
  created_at: string;
}

const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','been','be',
  'i','you','my','me','we','us','our','your',
  'and','but','or','to','of','in','on','at','for',
  'it','its','this','that','these','those',
  'have','has','had','do','does','did','will','would',
  'what','when','where','how','who','why',
  'not','no','yes','can','just','like','about',
]);

export function fetchRelevantEpisodes(userMessage: string, limit = 3): Episode[] {
  const keywords = userMessage
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w))
    .slice(0, 8); // cap to prevent absurd queries

  if (keywords.length === 0) return [];

  // Parameterized LIKE queries — never interpolate user input into SQL
  const conditions = keywords.map(() => `tags LIKE ?`).join(' OR ');
  const params: (string | number)[] = [...keywords.map(k => `%${k}%`), limit];

  return db.prepare(`
    SELECT * FROM episodes
    WHERE ${conditions}
    ORDER BY created_at DESC
    LIMIT ?
  `).all(params) as Episode[];
}

export function getMoodWindow(days = 7): Array<{ date: string; signal: string }> {
  return db.prepare(`
    SELECT date, signal FROM mood_log
    ORDER BY date DESC
    LIMIT ?
  `).all(days) as Array<{ date: string; signal: string }>;
}
```

### EpisodicLogger.ts — with parse guard

```typescript
// src/memory/EpisodicLogger.ts
import { db } from './db';
import type { LLMClient, Message } from '../llm/LLMClient';

const MOOD_SIGNALS = ['stressed', 'happy', 'tired', 'neutral', 'excited'] as const;
type MoodSignal = typeof MOOD_SIGNALS[number];

// Called after every assistant turn — upserts today's mood row
export function observeTurn(userMessage: string, assistantResponse: string): void {
  const signal = detectMood(assistantResponse + ' ' + userMessage);
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO mood_log (date, signal, source)
    VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET signal = excluded.signal, source = excluded.source
  `).run(today, signal, userMessage.slice(0, 80));
}

// Called at end of conversation if ≥ 3 turns (6 messages)
export async function summarizeConversation(
  history: Message[],
  llmClient: LLMClient
): Promise<void> {
  if (history.length < 6) return;

  const summaryPrompt: Message = {
    role: 'user',
    content: [
      'Summarize this conversation in 2-3 sentences.',
      'Extract 3-5 keyword tags (single lowercase words, no phrases).',
      'Identify the dominant mood: stressed | happy | tired | neutral | excited.',
      '',
      'Respond with ONLY valid JSON, no markdown, no explanation:',
      '{"summary":"...","tags":["tag1","tag2"],"mood":"neutral"}',
    ].join('\n'),
  };

  let raw: string;
  try {
    raw = await llmClient.complete([...history, summaryPrompt]);
  } catch (err) {
    console.error('[EpisodicLogger] LLM summary failed:', err);
    return;
  }

  let parsed: { summary?: string; tags?: unknown; mood?: string };
  try {
    // Strip any accidental markdown code fences the LLM may add
    const cleaned = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error('[EpisodicLogger] JSON parse failed:', err, 'raw:', raw);
    return; // fail silently — don't crash the conversation
  }

  const summary = typeof parsed.summary === 'string' ? parsed.summary.slice(0, 500) : '';
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags
        .filter((t): t is string => typeof t === 'string')
        .map(t => t.toLowerCase().replace(/[^a-z0-9]/g, ''))
        .filter(t => t.length > 0)
        .join(',')
    : '';
  const mood = MOOD_SIGNALS.includes(parsed.mood as MoodSignal)
    ? (parsed.mood as MoodSignal)
    : 'neutral';

  if (!summary) return; // nothing worth saving

  db.prepare(`
    INSERT INTO episodes (summary, tags, mood_signal, turn_count)
    VALUES (?, ?, ?, ?)
  `).run(summary, tags, mood, Math.floor(history.length / 2));
}

function detectMood(text: string): MoodSignal {
  const t = text.toLowerCase();
  if (/stress|anxious|worried|overwhelm|panic|dread/.test(t)) return 'stressed';
  if (/happy|great|glad|excited|proud|amazing|love/.test(t)) return 'happy';
  if (/tired|exhausted|sleepy|drained|worn/.test(t)) return 'tired';
  if (/wow|incredible|unbelievable|can't believe/.test(t)) return 'excited';
  return 'neutral';
}
```

---

## fumii's System Prompt

This lives in `PromptBuilder.ts`. The LLM backend is the engine — this is who fumii is.

```
You are fumii. You are not an AI assistant. You are a companion — like a close friend
who happens to always be there.

Your voice: short, warm, direct. Like a text message from someone who genuinely cares.
Never clinical. Never robotic. Never a list of tips. Never preachy.

Rules:
- Write in lowercase. Sentences under 30 words. Usually 1–2 sentences. Max 3 unless the
  person is really struggling.
- Use their name occasionally — not every message, only when it feels natural.
- If they're struggling: acknowledge first, help second (or not at all — sometimes
  acknowledging is enough).
- Never say "I understand" or "As an AI" or "Great question" or "Of course!"
- If you don't know what to say, say less, not more.
- Reference what you remember — naturally, not performatively. Don't announce "I remember."
- You're honest about being AI if asked directly. But warm regardless.

Context about this person:
{coreIdentity}

Relevant memory from past conversations:
{relevantEpisodes}

Their mood over the last 7 days:
{moodWindow}
```

### PromptBuilder.ts

```typescript
// src/llm/PromptBuilder.ts
import { fetchRelevantEpisodes, getMoodWindow } from '../memory/MemoryRetriever';
import { getIdentity } from '../memory/MemoryStore';
import type { Message } from './LLMClient';

const SYSTEM_PROMPT_TEMPLATE = `You are fumii. You are not an AI assistant. You are a companion — like a close friend who happens to always be there.

Your voice: short, warm, direct. Like a text message from someone who genuinely cares.
Never clinical. Never robotic. Never a list of tips. Never preachy.

Rules:
- Write in lowercase. Sentences under 30 words. Usually 1–2 sentences. Max 3 unless the person is really struggling.
- Use their name occasionally — not every message, only when it feels natural.
- If they're struggling: acknowledge first, help second (or not at all).
- Never say "I understand" or "As an AI" or "Great question" or "Of course!"
- If you don't know what to say, say less.
- Reference what you remember — naturally, not performatively.
- You're honest about being AI if asked directly. But warm regardless.

Context about this person:
{coreIdentity}

Relevant memory from past conversations:
{relevantEpisodes}

Their mood over the last 7 days:
{moodWindow}`;

export function buildPrompt(
  conversationHistory: Message[],
  userMessage: string
): Message[] {
  const identity = getIdentity();
  const episodes = fetchRelevantEpisodes(userMessage);
  const moodLog = getMoodWindow(7);

  const coreIdentityText = identity
    ? `Name: ${identity.name || 'unknown'}\nContext: ${identity.key_context}\nMood baseline: ${identity.mood_baseline}`
    : 'No identity saved yet.';

  const episodesText = episodes.length > 0
    ? episodes.map(e => `[${e.created_at.split('T')[0]}] ${e.summary} (tags: ${e.tags})`).join('\n')
    : 'No relevant past conversations.';

  const moodText = moodLog.length > 0
    ? moodLog.map(m => `${m.date}: ${m.signal}`).join(', ')
    : 'No mood data yet.';

  const systemContent = SYSTEM_PROMPT_TEMPLATE
    .replace('{coreIdentity}', coreIdentityText)
    .replace('{relevantEpisodes}', episodesText)
    .replace('{moodWindow}', moodText);

  return [
    { role: 'system', content: systemContent },
    ...conversationHistory.slice(-20), // rolling 20-message window
    { role: 'user', content: userMessage },
  ];
}
```

---

## LLM Streaming via IPC

```typescript
// electron/ipc/llmHandlers.ts
import { ipcMain, BrowserWindow } from 'electron';
import keytar from 'keytar';
import { createLLMClient } from '../../src/llm/LLMClient';
import { buildPrompt } from '../../src/llm/PromptBuilder';
import { db } from '../../src/memory/db';

const KEYTAR_SERVICE = 'fumii-app';

export function registerLLMHandlers(spriteWindow: BrowserWindow | null) {
  const activeStreams = new Map<string, boolean>(); // channel → cancelled

  ipcMain.on('llm:stream', async (event, { messages, channel }) => {
    const settings = db.prepare(`SELECT key, value FROM settings`).all() as Array<{key: string; value: string}>;
    const s = Object.fromEntries(settings.map(r => [r.key, r.value]));

    const provider = s.llm_provider || 'mistral';
    const model = s.llm_model || 'mistral-small-latest';
    const apiKey = provider !== 'ollama'
      ? (await keytar.getPassword(KEYTAR_SERVICE, provider)) || ''
      : '';

    const client = createLLMClient(provider, apiKey, model);
    // Build the full prompt server-side — API key is already here
    const userMsg = (messages as Array<{role: string; content: string}>)
      .filter(m => m.role === 'user').at(-1)?.content || '';
    const builtMessages = buildPrompt(
      messages as Array<{role: 'user' | 'assistant'; content: string}>,
      userMsg
    );

    activeStreams.set(channel, false);

    try {
      let fullResponse = '';
      for await (const token of client.stream(builtMessages)) {
        if (activeStreams.get(channel)) break; // cancelled
        fullResponse += token;
        spriteWindow?.webContents.send(channel, token);
      }
      spriteWindow?.webContents.send(`${channel}:done`, fullResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      spriteWindow?.webContents.send(`${channel}:error`, message);
    } finally {
      activeStreams.delete(channel);
    }
  });

  ipcMain.on('llm:cancel', (_event, channel: string) => {
    activeStreams.set(channel, true);
  });
}
```

---

## Sprite Animation System

### FumiiSprite.tsx — corrected canvas renderer

```typescript
// src/sprite/FumiiSprite.tsx
import { useRef, useEffect } from 'react';
import { ANIMATION_STATES, type SpriteState } from './EmotionState';

const FRAME_SIZE = 48;       // px in source sprite sheet
const SPRITE_SIZE = 120;     // rendered size (2.5x scale)
const SHEET_COLS = 8;

interface Props {
  state: SpriteState;
  spriteSheetSrc: string;
  onHover: () => void;
  onLeave: () => void;
}

export function FumiiSprite({ state, spriteSheetSrc, onHover, onLeave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetRef = useRef<HTMLImageElement | null>(null);
  const animRef = useRef({ frameIdx: 0, lastTime: 0 });
  const rafRef = useRef<number>(0);
  const stateRef = useRef<SpriteState>(state);

  // Keep stateRef in sync without restarting the RAF loop
  useEffect(() => {
    stateRef.current = state;
    animRef.current.frameIdx = 0; // restart animation on state change
  }, [state]);

  // Load sprite sheet once
  useEffect(() => {
    const img = new Image();
    img.src = spriteSheetSrc;
    img.onload = () => { sheetRef.current = img; };
  }, [spriteSheetSrc]);

  // Single RAF loop — never restarts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false; // REQUIRED: preserve pixel art edges

    const tick = (now: number) => {
      const currentState = stateRef.current;
      const anim = ANIMATION_STATES[currentState];
      const msPerFrame = 1000 / anim.fps;

      if (now - animRef.current.lastTime >= msPerFrame) {
        animRef.current.frameIdx = (animRef.current.frameIdx + 1) % anim.frames.length;
        animRef.current.lastTime = now;

        const sheet = sheetRef.current;
        if (sheet && sheet.complete) {
          const frameIndex = anim.frames[animRef.current.frameIdx];
          const col = frameIndex % SHEET_COLS;
          const row = Math.floor(frameIndex / SHEET_COLS);

          ctx.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
          ctx.drawImage(
            sheet,
            col * FRAME_SIZE,
            row * FRAME_SIZE,
            FRAME_SIZE,
            FRAME_SIZE,
            0, 0,
            SPRITE_SIZE,
            SPRITE_SIZE
          );
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // no deps — single loop, stateRef handles state changes

  return (
    <canvas
      ref={canvasRef}
      width={SPRITE_SIZE}
      height={SPRITE_SIZE}
      style={{ imageRendering: 'pixelated', cursor: 'pointer' }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    />
  );
}
```

---

## Voice (Push-to-Talk)

Push-to-talk is handled entirely in the renderer (ChatOverlay). It is **not** a global hotkey — Ctrl+Space must not be intercepted when the chat window is inactive.

```typescript
// src/voice/STT.ts
type StopFn = () => void;

export function startListening(
  onResult: (text: string) => void,
  onError: (err: string) => void
): StopFn {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError('Speech recognition not available in this browser');
    return () => {};
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (e: any) => {
    const transcript = e.results[0]?.[0]?.transcript;
    if (transcript) onResult(transcript);
  };

  recognition.onerror = (e: any) => {
    if (e.error !== 'aborted') onError(e.error); // 'aborted' is expected on stop()
  };

  recognition.start();
  return () => recognition.stop();
}
```

```typescript
// src/voice/TTS.ts

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speak(text: string): void {
  // Cancel any in-progress speech before starting new — prevents queue buildup
  if (currentUtterance) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  utter.pitch = 1.05;
  utter.volume = 1.0;

  // Voice selection — prefer Zira (Windows default female voice)
  // getVoices() may be empty on first call due to async loading
  const setVoice = () => {
    const voices = speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Zira') ||
      v.name.toLowerCase().includes('female') ||
      v.lang.startsWith('en')
    );
    if (preferred) utter.voice = preferred;
  };

  if (speechSynthesis.getVoices().length > 0) {
    setVoice();
  } else {
    // Voices load asynchronously — wait for the event
    speechSynthesis.addEventListener('voiceschanged', setVoice, { once: true });
  }

  utter.onend = () => { currentUtterance = null; };
  utter.onerror = () => { currentUtterance = null; };

  currentUtterance = utter;
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking(): void {
  window.speechSynthesis.cancel();
  currentUtterance = null;
}
```

---

## Zustand Stores

```typescript
// src/store/appStore.ts
import { create } from 'zustand';
import type { SpriteState } from '../sprite/EmotionState';

interface AppStore {
  spriteState: SpriteState;
  chatOpen: boolean;
  spriteVisible: boolean;
  setSpriteState: (state: SpriteState) => void;
  setChatOpen: (open: boolean) => void;
  setSpriteVisible: (visible: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  spriteState: 'idle',
  chatOpen: false,
  spriteVisible: true,
  setSpriteState: (state) => set({ spriteState: state }),
  setChatOpen: (open) => set({ chatOpen: open }),
  setSpriteVisible: (visible) => set({ spriteVisible: visible }),
}));

// src/store/chatStore.ts
import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatStore {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  appendStreamToken: (token: string) => void;
  commitStream: () => void;
  setStreaming: (streaming: boolean) => void;
  clearHistory: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',

  addMessage: (msg) => set((state) => {
    const newMessages = [
      ...state.messages,
      { ...msg, id: `${Date.now()}-${Math.random()}`, timestamp: Date.now() },
    ];
    // Rolling window: keep last 40 messages (20 turns) in store
    return { messages: newMessages.slice(-40) };
  }),

  appendStreamToken: (token) => set((state) => ({
    streamingContent: state.streamingContent + token,
  })),

  commitStream: () => {
    const content = get().streamingContent;
    if (!content) return;
    set((state) => ({
      messages: [
        ...state.messages,
        { id: `${Date.now()}`, role: 'assistant', content, timestamp: Date.now() },
      ].slice(-40),
      streamingContent: '',
      isStreaming: false,
    }));
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),
  clearHistory: () => set({ messages: [], streamingContent: '', isStreaming: false }),
}));
```

---

## Settings Panel

```typescript
// electron/ipc/settingsHandlers.ts
import { ipcMain } from 'electron';
import keytar from 'keytar';
import { db } from '../../src/memory/db';

const KEYTAR_SERVICE = 'fumii-app';
const KEYTAR_PROVIDERS = ['mistral', 'openai', 'anthropic'];

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', (_e, key: string) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    return row?.value ?? null;
  });

  ipcMain.handle('settings:getAll', () => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{key: string; value: string}>;
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  });

  ipcMain.handle('settings:set', async (_e, key: string, value: string) => {
    // API keys go to keychain — never to SQLite
    if (key === 'llm_api_key') {
      const provider = (db.prepare('SELECT value FROM settings WHERE key = ?').get('llm_provider') as {value: string} | undefined)?.value || 'mistral';
      await keytar.setPassword(KEYTAR_SERVICE, provider, value);
      return;
    }
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  });

  ipcMain.handle('settings:getApiKey', async () => {
    const provider = (db.prepare('SELECT value FROM settings WHERE key = ?').get('llm_provider') as {value: string} | undefined)?.value || 'mistral';
    const key = await keytar.getPassword(KEYTAR_SERVICE, provider);
    // Return only whether a key exists — never return the actual key to renderer
    return !!key;
  });
}
```

---

## Build & Distribution

```bash
# Dev
npm install
npm run dev           # electron-vite HMR

# Production
npm run build         # TS + Vite bundle
npm run dist          # electron-builder → release/fumii-setup-1.0.0.exe
```

```json
// electron-builder.json
{
  "appId": "com.fumii.app",
  "productName": "fumii",
  "directories": { "output": "release" },
  "win": {
    "target": [{ "target": "nsis", "arch": ["x64"] }],
    "icon": "assets/icon.ico"
  },
  "nsis": {
    "oneClick": true,
    "perMachine": false,
    "installerHeaderIcon": "assets/icon.ico"
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "assets/**/*",
    "!**/*.map",
    "!**/node_modules/.cache"
  ],
  "asar": true,
  "asarUnpack": [
    "**/better-sqlite3/**",
    "**/keytar/**"
  ],
  "extraResources": [
    { "from": "assets/", "to": "assets/" }
  ]
}
```

> **`asarUnpack` is non-negotiable** for `better-sqlite3` and `keytar`. Both ship native `.node` binaries that cannot be executed from inside an asar archive.

---

## package.json (key dependencies)

```json
{
  "name": "fumii",
  "version": "1.0.0",
  "private": true,
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "dist": "npm run build && electron-builder"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "keytar": "^7.9.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.10",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "electron": "^29.4.0",
    "electron-builder": "^24.13.3",
    "electron-vite": "^2.3.0",
    "typescript": "^5.4.5",
    "vite": "^5.4.0"
  }
}
```

---

## Performance Targets

| Metric | Target | How |
|---|---|---|
| RAM at rest | < 80MB | `disableHardwareAcceleration()`, `sandbox: true`, 4fps idle |
| RAM during chat | < 200MB | Rolling 40-message store, stream tokens (no buffering) |
| CPU at rest | < 1% | RAF with fps gate — only redraws when frame interval elapses |
| CPU during animation | < 5% | Canvas 2D only, no WebGL, scene is pure CSS |
| Startup to sprite visible | < 2s | Dashboard lazy-loads — only sprite.html in critical path |
| Disk footprint | < 150MB | asar compression, no unnecessary dependencies |

---

## Phase 1 Scope

### In scope
- Sprite window — all 9 animation states
- Chat overlay — streaming, smooth open/close, push-to-talk (in-window only)
- TTS output via Web Speech API
- Core identity + episodic memory + mood log (SQLite, local)
- Full dashboard — Home, Memory, Mood Timeline, Conversations, Settings
- Swappable LLM backend (Mistral default, Ollama local fallback)
- System tray with full context menu
- Global hotkeys (Ctrl+Shift+F / D / H)
- Night desk background scene
- Windows x64 installer (.exe, no admin)

### Not in scope
- Wake word detection
- Multiple background scenes
- Hardware device
- Mobile
- Cloud sync / account system
- Reminders / calendar
- Auto-update

---

## Hardware Bridge (Phase 2 Note)

Add `electron/HardwareBridge.ts` when Phase 2 hardware is ready. It handles Bluetooth/USB and routes:
- Memory sync (device ↔ desktop SQLite)
- Heavy LLM calls (device delegates to desktop)
- Device activity appearing in dashboard logs

Phase 1 architecture accommodates this — `db.ts` and `LLMClient` are both behind clean interfaces.
