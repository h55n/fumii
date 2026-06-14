import { create } from 'zustand'

export type SpriteState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'happy'
  | 'concerned'
  | 'sleepy'
  | 'excited'
  | 'waving'

export type MoodSignal = 'happy' | 'stressed' | 'tired' | 'neutral' | 'excited'

interface AppState {
  spriteState: SpriteState
  currentMood: MoodSignal
  lastInteractionTime: number
  setSpriteState: (state: SpriteState) => void
  setCurrentMood: (mood: MoodSignal) => void
  updateInteractionTime: () => void
}

export const useAppStore = create<AppState>((set) => ({
  spriteState: 'waving',
  currentMood: 'neutral',
  lastInteractionTime: Date.now(),

  setSpriteState: (state) => set({ spriteState: state }),
  setCurrentMood: (mood) => set({ currentMood: mood }),
  updateInteractionTime: () => set({ lastInteractionTime: Date.now() })
}))
