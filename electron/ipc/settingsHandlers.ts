import { ipcMain } from 'electron'
import { execSync } from 'child_process'
import { getSetting, setSetting, getAllSettings } from '../../src/memory/MemoryStore'
import keytar from 'keytar'

const KEYTAR_SERVICE = 'fumii-app'

// Common Windows install paths for Claude Code CLI
const CLAUDE_CODE_CANDIDATE_PATHS = [
  'claude',
  `C:\\Users\\${process.env['USERNAME']}\\AppData\\Local\\Claude\\claude.exe`,
  'C:\\Program Files\\Claude\\claude.exe',
  `C:\\Users\\${process.env['USERNAME']}\\AppData\\Roaming\\npm\\claude.cmd`,
]

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', (_event, key: string) => getSetting(key))

  ipcMain.handle('settings:set', (_event, key: string, value: unknown) => {
    setSetting(key, String(value))
    return true
  })

  ipcMain.handle('settings:get-all', () => getAllSettings())

  // API keys go through OS keychain — never plain SQLite
  ipcMain.handle('settings:get-api-key', async (_event, provider: string) => {
    const key = await keytar.getPassword(KEYTAR_SERVICE, provider)
    if (key && key.length > 8) {
      return '•'.repeat(key.length - 4) + key.slice(-4)
    }
    return key ? '••••' : ''
  })

  ipcMain.handle('settings:set-api-key', async (_event, provider: string, apiKey: string) => {
    if (!apiKey || apiKey.includes('•')) return false
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
}

