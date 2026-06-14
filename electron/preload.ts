import { contextBridge, ipcRenderer } from 'electron'

// ── IPC Bridge ─────────────────────────────────────────────────────────────
// The ONLY way renderers communicate with the main process.
// contextIsolation = true ensures this is the sole bridge.

contextBridge.exposeInMainWorld('fumiiAPI', {
  // Sprite window controls
  sprite: {
    setMouseEvents: (enabled: boolean) =>
      ipcRenderer.send('sprite:set-mouse-events', enabled),
    toggleChat: (open: boolean) =>
      ipcRenderer.send('chat:toggle', open),
    sleep: () => ipcRenderer.send('sprite:sleep'),
    wake:  () => ipcRenderer.send('sprite:wake')
  },

  // Dashboard
  dashboard: {
    open: () => ipcRenderer.send('dashboard:open')
  },

  // Frameless window controls (dashboard titlebar)
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close:    () => ipcRenderer.send('window:close')
  },

  // Memory — all DB operations are main-process only
  memory: {
    getCoreIdentity:  ()              => ipcRenderer.invoke('memory:get-core-identity'),
    setCoreIdentity:  (data: unknown) => ipcRenderer.invoke('memory:set-core-identity', data),
    getEpisodes:      (limit?: number) => ipcRenderer.invoke('memory:get-episodes', limit),
    searchEpisodes:   (q: string)     => ipcRenderer.invoke('memory:search-episodes', q),
    getMoodLog:       (days?: number) => ipcRenderer.invoke('memory:get-mood-log', days),
    clearAll:         ()              => ipcRenderer.invoke('memory:clear-all'),
    getTranscripts:   (id: number)    => ipcRenderer.invoke('memory:get-transcripts', id),
    observeTurn:      (date: string, signal: string, source: string) =>
                        ipcRenderer.invoke('memory:observe-turn', date, signal, source),
    saveEpisode:      (summary: string, tags: string, mood: string, turns: number) =>
                        ipcRenderer.invoke('memory:save-episode', summary, tags, mood, turns)
  },

  // LLM — API keys never touch the renderer
  llm: {
    sendMessage: (
      messages: Array<{ role: string; content: string }>,
      config: Record<string, unknown>
    ) => ipcRenderer.invoke('llm:send-message', messages, config),

    streamMessage: (
      messages: Array<{ role: string; content: string }>,
      config: Record<string, unknown>,
      onChunk: (chunk: string | null) => void
    ): Promise<string> => {
      const channel = `llm:stream:${Date.now()}:${Math.random().toString(36).slice(2)}`
      ipcRenderer.on(channel, (_e, chunk: string | null) => onChunk(chunk))
      return ipcRenderer
        .invoke('llm:stream-message', messages, config, channel)
        .finally(() => ipcRenderer.removeAllListeners(channel))
    },

    getProviders: () => ipcRenderer.invoke('llm:get-providers')
  },

  // Settings
  settings: {
    get:       (key: string)                => ipcRenderer.invoke('settings:get', key),
    set:       (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAll:    ()                           => ipcRenderer.invoke('settings:get-all'),
    getApiKey: (provider: string)           => ipcRenderer.invoke('settings:get-api-key', provider),
    setApiKey: (provider: string, key: string) =>
                 ipcRenderer.invoke('settings:set-api-key', provider, key),
    detectClaudeCode: () => ipcRenderer.invoke('settings:detectClaudeCode')
  },

  // Listen for events pushed from main → renderer
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const allowed = [
      'emotion:update',
      'hotkey:toggle-chat',
      'navigate',
      'memory:cleared',
      'sprite:walk-direction',
      'sprite:status'
    ]
    if (!allowed.includes(channel)) return
    ipcRenderer.on(channel, (_e, ...args) => callback(...args))
  },

  off: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
})

// Hook the EpisodicLogger's fire-and-forget calls into IPC
// These are set on window directly since contextBridge only exposes named objects
contextBridge.exposeInMainWorld('__fumiiObserveTurn', (
  date: string, signal: string, source: string
) => {
  ipcRenderer.invoke('memory:observe-turn', date, signal, source).catch(() => {})
})

contextBridge.exposeInMainWorld('__fumiiSaveEpisode', (
  summary: string, tags: string, mood: string, turns: number
) => {
  ipcRenderer.invoke('memory:save-episode', summary, tags, mood, turns).catch(() => {})
})
