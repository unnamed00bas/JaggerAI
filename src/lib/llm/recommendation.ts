import { getProvider } from './provider'
import { buildTrainerRecommendationPrompt } from './coachPrompt'
import type { LlmMessage } from './provider'
import type { CycleConfig, AmrapResult, WorkoutLog, TabataLog, WorkoutType } from '../../types'

interface TrainerRecommendationParams {
  week: number
  block: number
  cycle?: CycleConfig
  amrapResults?: AmrapResult[]
  workoutLogs?: WorkoutLog[]
  tabataLogs?: TabataLog[]
  completedLiftsToday: string[]
  allWeekLogs: { lift: string; date: string; phase: string }[]
  recentWorkoutTypes?: { type: WorkoutType; date: string }[]
  daysSinceLastStretch?: number | null
  daysSinceLastAerobic?: number | null
  daysSinceLastStrength?: number | null
  includeHiit: boolean
  tabataEnabled: boolean
  tabataEquipment?: string
  availableEquipment?: string[]
  preferredWorkoutType?: WorkoutType | 'auto'
  provider: string
  apiKey: string
  model: string
  baseUrl?: string
  language: 'ru' | 'en'
}

function computeDaysSince(logs: { date: string }[], filterFn?: (log: { date: string }) => boolean): number | null {
  const filtered = filterFn ? logs.filter(filterFn) : logs
  if (!filtered.length) return null
  const lastDate = filtered.reduce((latest, log) => log.date > latest ? log.date : latest, filtered[0].date)
  const diff = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export async function generateTrainerRecommendation(params: TrainerRecommendationParams): Promise<string> {
  const llm = getProvider(params.provider)
  if (!llm) throw new Error('LLM provider not configured')

  const allLogs = params.workoutLogs ?? []
  const tabataLogs = params.tabataLogs ?? []

  const daysSinceLastStrength = params.daysSinceLastStrength ?? computeDaysSince(allLogs)
  const daysSinceLastAerobic = params.daysSinceLastAerobic ?? computeDaysSince(tabataLogs)
  const daysSinceLastStretch = params.daysSinceLastStretch ?? null

  const recentWorkoutTypes: { type: WorkoutType; date: string }[] = params.recentWorkoutTypes ?? []
  if (!recentWorkoutTypes.length) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    for (const log of allLogs) {
      if (log.date >= sevenDaysAgo) {
        recentWorkoutTypes.push({ type: 'strength', date: log.date })
      }
    }
    for (const log of tabataLogs) {
      if (log.date >= sevenDaysAgo) {
        recentWorkoutTypes.push({ type: 'tabata', date: log.date })
      }
    }
    recentWorkoutTypes.sort((a, b) => a.date.localeCompare(b.date))
  }

  const defaultEquipment = ['barbell', 'dumbbells', 'kettlebell', 'pull-up bar', 'cable machine', 'leg press']
  if (params.tabataEquipment === 'cardio_machines' || params.tabataEquipment === 'mixed') {
    defaultEquipment.push('assault bike', 'rowing machine')
  }

  const systemPrompt = buildTrainerRecommendationPrompt({
    cycle: params.cycle,
    amrapResults: params.amrapResults,
    workoutLogs: params.workoutLogs,
    tabataLogs: params.tabataLogs,
    language: params.language,
    currentWeek: params.week,
    completedLiftsToday: params.completedLiftsToday,
    allWeekLogs: params.allWeekLogs,
    recentWorkoutTypes,
    daysSinceLastStretch,
    daysSinceLastAerobic,
    daysSinceLastStrength,
    includeHiit: params.includeHiit,
    tabataEnabled: params.tabataEnabled,
    tabataEquipment: params.tabataEquipment,
    availableEquipment: params.availableEquipment ?? defaultEquipment,
    preferredWorkoutType: params.preferredWorkoutType,
  })

  const today = new Date().toLocaleDateString(params.language === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const typeLabel = params.preferredWorkoutType && params.preferredWorkoutType !== 'auto'
    ? params.language === 'ru'
      ? ` Я хочу ${WORKOUT_TYPE_LABELS_RU[params.preferredWorkoutType]}.`
      : ` I want ${params.preferredWorkoutType} today.`
    : params.language === 'ru'
      ? ' Выбери оптимальный тип тренировки.'
      : ' Choose the optimal workout type.'

  const messages: LlmMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: params.language === 'ru'
        ? `Спланируй мне тренировку на сегодня (${today}).${typeLabel}`
        : `Plan my workout for today (${today}).${typeLabel}`,
    },
  ]

  return llm.chat(messages, params.model, params.apiKey, params.baseUrl)
}

const WORKOUT_TYPE_LABELS_RU: Record<WorkoutType, string> = {
  strength: 'силовую тренировку',
  crossfit: 'кроссфит-комплекс',
  tabata: 'табату',
  stretching: 'растяжку и мобильность',
  aerobic: 'кардио-тренировку',
}
