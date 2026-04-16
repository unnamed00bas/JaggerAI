import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface CoachChatState {
  messages: ChatMessage[]
  pendingPrompt: string | null

  addMessage: (msg: Omit<ChatMessage, 'timestamp'>) => void
  updateLastMessage: (content: string) => void
  removeLastMessage: () => void
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

      updateLastMessage: (content) =>
        set((state) => {
          if (state.messages.length === 0) return state
          const messages = state.messages.slice()
          const last = messages[messages.length - 1]
          messages[messages.length - 1] = { ...last, content }
          return { messages }
        }),

      removeLastMessage: () =>
        set((state) => ({ messages: state.messages.slice(0, -1) })),

      setPendingPrompt: (prompt) => set({ pendingPrompt: prompt }),

      clearHistory: () => set({ messages: [], pendingPrompt: null }),
    }),
    {
      name: 'rowfit-coach-chat',
      partialize: (state) => ({ messages: state.messages }),
    },
  ),
)
