import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { MarkdownMessage } from '../ui/MarkdownMessage'
import { confirmAsync } from '../ui/ConfirmDialog'
import { useCoachChatStore } from '../../stores/coachChatStore'
import { useProfileStore } from '../../stores/profileStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useToastStore } from '../../stores/toastStore'
import { buildCoachSystemPrompt, getProvider } from '../../lib/llm'
import { db } from '../../lib/db'
import { nextDayType } from '../../lib/program'

const PRESET_PROMPTS = [
  'suggest_next_weight',
  'suggest_rowing',
  'suggest_missed',
  'suggest_pain',
  'preset_analyze',
  'preset_next',
  'preset_recovery',
  'preset_nutrition',
  'preset_plateau',
  'preset_technique',
] as const

export function CoachPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const profile = useProfileStore((s) => s.profile)
  const cycle = useProfileStore((s) => s.cycle)
  const { llmProvider, llmApiKey, llmModel, llmBaseUrl, language } = useSettingsStore()
  const {
    messages,
    pendingPrompt,
    addMessage,
    updateLastMessage,
    removeLastMessage,
    clearHistory,
    setPendingPrompt,
  } = useCoachChatStore()
  const errorToast = useToastStore((s) => s.error)

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, loading])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  async function send(rawText: string) {
    const text = rawText.trim()
    if (!text || loading) return
    if (!llmProvider || !llmApiKey) {
      errorToast(t('coach.configure_first'))
      return
    }

    addMessage({ role: 'user', content: text })
    addMessage({ role: 'assistant', content: '' })
    setInput('')
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const [recentWorkouts, personalRecords, lastRowing, rowingHistory] = await Promise.all([
        db.workouts.orderBy('date').reverse().limit(20).toArray(),
        db.personalRecords.toArray(),
        db.rowingSessions.orderBy('date').reverse().first(),
        db.rowingSessions.orderBy('date').reverse().limit(5).toArray(),
      ])

      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const weekLogs = recentWorkouts.filter((w) => new Date(w.date).getTime() > weekAgo)
      const todayDayType = nextDayType(weekLogs)

      const system = buildCoachSystemPrompt({
        profile,
        cycle,
        recentWorkouts,
        personalRecords,
        lastRowing,
        rowingHistory,
        todayDayType,
        language,
      })

      const provider = getProvider(llmProvider)
      if (!provider) {
        errorToast('Invalid provider')
        removeLastMessage()
        return
      }

      const chatHistory = [
        ...messages,
        { role: 'user' as const, content: text, timestamp: '' },
      ]
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))

      let accumulated = ''
      await provider.stream(
        [{ role: 'system', content: system }, ...chatHistory],
        llmModel,
        llmApiKey,
        {
          signal: controller.signal,
          onToken: (delta) => {
            accumulated += delta
            updateLastMessage(accumulated)
          },
        },
        llmBaseUrl,
      )

      if (!accumulated) {
        removeLastMessage()
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // user navigated away; keep whatever we have
        return
      }
      removeLastMessage()
      const message = err instanceof Error ? err.message : String(err)
      errorToast(t('errors.llm_failed', { message }))
    } finally {
      abortRef.current = null
      setLoading(false)
    }
  }

  useEffect(() => {
    if (pendingPrompt) {
      const p = pendingPrompt
      setPendingPrompt(null)
      send(p)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt])

  async function handleClear() {
    const ok = await confirmAsync({
      title: t('confirm.clear_chat_title'),
      message: t('confirm.clear_chat_text'),
      confirmLabel: t('common.delete'),
      destructive: true,
    })
    if (ok) clearHistory()
  }

  function stopStreaming() {
    abortRef.current?.abort()
  }

  const lastMessage = messages[messages.length - 1]
  const showTypingPlaceholder =
    loading && (!lastMessage || lastMessage.role !== 'assistant' || !lastMessage.content)

  return (
    <div className="flex flex-col gap-3 pb-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('coach.title')}</h1>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
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
        {messages.map((m, i) => {
          const isLastAssistant =
            i === messages.length - 1 && m.role === 'assistant' && loading
          return (
            <div
              key={i}
              className={`rounded-2xl px-3 py-2 text-sm max-w-[88%] ${
                m.role === 'user'
                  ? 'bg-[color:var(--color-accent-500)] text-surface-950 self-end'
                  : 'bg-surface-800 border border-surface-700 text-surface-100 self-start'
              }`}
            >
              {m.role === 'assistant' ? (
                m.content ? (
                  <MarkdownMessage content={m.content} />
                ) : (
                  <span className="text-surface-400">{t('coach.streaming')}</span>
                )
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}
              {isLastAssistant && m.content && (
                <span
                  aria-hidden="true"
                  className="inline-block w-[6px] h-[14px] ml-0.5 align-middle bg-surface-400 animate-pulse"
                />
              )}
            </div>
          )
        })}
        {showTypingPlaceholder && (
          <div className="self-start bg-surface-800 border border-surface-700 rounded-2xl px-3 py-2 text-xs text-surface-400">
            {t('coach.streaming')}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESET_PROMPTS.map((key) => (
          <button
            key={key}
            disabled={loading}
            onClick={() => send(t(`coach.${key}`))}
            className="text-xs px-2.5 py-1.5 rounded-full bg-surface-800 border border-surface-700 text-surface-300 hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t(`coach.${key}`)}
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
        {loading ? (
          <Button type="button" variant="secondary" size="md" onClick={stopStreaming}>
            {t('common.cancel')}
          </Button>
        ) : (
          <Button type="submit" disabled={!input.trim()} size="md">
            {t('coach.send')}
          </Button>
        )}
      </form>
    </div>
  )
}
