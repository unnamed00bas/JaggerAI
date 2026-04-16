import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'system' | 'light' | 'dark'
export type Language = 'ru' | 'en'
export type LlmProviderName = 'claude' | 'openai' | 'glm' | null

interface SettingsState {
  theme: Theme
  language: Language
  defaultRestTimerSec: number
  notificationsEnabled: boolean
  llmProvider: LlmProviderName
  llmApiKey: string
  llmModel: string
  llmBaseUrl: string

  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  setDefaultRestTimerSec: (seconds: number) => void
  setNotificationsEnabled: (on: boolean) => void
  setLlmProvider: (provider: LlmProviderName) => void
  setLlmApiKey: (key: string) => void
  setLlmModel: (model: string) => void
  setLlmBaseUrl: (url: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'ru',
      defaultRestTimerSec: 120,
      notificationsEnabled: false,
      llmProvider: null,
      llmApiKey: '',
      llmModel: '',
      llmBaseUrl: '',

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setDefaultRestTimerSec: (seconds) => set({ defaultRestTimerSec: seconds }),
      setNotificationsEnabled: (on) => set({ notificationsEnabled: on }),
      setLlmProvider: (llmProvider) => set({ llmProvider }),
      setLlmApiKey: (llmApiKey) => set({ llmApiKey }),
      setLlmModel: (llmModel) => set({ llmModel }),
      setLlmBaseUrl: (llmBaseUrl) => set({ llmBaseUrl }),
    }),
    { name: 'rowfit-settings' },
  ),
)
