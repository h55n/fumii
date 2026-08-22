import keytar from 'keytar';

/**
 * LLMService
 * ──────────
 * Unified multi-provider LLM router built directly in TypeScript.
 * No localhost proxy required — all API calls go directly to each
 * provider's cloud endpoint from inside the Electron main process.
 * 
 * Provider priority (first with a key/availability wins):
 *   Groq → Ollama → Mistral → OpenAI → Anthropic → Gemini
 * 
 * Groq is listed first because it offers a generous free tier
 * (llama-3.1-8b-instant at 200+ tok/s) — great default for new users
 * who haven't set up Ollama yet.
 */

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type Provider = 'ollama' | 'groq' | 'nvidia' | 'mistral' | 'openai' | 'anthropic' | 'gemini';

const KEYTAR_SERVICE = 'fumii-app';

export const PROVIDER_MODELS: Record<Provider, string[]> = {
  ollama:    ['qwen2.5:1.5b', 'qwen2.5:3b', 'qwen2.5:7b', 'mistral:7b', 'llama3.2:3b', 'phi3.5:mini', 'gemma2:2b'],
  groq:      ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it', 'llama-3.1-70b-versatile'],
  nvidia:    ['meta/llama-3.1-8b-instruct', 'meta/llama-3.3-70b-instruct', 'microsoft/phi-3-mini-128k-instruct', 'mistralai/mistral-7b-instruct-v0.3'],
  mistral:   ['mistral-small-latest', 'mistral-medium-latest', 'open-mistral-nemo', 'mistral-large-latest'],
  openai:    ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1-nano'],
  anthropic: ['claude-haiku-4-5', 'claude-sonnet-4-5', 'claude-3-haiku-20240307'],
  gemini:    ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash', 'gemini-1.5-pro'],
};

export const PROVIDER_DEFAULT_MODEL: Record<Provider, string> = {
  ollama:    'qwen2.5:1.5b',
  groq:      'llama-3.1-8b-instant',
  nvidia:    'meta/llama-3.1-8b-instruct',
  mistral:   'mistral-small-latest',
  openai:    'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5',
  gemini:    'gemini-1.5-flash',
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  ollama:    'Ollama (Local)',
  groq:      'Groq',
  nvidia:    'NVIDIA NIM',
  mistral:   'Mistral AI',
  openai:    'OpenAI',
  anthropic: 'Anthropic',
  gemini:    'Google Gemini',
};

export const PROVIDER_DOCS: Record<Provider, string> = {
  ollama:    'https://ollama.com/',
  groq:      'https://console.groq.com/keys',
  nvidia:    'https://build.nvidia.com/',
  mistral:   'https://console.mistral.ai/api-keys/',
  openai:    'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  gemini:    'https://aistudio.google.com/app/apikey',
};

const CACHED_FALLBACKS = [
  "hey, i'm having trouble connecting right now. give me a second?",
  "something's off on my end. you ok though?",
  "i'll be right back with you.",
  "having a bit of a moment here — technical, not emotional. one sec."
];

// Injected at runtime by llmHandlers so we can read per-provider models from DB settings
let _getProviderModel: ((provider: Provider) => string) | null = null;

export class LLMService {
  /** Called once from llmHandlers to wire in the settings DB reader */
  setModelResolver(fn: (provider: Provider) => string) {
    _getProviderModel = fn;
  }

  private resolveModel(provider: Provider): string {
    if (_getProviderModel) {
      const custom = _getProviderModel(provider);
      if (custom && PROVIDER_MODELS[provider].includes(custom)) return custom;
    }
    return PROVIDER_DEFAULT_MODEL[provider];
  }

  async getApiKey(provider: Provider): Promise<string | null> {
    if (provider === 'ollama') return 'local';
    return keytar.getPassword(KEYTAR_SERVICE, provider);
  }

  async setApiKey(provider: Provider, key: string) {
    await keytar.setPassword(KEYTAR_SERVICE, provider, key);
  }

  async hasApiKey(provider: Provider): Promise<boolean> {
    if (provider === 'ollama') return this.isOllamaUp();
    const key = await keytar.getPassword(KEYTAR_SERVICE, provider);
    return !!key;
  }

  async isOllamaUp(): Promise<boolean> {
    try {
      const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(1200) });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** Ordered fallback chain. Groq first (fast free tier), then local Ollama, then cloud. */
  private async resolveOrder(): Promise<Provider[]> {
    return ['groq', 'ollama', 'mistral', 'openai', 'anthropic', 'gemini', 'nvidia'];
  }

  /**
   * Streams a response, trying each provider in order until one succeeds.
   * onToken fires per chunk; returns the full response string.
   * No localhost proxy or external process required.
   */
  async chatStream(
    messages: ChatMessage[],
    onToken: (t: string) => void,
    signal?: AbortSignal,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const order = await this.resolveOrder();

    for (const provider of order) {
      try {
        const available = provider === 'ollama'
          ? await this.isOllamaUp()
          : await this.hasApiKey(provider);
        if (!available) continue;
        return await this.streamFromProvider(provider, messages, onToken, signal, options);
      } catch {
        continue;
      }
    }

    // Last resort — cached offline response
    const cached = CACHED_FALLBACKS[Math.floor(Math.random() * CACHED_FALLBACKS.length)];
    for (const word of cached.split(' ')) onToken(word + ' ');
    return cached;
  }

  /**
   * Single-provider call — used by the settings "test" button.
   */
  async chatStreamProvider(
    provider: Provider,
    messages: ChatMessage[],
    onToken: (t: string) => void,
    signal?: AbortSignal,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    return this.streamFromProvider(provider, messages, onToken, signal, options);
  }

  private async streamFromProvider(
    provider: Provider,
    messages: ChatMessage[],
    onToken: (t: string) => void,
    signal?: AbortSignal,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const model = this.resolveModel(provider);
    switch (provider) {
      case 'ollama':
        return this.streamOllama(model, messages, onToken, signal, options);
      case 'groq':
        return this.streamOpenAICompatible(
          'https://api.groq.com/openai/v1/chat/completions',
          await this.getApiKey('groq'),
          model,
          messages, onToken, signal, options
        );
      case 'nvidia':
        return this.streamOpenAICompatible(
          'https://integrate.api.nvidia.com/v1/chat/completions',
          await this.getApiKey('nvidia'),
          model,
          messages, onToken, signal, options
        );
      case 'mistral':
        return this.streamOpenAICompatible(
          'https://api.mistral.ai/v1/chat/completions',
          await this.getApiKey('mistral'),
          model,
          messages, onToken, signal, options
        );
      case 'openai':
        return this.streamOpenAICompatible(
          'https://api.openai.com/v1/chat/completions',
          await this.getApiKey('openai'),
          model,
          messages, onToken, signal, options
        );
      case 'anthropic':
        return this.streamAnthropic(model, messages, onToken, signal, options);
      case 'gemini':
        return this.streamGemini(model, messages, onToken, signal, options);
    }
  }

  private async streamOllama(
    model: string,
    messages: ChatMessage[],
    onToken: (t: string) => void,
    signal?: AbortSignal,
    options?: { temperature?: number; maxTokens?: number }
  ) {
    const res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
          temperature: options?.temperature ?? 0.87,
          num_predict: options?.maxTokens ?? 250
        }
      }),
      signal
    });
    if (!res.ok || !res.body) throw new Error('ollama unavailable');

    let full = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          const chunk = json?.message?.content ?? '';
          if (chunk) { full += chunk; onToken(chunk); }
        } catch { /* partial line */ }
      }
    }
    return full;
  }

  private async streamOpenAICompatible(
    url: string,
    apiKey: string | null,
    model: string,
    messages: ChatMessage[],
    onToken: (t: string) => void,
    signal?: AbortSignal,
    options?: { temperature?: number; maxTokens?: number }
  ) {
    if (!apiKey) throw new Error('no api key');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: options?.temperature ?? 0.87,
        max_tokens: options?.maxTokens ?? 250
      }),
      signal
    });
    if (!res.ok || !res.body) {
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`${url} [${res.status}]: ${err}`);
    }

    let full = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          const chunk = json?.choices?.[0]?.delta?.content ?? '';
          if (chunk) { full += chunk; onToken(chunk); }
        } catch { /* partial frame */ }
      }
    }
    return full;
  }

  private async streamAnthropic(
    model: string,
    messages: ChatMessage[],
    onToken: (t: string) => void,
    signal?: AbortSignal,
    options?: { temperature?: number; maxTokens?: number }
  ) {
    const apiKey = await this.getApiKey('anthropic');
    if (!apiKey) throw new Error('no api key');
    const system = messages.find((m) => m.role === 'system')?.content ?? '';
    const rest = messages.filter((m) => m.role !== 'system');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        system,
        messages: rest,
        temperature: options?.temperature ?? 0.87,
        max_tokens: options?.maxTokens ?? 250,
        stream: true
      }),
      signal
    });
    if (!res.ok || !res.body) throw new Error('anthropic failed');

    let full = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const json = JSON.parse(trimmed.slice(6));
          const chunk = json?.delta?.text ?? '';
          if (chunk) { full += chunk; onToken(chunk); }
        } catch { /* partial frame */ }
      }
    }
    return full;
  }

  private async streamGemini(
    model: string,
    messages: ChatMessage[],
    onToken: (t: string) => void,
    signal?: AbortSignal,
    options?: { temperature?: number; maxTokens?: number }
  ) {
    const apiKey = await this.getApiKey('gemini');
    if (!apiKey) throw new Error('no api key');
    const systemMsg = messages.find((m) => m.role === 'system');
    const rest = messages.filter((m) => m.role !== 'system');
    const contents = rest.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.87,
        maxOutputTokens: options?.maxTokens ?? 250
      }
    };
    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal }
    );
    if (!res.ok || !res.body) throw new Error('gemini failed');

    let full = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const json = JSON.parse(trimmed.slice(6));
          const chunk = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          if (chunk) { full += chunk; onToken(chunk); }
        } catch { /* partial frame */ }
      }
    }
    return full;
  }
}
