import { FumiiAPI, Pet, DeviceStatus, WhisperModelInfo, MoodEntry, Session, Transcript, MemoryResult } from './global';

export function setupBrowserMockFumii(): void {
  if (typeof window === 'undefined' || window.fumii) return;

  const storageKey = (k: string) => `fumii_mock_${k}`;
  const getStorage = <T>(k: string, def: T): T => {
    try {
      const v = localStorage.getItem(storageKey(k));
      return v ? JSON.parse(v) : def;
    } catch {
      return def;
    }
  };
  const setStorage = <T>(k: string, v: T): void => {
    try {
      localStorage.setItem(storageKey(k), JSON.stringify(v));
    } catch {}
  };

  const settings = getStorage<Record<string, string>>('settings', {
    active_mode: 'companion',
    user_name: 'Explorer',
    save_transcripts: 'true',
    groq_model: 'llama-3.1-8b-instant',
    ollama_model: 'qwen2.5:1.5b',
    whisper_model: 'base.en'
  });

  // Default empty so user must enter and save an API key to test!
  const apiKeys: Record<string, string> = getStorage('keys', {
    ollama: 'local'
  });

  const memories: MemoryResult[] = getStorage('memories', [
    { id: '1', content: "User loves working on robotic companions and hardware projects", createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), tags: ['interest'] },
    { id: '2', content: "User is building an ESP32-S3 physical companion device with MQTT and I2S audio", createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), tags: ['hardware'] },
    { id: '3', content: "User prefers concise text and calm interactions", createdAt: new Date().toISOString(), tags: ['preference'] }
  ]);

  const moodLog: MoodEntry[] = [
    { id: 1, date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], signal: 'happy', source: 'conversation' },
    { id: 2, date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], signal: 'excited', source: 'conversation' },
    { id: 3, date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0], signal: 'neutral', source: 'conversation' },
    { id: 4, date: new Date().toISOString().split('T')[0], signal: 'happy', source: 'conversation' }
  ];

  const sessions: Session[] = [
    { id: 1, started_at: new Date(Date.now() - 3600000 * 2).toISOString(), ended_at: new Date(Date.now() - 3600000 * 1).toISOString(), mode: 'companion', turn_count: 8 }
  ];

  const transcripts: Transcript[] = [
    { id: 1, session_id: 1, role: 'user', content: 'hey fumii, is the hardware test connected?', created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 2, session_id: 1, role: 'assistant', content: 'everything looks clear. microphone and speaker are ready.', created_at: new Date(Date.now() - 3600000 * 2 + 1000).toISOString() }
  ];

  const pets: Pet[] = [
    { slug: 'fumii-default', name: 'Fumii Classic', isDefault: true, description: 'The original mindful companion' },
    { slug: 'pixel-cat', name: 'Pixel Cat', isDefault: false, description: 'Playful pixel feline' }
  ];

  const whisperModels: WhisperModelInfo[] = [
    { id: 'tiny.en', label: 'Whisper Tiny (English)', filename: 'ggml-tiny.en.bin', sizeMB: 75, description: 'Instant, lightweight live English transcription with minimal battery usage.', accuracy: 3, speed: 5, language: 'en', badge: 'Fastest', installed: true, isActive: false },
    { id: 'base.en', label: 'Whisper Base (English)', filename: 'ggml-base.en.bin', sizeMB: 142, description: 'Optimal balance of fast response and high transcription accuracy for everyday voice.', accuracy: 4, speed: 4, language: 'en', badge: 'Recommended', installed: true, isActive: true },
    { id: 'small.en', label: 'Whisper Small (English)', filename: 'ggml-small.en.bin', sizeMB: 466, description: 'Highest precision English transcription for complex vocabulary and accents.', accuracy: 5, speed: 3, language: 'en', badge: 'High Accuracy', installed: false, isActive: false },
    { id: 'tiny', label: 'Whisper Tiny (Multilingual)', filename: 'ggml-tiny.bin', sizeMB: 75, description: 'Fast live multilingual speech recognition across 99 languages.', accuracy: 3, speed: 5, language: 'multi', badge: 'Multilingual', installed: false, isActive: false },
    { id: 'base', label: 'Whisper Base (Multilingual)', filename: 'ggml-base.bin', sizeMB: 142, description: 'Accurate multilingual speech recognition across 99 languages.', accuracy: 4, speed: 4, language: 'multi', badge: 'Multilingual', installed: false, isActive: false }
  ];

  let deviceConnected = false;
  let activePetSlug = 'fumii-default';
  const listeners: Record<string, Function[]> = {};

  const emit = (channel: string, ...args: any[]) => {
    listeners[channel]?.forEach((cb) => cb(...args));
  };

  const mockApi: FumiiAPI = {
    streamMessage: (_messages, onToken, onDone) => {
      let isAborted = false;
      const sample = "all systems and simulations are functioning properly. memory, device telemetry, and provider connections are verified.";
      const words = sample.split(' ');
      let i = 0;
      const t = setInterval(() => {
        if (isAborted) { clearInterval(t); return; }
        if (i < words.length) {
          onToken(words[i] + ' ');
          i++;
        } else {
          clearInterval(t);
          onDone(sample);
        }
      }, 50);
      return () => { isAborted = true; clearInterval(t); };
    },

    getProfile: async () => ({
      static: ["User's name is Explorer", "User works on hardware & robotics", "User prefers calm responses"],
      dynamic: ["Recent context: Testing ESP32-S3 simulation and memory persistence"]
    }),

    searchMemories: async (q: string) => {
      if (!q) return memories;
      return memories.filter((m) => m.content.toLowerCase().includes(q.toLowerCase()));
    },

    deleteMemory: async (id: string) => {
      const idx = memories.findIndex((m) => m.id === id);
      if (idx !== -1) memories.splice(idx, 1);
      setStorage('memories', memories);
    },

    clearAllMemories: async () => {
      memories.length = 0;
      setStorage('memories', memories);
      return true;
    },

    getMemoryProvenance: async (id: string) => {
      const mem = memories.find((m) => m.id === id);
      if (!mem) return null;
      return {
        memoryId: id,
        citeCount: 3,
        firstCited: new Date(Date.now() - 86400000 * 2).toISOString(),
        lastCited: new Date(Date.now() - 3600000 * 4).toISOString()
      };
    },

    getMemorySummary: async () => {
      const dates = memories.map((m) => m.createdAt).sort();
      const oldestDate = dates[0] || null;
      const newestDate = dates[dates.length - 1] || null;
      let daysCovered = 0;
      if (oldestDate && newestDate) {
        daysCovered = Math.max(1, Math.round((new Date(newestDate).getTime() - new Date(oldestDate).getTime()) / 86400000));
      }
      const tagFreq: Record<string, number> = {};
      memories.forEach((m) => {
        (m.tags || []).forEach((t) => {
          tagFreq[t] = (tagFreq[t] || 0) + 1;
        });
      });
      const topTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t);
      return {
        totalCount: memories.length,
        oldestDate,
        newestDate,
        daysCovered,
        topTags,
        totalCitations: memories.length * 3
      };
    },

    getMoodLog: async () => moodLog,
    getTodayMood: async () => moodLog[moodLog.length - 1] || null,
    getSessions: async () => sessions,
    getTranscripts: async () => transcripts,

    getAllSettings: async () => settings,
    getSetting: async (key: string) => settings[key] || null,
    setSetting: async (key: string, value: string) => {
      settings[key] = value;
      setStorage('settings', settings);
    },

    setApiKey: async (provider: string, key: string) => {
      apiKeys[provider] = key;
      setStorage('keys', apiKeys);
    },

    hasApiKey: async (provider: string) => {
      if (provider === 'ollama') return true;
      return Boolean(apiKeys[provider] && apiKeys[provider].trim().length > 0);
    },

    testConnection: async (provider: string) => {
      if (provider !== 'ollama') {
        const key = apiKeys[provider];
        if (!key || !key.trim()) {
          return { ok: false, error: `No API key saved for ${provider}. Please enter your key and click Save first.` };
        }
      }
      return { ok: true, response: `✓ ${provider} test connection successful (latency 38ms)` };
    },

    getMode: async () => (settings.active_mode as 'companion' | 'assistant') || 'companion',
    setMode: async (mode) => {
      settings.active_mode = mode;
      setStorage('settings', settings);
    },

    getDeviceStatus: async (): Promise<DeviceStatus> => ({
      connected: deviceConnected,
      battery: deviceConnected ? 94 : null,
      wifi: deviceConnected ? 'Home_WiFi_5G' : null,
      wifiRssi: deviceConnected ? -48 : null,
      lastSeen: deviceConnected ? new Date().toISOString() : null,
      mode: (settings.active_mode as any) || 'companion',
      pairingStatus: deviceConnected ? 'paired' : 'found-unpaired',
      firmwareVersion: 'v1.0.4',
      ip: '192.168.1.142'
    }),

    getPairingStatus: async () => (deviceConnected ? 'paired' : 'found-unpaired'),

    pairDevice: async () => {
      await new Promise((r) => setTimeout(r, 600));
      deviceConnected = true;
      return true;
    },

    unpairDevice: async () => {
      deviceConnected = false;
      return true;
    },

    setDeviceMode: async (mode) => {
      settings.active_mode = mode;
    },

    sendLEDCommand: async (color: string, pattern: string) => {
      console.log(`[MockDevice] LED command: ${color} (${pattern})`);
    },

    identifyDevice: async () => {
      console.log('[MockDevice] Identify triggered (Blink LED 3x)');
    },

    restartDevice: async () => {
      console.log('[MockDevice] Restart triggered');
      deviceConnected = false;
      emit('device:disconnected');
      setTimeout(() => {
        deviceConnected = true;
        emit('device:connected');
      }, 1500);
    },

    getInstalledPets: async () => pets,
    getPetRegistry: async () => pets,
    fetchCodexLibrary: async () => ({
      pets: pets.map((p) => ({
        id: p.slug,
        displayName: p.name,
        slug: p.slug,
        name: p.name,
        author: p.author || 'fumii team',
        description: p.description || 'Virtual companion character',
        previewUrl: p.previewUrl || '',
        spritesheetUrl: p.spritesheetUrl || '',
        isDefault: p.isDefault || false
      })),
      total: pets.length,
      page: 1,
      totalPages: 1
    }),
    getActivePet: async () => pets.find((p) => p.slug === activePetSlug) || pets[0],
    setActivePet: async (slug: string) => {
      activePetSlug = slug;
    },
    installPet: async (petData: any) => {
      pets.push({ slug: petData.slug || 'custom', name: petData.name || 'Custom Pet', isDefault: false });
      return { ok: true };
    },
    installCustomPet: async (slugOrUrl: string) => {
      const slug = slugOrUrl.replace(/^.*[\\/]/, '');
      pets.push({ slug, name: slug, isDefault: false });
      return { ok: true };
    },
    downloadAndInstallPet: async (petIdentifierOrData: any) => {
      const slug = typeof petIdentifierOrData === 'string' ? petIdentifierOrData : petIdentifierOrData.id || petIdentifierOrData.slug;
      pets.push({ slug, name: slug, isDefault: false });
      return { ok: true };
    },
    removeInstalledPet: async (slug: string) => {
      const idx = pets.findIndex((p) => p.slug === slug);
      if (idx !== -1) pets.splice(idx, 1);
    },

    getWhisperModels: async () => whisperModels,
    downloadWhisperModel: async (modelId: string) => {
      let percent = 0;
      const interval = setInterval(() => {
        percent += 20;
        emit('whisper:downloadProgress', { modelId, bytesReceived: percent * 1024 * 1024, totalBytes: 100 * 1024 * 1024, percent });
        if (percent >= 100) {
          clearInterval(interval);
          const m = whisperModels.find((x) => x.id === modelId);
          if (m) m.installed = true;
          emit('whisper:downloadDone', { modelId });
        }
      }, 180);
      return { ok: true };
    },

    cancelWhisperDownload: async (modelId: string) => {
      emit('whisper:downloadError', { modelId, error: 'cancelled' });
      return true;
    },

    deleteWhisperModel: async (modelId: string) => {
      const m = whisperModels.find((x) => x.id === modelId);
      if (m) m.installed = false;
      return true;
    },

    isWhisperAvailable: async () => true,

    showSprite: () => console.log('[Mock] showSprite'),
    hideSprite: () => console.log('[Mock] hideSprite'),
    openChat: () => console.log('[Mock] openChat'),
    closeChat: () => console.log('[Mock] closeChat'),
    openDashboard: () => console.log('[Mock] openDashboard'),
    minimizeDashboard: () => console.log('[Mock] minimizeDashboard'),
    maximizeDashboard: () => console.log('[Mock] maximizeDashboard'),
    closeDashboard: () => console.log('[Mock] closeDashboard'),
    setInteractive: (i: boolean) => console.log('[Mock] setInteractive', i),
    setSpriteState: (st: string) => console.log('[Mock] setSpriteState', st),
    setSpriteBehavior: (bm: string) => console.log('[Mock] setSpriteBehavior', bm),
    moveSpriteWindow: (dx: number, dy: number) => console.log('[Mock] moveSpriteWindow', dx, dy),
    setSpritePosition: (x: number, y: number) => console.log('[Mock] setSpritePosition', x, y),
    runSystemTests: async () => {
      return [
        { name: 'Memory Engine', ok: true, detail: `${memories.length} entries · 3 facts · path OK (in-process engine)`, durationMs: 4 },
        { name: 'Memory Search (TF-IDF)', ok: true, detail: '3 result(s) for "hardware companion"', durationMs: 6 },
        { name: 'Auto Fact Extraction', ok: true, detail: 'name & hardware facts extracted successfully', durationMs: 5 },
        { name: 'SQLite Database', ok: true, detail: '4 tables verified · active_mode=companion', durationMs: 3 },
        { name: 'Hardware Telemetry', ok: true, detail: 'Microphone & Speaker services ready', durationMs: 12 },
        { name: 'Device Simulator', ok: true, detail: 'Touch sensor, Audio, and Telemetry verified', durationMs: 8 },
        { name: 'LLM: Groq', ok: Boolean(apiKeys['groq']), detail: apiKeys['groq'] ? 'response: "pong" (latency 48ms)' : 'no key saved (skipped)', durationMs: 48 },
        { name: 'LLM: Ollama (Local)', ok: true, detail: 'running at localhost:11434 · model=qwen2.5:1.5b', durationMs: 15 },
        { name: 'Whisper STT Engine', ok: true, detail: '2 model(s) installed (base.en active)', durationMs: 4 },
        { name: 'OS Keychain (keytar)', ok: true, detail: 'keychain read/write round-trip OK', durationMs: 7 }
      ];
    },
    synthesizeTTS: async () => null,
    getEdgeVoices: async () => [
      { id: 'en-US-JennyNeural', name: 'Jenny (US)', gender: 'female', locale: 'en-US', description: 'Calm, gentle & friendly', isSoothing: true },
      { id: 'en-US-AriaNeural', name: 'Aria (US)', gender: 'female', locale: 'en-US', description: 'Warm, expressive & natural', isSoothing: true }
    ],

    on: (channel: string, handler: Function) => {
      listeners[channel] = listeners[channel] || [];
      listeners[channel].push(handler);
      return () => {
        listeners[channel] = (listeners[channel] || []).filter((h) => h !== handler);
      };
    }
  };

  (mockApi as any).runSystemTests = async () => {
    return [
      { name: 'Memory Engine', ok: true, detail: `${memories.length} entries · 3 facts · path OK (in-process engine)`, durationMs: 4 },
      { name: 'Memory Search (TF-IDF)', ok: true, detail: '3 result(s) for "hardware companion"', durationMs: 6 },
      { name: 'Auto Fact Extraction', ok: true, detail: 'name & hardware facts extracted successfully', durationMs: 5 },
      { name: 'SQLite Database', ok: true, detail: '4 tables verified · active_mode=companion', durationMs: 3 },
      { name: 'Hardware Telemetry', ok: true, detail: 'Microphone & Speaker services ready', durationMs: 12 },
      { name: 'Device Simulator', ok: true, detail: 'Touch sensor, Audio, and Telemetry verified', durationMs: 8 },
      { name: 'LLM: Groq', ok: Boolean(apiKeys['groq']), detail: apiKeys['groq'] ? 'response: "pong" (latency 48ms)' : 'no key saved (skipped)', durationMs: 48 },
      { name: 'LLM: Ollama (Local)', ok: true, detail: 'running at localhost:11434 · model=qwen2.5:1.5b', durationMs: 15 },
      { name: 'Whisper STT Engine', ok: true, detail: '2 model(s) installed (base.en active)', durationMs: 4 },
      { name: 'OS Keychain (keytar)', ok: true, detail: 'keychain read/write round-trip OK', durationMs: 7 }
    ];
  };

  (window as any).fumii = mockApi;
}
