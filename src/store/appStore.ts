import { create } from 'zustand';
import type { FumiiState, BehaviorMode } from '../sprite/EmotionState';

interface AppState {
  spriteState: FumiiState;
  behaviorMode: BehaviorMode;
  chatOpen: boolean;
  mode: 'companion' | 'assistant';
  setSpriteState: (s: FumiiState) => void;
  setBehaviorMode: (b: BehaviorMode) => void;
  setChatOpen: (open: boolean) => void;
  setMode: (m: 'companion' | 'assistant') => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  spriteState: 'idle',
  behaviorMode: 'wander',
  chatOpen: false,
  mode: 'companion',
  setSpriteState: (spriteState) => {
    if (get().spriteState === spriteState) return;
    set({ spriteState });
    window?.fumii?.setSpriteState?.(spriteState);
  },
  setBehaviorMode: (behaviorMode) => {
    if (get().behaviorMode === behaviorMode) return;
    set({ behaviorMode });
    window?.fumii?.setSpriteBehavior?.(behaviorMode);
  },
  setChatOpen: (chatOpen) => set({ chatOpen }),
  setMode: (mode) => set({ mode })
}));
