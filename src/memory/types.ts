/**
 * Shared type definitions for fumii memory entities.
 * This file is SAFE to import in renderer processes — no electron/sqlite deps.
 * Main-process code should import from MemoryStore.ts directly for runtime functions.
 */

export interface CoreIdentity {
  id:            number
  name:          string
  age_hint:      string
  mood_baseline: string
  key_context:   string
  created_at:    string
  updated_at:    string
}

export interface Episode {
  id:          number
  summary:     string
  tags:        string
  mood_signal: string
  turn_count:  number
  created_at:  string
}

export interface MoodLog {
  id:     number
  date:   string
  signal: string
  source: string
}

export interface Transcript {
  id:         number
  episode_id: number
  role:       'user' | 'assistant'
  content:    string
  created_at: string
}

export interface Setting {
  key:   string
  value: string
}

export type MoodSignal = 'happy' | 'stressed' | 'tired' | 'neutral' | 'excited'
