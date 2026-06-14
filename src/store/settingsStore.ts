import { create } from 'zustand'

export type SettingKey =
  | 'user_name'
  | 'llm_provider'
  | 'llm_model'
  | 'sprite_position'
  | 'sprite_scale'
  | 'voice_enabled'
  | 'tts_enabled'
  | 'save_transcripts'
  | 'hotkey_chat'
  | 'chat_theme'
  | 'completion_chime'
  | 'sprite_drift'
  | 'claude_code_path'

export type Settings = Record<SettingKey, string>

const DEFAULTS: Settings = {
  user_name:        '',
  llm_provider:     'mistral',
  llm_model:        'mistral-small-latest',
  sprite_position:  'bottom-right',
  sprite_scale:     '1.0',
  voice_enabled:    'true',
  tts_enabled:      'true',
  save_transcripts: 'true',
  hotkey_chat:      'Ctrl+Shift+F',
  chat_theme:       'midnight',
  completion_chime: 'true',
  sprite_drift:     'true',
  claude_code_path: 'claude'
}

interface SettingsState {
  settings: Settings
  loaded:   boolean
  load:     () => Promise<void>
  set:      (key: SettingKey, value: string) => Promise<void>
  get:      (key: SettingKey) => string
}

export const useSettingsStore = create<SettingsState>((setState, getState) => ({
  settings: { ...DEFAULTS },
  loaded:   false,

  load: async () => {
    if (typeof window === 'undefined' || !window.fumiiAPI) return
    try {
      const all = await window.fumiiAPI.settings.getAll()
      setState({
        settings: { ...DEFAULTS, ...all } as Settings,
        loaded:   true
      })
    } catch {
      setState({ loaded: true })
    }
  },

  set: async (key, value) => {
    // Optimistic local update
    setState(state => ({
      settings: { ...state.settings, [key]: value }
    }))
    // Persist via IPC
    if (typeof window !== 'undefined' && window.fumiiAPI) {
      await window.fumiiAPI.settings.set(key, value)
    }
  },

  get: (key) => getState().settings[key] ?? DEFAULTS[key] ?? ''
}))
