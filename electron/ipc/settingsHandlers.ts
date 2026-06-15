import { ipcMain, shell } from 'electron'
import { execSync } from 'child_process'
import { getSetting, setSetting, getAllSettings } from '../../src/memory/MemoryStore'
import keytar from 'keytar'

const KEYTAR_SERVICE = 'fumii-app'

// Allowlist of valid settings keys — prevents arbitrary SQLite writes
const VALID_SETTINGS_KEYS = new Set([
  'user_name', 'llm_provider', 'llm_model', 'sprite_position', 'sprite_scale',
  'voice_enabled', 'tts_enabled', 'save_transcripts', 'hotkey_chat',
  'chat_theme', 'completion_chime', 'sprite_drift', 'claude_code_path'
])

// Allowlist of valid LLM providers
const VALID_PROVIDERS = new Set(['mistral', 'openai', 'anthropic', 'ollama', 'claude-code'])

const MAX_SETTING_VALUE_LENGTH = 1024

// Common Windows install paths for Claude Code CLI
const CLAUDE_CODE_CANDIDATE_PATHS = [
  'claude',
  `C:\\Users\\${process.env['USERNAME']}\\AppData\\Local\\Claude\\claude.exe`,
  'C:\\Program Files\\Claude\\claude.exe',
  `C:\\Users\\${process.env['USERNAME']}\\AppData\\Roaming\\npm\\claude.cmd`,
]

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', (_event, key: string) => {
    if (typeof key !== 'string' || !VALID_SETTINGS_KEYS.has(key)) return null
    return getSetting(key)
  })

  ipcMain.handle('settings:set', (_event, key: string, value: unknown) => {
    if (typeof key !== 'string' || !VALID_SETTINGS_KEYS.has(key)) return false
    const strValue = String(value).slice(0, MAX_SETTING_VALUE_LENGTH)
    setSetting(key, strValue)
    return true
  })

  ipcMain.handle('settings:get-all', () => getAllSettings())

  // API keys go through OS keychain — never plain SQLite
  ipcMain.handle('settings:get-api-key', async (_event, provider: string) => {
    if (typeof provider !== 'string' || !VALID_PROVIDERS.has(provider)) return ''
    const key = await keytar.getPassword(KEYTAR_SERVICE, provider)
    if (key && key.length > 8) {
      return '•'.repeat(key.length - 4) + key.slice(-4)
    }
    return key ? '••••' : ''
  })

  ipcMain.handle('settings:set-api-key', async (_event, provider: string, apiKey: string) => {
    if (typeof provider !== 'string' || !VALID_PROVIDERS.has(provider)) return false
    if (!apiKey || typeof apiKey !== 'string' || apiKey.includes('•')) return false
    if (apiKey.length > 256) return false // API keys shouldn't exceed this
    await keytar.setPassword(KEYTAR_SERVICE, provider, apiKey)
    return true
  })

  // Detect Claude Code CLI in common install locations
  ipcMain.handle('settings:detectClaudeCode', async () => {
    for (const candidate of CLAUDE_CODE_CANDIDATE_PATHS) {
      try {
        execSync(`"${candidate}" --version`, { timeout: 3000, stdio: 'ignore' })
        return { found: true, path: candidate }
      } catch {
        // not at this path — try next
      }
    }
    return { found: false, path: null }
  })

  // Safe external URL opening — replaces window.open in renderer
  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    if (typeof url !== 'string') return false
    // Only allow https URLs
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:') return false
      await shell.openExternal(url)
      return true
    } catch {
      return false
    }
  })
}

