import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface CoachChatState {
  messages: ChatMessage[]
  /** Optional prompt to auto-send when CoachPage opens */
  pendingPrompt: string | null

  addMessage: (msg: Omit<ChatMessage, 'timestamp'>) => void
  setPendingPrompt: (prompt: string | null) => void
  clearHistory: () => void
}

export const useCoachChatStore = create<CoachChatState>()(
  persist(
    (set) => ({
      messages: [],
      pendingPrompt: null,

      addMessage: (msg) =>
        set((state) => ({
          messages: [...state.messages, { ...msg, timestamp: new Date().toISOString() }],
        })),

      setPendingPrompt: (prompt) => set({ pendingPrompt: prompt }),

      clearHistory: () => set({ messages: [], pendingPrompt: null }),
    }),
    {
      name: 'jagger-coach-chat',
      partialize: (state) => ({ messages: state.messages }),
    },
  ),
)
