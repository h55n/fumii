/**
 * EpisodicLogger — renderer-safe version.
 *
 * All DB writes go through IPC (window.fumiiAPI) so this file
 * is safe to import in renderer processes (sprite window, dashboard).
 *
 * For the main-process summarisation we call llm:send-message over IPC,
 * and memory:observe-turn / memory:save-episode over IPC.
 */

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const MOOD_SIGNALS = ['stressed', 'happy', 'tired', 'neutral', 'excited'] as const
type MoodSignal = typeof MOOD_SIGNALS[number]

// ── Mood detection ─────────────────────────────────────────────────────────

export function extractMoodSignal(text: string): MoodSignal {
  const t = text.toLowerCase()
  if (/happy|great|excited|wonderful|congrat|proud|amazing|love|fantastic/.test(t)) return 'happy'
  if (/stress|anxious|worried|overwhelm|panic|dread|rough|tough/.test(t))            return 'stressed'
  if (/tired|exhausted|sleepy|drained|worn|rest/.test(t))                            return 'tired'
  if (/wow|incredible|unbelievable|can't believe|thrilled|burs/.test(t))             return 'excited'
  return 'neutral'
}

// ── Per-turn observation (renderer → IPC → main → SQLite) ─────────────────

export function observeTurn(userMessage: string, assistantResponse: string): void {
  const signal = extractMoodSignal(userMessage + ' ' + assistantResponse)
  const today  = new Date().toISOString().split('T')[0]

  // Fire-and-forget IPC write — we don't await it to keep the UI responsive
  window.fumiiAPI?.memory
    ?.getCoreIdentity()   // lightweight ping to confirm IPC is alive
    .catch(() => {})

  // Direct IPC call to the settings-like handler to upsert mood
  // We expose a dedicated handler for this (added to memoryHandlers)
  if (typeof window !== 'undefined' && (window as any).__fumiiObserveTurn) {
    ;(window as any).__fumiiObserveTurn(today, signal, userMessage.slice(0, 80))
  }
}

// ── Session summarisation (called at chat close) ────────────────────────────

export async function summarizeConversation(
  history: Message[],
  llmCall: (messages: Message[]) => Promise<string>
): Promise<void> {
  const turns = history.filter(m => m.role !== 'system')
  if (turns.length < 6) return

  const prompt: Message = {
    role: 'user',
    content:
      'Summarize this conversation in 2-3 sentences. Extract 3-5 single-word keyword tags (lowercase). ' +
      'Identify the dominant mood: stressed | happy | tired | neutral | excited.\n\n' +
      'Respond ONLY as valid JSON, no markdown fences:\n' +
      '{"summary":"...","tags":["word1","word2"],"mood":"neutral"}'
  }

  let raw = ''
  try {
    raw = await llmCall([...turns, prompt])
  } catch {
    return // non-fatal — conversation still happened, just not summarised
  }

  let parsed: { summary?: string; tags?: unknown; mood?: string } = {}
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    // Fallback: extract keywords manually
    const allText = turns.map(m => m.content).join(' ')
    parsed = {
      summary: turns.find(m => m.role === 'user')?.content.slice(0, 120) ?? 'Conversation',
      tags:    extractKeywords(allText).slice(0, 5),
      mood:    extractMoodSignal(allText)
    }
  }

  const summary = typeof parsed.summary === 'string' ? parsed.summary.slice(0, 500) : ''
  const tags    = Array.isArray(parsed.tags)
    ? (parsed.tags as unknown[])
        .filter((t): t is string => typeof t === 'string')
        .map(t => t.toLowerCase().replace(/[^a-z0-9]/g, ''))
        .filter(Boolean)
        .join(',')
    : ''
  const mood = MOOD_SIGNALS.includes(parsed.mood as MoodSignal)
    ? (parsed.mood as MoodSignal)
    : 'neutral'

  if (!summary) return

  // Save via IPC
  if (typeof window !== 'undefined' && (window as any).__fumiiSaveEpisode) {
    ;(window as any).__fumiiSaveEpisode(summary, tags, mood, Math.floor(turns.length / 2))
  }
}

// ── Keyword extraction helper ──────────────────────────────────────────────

function extractKeywords(text: string): string[] {
  const stop = new Set([
    'the','a','an','is','are','was','i','you','my','me','and','to',
    'of','in','on','it','that','this','be','have','had','has','what',
    'how','when','where','why','who','do','did','can','could','would',
    'like','just','really','very','also','about','with','from','they'
  ])
  return [...new Set(
    text.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stop.has(w))
  )]
}
