/**
 * ClaudeCodeProvider — spawns the Claude Code CLI as a persistent subprocess.
 * Communicates via NDJSON stream on stdout / stdin.
 *
 * MAIN PROCESS ONLY — never import from renderer.
 * renderer → main via IPC → llmHandlers.ts → this class.
 */

import { spawn, ChildProcess } from 'child_process'
import type { LLMProvider, Message } from '../LLMClient'

interface NdjsonEvent {
  type: 'assistant' | 'result' | 'error' | string
  content?: string | Array<{ type: string; text?: string }>
  stop_reason?: string
  error?: { message: string }
}

export class ClaudeCodeProvider implements LLMProvider {
  private process: ChildProcess | null = null
  private buffer = ''
  private resolveQueue: Array<(value: string) => void> = []
  private rejectQueue: Array<(err: Error) => void> = []

  constructor(
    private claudePath: string = 'claude',
    private model: string = 'claude-sonnet-4-5'
  ) {}

  // Spawns the CLI if not already running. Keeps it alive for the session.
  private ensureProcess(): ChildProcess {
    if (this.process && !this.process.killed) return this.process

    this.process = spawn(this.claudePath, [
      '--output-format', 'stream-json',
      '--verbose',
      '--model', this.model,
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
      shell: true,
    })

    this.buffer = ''

    this.process.stdout?.setEncoding('utf8')
    this.process.stdout?.on('data', (chunk: string) => {
      this.buffer += chunk
      this.flushBuffer()
    })

    this.process.stderr?.on('data', (chunk: string) => {
      console.error('[fumii:claude-code] stderr:', chunk)
    })

    this.process.on('exit', (code) => {
      console.warn('[fumii:claude-code] process exited with code', code)
      this.process = null
      for (const reject of this.rejectQueue) {
        reject(new Error(`Claude Code CLI exited with code ${code}`))
      }
      this.resolveQueue = []
      this.rejectQueue = []
    })

    return this.process
  }

  // Parse complete NDJSON lines from buffer and dispatch to queued callbacks.
  private flushBuffer(): void {
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      let event: NdjsonEvent
      try {
        event = JSON.parse(trimmed)
      } catch {
        continue
      }

      if (event.type === 'result' || event.type === 'error') {
        let text = ''
        if (typeof event.content === 'string') {
          text = event.content
        } else if (Array.isArray(event.content)) {
          text = event.content
            .filter(b => b.type === 'text')
            .map(b => b.text ?? '')
            .join('')
        }
        if (event.type === 'error') {
          const err = new Error(event.error?.message ?? 'Claude Code CLI error')
          for (const reject of this.rejectQueue) reject(err)
        } else {
          for (const resolve of this.resolveQueue) resolve(text)
        }
        this.resolveQueue = []
        this.rejectQueue = []
      }
    }
  }

  // Yield result in chunks to simulate streaming in the chat UI.
  async *stream(messages: Message[]): AsyncGenerator<string> {
    const result = await this.complete(messages)
    const CHUNK = 20
    for (let i = 0; i < result.length; i += CHUNK) {
      yield result.slice(i, i + CHUNK)
      await new Promise(r => setTimeout(r, 16)) // ~60fps pacing
    }
  }

  async complete(messages: Message[]): Promise<string> {
    const proc = this.ensureProcess()
    const userMessage = messages
      .filter(m => m.role === 'user')
      .at(-1)?.content ?? ''

    return new Promise<string>((resolve, reject) => {
      this.resolveQueue.push(resolve)
      this.rejectQueue.push(reject)
      proc.stdin?.write(userMessage + '\n')
    })
  }

  // Kill the subprocess cleanly on session end or app quit.
  destroy(): void {
    if (this.process && !this.process.killed) {
      this.process.kill()
    }
    this.process = null
    // Reject any pending calls
    for (const reject of this.rejectQueue) {
      reject(new Error('Claude Code provider destroyed'))
    }
    this.resolveQueue = []
    this.rejectQueue = []
  }
}
