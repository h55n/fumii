import type { IpcMain, BrowserWindow } from 'electron';
import type Database from 'better-sqlite3';
import { LLMService, type ChatMessage } from '../services/LLMService';
import { MemoryService } from '../services/MemoryService';
import { buildPrompt } from '../promptBuilder';
import type { KokoroTTSService } from '../services/KokoroTTSService';
import type { AudioStreamer } from '../services/AudioStreamer';
import {
  getSetting,
  upsertTodayMood,
  getMoodLog,
  startSession,
  bumpSessionTurn,
  addTranscript,
  recordMemoryCitations
} from '../db/queries';


type Deps = {
  llm: LLMService;
  memory: MemoryService;
  db: Database.Database;
  getSpriteWindow: () => BrowserWindow | null;
  // Present only when ENABLE_HARDWARE=1 (main.ts) — when set, the assistant's
  // full response is also synthesized to the device speaker (PRD §16 Flow B,
  // "After LLM response complete"). Optional so Phase 1 users never pay for
  // Python/Kokoro setup they don't need.
  hardware?: { kokoro: KokoroTTSService; audioStreamer: AudioStreamer };
};

const activeStreams = new Map<string, AbortController>();
let currentSessionId: number | null = null;

function detectMood(text: string): 'stressed' | 'happy' | 'tired' | 'neutral' | 'excited' {
  const t = text.toLowerCase();
  // 1. Excited / Major wins / Celebrations (e.g. "got the job", "got the internship", "celebrating")
  if (/excited|can't wait|amazing|incredible|huge news|got the (?:job|internship|offer|role)|celebrat/.test(t)) return 'excited';
  // 2. Relieved / Content / Happy / Small Wins
  if (/finally done|done with|relieved|passed|won|got the|great day|good day|proud|awesome|peaceful|glad|happy/.test(t)) return 'happy';
  // 3. Tired / Burnout / Sleep deprivation (e.g. "haven't slept", "no sleep", "exhausted")
  if (/tired|exhausted|sleepy|late night|no sleep|haven'?t slept|lack of sleep|burnout|drained|empty|dissociat/.test(t)) return 'tired';
  // 4. Overwhelmed / Anxious / Spiralling / Stress / Fear / Anger
  if (/stress|overwhelm|anxious|spirall?ing|worried|exam|deadline|panic|scared|dreading|failing|guilt|angry|infuriat|pissed/.test(t)) return 'stressed';
  return 'neutral';
}

function moodWindowString(db: Database.Database): string {
  const days = getMoodLog(db, 7).reverse();
  if (!days.length) return '';
  const short = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short' });
  return days.map((d) => `${short(d.date)}: ${d.signal}`).join('. ');
}

export function registerLLMHandlers(ipcMain: IpcMain, deps: Deps) {
  const { llm, memory, db } = deps;

  ipcMain.on('llm:stream', async (event, streamId: string, messages: ChatMessage[]) => {
    const sender = event.sender;
    const controller = new AbortController();
    activeStreams.set(streamId, controller);

    try {
      const mode = (getSetting(db, 'active_mode') as 'companion' | 'assistant') ?? 'companion';
      const userMessage = messages[messages.length - 1]?.content ?? '';

      const { profile, relationshipStage, searchResults } = await memory.profile(userMessage);

      // ── Provenance: record which memory IDs shaped this response ────────────
      // Fire-and-forget — never blocks streaming. Only IDs that exist are tracked.
      const citedIds = searchResults.map((r: any) => r.id).filter(Boolean) as string[];
      if (citedIds.length) recordMemoryCitations(db, citedIds);
      // ────────────────────────────────────────────────────────────────────────

      const prompt = buildPrompt({
        mode,
        identity: profile.static,
        recentContext: profile.dynamic,
        relevantMemories: searchResults.map((r) => r.content),
        relationshipStage,
        moodWindow: mode === 'companion' ? moodWindowString(db) : undefined,
        history: messages.slice(0, -1),
        userMessage
      });

      if (currentSessionId === null) currentSessionId = startSession(db, mode);

      // Temperature: 0.87 for companion (warmth, philosophy, natural variance) vs 0.67 for assistant (PRD §7)
      const temperature = mode === 'companion' ? 0.87 : 0.67;
      const maxTokens = 250;

      let full = '';
      full = await llm.chatStream(
        prompt,
        (token) => {
          sender.send('llm:token', streamId, token);
        },
        controller.signal,
        { temperature, maxTokens }
      );

      if (controller.signal.aborted) {
        return;
      }

      sender.send('llm:done', streamId, full);

      // Post-response bookkeeping — mirrors PRD §16 Flow A
      if (getSetting(db, 'save_transcripts') === 'true') {
        addTranscript(db, currentSessionId, 'user', userMessage);
        addTranscript(db, currentSessionId, 'assistant', full);
      }
      bumpSessionTurn(db, currentSessionId);

      if (mode === 'companion') {
        upsertTodayMood(db, detectMood(userMessage), userMessage);
        await memory.add(`User: ${userMessage}\nfumii: ${full}`);
      }

      // Hardware TTS path — mirrors PRD §16 Flow B tail end. Silently
      // skipped if Kokoro isn't set up; desktop chat already spoke the
      // response via Web Speech API regardless.
      if (deps.hardware && !controller.signal.aborted) {
        deps.hardware.kokoro
          .synthesize(full)
          .then((pcm) => {
            if (controller.signal.aborted) return;
            deps.hardware!.audioStreamer.sendOutputHeader();
            // KokoroTTSService.chunk is a static utility — use the concrete
            // class from the import above instead of a dynamic require().
            const chunkSize = 512; // PRD §29 — 512-byte chunks over WebSocket
            for (let i = 0; i < pcm.length; i += chunkSize) {
              if (controller.signal.aborted) break;
              deps.hardware!.audioStreamer.sendAudioChunk(pcm.slice(i, i + chunkSize));
            }
          })
          .catch(() => {
            /* kokoro not installed — device just stays silent for this turn */
          });
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        sender.send('llm:error', streamId, err?.message ?? 'unknown error');
      }
    } finally {
      activeStreams.delete(streamId);
    }
  });

  ipcMain.on('llm:cancel', (_event, streamId: string) => {
    activeStreams.get(streamId)?.abort();
    activeStreams.delete(streamId);
  });
}
