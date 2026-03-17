import { getProvider } from './provider'
import type { LlmMessage } from './provider'
import type { Lift, Wave, TrainingMaxes } from '../../types'
import { estimateOneRepMax } from '../juggernaut'

interface AmrapInsightParams {
  lift: Lift
  wave: Wave
  weight: number
  targetReps: number
  actualReps: number
  oldTM: number
  newTM: number
  trainingMaxes: TrainingMaxes
  provider: string
  apiKey: string
  model: string
  baseUrl?: string
  language: 'ru' | 'en'
}

export async function generateAmrapInsight(params: AmrapInsightParams): Promise<string> {
  const llm = getProvider(params.provider)
  if (!llm) throw new Error('LLM provider not configured')

  const e1rm = estimateOneRepMax(params.weight, params.actualReps)
  const repsOverTarget = params.actualReps - params.targetReps

  const lang = params.language === 'ru' ? 'Russian' : 'English'

  const messages: LlmMessage[] = [
    {
      role: 'system',
      content: `You are an expert strength coach specializing in the Juggernaut Method 2.0. Provide brief, actionable post-AMRAP analysis. Respond in ${lang}. Keep it to 3-4 sentences max.`,
    },
    {
      role: 'user',
      content: [
        `AMRAP result for ${params.lift}:`,
        `Wave: ${params.wave}, Weight: ${params.weight}kg`,
        `Target reps: ${params.targetReps}, Actual reps: ${params.actualReps} (${repsOverTarget > 0 ? '+' : ''}${repsOverTarget} over target)`,
        `Estimated 1RM: ${e1rm.toFixed(1)}kg`,
        `Training Max: ${params.oldTM}kg → ${params.newTM}kg`,
        `Current TMs: Squat ${params.trainingMaxes.squat}kg, Bench ${params.trainingMaxes.bench}kg, OHP ${params.trainingMaxes.ohp}kg, Deadlift ${params.trainingMaxes.deadlift}kg`,
        '',
        'Give a brief analysis of this AMRAP result: was it good/average/poor? What does it mean for the next wave? Any recovery or technique advice?',
      ].join('\n'),
    },
  ]

  return llm.chat(messages, params.model, params.apiKey, params.baseUrl)
}
