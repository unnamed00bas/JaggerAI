import { getProvider } from './provider'
import { buildAmrapInsightPrompt } from './coachPrompt'
import type { LlmMessage } from './provider'
import type { CycleConfig, AmrapResult } from '../../types'
import { estimateOneRepMax } from '../juggernaut'

interface AmrapInsightParams {
  exerciseId: string
  weight: number
  actualReps: number
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

  const systemPrompt = buildAmrapInsightPrompt({
    cycle: params.cycle,
    amrapResults: params.amrapResults,
    language: params.language,
  })

  const messages: LlmMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        `AMRAP test result:`,
        `Exercise: ${params.exerciseId}`,
        `Weight: ${params.weight} kg`,
        `Reps: ${params.actualReps}`,
        `Estimated 1RM: ${e1rm.toFixed(1)} kg`,
      ].join('\n'),
    },
  ]

  return llm.chat(messages, params.model, params.apiKey, params.baseUrl)
}
