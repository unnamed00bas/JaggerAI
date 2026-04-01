import { getProvider } from './provider'
import { buildWeeklySummaryPrompt } from './coachPrompt'
import type { LlmMessage } from './provider'
import type { WorkoutLog, TrainingDayType, Block, WorkingWeights, CycleConfig } from '../../types'

interface WeeklySummaryParams {
  week: number
  block: Block
  dayType: TrainingDayType
  logs: WorkoutLog[]
  workingWeights: WorkingWeights
  cycle?: CycleConfig
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
    workoutLogs: params.logs,
    language: params.language,
    currentWeek: params.week,
  })

  const logsSummary = params.logs.map((log) => {
    const exercises = log.exercises.map(e => {
      const completedSets = e.sets.filter(s => s.completed).length
      const tonnage = e.sets.reduce((sum, s) => s.completed ? sum + s.actualWeight * s.actualReps : sum, 0)
      return `${e.exerciseId}: ${completedSets}/${e.sets.length} sets, ${Math.round(tonnage)} kg`
    }).join('; ')
    return `${log.dayType} (W${log.week}): ${exercises}`
  }).join('\n')

  const messages: LlmMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        `Week ${params.week} completed (Block ${params.block}):`,
        '',
        logsSummary,
        '',
        'Summarize this training week.',
      ].join('\n'),
    },
  ]

  return llm.chat(messages, params.model, params.apiKey, params.baseUrl)
}
