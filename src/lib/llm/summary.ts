import { getProvider } from './provider'
import { buildWeeklySummaryPrompt } from './coachPrompt'
import type { LlmMessage } from './provider'
import type { WorkoutLog, Wave, Phase, TrainingMaxes, CycleConfig, AmrapResult, TabataLog } from '../../types'

interface WeeklySummaryParams {
  wave: Wave
  phase: Phase
  week: number
  logs: WorkoutLog[]
  trainingMaxes: TrainingMaxes
  cycle?: CycleConfig
  amrapResults?: AmrapResult[]
  tabataLogs?: TabataLog[]
  provider: string
  apiKey: string
  model: string
  baseUrl?: string
  language: 'ru' | 'en'
}

export async function generateWeeklySummary(params: WeeklySummaryParams): Promise<string> {
  const llm = getProvider(params.provider)
  if (!llm) throw new Error('LLM provider not configured')

  const systemPrompt = buildWeeklySummaryPrompt({
    cycle: params.cycle,
    amrapResults: params.amrapResults,
    workoutLogs: params.logs,
    tabataLogs: params.tabataLogs,
    language: params.language,
    currentWeek: params.week,
  })

  const logsSummary = params.logs.map((log) => {
    const totalTonnage = log.sets.reduce(
      (sum, s) => sum + (s.completed ? s.actualWeight * s.actualReps : 0),
      0,
    )
    const completedSets = log.sets.filter((s) => s.completed).length
    return `${log.lift}: ${completedSets}/${log.sets.length} sets completed, tonnage ${Math.round(totalTonnage)} kg`
  }).join('\n')

  const messages: LlmMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: [
        `Week ${params.week} completed (${params.wave} wave, ${params.phase} phase):`,
        '',
        logsSummary,
        '',
        'Summarize this training week.',
      ].join('\n'),
    },
  ]

  return llm.chat(messages, params.model, params.apiKey, params.baseUrl)
}
