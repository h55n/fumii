export type Message = { role: 'user' | 'assistant' | 'system'; content: string };

export type MoodSignal = 'stressed' | 'happy' | 'tired' | 'neutral' | 'excited';
export type MoodEntry = { id: number; date: string; signal: MoodSignal; source: string };
export type Session = {
  id: number;
  started_at: string;
  ended_at: string | null;
  mode: 'companion' | 'assistant';
  turn_count: number;
};
export type Transcript = { id: number; session_id: number; role: 'user' | 'assistant'; content: string; created_at: string };
export type Pet = { slug: string; name: string; spritesheetPath?: string; previewUrl?: string; spritesheetUrl?: string; isDefault: boolean; description?: string; author?: string; tags?: string[] };
export type MemoryResult = { id: string; content: string; createdAt: string; tags: string[] };
export type PairingStatus = 'none-found' | 'found-unpaired' | 'pairing' | 'paired' | 'paired-offline';

export type DeviceStatus = {
  connected: boolean;
  battery: number | null;
  wifi: string | null;
  wifiRssi?: number | null;
  lastSeen: string | null;
  mode: 'companion' | 'assistant';
  pairingStatus?: PairingStatus;
  firmwareVersion?: string;
  ip?: string;
  apSsid?: string;  // AP SSID broadcast during provisioning (fumii-setup-XXXX)
};

export interface NetworkInfo {
  localIp: string;
  hostname: string;
  mqttPort: number;
  wsPort: number;
  discoveryPort: number;
  allIps: string[];
}

export interface WhisperModelInfo {
  id: string;
  label: string;
  filename: string;
  sizeMB: number;
  description: string;
  installed: boolean;
  isActive?: boolean;
  accuracy: number;
  speed: number;
  language: 'en' | 'multi';
  badge?: string;
}

export interface FumiiAPI {
  streamMessage: (
    messages: Message[],
    onToken: (token: string) => void,
    onDone: (full: string) => void,
    onError: (err: string) => void
  ) => () => void;

  getProfile: () => Promise<{ static: string[]; dynamic: string[] }>;
  searchMemories: (query: string) => Promise<MemoryResult[]>;
  deleteMemory: (id: string) => Promise<void>;
  clearAllMemories: () => Promise<boolean>;
  getMemoryProvenance: (id: string) => Promise<{ memoryId: string; citeCount: number; firstCited: string | null; lastCited: string | null } | null>;
  getMemorySummary: () => Promise<{ totalCount: number; oldestDate: string | null; newestDate: string | null; daysCovered: number; topTags: string[]; totalCitations: number }>;

  getMoodLog: (days: number) => Promise<MoodEntry[]>;
  getTodayMood: () => Promise<MoodEntry | null>;

  getSessions: (limit: number) => Promise<Session[]>;
  getTranscripts: (sessionId: number) => Promise<Transcript[]>;

  getAllSettings: () => Promise<Record<string, string>>;
  getSetting: (key: string) => Promise<string | null>;
  setSetting: (key: string, value: string) => Promise<void>;
  setApiKey: (provider: string, key: string) => Promise<void>;
  hasApiKey: (provider: string) => Promise<boolean>;
  testConnection: (provider: string) => Promise<{ ok: boolean; response?: string; error?: string }>;

  getMode: () => Promise<'companion' | 'assistant'>;
  setMode: (mode: 'companion' | 'assistant') => Promise<void>;

  getDeviceStatus: () => Promise<DeviceStatus>;
  getPairingStatus: () => Promise<PairingStatus>;
  getNetworkInfo: () => Promise<NetworkInfo>;
  pairDevice: () => Promise<boolean>;
  unpairDevice: () => Promise<boolean>;
  setDeviceMode: (mode: 'companion' | 'assistant') => Promise<void>;
  sendLEDCommand: (color: string, pattern: string) => Promise<void>;
  identifyDevice: () => Promise<void>;
  restartDevice: () => Promise<void>;

  getInstalledPets: () => Promise<Pet[]>;
  getPetRegistry: () => Promise<Pet[]>;
  fetchCodexLibrary: (params: any) => Promise<any>;
  getActivePet: () => Promise<Pet>;
  setActivePet: (slug: string) => Promise<void>;
  installPet: (petData: any) => Promise<any>;
  installCustomPet: (slugOrUrl: string) => Promise<any>;
  downloadAndInstallPet: (petIdentifierOrData: any) => Promise<any>;
  removeInstalledPet: (slug: string) => Promise<void>;

  // Whisper STT model management
  getWhisperModels: () => Promise<WhisperModelInfo[]>;
  downloadWhisperModel: (modelId: string) => Promise<{ ok: boolean }>;
  cancelWhisperDownload: (modelId: string) => Promise<boolean>;
  deleteWhisperModel: (modelId: string) => Promise<boolean>;
  isWhisperAvailable: (modelId?: string) => Promise<boolean>;

  showSprite: () => void;
  hideSprite: () => void;
  openChat: () => void;
  closeChat: () => void;
  openDashboard: () => void;
  minimizeDashboard: () => void;
  maximizeDashboard: () => void;
  closeDashboard: () => void;
  setInteractive: (interactive: boolean) => void;
  setSpriteState: (state: string) => void;
  setSpriteBehavior: (behavior: string) => void;
  moveSpriteWindow: (dx: number, dy: number) => void;
  setSpritePosition: (x: number, y: number) => void;
  runSystemTests: () => Promise<any>;

  // Microsoft Neural TTS
  synthesizeTTS: (text: string, options?: { voice?: string; pitch?: string; rate?: string; volume?: string }) => Promise<string | null>;
  getEdgeVoices: () => Promise<Array<{ id: string; name: string; gender: string; locale: string; description: string; isSoothing: boolean }>>;

  on: (channel: string, handler: (...args: any[]) => void) => () => void;
}

declare global {
  interface Window {
    fumii: FumiiAPI;
  }
}
