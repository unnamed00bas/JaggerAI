import { getProvider } from './provider'
import { buildAmrapInsightPrompt } from './coachPrompt'
import type { LlmMessage } from './provider'
import type { Lift, Wave, TrainingMaxes, CycleConfig, AmrapResult } from '../../types'
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
  cycle?: CycleConfig
  amrapResults?: AmrapResult[]
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

  const systemPrompt = buildAmrapInsightPrompt({
    cycle: params.cycle,
    amrapResults: params.amrapResults,
    language: params.language,
  })

  const messages: LlmMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: [
        `AMRAP result just completed:`,
        `Lift: ${params.lift}`,
        `Wave: ${params.wave}, Weight: ${params.weight} kg`,
        `Target reps: ${params.targetReps}, Actual reps: ${params.actualReps} (${repsOverTarget > 0 ? '+' : ''}${repsOverTarget} over target)`,
        `Estimated 1RM: ${e1rm.toFixed(1)} kg`,
        `Training Max change: ${params.oldTM} kg → ${params.newTM} kg`,
      ].join('\n'),
    },
  ]

  return llm.chat(messages, params.model, params.apiKey, params.baseUrl)
}
