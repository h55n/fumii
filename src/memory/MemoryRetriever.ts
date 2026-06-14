import { fetchRelevantEpisodes, getMoodWindow, getCoreIdentity } from './MemoryStore'
import type { CoreIdentity, Episode, MoodLog } from './types'

export interface MemoryContext {
  coreIdentity: CoreIdentity | null
  relevantEpisodes: Episode[]
  moodWindow: MoodLog[]
}

export function buildMemoryContext(userMessage: string): MemoryContext {
  return {
    coreIdentity: getCoreIdentity(),
    relevantEpisodes: fetchRelevantEpisodes(userMessage, 3),
    moodWindow: getMoodWindow(7)
  }
}

export function formatCoreIdentity(identity: CoreIdentity | null): string {
  if (!identity || !identity.name) return 'No profile yet — this is a new user.'

  let ctx = `Name: ${identity.name}`
  if (identity.age_hint) ctx += `\nAge range: ${identity.age_hint}`
  if (identity.mood_baseline) ctx += `\nMood baseline: ${identity.mood_baseline}`

  try {
    const keyCtx = JSON.parse(identity.key_context || '{}')
    if (keyCtx.projects?.length) ctx += `\nCurrent projects: ${keyCtx.projects.join(', ')}`
    if (keyCtx.people?.length) ctx += `\nKey people in their life: ${keyCtx.people.join(', ')}`
  } catch {}

  return ctx
}

export function formatRelevantEpisodes(episodes: Episode[]): string {
  if (episodes.length === 0) return 'No relevant past conversations found.'
  return episodes.map(ep => {
    const date = new Date(ep.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `[${date}] ${ep.summary} (tags: ${ep.tags})`
  }).join('\n')
}

export function formatMoodWindow(moods: MoodLog[]): string {
  if (moods.length === 0) return 'No mood data yet.'
  return moods
    .slice(0, 7)
    .map(m => {
      const day = new Date(m.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      return `${day}: ${m.signal}`
    })
    .join('\n')
}
