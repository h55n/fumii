/**
 * TypeScript declarations for the fumii preload bridge.
 * window.fumiiAPI is injected by electron/preload.ts via contextBridge.
 */
export {}

import type { CoreIdentity, Episode, MoodLog, Transcript } from './memory/types'

declare global {
  interface Window {
    fumiiAPI: {
      sprite: {
        setMouseEvents: (enabled: boolean) => void
        toggleChat:     (open: boolean)    => void
      }
      dashboard: {
        open: () => void
      }
      window: {
        minimize: () => void
        maximize: () => void
        close:    () => void
      }
      memory: {
        getCoreIdentity:  ()                      => Promise<CoreIdentity | null>
        setCoreIdentity:  (data: Partial<CoreIdentity>) => Promise<void>
        getEpisodes:      (limit?: number)        => Promise<Episode[]>
        searchEpisodes:   (query: string)         => Promise<Episode[]>
        getMoodLog:       (days?: number)         => Promise<MoodLog[]>
        clearAll:         ()                      => Promise<boolean>
        getTranscripts:   (episodeId: number)     => Promise<Transcript[]>
        observeTurn:      (date: string, signal: string, source: string) => Promise<void>
        saveEpisode:      (summary: string, tags: string, mood: string, turns: number) => Promise<void>
      }
      llm: {
        sendMessage: (
          messages: Array<{ role: string; content: string }>,
          config: Record<string, unknown>
        ) => Promise<string>
        streamMessage: (
          messages: Array<{ role: string; content: string }>,
          config: Record<string, unknown>,
          onChunk: (chunk: string | null) => void
        ) => Promise<string>
        getProviders: () => Promise<Array<{ id: string; name: string; defaultModel: string }>>
      }
      settings: {
        get:       (key: string)                => Promise<string | null>
        set:       (key: string, value: string) => Promise<boolean>
        getAll:    ()                           => Promise<Record<string, string>>
        getApiKey: (provider: string)           => Promise<string>
        setApiKey: (provider: string, key: string) => Promise<boolean>
      }
      on:  (channel: string, callback: (...args: unknown[]) => void) => void
      off: (channel: string) => void
    }

    // Internal helpers wired by preload for EpisodicLogger (renderer-safe)
    __fumiiObserveTurn: (date: string, signal: string, source: string) => void
    __fumiiSaveEpisode: (summary: string, tags: string, mood: string, turns: number) => void
  }
}
