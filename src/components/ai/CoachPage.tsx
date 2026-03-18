import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSettingsStore } from '../../stores/settingsStore'
import { useCycleStore } from '../../stores/cycleStore'
import { useCoachChatStore } from '../../stores/coachChatStore'
import { db } from '../../lib/db'
import { getProvider } from '../../lib/llm'
import { buildCoachSystemPrompt } from '../../lib/llm/coachPrompt'
import type { LlmMessage } from '../../lib/llm'
import type { AmrapResult, WorkoutLog, TabataLog } from '../../types'
import { Button } from '../ui/Button'
import { MarkdownMessage } from '../ui/MarkdownMessage'

export function CoachPage() {
  const { t } = useTranslation()
  const llmProvider = useSettingsStore((s) => s.llmProvider)
  const llmApiKey = useSettingsStore((s) => s.llmApiKey)
  const llmModel = useSettingsStore((s) => s.llmModel)
  const llmBaseUrl = useSettingsStore((s) => s.llmBaseUrl)
  const language = useSettingsStore((s) => s.language)
  const activeCycleId = useCycleStore((s) => s.activeCycleId)
  const currentWeek = useCycleStore((s) => s.currentWeek)

  const messages = useCoachChatStore((s) => s.messages)
  const pendingPrompt = useCoachChatStore((s) => s.pendingPrompt)
  const addMessage = useCoachChatStore((s) => s.addMessage)
  const setPendingPrompt = useCoachChatStore((s) => s.setPendingPrompt)
  const clearHistory = useCoachChatStore((s) => s.clearHistory)

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pendingHandled = useRef(false)

  const cycle = useLiveQuery(
    () => (activeCycleId ? db.cycles.get(activeCycleId) : undefined),
    [activeCycleId],
  )

  const amrapResults = useLiveQuery(
    () => (activeCycleId
      ? db.amrapResults.where('cycleId').equals(activeCycleId).sortBy('date')
      : Promise.resolve([] as AmrapResult[])),
    [activeCycleId],
  )

  const workoutLogs = useLiveQuery(
    () => (activeCycleId
      ? db.workoutLogs.where('cycleId').equals(activeCycleId).sortBy('date')
      : Promise.resolve([] as WorkoutLog[])),
    [activeCycleId],
  )

  const tabataLogs = useLiveQuery(
    () => (activeCycleId
      ? db.tabataLogs.where('cycleId').equals(activeCycleId).sortBy('date')
      : Promise.resolve([] as TabataLog[])),
    [activeCycleId],
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  function buildSystemPrompt(): string {
    return buildCoachSystemPrompt({
      cycle,
      amrapResults: amrapResults ?? [],
      workoutLogs: workoutLogs ?? [],
      tabataLogs: tabataLogs ?? [],
      language,
      currentWeek,
    })
  }

  const handleSend = useCallback(async (text?: string) => {
    const msg = text ?? input
    if (!msg.trim() || loading) return

    addMessage({ role: 'user', content: msg })
    setInput('')
    setLoading(true)

    try {
      const provider = getProvider(llmProvider!)
      if (!provider) throw new Error('Provider not found')

      const currentMessages = useCoachChatStore.getState().messages
      const llmMessages: LlmMessage[] = [
        { role: 'system', content: buildSystemPrompt() },
        ...currentMessages.map((m) => ({ role: m.role, content: m.content })),
      ]

      const response = await provider.chat(llmMessages, llmModel, llmApiKey, llmBaseUrl)
      addMessage({ role: 'assistant', content: response })
    } catch (err) {
      addMessage({
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      })
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, loading, llmProvider, llmApiKey, llmModel, llmBaseUrl, cycle, currentWeek, amrapResults, workoutLogs, tabataLogs, language])

  // Handle pending prompt from Dashboard trainer recommendation
  useEffect(() => {
    if (pendingPrompt && !pendingHandled.current && !loading && cycle) {
      pendingHandled.current = true
      setPendingPrompt(null)
      handleSend(pendingPrompt)
    }
  }, [pendingPrompt, loading, cycle, handleSend, setPendingPrompt])

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

  const quickPrompts = [
    { key: 'analyzeProgress', label: t('coach.prompts.analyzeProgress') },
    { key: 'weakPoints', label: t('coach.prompts.weakPoints') },
    { key: 'recovery', label: t('coach.prompts.recovery') },
    { key: 'adjustTm', label: t('coach.prompts.adjustTm') },
  ]

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)]">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold">{t('coach.title')}</h1>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory}>
            {t('coach.clearHistory')}
          </Button>
        )}
      </div>

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
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
              msg.role === 'user'
                ? 'self-end bg-primary-600 dark:bg-primary-700 text-white'
                : 'self-start bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 text-surface-900 dark:text-surface-100'
            }`}
          >
            {msg.role === 'assistant' ? (
              <MarkdownMessage content={msg.content} />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            )}
          </div>
        ))}
        {loading && (
          <div className="self-start max-w-[85%] rounded-2xl p-3 shadow-sm bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700">
            <p className="text-sm text-surface-500 dark:text-surface-400 animate-pulse">
              {t('coach.analyzing')}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
          placeholder={t('coach.placeholder')}
          className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <Button onClick={() => handleSend()} disabled={loading || !input.trim()}>
          {t('coach.send')}
        </Button>
      </div>
    </div>
  )
}
