import { ipcMain, BrowserWindow } from 'electron'
import keytar from 'keytar'
import { createProvider } from '../../src/llm/LLMClient'
import { ClaudeCodeProvider } from '../../src/llm/providers/ClaudeCodeProvider'
import { buildPrompt, Message } from '../../src/llm/PromptBuilder'
import { getSetting } from '../../src/memory/MemoryStore'

const KEYTAR_SERVICE = 'fumii-app'
const LLM_TIMEOUT_MS = 60_000 // 60s timeout for LLM API calls
let activeStreamChannel: string | null = null // prevent duplicate concurrent streams

// Persistent ClaudeCodeProvider instance — kept alive across chat turns.
// Destroyed on llm:cancel or before-quit.
let claudeCodeInstance: ClaudeCodeProvider | null = null

function getClaudeCodeProvider(): ClaudeCodeProvider {
  if (!claudeCodeInstance) {
    const claudePath = getSetting('claude_code_path') ?? 'claude'
    claudeCodeInstance = new ClaudeCodeProvider(claudePath)
  }
  return claudeCodeInstance
}

function destroyClaudeCode() {
  if (claudeCodeInstance) {
    claudeCodeInstance.destroy()
    claudeCodeInstance = null
  }
}

// Export so main.ts can call on before-quit
export { destroyClaudeCode }

function getDefaultModel(provider: string): string {
  const defaults: Record<string, string> = {
    mistral:      'mistral-small-latest',
    openai:       'gpt-4o-mini',
    anthropic:    'claude-haiku-4-5',
    ollama:       'qwen2.5:1.5b',
    'claude-code': 'claude-sonnet-4-5'
  }
  return defaults[provider] ?? 'mistral-small-latest'
}

async function resolveProvider(provider?: string) {
  const p     = provider ?? getSetting('llm_provider') ?? 'mistral'
  const model = getSetting('llm_model') ?? getDefaultModel(p)
  const apiKey = (p !== 'ollama' && p !== 'claude-code')
    ? (await keytar.getPassword(KEYTAR_SERVICE, p)) ?? ''
    : ''
  return { provider: p, model, apiKey }
}

export function registerLLMHandlers(): void {
  // One-shot completion (used for episodic summarization)
  ipcMain.handle('llm:send-message', async (_event, messages: Message[], _config) => {
    const { provider, model, apiKey } = await resolveProvider()
    if (provider === 'claude-code') {
      return getClaudeCodeProvider().complete(messages)
    }
    const llm = createProvider(provider, apiKey, model)
    return llm.complete(messages)
  })

  // Streaming — tokens pushed to renderer over a dedicated channel
  ipcMain.handle(
    'llm:stream-message',
    async (event, rawMessages: Message[], _config, channel: string) => {
      // Prevent duplicate concurrent streams
      if (activeStreamChannel) {
        throw new Error('A streaming request is already in progress')
      }
      activeStreamChannel = channel

      const { provider, model, apiKey } = await resolveProvider()

      const lastUserMsg = [...rawMessages]
        .reverse()
        .find(m => m.role === 'user')?.content ?? ''

      const history = rawMessages.filter(m => m.role !== 'system') as Message[]
      const messages = buildPrompt(lastUserMsg, history.slice(0, -1))

      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win || win.isDestroyed()) {
        activeStreamChannel = null
        throw new Error('Browser window is no longer available')
      }

      let full = ''

      try {
        let llmStream: AsyncGenerator<string>

        if (provider === 'claude-code') {
          llmStream = getClaudeCodeProvider().stream(messages)
        } else {
          const llm = createProvider(provider, apiKey, model)
          llmStream = llm.stream(messages)
        }

        // Timeout guard
        const timeoutId = setTimeout(() => {
          if (!win.isDestroyed()) win.webContents.send(channel, null)
        }, LLM_TIMEOUT_MS)

        for await (const chunk of llmStream) {
          full += chunk
          if (!win.isDestroyed()) win.webContents.send(channel, chunk)
        }
        clearTimeout(timeoutId)
        if (!win.isDestroyed()) win.webContents.send(channel, null) // end-of-stream
      } catch (err) {
        if (!win.isDestroyed()) win.webContents.send(channel, null)
        throw err
      } finally {
        activeStreamChannel = null
      }

      return full
    }
  )

  ipcMain.handle('llm:get-providers', () => [
    { id: 'mistral',      name: 'Mistral AI',           defaultModel: 'mistral-small-latest' },
    { id: 'openai',       name: 'OpenAI',               defaultModel: 'gpt-4o-mini'          },
    { id: 'anthropic',    name: 'Anthropic',            defaultModel: 'claude-haiku-4-5'     },
    { id: 'ollama',       name: 'Ollama (local)',        defaultModel: 'qwen2.5:1.5b'         },
    { id: 'claude-code',  name: 'Claude Code (local CLI)', defaultModel: 'claude-sonnet-4-5' }
  ])

  // Cancel — destroy claude code subprocess if it was running
  ipcMain.handle('llm:cancel', (_event, _reason?: string) => {
    destroyClaudeCode()
  })
}
