import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { generateTrainerRecommendation } from '../../lib/llm'
import { useSettingsStore } from '../../stores/settingsStore'
import { useCycleStore } from '../../stores/cycleStore'
import { db } from '../../lib/db'
import { getCycleWeeks } from '../../lib/juggernaut'
import type { WorkoutLog, AmrapResult, TabataLog } from '../../types'

export function TrainerRecommendation() {
  const { t } = useTranslation()

  const activeCycleId = useCycleStore((s) => s.activeCycleId)
  const currentWeek = useCycleStore((s) => s.currentWeek)
  const llmProvider = useSettingsStore((s) => s.llmProvider)
  const llmApiKey = useSettingsStore((s) => s.llmApiKey)
  const llmModel = useSettingsStore((s) => s.llmModel)
  const llmBaseUrl = useSettingsStore((s) => s.llmBaseUrl)
  const language = useSettingsStore((s) => s.language)
  const tabataEnabled = useSettingsStore((s) => s.tabataEnabled)
  const tabataEquipment = useSettingsStore((s) => s.tabataEquipment)

  const [recommendation, setRecommendation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showHiitQuestion, setShowHiitQuestion] = useState(false)

  const cycle = useLiveQuery(
    () => (activeCycleId ? db.cycles.get(activeCycleId) : undefined),
    [activeCycleId],
  )

  const weekLogs = useLiveQuery(
    () => (activeCycleId
      ? db.workoutLogs
          .where('cycleId')
          .equals(activeCycleId)
          .filter((log) => log.week === currentWeek)
          .toArray()
      : Promise.resolve([] as WorkoutLog[])),
    [activeCycleId, currentWeek],
  )

  const allLogs = useLiveQuery(
    () => (activeCycleId
      ? db.workoutLogs.where('cycleId').equals(activeCycleId).sortBy('date')
      : Promise.resolve([] as WorkoutLog[])),
    [activeCycleId],
  )

  const amrapResults = useLiveQuery(
    () => (activeCycleId
      ? db.amrapResults.where('cycleId').equals(activeCycleId).sortBy('date')
      : Promise.resolve([] as AmrapResult[])),
    [activeCycleId],
  )

  const tabataLogs = useLiveQuery(
    () => (activeCycleId
      ? db.tabataLogs.where('cycleId').equals(activeCycleId).sortBy('date')
      : Promise.resolve([] as TabataLog[])),
    [activeCycleId],
  )

  const generate = useCallback(async (includeHiit: boolean) => {
    if (!llmProvider || !llmApiKey || !cycle) return

    setShowHiitQuestion(false)
    setLoading(true)
    setRecommendation(null)

    const weeks = getCycleWeeks()
    const weekInfo = weeks[currentWeek - 1]
    if (!weekInfo) {
      setLoading(false)
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    const todayLogs = (weekLogs ?? []).filter((log) => log.date.slice(0, 10) === today)
    const completedLiftsToday = todayLogs.map((log) => log.lift)

    const allWeekLogsMapped = (weekLogs ?? []).map((log) => ({
      lift: log.lift,
      date: log.date.slice(0, 10),
      phase: log.phase,
    }))

    try {
      const result = await generateTrainerRecommendation({
        wave: weekInfo.wave,
        phase: weekInfo.phase,
        week: currentWeek,
        cycle,
        amrapResults: amrapResults ?? [],
        workoutLogs: allLogs ?? [],
        tabataLogs: tabataLogs ?? [],
        completedLiftsToday,
        allWeekLogs: allWeekLogsMapped,
        includeHiit,
        tabataEnabled,
        tabataEquipment: tabataEquipment,
        provider: llmProvider,
        apiKey: llmApiKey,
        model: llmModel,
        baseUrl: llmBaseUrl || undefined,
        language,
      })
      setRecommendation(result)
    } catch {
      setRecommendation(language === 'ru'
        ? 'Не удалось получить рекомендацию. Проверьте настройки AI-тренера.'
        : 'Failed to get recommendation. Check AI coach settings.')
    } finally {
      setLoading(false)
    }
  }, [
    llmProvider, llmApiKey, llmModel, llmBaseUrl, cycle, currentWeek,
    weekLogs, allLogs, amrapResults, tabataLogs, tabataEnabled,
    tabataEquipment, language,
  ])

  if (!llmProvider || !llmApiKey) {
    return (
      <Card className="bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/50">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🤖</div>
          <div>
            <h3 className="text-sm font-semibold text-violet-800 dark:text-violet-300">
              {t('dashboard.trainer.title')}
            </h3>
            <p className="text-xs text-violet-500 dark:text-violet-400">
              {t('dashboard.trainer.noProvider')}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-2xl">🤖</div>
          <h3 className="text-sm font-semibold text-violet-800 dark:text-violet-300">
            {t('dashboard.trainer.title')}
          </h3>
        </div>
        {recommendation && !loading && (
          <Button
            variant="ghost"
            size="sm"
            className="text-violet-600 dark:text-violet-400"
            onClick={() => setShowHiitQuestion(true)}
          >
            {t('dashboard.trainer.regenerate')}
          </Button>
        )}
      </div>

      {recommendation ? (
        <div className="text-sm text-violet-900 dark:text-violet-200 whitespace-pre-wrap leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-headings:text-violet-800 dark:prose-headings:text-violet-300 prose-headings:text-sm prose-headings:mt-3 prose-headings:mb-1 prose-li:my-0 prose-ul:my-1 prose-p:my-1">
          {recommendation}
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-violet-500 dark:text-violet-400 animate-pulse">
            {t('dashboard.trainer.loading')}
          </p>
        </div>
      ) : showHiitQuestion ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-violet-700 dark:text-violet-300">
            {t('dashboard.trainer.hiitQuestion')}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => generate(true)}
              className="flex-1"
            >
              {t('dashboard.trainer.yes')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => generate(false)}
              className="flex-1"
            >
              {t('dashboard.trainer.no')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowHiitQuestion(true)}
          className="w-full"
        >
          {t('dashboard.trainer.generate')}
        </Button>
      )}
    </Card>
  )
}
