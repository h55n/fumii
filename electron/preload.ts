import { contextBridge, ipcRenderer } from 'electron';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

const streamMessage = (
  messages: Message[],
  onToken: (token: string) => void,
  onDone: (full: string) => void,
  onError: (err: string) => void
) => {
  const streamId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const tokenHandler = (_: unknown, id: string, token: string) => {
    if (id === streamId) onToken(token);
  };
  const doneHandler = (_: unknown, id: string, full: string) => {
    if (id === streamId) {
      cleanup();
      onDone(full);
    }
  };
  const errorHandler = (_: unknown, id: string, err: string) => {
    if (id === streamId) {
      cleanup();
      onError(err);
    }
  };
  const cleanup = () => {
    ipcRenderer.removeListener('llm:token', tokenHandler);
    ipcRenderer.removeListener('llm:done', doneHandler);
    ipcRenderer.removeListener('llm:error', errorHandler);
  };

  ipcRenderer.on('llm:token', tokenHandler);
  ipcRenderer.on('llm:done', doneHandler);
  ipcRenderer.on('llm:error', errorHandler);
  ipcRenderer.send('llm:stream', streamId, messages);

  return () => {
    cleanup();
    ipcRenderer.send('llm:cancel', streamId);
  };
};

const api = {
  // LLM
  streamMessage,

  // Memory
  getProfile: () => ipcRenderer.invoke('memory:getProfile'),
  searchMemories: (query: string) => ipcRenderer.invoke('memory:search', query),
  deleteMemory: (id: string) => ipcRenderer.invoke('memory:delete', id),
  clearAllMemories: () => ipcRenderer.invoke('memory:clearAll'),
  // Provenance — fetches origin/lineage data before confirming destructive actions
  getMemoryProvenance: (id: string) => ipcRenderer.invoke('memory:getProvenance', id),
  getMemorySummary: () => ipcRenderer.invoke('memory:getSummary'),

  // Mood
  getMoodLog: (days: number) => ipcRenderer.invoke('mood:getLog', days),
  getTodayMood: () => ipcRenderer.invoke('mood:getToday'),

  // Sessions + transcripts
  getSessions: (limit: number) => ipcRenderer.invoke('sessions:list', limit),
  getTranscripts: (sessionId: number) => ipcRenderer.invoke('sessions:transcripts', sessionId),

  // Settings
  getAllSettings: () => ipcRenderer.invoke('settings:getAll'),
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
  setApiKey: (provider: string, key: string) => ipcRenderer.invoke('settings:setApiKey', provider, key),
  hasApiKey: (provider: string) => ipcRenderer.invoke('settings:hasApiKey', provider),
  testConnection: (provider: string) => ipcRenderer.invoke('settings:testConnection', provider),

  // Mode (software-only stand-in for the hardware rotary switch — Phase 2 will
  // add the real device toggle; this drives the same SQLite key + prompt path)
  getMode: () => ipcRenderer.invoke('settings:get', 'active_mode'),
  setMode: (mode: 'companion' | 'assistant') => ipcRenderer.invoke('settings:set', 'active_mode', mode),

  // Hardware / Device & Zero-Friction Pairing
  getDeviceStatus: () => ipcRenderer.invoke('hardware:getStatus'),
  getPairingStatus: () => ipcRenderer.invoke('hardware:getPairingStatus'),
  getNetworkInfo: () => ipcRenderer.invoke('hardware:getNetworkInfo'),
  pairDevice: () => ipcRenderer.invoke('hardware:pairDevice'),
  unpairDevice: () => ipcRenderer.invoke('hardware:unpairDevice'),
  setDeviceMode: (mode: 'companion' | 'assistant') => ipcRenderer.invoke('hardware:setMode', mode),
  sendLEDCommand: (color: string, pattern: string) => ipcRenderer.invoke('hardware:sendLED', color, pattern),
  identifyDevice: () => ipcRenderer.invoke('hardware:identify'),
  restartDevice: () => ipcRenderer.invoke('hardware:restart'),

  // Pets
  getInstalledPets: () => ipcRenderer.invoke('pets:list'),
  getPetRegistry: () => ipcRenderer.invoke('pets:registry'),
  fetchCodexLibrary: (params: any) => ipcRenderer.invoke('pets:fetchLibrary', params),
  getActivePet: () => ipcRenderer.invoke('pets:active'),
  setActivePet: (slug: string) => ipcRenderer.invoke('pets:setActive', slug),
  installPet: (petData: any) => ipcRenderer.invoke('pets:install', petData),
  installCustomPet: (slugOrUrl: string) => ipcRenderer.invoke('pets:installCustom', slugOrUrl),
  downloadAndInstallPet: (petIdentifierOrData: any) => ipcRenderer.invoke('pets:downloadAndInstall', petIdentifierOrData),
  removeInstalledPet: (slug: string) => ipcRenderer.invoke('pets:remove', slug),

  // Window actions
  showSprite: () => ipcRenderer.send('window:showSprite'),
  hideSprite: () => ipcRenderer.send('window:hideSprite'),
  openChat: () => ipcRenderer.send('window:openChat'),
  closeChat: () => ipcRenderer.send('window:closeChat'),
  openDashboard: () => ipcRenderer.send('window:openDashboard'),
  minimizeDashboard: () => ipcRenderer.send('window:minimizeDashboard'),
  maximizeDashboard: () => ipcRenderer.send('window:maximizeDashboard'),
  closeDashboard: () => ipcRenderer.send('window:closeDashboard'),

  // Sprite controls
  setSpriteState: (state: string) => ipcRenderer.send('sprite:setState', state),
  setSpriteBehavior: (behavior: string) => ipcRenderer.send('sprite:setBehavior', behavior),
  setInteractive: (interactive: boolean) => ipcRenderer.send('sprite:setInteractive', interactive),
  moveSpriteWindow: (dx: number, dy: number) => ipcRenderer.send('sprite:moveBy', dx, dy),
  setSpritePosition: (x: number, y: number) => ipcRenderer.send('sprite:setPosition', x, y),

  // System diagnostics & self-test
  runSystemTests: () => ipcRenderer.invoke('system:runTests'),

  // Whisper STT Model Management
  getWhisperModels: () => ipcRenderer.invoke('whisper:getModels'),
  downloadWhisperModel: (modelId: string) => ipcRenderer.invoke('whisper:downloadModel', modelId),
  cancelWhisperDownload: (modelId: string) => ipcRenderer.invoke('whisper:cancelDownload', modelId),
  deleteWhisperModel: (modelId: string) => ipcRenderer.invoke('whisper:deleteModel', modelId),
  isWhisperAvailable: (modelId?: string) => ipcRenderer.invoke('whisper:isAvailable', modelId),

  // Microsoft Neural TTS & Audio Synthesis
  synthesizeTTS: (text: string, options?: any) => ipcRenderer.invoke('tts:synthesize', text, options),
  getEdgeVoices: () => ipcRenderer.invoke('tts:getEdgeVoices'),

  // Safe Whitelisted Event Prefixes
  on: (channel: string, handler: (...args: any[]) => void) => {
    const ALLOWED_NAMESPACES = ['device:', 'sprite:', 'chat:', 'pets:', 'whisper:', 'llm:', 'settings:', 'system:', 'updater:'];
    const isAllowed = ALLOWED_NAMESPACES.some((prefix) => channel.startsWith(prefix));
    if (!isAllowed) {
      console.warn(`[preload] Blocked unregistered event subscription: "${channel}"`);
      return () => {};
    }
    const wrapped = (_: unknown, ...args: any[]) => handler(...args);
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  }
};

contextBridge.exposeInMainWorld('fumii', api);

export type FumiiAPI = typeof api;
