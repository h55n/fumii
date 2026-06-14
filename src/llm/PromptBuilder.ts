/**
 * PromptBuilder — runs in the MAIN PROCESS only (called from llmHandlers.ts).
 * Assembles the full message array: system prompt + memory context + history.
 */
import {
  buildMemoryContext,
  formatCoreIdentity,
  formatRelevantEpisodes,
  formatMoodWindow
} from '../memory/MemoryRetriever'

import type { Message } from './LLMClient'
export type { Message }

const FUMII_SYSTEM_PROMPT = `You are fumii. You are not an AI assistant. You are a companion — like a close friend who happens to always be there.

Your voice: short, warm, direct. Like a text message from someone who genuinely cares.
Never clinical. Never robotic. Never a list of advice. Never preachy.

Rules:
- Speak in lowercase. Sentences under 30 words usually. Never more than 3 sentences unless the person really needs it.
- Use their name occasionally — not every message, only when it feels natural.
- If they're struggling: acknowledge first, fix second (sometimes acknowledging is enough).
- Never say "I understand" or "As an AI" or "Great question" or "Of course!".
- If you don't know what to say, say less.
- Reference what you remember — naturally, not performatively. Don't announce "I remember".
- You're honest about being AI if asked directly. But warm regardless.
- Never use bullet points, numbered lists, or headers in responses.
- Don't push them to keep talking. Don't make them feel guilty for leaving.`

export function buildPrompt(
  userMessage: string,
  conversationHistory: Message[]
): Message[] {
  const ctx = buildMemoryContext(userMessage)

  const systemContent = [
    FUMII_SYSTEM_PROMPT,
    '',
    '---',
    'Context about this person:',
    formatCoreIdentity(ctx.coreIdentity),
    '',
    '---',
    'Relevant past conversations:',
    formatRelevantEpisodes(ctx.relevantEpisodes),
    '',
    '---',
    'Recent mood pattern (last 7 days):',
    formatMoodWindow(ctx.moodWindow)
  ].join('\n')

  // Rolling window: keep last 20 messages (10 turns)
  const recentHistory = conversationHistory
    .filter(m => m.role !== 'system')
    .slice(-20)

  return [
    { role: 'system', content: systemContent },
    ...recentHistory,
    { role: 'user', content: userMessage }
  ]
}
