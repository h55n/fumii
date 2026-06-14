import { create } from 'zustand'

export type Role = 'user' | 'assistant'

export interface ChatMessage {
  id:        string
  role:      Role
  content:   string
  timestamp: number
  streaming: boolean
}

interface ChatState {
  messages:    ChatMessage[]
  isStreaming: boolean
  isOpen:      boolean

  addMessage:     (role: Role, content: string) => string
  updateMessage:  (id: string, chunk: string) => void
  finalizeMessage:(id: string) => void
  clearMessages:  () => void
  setOpen:        (open: boolean) => void
  setStreaming:   (v: boolean) => void

  /** Returns message array suitable for passing to LLM */
  getHistoryForLLM: () => Array<{ role: Role; content: string }>
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages:    [],
  isStreaming: false,
  isOpen:      false,

  addMessage: (role, content) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    set(state => ({
      messages: [
        ...state.messages.slice(-39), // keep rolling 40-message window
        { id, role, content, timestamp: Date.now(), streaming: role === 'assistant' && content === '' }
      ]
    }))
    return id
  },

  updateMessage: (id, chunk) => {
    set(state => ({
      messages: state.messages.map(m =>
        m.id === id ? { ...m, content: m.content + chunk } : m
      )
    }))
  },

  finalizeMessage: (id) => {
    set(state => ({
      messages: state.messages.map(m =>
        m.id === id ? { ...m, streaming: false } : m
      )
    }))
  },

  clearMessages: () => set({ messages: [], isStreaming: false }),

  setOpen:      (open) => set({ isOpen: open }),
  setStreaming:  (v)    => set({ isStreaming: v }),

  getHistoryForLLM: () =>
    get().messages
      .filter(m => !m.streaming && m.content.trim())
      .map(m => ({ role: m.role, content: m.content }))
}))
