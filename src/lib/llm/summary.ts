import { getProvider } from './provider'
import type { LlmMessage } from './provider'
import type { WorkoutLog, Wave, Phase, TrainingMaxes } from '../../types'

interface WeeklySummaryParams {
  wave: Wave
  phase: Phase
  week: number
  logs: WorkoutLog[]
  trainingMaxes: TrainingMaxes
  provider: string
  apiKey: string
  model: string
  baseUrl?: string
  language: 'ru' | 'en'
}

export async function generateWeeklySummary(params: WeeklySummaryParams): Promise<string> {
  const llm = getProvider(params.provider)
  if (!llm) throw new Error('LLM provider not configured')

  const lang = params.language === 'ru' ? 'Russian' : 'English'

  const logsSummary = params.logs.map((log) => {
    const totalTonnage = log.sets.reduce(
      (sum, s) => sum + (s.completed ? s.actualWeight * s.actualReps : 0),
      0,
    )
    const completedSets = log.sets.filter((s) => s.completed).length
    return `${log.lift}: ${completedSets}/${log.sets.length} sets completed, tonnage ${totalTonnage}kg`
  }).join('\n')

  const messages: LlmMessage[] = [
    {
      role: 'system',
      content: `You are an expert strength coach specializing in the Juggernaut Method 2.0. Provide a brief weekly training summary. Respond in ${lang}. Keep it to 4-5 sentences max.`,
    },
    {
      role: 'user',
      content: [
        `Week ${params.week} summary (${params.wave} wave, ${params.phase} phase):`,
        '',
        logsSummary,
        '',
        `TMs: Squat ${params.trainingMaxes.squat}kg, Bench ${params.trainingMaxes.bench}kg, OHP ${params.trainingMaxes.ohp}kg, Deadlift ${params.trainingMaxes.deadlift}kg`,
        '',
        'Summarize this training week: overall volume, quality of work, and what to focus on next week.',
      ].join('\n'),
    },
  ]

  return llm.chat(messages, params.model, params.apiKey, params.baseUrl)
}
