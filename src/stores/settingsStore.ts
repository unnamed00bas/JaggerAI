import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TabataEquipment } from '../types'

interface SettingsState {
  theme: 'system' | 'light' | 'dark'
  language: 'ru' | 'en'
  defaultRestTimerSeconds: number
  tabataEnabled: boolean
  tabataEquipment: TabataEquipment
  llmProvider: 'claude' | 'openai' | 'glm' | null
  llmApiKey: string
  llmModel: string
  llmBaseUrl: string

  setTheme: (theme: 'system' | 'light' | 'dark') => void
  setLanguage: (language: 'ru' | 'en') => void
  setDefaultRestTimerSeconds: (seconds: number) => void
  setTabataEnabled: (enabled: boolean) => void
  setTabataEquipment: (equipment: TabataEquipment) => void
  setLlmProvider: (provider: 'claude' | 'openai' | 'glm' | null) => void
  setLlmApiKey: (key: string) => void
  setLlmModel: (model: string) => void
  setLlmBaseUrl: (url: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'ru',
      defaultRestTimerSeconds: 120,
      tabataEnabled: false,
      tabataEquipment: 'mixed',
      llmProvider: null,
      llmApiKey: '',
      llmModel: '',
      llmBaseUrl: '',

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setDefaultRestTimerSeconds: (seconds) => set({ defaultRestTimerSeconds: seconds }),
      setTabataEnabled: (enabled) => set({ tabataEnabled: enabled }),
      setTabataEquipment: (equipment) => set({ tabataEquipment: equipment }),
      setLlmProvider: (provider) => set({ llmProvider: provider }),
      setLlmApiKey: (key) => set({ llmApiKey: key }),
      setLlmModel: (model) => set({ llmModel: model }),
      setLlmBaseUrl: (url) => set({ llmBaseUrl: url }),
    }),
    { name: 'jagger-settings' },
  ),
)
