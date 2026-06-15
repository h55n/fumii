import { ipcMain } from 'electron'
import {
  getCoreIdentity,
  setCoreIdentity,
  getEpisodes,
  searchEpisodes,
  getMoodLog,
  getTranscripts,
  upsertMoodLog,
  insertEpisode
} from '../../src/memory/MemoryStore'

const VALID_MOODS = new Set(['happy', 'stressed', 'tired', 'neutral', 'excited'])
const MAX_STRING_LENGTH = 2000

export function registerMemoryHandlers(): void {
  ipcMain.handle('memory:get-core-identity', () => getCoreIdentity())

  ipcMain.handle('memory:set-core-identity', (_e, data) => {
    if (!data || typeof data !== 'object') return false
    setCoreIdentity(data)
    return true
  })

  ipcMain.handle('memory:get-episodes', (_e, limit = 50) => {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 1000))
    return getEpisodes(safeLimit)
  })

  ipcMain.handle('memory:search-episodes', (_e, query: string) => {
    if (typeof query !== 'string') return []
    return searchEpisodes(query.slice(0, 500))
  })

  ipcMain.handle('memory:get-mood-log', (_e, days = 30) => {
    const safeDays = Math.max(1, Math.min(Number(days) || 30, 365))
    return getMoodLog(safeDays)
  })

  ipcMain.handle('memory:get-transcripts', (_e, episodeId: number) => {
    const id = Number(episodeId)
    if (!Number.isInteger(id) || id < 1) return []
    return getTranscripts(id)
  })

  // Called from renderer after each conversation turn
  ipcMain.handle('memory:observe-turn', (_e, date: string, signal: string, source: string) => {
    if (typeof signal !== 'string' || !VALID_MOODS.has(signal)) return false
    const safeSource = typeof source === 'string' ? source.slice(0, 200) : ''
    upsertMoodLog(signal, safeSource)
    return true
  })

  // Called from renderer after session ends and LLM summarization completes
  ipcMain.handle(
    'memory:save-episode',
    (_e, summary: string, tags: string, mood: string, turnCount: number) => {
      if (typeof summary !== 'string' || !summary.trim()) return false
      const safeSummary = summary.slice(0, MAX_STRING_LENGTH)
      const safeTags = typeof tags === 'string' ? tags.slice(0, 500) : ''
      const safeMood = typeof mood === 'string' && VALID_MOODS.has(mood) ? mood : 'neutral'
      const safeTurns = Math.max(0, Math.min(Number(turnCount) || 0, 10000))
      insertEpisode(safeSummary, safeTags, safeMood, safeTurns)
      return true
    }
  )

  // clear-all is handled in main.ts (needs dialog) — handler is registered there
}

