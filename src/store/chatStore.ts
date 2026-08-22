import { create } from 'zustand';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
};

interface ChatState {
  messages: ChatMessage[];
  isThinking: boolean;
  addMessage: (m: Omit<ChatMessage, 'id'>) => string;
  appendStreamToken: (id: string, token: string) => void;
  finishStream: (id: string, full: string) => void;
  setThinking: (v: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isThinking: false,
  addMessage: (m) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set({ messages: [...get().messages, { ...m, id }] });
    return id;
  },
  appendStreamToken: (id, token) => {
    set({
      messages: get().messages.map((msg) =>
        msg.id === id ? { ...msg, content: msg.content + token } : msg
      )
    });
  },
  finishStream: (id, full) => {
    set({
      messages: get().messages.map((msg) =>
        msg.id === id ? { ...msg, content: full, streaming: false } : msg
      ),
      isThinking: false
    });
  },
  setThinking: (isThinking) => set({ isThinking }),
  reset: () => set({ messages: [], isThinking: false })
}));
