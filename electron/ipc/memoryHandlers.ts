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

export function registerMemoryHandlers(): void {
  ipcMain.handle('memory:get-core-identity', () => getCoreIdentity())

  ipcMain.handle('memory:set-core-identity', (_e, data) => {
    setCoreIdentity(data)
    return true
  })

  ipcMain.handle('memory:get-episodes', (_e, limit = 50) => getEpisodes(limit))

  ipcMain.handle('memory:search-episodes', (_e, query: string) => searchEpisodes(query))

  ipcMain.handle('memory:get-mood-log', (_e, days = 30) => getMoodLog(days))

  ipcMain.handle('memory:get-transcripts', (_e, episodeId: number) =>
    getTranscripts(episodeId)
  )

  // Called from renderer after each conversation turn
  ipcMain.handle('memory:observe-turn', (_e, date: string, signal: string, source: string) => {
    upsertMoodLog(signal, source)
    return true
  })

  // Called from renderer after session ends and LLM summarization completes
  ipcMain.handle(
    'memory:save-episode',
    (_e, summary: string, tags: string, mood: string, turnCount: number) => {
      insertEpisode(summary, tags, mood, turnCount)
      return true
    }
  )

  // clear-all is handled in main.ts (needs dialog) — handler is registered there
}
