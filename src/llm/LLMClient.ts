export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LLMProvider {
  stream(messages: Message[]): AsyncGenerator<string>
  complete(messages: Message[]): Promise<string>
}

export function createProvider(name: string, apiKey: string, model: string): LLMProvider {
  switch (name) {
    case 'mistral':
      return new MistralProvider(apiKey, model)
    case 'openai':
      return new OpenAIProvider(apiKey, model)
    case 'anthropic':
      return new AnthropicProvider(apiKey, model)
    case 'ollama':
      return new OllamaProvider(model)
    case 'claude-code':
      // ClaudeCodeProvider is main-process only — instantiated directly in llmHandlers.ts.
      // This case should never be reached from createProvider, but is listed for completeness.
      throw new Error('claude-code provider must be instantiated via ClaudeCodeProvider in main process')
    default:
      throw new Error(`Unknown provider: ${name}`)
  }
}

// ── Mistral ────────────────────────────────────────────────────────────────

class MistralProvider implements LLMProvider {
  constructor(private apiKey: string, private model: string) {}

  async *stream(messages: Message[]): AsyncGenerator<string> {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
        max_tokens: 300,
        temperature: 0.85
      })
    })

    if (!res.ok) throw new Error(`Mistral error: ${res.status} ${await res.text()}`)

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') return
        try {
          const json = JSON.parse(data)
          const text = json.choices?.[0]?.delta?.content
          if (text) yield text
        } catch {}
      }
    }
  }

  async complete(messages: Message[]): Promise<string> {
    let result = ''
    for await (const chunk of this.stream(messages)) result += chunk
    return result
  }
}

// ── OpenAI ─────────────────────────────────────────────────────────────────

class OpenAIProvider implements LLMProvider {
  constructor(private apiKey: string, private model: string) {}

  async *stream(messages: Message[]): AsyncGenerator<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
        max_tokens: 300,
        temperature: 0.85
      })
    })

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') return
        try {
          const json = JSON.parse(data)
          const text = json.choices?.[0]?.delta?.content
          if (text) yield text
        } catch {}
      }
    }
  }

  async complete(messages: Message[]): Promise<string> {
    let result = ''
    for await (const chunk of this.stream(messages)) result += chunk
    return result
  }
}

// ── Anthropic ──────────────────────────────────────────────────────────────

class AnthropicProvider implements LLMProvider {
  constructor(private apiKey: string, private model: string) {}

  async *stream(messages: Message[]): AsyncGenerator<string> {
    // Anthropic requires system messages to be separate
    const systemMsg = messages.find(m => m.role === 'system')
    const chatMessages = messages.filter(m => m.role !== 'system')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        system: systemMsg?.content || '',
        messages: chatMessages,
        stream: true,
        max_tokens: 300
      })
    })

    if (!res.ok) throw new Error(`Anthropic error: ${res.status}`)

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const json = JSON.parse(line.slice(6))
          if (json.type === 'content_block_delta') yield json.delta?.text || ''
        } catch {}
      }
    }
  }

  async complete(messages: Message[]): Promise<string> {
    let result = ''
    for await (const chunk of this.stream(messages)) result += chunk
    return result
  }
}

// ── Ollama (local) ─────────────────────────────────────────────────────────

class OllamaProvider implements LLMProvider {
  private baseUrl: string

  constructor(private model: string) {
    this.baseUrl = process.env['OLLAMA_BASE_URL'] || 'http://localhost:11434'
  }

  async *stream(messages: Message[]): AsyncGenerator<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
        options: { temperature: 0.85, num_predict: 300 }
      })
    })

    if (!res.ok) throw new Error(`Ollama error: ${res.status} — is Ollama running?`)

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder.decode(value).split('\n').filter(Boolean)
      for (const line of lines) {
        try {
          const json = JSON.parse(line)
          if (json.message?.content) yield json.message.content
        } catch {}
      }
    }
  }

  async complete(messages: Message[]): Promise<string> {
    let result = ''
    for await (const chunk of this.stream(messages)) result += chunk
    return result
  }
}
