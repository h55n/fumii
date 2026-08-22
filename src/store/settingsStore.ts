import { create } from 'zustand';

interface SettingsState {
  settings: Record<string, string>;
  loaded: boolean;
  load: () => Promise<void>;
  set: (key: string, value: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {},
  loaded: false,
  load: async () => {
    const settings = await window.fumii.getAllSettings();
    set({ settings, loaded: true });
  },
  set: async (key, value) => {
    await window.fumii.setSetting(key, value);
    set({ settings: { ...get().settings, [key]: value } });
  }
}));
