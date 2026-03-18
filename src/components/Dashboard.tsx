import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCycleStore } from '../stores/cycleStore'
import { db } from '../lib/db'
import { getCycleWeeks, getWeightForSet, getWorkoutPrescription } from '../lib/juggernaut'
import { getTabataWorkout, getTabataFrequency, getBlockDurationSeconds } from '../lib/tabata'
import { generateWeeklySummary } from '../lib/llm'
import { useSettingsStore } from '../stores/settingsStore'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { TrainerRecommendation } from './ai/TrainerRecommendation'
import type { Lift, WorkoutLog, TabataLog, AmrapResult } from '../types'

const TOTAL_WEEKS = 16

export function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const activeCycleId = useCycleStore((s) => s.activeCycleId)
  const currentWeek = useCycleStore((s) => s.currentWeek)
  const variant = useSettingsStore((s) => s.variant)
  const tabataEnabled = useSettingsStore((s) => s.tabataEnabled)
  const tabataEquipment = useSettingsStore((s) => s.tabataEquipment)
  const llmProvider = useSettingsStore((s) => s.llmProvider)
  const llmApiKey = useSettingsStore((s) => s.llmApiKey)
  const llmModel = useSettingsStore((s) => s.llmModel)
  const llmBaseUrl = useSettingsStore((s) => s.llmBaseUrl)
  const language = useSettingsStore((s) => s.language)

  const [weekSummary, setWeekSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

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

  const amrapResults = useLiveQuery(
    () => (activeCycleId
      ? db.amrapResults.where('cycleId').equals(activeCycleId).sortBy('date')
      : Promise.resolve([] as AmrapResult[])),
    [activeCycleId],
  )

  const allTabataLogs = useLiveQuery(
    () => (activeCycleId
      ? db.tabataLogs.where('cycleId').equals(activeCycleId).sortBy('date')
      : Promise.resolve([] as TabataLog[])),
    [activeCycleId],
  )

  const tabataLog = useLiveQuery(
    () => (activeCycleId && tabataEnabled
      ? db.tabataLogs
          .where('cycleId')
          .equals(activeCycleId)
          .filter((log: TabataLog) => log.week === currentWeek)
          .first()
      : Promise.resolve(undefined)),
    [activeCycleId, currentWeek, tabataEnabled],
  )

  if (!cycle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-6xl">🏋️</div>
        <h1 className="text-2xl font-bold">{t('app.name')}</h1>
        <p className="text-surface-500 dark:text-surface-400 text-center">
          {t('cycle.createFirst')}
        </p>
        <Button size="lg" onClick={() => navigate('/cycle/new')}>
          {t('cycle.startCycle')}
        </Button>
      </div>
    )
  }

  const weeks = getCycleWeeks()
  const weekInfo = weeks[currentWeek - 1]
  if (!weekInfo) return null

  const lifts: Lift[] = ['squat', 'bench', 'ohp', 'deadlift']
  const completedLifts = new Set(weekLogs?.map((log) => log.lift) ?? [])
  const completedCount = completedLifts.size
  const totalCount = lifts.length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('app.name')}</h1>
        <span className="text-sm text-surface-500 dark:text-surface-400">
          {t('cycle.week', { number: currentWeek })}
        </span>
      </div>

      <Card className="bg-primary-600 dark:bg-primary-800 text-white border-0">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm opacity-80">{t(`waves.${weekInfo.wave}`)}</div>
            <div className="text-lg font-bold">{t(`phases.${weekInfo.phase}`)}</div>
          </div>
          <div className="text-3xl font-bold opacity-20">
            {currentWeek}/16
          </div>
        </div>
        <p className="text-sm mt-2 opacity-80">
          {t(`effort.${weekInfo.phase}`)}
        </p>
      </Card>

      {/* Weekly progress */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">{t('dashboard.weekProgress')}</h2>
          <span className="text-sm text-surface-500 dark:text-surface-400">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="flex gap-1.5">
          {lifts.map((lift) => (
            <div
              key={lift}
              className={`flex-1 h-2 rounded-full ${
                completedLifts.has(lift)
                  ? 'bg-green-500'
                  : 'bg-surface-200 dark:bg-surface-600'
              }`}
            />
          ))}
        </div>
        <div className="flex gap-1.5 mt-1">
          {lifts.map((lift) => (
            <div key={lift} className="flex-1 text-center">
              <span className={`text-xs ${
                completedLifts.has(lift)
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-surface-400 dark:text-surface-500'
              }`}>
                {t(`lifts.${lift}`).slice(0, 3)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Trainer recommendation */}
      <TrainerRecommendation />

      <h2 className="text-lg font-semibold mt-2">{t('workout.title')}</h2>

      {lifts.map((lift) => {
        const prescription = getWorkoutPrescription(
          weekInfo.wave,
          weekInfo.phase,
          lift,
          cycle.trainingMaxes[lift],
          variant,
        )
        const mainSet = prescription.sets.find(s => !s.isWarmup) ?? prescription.sets[0]
        const weight = getWeightForSet(cycle.trainingMaxes[lift], mainSet.percentage)
        const isDone = completedLifts.has(lift)

        return (
          <Card
            key={lift}
            onClick={() => navigate(`/workout/${lift}`)}
            className={`flex items-center justify-between ${isDone ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-3">
              {isDone ? (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-surface-300 dark:border-surface-500 flex-shrink-0" />
              )}
              <div>
                <div className="font-semibold">{t(`lifts.${lift}`)}</div>
                <div className="text-sm text-surface-500 dark:text-surface-400">
                  {mainSet.reps === 'amrap'
                    ? `${weight} ${t('common.kg')} × AMRAP`
                    : `${weight} ${t('common.kg')} × ${mainSet.reps}`}
                </div>
              </div>
            </div>
            <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Card>
        )
      })}

      {/* Tabata conditioning card */}
      {tabataEnabled && weekInfo && (() => {
        const tabataWorkout = getTabataWorkout(weekInfo.wave, weekInfo.phase, currentWeek, tabataEquipment)
        const freq = getTabataFrequency(weekInfo.phase)
        const blockMin = Math.ceil(getBlockDurationSeconds(tabataWorkout.blocks[0]) / 60)
        const isDone = !!tabataLog

        return (
          <>
            <h2 className="text-lg font-semibold mt-4">{t('tabata.title')}</h2>
            <Card
              onClick={() => navigate('/workout/tabata')}
              className={`flex items-center justify-between ${isDone ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3">
                {isDone ? (
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-orange-400 dark:border-orange-500 flex-shrink-0" />
                )}
                <div>
                  <div className="font-semibold">
                    {tabataWorkout.blocks.length} {tabataWorkout.blocks.length === 1 ? 'block' : 'blocks'} &middot; ~{blockMin} {t('tabata.min')}
                  </div>
                  <div className="text-sm text-surface-500 dark:text-surface-400">
                    {tabataWorkout.blocks.map((b) => t(`tabata.exercises.${b.exerciseId}`)).join(', ')}
                  </div>
                  <div className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                    {t('tabata.frequency', { min: freq.min, max: freq.max })}
                  </div>
                </div>
              </div>
              <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Card>
          </>
        )
      })()}

      {/* Weekly AI summary — shows when all lifts are done and LLM configured */}
      {completedCount === totalCount && llmProvider && llmApiKey && (
        <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/50 mt-2">
          <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-2">
            {t('dashboard.weekSummary')}
          </h3>
          {weekSummary ? (
            <p className="text-sm text-indigo-700 dark:text-indigo-400 whitespace-pre-wrap">{weekSummary}</p>
          ) : summaryLoading ? (
            <p className="text-sm text-indigo-500 dark:text-indigo-400 animate-pulse">
              {t('dashboard.summaryLoading')}
            </p>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                setSummaryLoading(true)
                try {
                  const result = await generateWeeklySummary({
                    wave: weekInfo.wave,
                    phase: weekInfo.phase,
                    week: currentWeek,
                    logs: weekLogs ?? [],
                    trainingMaxes: cycle.trainingMaxes,
                    cycle,
                    amrapResults: amrapResults ?? [],
                    tabataLogs: allTabataLogs ?? [],
                    provider: llmProvider,
                    apiKey: llmApiKey,
                    model: llmModel,
                    baseUrl: llmBaseUrl || undefined,
                    language,
                  })
                  setWeekSummary(result)
                } catch {
                  // Non-critical, silently fail
                } finally {
                  setSummaryLoading(false)
                }
              }}
            >
              {t('dashboard.generateSummary')}
            </Button>
          )}
        </Card>
      )}

      {/* Training tips */}
      <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50 mt-2">
        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
          {t(`dashboard.tips.${weekInfo.phase}Title`)}
        </h3>
        <p className="text-sm text-amber-700 dark:text-amber-400">
          {t(`dashboard.tips.${weekInfo.phase}`)}
        </p>
      </Card>

      {currentWeek === TOTAL_WEEKS && completedCount === totalCount && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 mt-2">
          <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-1">
            {t('cycle.cycleComplete')}
          </h3>
          <p className="text-sm text-green-700 dark:text-green-400 mb-3">
            {t('cycle.cycleCompleteDesc')}
          </p>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={async () => {
                await useCycleStore.getState().startNextCycle()
                navigate('/')
              }}
            >
              {t('cycle.startNextCycle')}
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={async () => {
                await useCycleStore.getState().resetCycle()
                navigate('/cycle/new')
              }}
            >
              {t('cycle.resetCycle')}
            </Button>
          </div>
        </Card>
      )}

      <Button
        variant="secondary"
        className="mt-2"
        onClick={() => navigate('/cycle/overview')}
      >
        {t('cycle.overview')}
      </Button>
    </div>
  )
}
