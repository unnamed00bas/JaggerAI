import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { MarkdownMessage } from '../ui/MarkdownMessage'
import { useCoachChatStore } from '../../stores/coachChatStore'
import { useProfileStore } from '../../stores/profileStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { buildCoachSystemPrompt, getProvider } from '../../lib/llm'
import { db } from '../../lib/db'
import { nextDayType } from '../../lib/program'

const QUICK_PROMPTS = [
  { key: 'suggest_next_weight' },
  { key: 'suggest_rowing' },
  { key: 'suggest_missed' },
  { key: 'suggest_pain' },
] as const

export function CoachPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const profile = useProfileStore((s) => s.profile)
  const cycle = useProfileStore((s) => s.cycle)
  const { llmProvider, llmApiKey, llmModel, llmBaseUrl, language } = useSettingsStore()
  const { messages, pendingPrompt, addMessage, clearHistory, setPendingPrompt } = useCoachChatStore()

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, loading])

  async function send(rawText: string) {
    const text = rawText.trim()
    if (!text || loading) return
    if (!llmProvider || !llmApiKey) {
      setError(t('coach.configure_first'))
      return
    }
    setError(null)

    addMessage({ role: 'user', content: text })
    setInput('')
    setLoading(true)

    try {
      const [recentWorkouts, personalRecords, lastRowing] = await Promise.all([
        db.workouts.orderBy('date').reverse().limit(10).toArray(),
        db.personalRecords.toArray(),
        db.rowingSessions.orderBy('date').reverse().first(),
      ])

      const weekLogs = recentWorkouts.filter(
        (w) => new Date(w.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      )
      const todayDayType = nextDayType(weekLogs)

      const system = buildCoachSystemPrompt({
        profile,
        cycle,
        recentWorkouts,
        personalRecords,
        lastRowing,
        todayDayType,
        language,
      })

      const provider = getProvider(llmProvider)
      if (!provider) {
        setError('Invalid provider')
        return
      }

      const chatHistory = [...messages, { role: 'user' as const, content: text, timestamp: '' }]
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))

      const reply = await provider.chat(
        [{ role: 'system', content: system }, ...chatHistory],
        llmModel,
        llmApiKey,
        llmBaseUrl,
      )
      addMessage({ role: 'assistant', content: reply })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  // Handle pending prompt (triggered from elsewhere)
  useEffect(() => {
    if (pendingPrompt) {
      const p = pendingPrompt
      setPendingPrompt(null)
      send(p)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt])

  return (
    <div className="flex flex-col gap-3 pb-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('coach.title')}</h1>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs text-surface-400 hover:text-red-400"
          >
            {t('coach.clear')}
          </button>
        )}
      </header>

      {!llmProvider || !llmApiKey ? (
        <Card>
          <p className="text-sm text-surface-300 mb-3">{t('coach.configure_first')}</p>
          <Button size="sm" onClick={() => navigate('/settings')}>
            {t('settings.title')}
          </Button>
        </Card>
      ) : null}

      <div
        ref={listRef}
        className="flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-330px)]"
      >
        {messages.length === 0 && (
          <Card>
            <p className="text-sm text-surface-400 mb-2">{t('coach.no_messages')}</p>
          </Card>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-2xl px-3 py-2 text-sm max-w-[88%] ${
              m.role === 'user'
                ? 'bg-[color:var(--color-accent-500)] text-surface-950 self-end'
                : 'bg-surface-800 border border-surface-700 text-surface-100 self-start'
            }`}
          >
            {m.role === 'assistant' ? (
              <MarkdownMessage content={m.content} />
            ) : (
              <div className="whitespace-pre-wrap">{m.content}</div>
            )}
          </div>
        ))}
        {loading && (
          <div className="self-start bg-surface-800 border border-surface-700 rounded-2xl px-3 py-2 text-sm text-surface-400">
            …
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-2">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q.key}
            onClick={() => send(t(`coach.${q.key}`))}
            className="text-xs px-2.5 py-1.5 rounded-full bg-surface-800 border border-surface-700 text-surface-300 hover:bg-surface-700"
          >
            {t(`coach.${q.key}`)}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('coach.placeholder')}
          className="flex-1 px-3 py-2.5 bg-surface-800 border border-surface-700 rounded-xl text-sm text-surface-100 placeholder:text-surface-500"
        />
        <Button type="submit" disabled={loading || !input.trim()} size="md">
          {t('coach.send')}
        </Button>
      </form>
    </div>
  )
}
