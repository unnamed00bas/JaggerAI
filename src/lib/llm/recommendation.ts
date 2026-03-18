import { getProvider } from './provider'
import { buildTrainerRecommendationPrompt } from './coachPrompt'
import type { LlmMessage } from './provider'
import type { Wave, Phase, CycleConfig, AmrapResult, WorkoutLog, TabataLog } from '../../types'

interface TrainerRecommendationParams {
  wave: Wave
  phase: Phase
  week: number
  cycle?: CycleConfig
  amrapResults?: AmrapResult[]
  workoutLogs?: WorkoutLog[]
  tabataLogs?: TabataLog[]
  completedLiftsToday: string[]
  allWeekLogs: { lift: string; date: string; phase: string }[]
  includeHiit: boolean
  tabataEnabled: boolean
  tabataEquipment?: string
  provider: string
  apiKey: string
  model: string
  baseUrl?: string
  language: 'ru' | 'en'
}

export async function generateTrainerRecommendation(params: TrainerRecommendationParams): Promise<string> {
  const llm = getProvider(params.provider)
  if (!llm) throw new Error('LLM provider not configured')

  const systemPrompt = buildTrainerRecommendationPrompt({
    cycle: params.cycle,
    amrapResults: params.amrapResults,
    workoutLogs: params.workoutLogs,
    tabataLogs: params.tabataLogs,
    language: params.language,
    currentWeek: params.week,
    completedLiftsToday: params.completedLiftsToday,
    allWeekLogs: params.allWeekLogs,
    includeHiit: params.includeHiit,
    tabataEnabled: params.tabataEnabled,
    tabataEquipment: params.tabataEquipment,
  })

  const today = new Date().toLocaleDateString(params.language === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const messages: LlmMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: params.language === 'ru'
        ? `Спланируй мне тренировку на сегодня (${today}). ${params.includeHiit ? 'Я готов сделать HIIT после силовой.' : 'Без HIIT сегодня.'}`
        : `Plan my workout for today (${today}). ${params.includeHiit ? 'I\'m ready for HIIT after strength work.' : 'No HIIT today.'}`,
    },
  ]

  return llm.chat(messages, params.model, params.apiKey, params.baseUrl)
}
