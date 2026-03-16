import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSettingsStore } from '../../stores/settingsStore'
import { useCycleStore } from '../../stores/cycleStore'
import { db } from '../../lib/db'
import { getProvider } from '../../lib/llm'
import type { LlmMessage } from '../../lib/llm'
import type { AmrapResult } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

export function CoachPage() {
  const { t } = useTranslation()
  const llmProvider = useSettingsStore((s) => s.llmProvider)
  const llmApiKey = useSettingsStore((s) => s.llmApiKey)
  const llmModel = useSettingsStore((s) => s.llmModel)
  const activeCycleId = useCycleStore((s) => s.activeCycleId)

  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const cycle = useLiveQuery(
    () => (activeCycleId ? db.cycles.get(activeCycleId) : undefined),
    [activeCycleId],
  )

  const amrapResults = useLiveQuery(
    () => (activeCycleId
      ? db.amrapResults.where('cycleId').equals(activeCycleId).toArray()
      : Promise.resolve([] as AmrapResult[])),
    [activeCycleId],
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  if (!llmProvider || !llmApiKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl">🤖</div>
        <h1 className="text-xl font-bold">{t('coach.title')}</h1>
        <p className="text-surface-500 dark:text-surface-400 text-center">
          {t('coach.noProvider')}
        </p>
      </div>
    )
  }

  function buildSystemPrompt(): string {
    let context = 'You are an expert strength training coach specializing in the Juggernaut Method 2.0. '
    context += 'Provide specific, actionable advice based on the athlete\'s training data. Respond in the same language the user writes in.\n\n'

    if (cycle) {
      context += `Training Maxes: Squat ${cycle.trainingMaxes.squat}kg, Bench ${cycle.trainingMaxes.bench}kg, OHP ${cycle.trainingMaxes.ohp}kg, Deadlift ${cycle.trainingMaxes.deadlift}kg\n`
      context += `Method variant: ${cycle.variant}\n`
    }

    if (amrapResults?.length) {
      context += '\nAMRAP Results:\n'
      for (const r of amrapResults) {
        context += `- ${r.lift} (${r.wave}): ${r.actualReps} reps @ ${r.weight}kg (e1RM: ${r.estimatedOneRepMax}kg)\n`
      }
    }

    return context
  }

  async function handleSend(text?: string) {
    const msg = text ?? input
    if (!msg.trim()) return

    const userMsg = { role: 'user' as const, content: msg }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const provider = getProvider(llmProvider!)
      if (!provider) throw new Error('Provider not found')

      const llmMessages: LlmMessage[] = [
        { role: 'system', content: buildSystemPrompt() },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        userMsg,
      ]

      const response = await provider.chat(llmMessages, llmModel, llmApiKey)
      setMessages((prev) => [...prev, { role: 'assistant', content: response }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const quickPrompts = [
    { key: 'analyzeProgress', label: t('coach.prompts.analyzeProgress') },
    { key: 'weakPoints', label: t('coach.prompts.weakPoints') },
    { key: 'recovery', label: t('coach.prompts.recovery') },
    { key: 'adjustTm', label: t('coach.prompts.adjustTm') },
  ]

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)]">
      <h1 className="text-xl font-bold mb-3">{t('coach.title')}</h1>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {quickPrompts.map((p) => (
            <Button key={p.key} variant="secondary" size="sm" onClick={() => handleSend(p.label)}>
              {p.label}
            </Button>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-3 mb-4">
        {messages.map((msg, i) => (
          <Card
            key={i}
            className={`max-w-[85%] ${
              msg.role === 'user'
                ? 'self-end bg-primary-600 dark:bg-primary-700 text-white border-0'
                : 'self-start'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          </Card>
        ))}
        {loading && (
          <Card className="self-start max-w-[85%]">
            <p className="text-sm text-surface-500 dark:text-surface-400 animate-pulse">
              {t('coach.analyzing')}
            </p>
          </Card>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
          placeholder={t('coach.placeholder')}
          className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <Button onClick={() => handleSend()} disabled={loading || !input.trim()}>
          {t('coach.send')}
        </Button>
      </div>
    </div>
  )
}
