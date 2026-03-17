import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCycleStore } from '../../stores/cycleStore'
import { useWorkoutStore } from '../../stores/workoutStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useRestTimer } from '../../hooks/useRestTimer'
import { db } from '../../lib/db'
import { getCycleWeeks, getWorkoutPrescription, getWeightForSet } from '../../lib/juggernaut'
import { generateAmrapInsight } from '../../lib/llm'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { Lift, CompletedSet, AmrapResult } from '../../types'
import { WAVE_TARGET_REPS } from '../../types'

export function WorkoutDay() {
  const { t } = useTranslation()
  const { lift: liftParam } = useParams<{ lift: string }>()
  const navigate = useNavigate()
  const lift = liftParam as Lift

  const activeCycleId = useCycleStore((s) => s.activeCycleId)
  const currentWeek = useCycleStore((s) => s.currentWeek)
  const updateTrainingMax = useCycleStore((s) => s.updateTrainingMax)
  const variant = useSettingsStore((s) => s.variant)
  const restTimerSeconds = useSettingsStore((s) => s.restTimerSeconds)

  const activeWorkout = useWorkoutStore((s) => s.activeWorkout)
  const startWorkout = useWorkoutStore((s) => s.startWorkout)
  const updateSet = useWorkoutStore((s) => s.updateSet)
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout)

  const { secondsLeft, isRunning, start: startTimer } = useRestTimer()
  const llmProvider = useSettingsStore((s) => s.llmProvider)
  const llmApiKey = useSettingsStore((s) => s.llmApiKey)
  const llmModel = useSettingsStore((s) => s.llmModel)
  const llmBaseUrl = useSettingsStore((s) => s.llmBaseUrl)
  const language = useSettingsStore((s) => s.language)

  const [amrapReps, setAmrapReps] = useState('')
  const [notes, setNotes] = useState('')
  const [insight, setInsight] = useState<string | null>(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const workoutFinishedRef = useRef(false)

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

  const weeks = getCycleWeeks()
  const weekInfo = weeks[currentWeek - 1]

  useEffect(() => {
    if (!cycle || !weekInfo || activeWorkout || workoutFinishedRef.current) return

    const tm = cycle.trainingMaxes[lift]
    const prescription = getWorkoutPrescription(weekInfo.wave, weekInfo.phase, lift, tm, variant)

    const sets: CompletedSet[] = prescription.sets.map((s) => ({
      targetWeight: getWeightForSet(tm, s.percentage),
      targetReps: s.reps,
      actualWeight: getWeightForSet(tm, s.percentage),
      actualReps: s.reps === 'amrap' ? 0 : s.reps,
      completed: false,
    }))

    startWorkout({
      cycleId: cycle.id,
      lift,
      wave: weekInfo.wave,
      phase: weekInfo.phase,
      week: currentWeek,
      sets,
    })
  }, [cycle, weekInfo, lift, activeWorkout, variant, currentWeek, startWorkout])

  if (!cycle || !weekInfo || !activeWorkout) return null

  const prescription = getWorkoutPrescription(weekInfo.wave, weekInfo.phase, lift, cycle.trainingMaxes[lift], variant)

  function handleSetComplete(index: number) {
    const set = activeWorkout!.sets[index]
    updateSet(index, { completed: !set.completed })
    if (!set.completed) {
      startTimer(restTimerSeconds)
    }
  }

  async function handleFinish() {
    workoutFinishedRef.current = true
    const isAmrapWorkout = weekInfo!.phase === 'realization' && amrapReps
    let newTM: number | undefined

    if (isAmrapWorkout) {
      newTM = await updateTrainingMax(
        cycle!.id,
        lift,
        weekInfo!.wave,
        Number(amrapReps),
      )
    }
    await finishWorkout(notes)

    // Auto-generate AI insight after AMRAP if LLM is configured
    if (isAmrapWorkout && llmProvider && llmApiKey && newTM !== undefined) {
      setInsightLoading(true)
      const amrapSet = activeWorkout!.sets.find((s) => s.targetReps === 'amrap')
      const weight = amrapSet?.actualWeight ?? 0
      const targetReps = WAVE_TARGET_REPS[weekInfo!.wave]
      try {
        const result = await generateAmrapInsight({
          lift,
          wave: weekInfo!.wave,
          weight,
          targetReps,
          actualReps: Number(amrapReps),
          oldTM: cycle!.trainingMaxes[lift],
          newTM,
          trainingMaxes: cycle!.trainingMaxes,
          cycle: cycle!,
          amrapResults: amrapResults ?? [],
          provider: llmProvider,
          apiKey: llmApiKey,
          model: llmModel,
          baseUrl: llmBaseUrl || undefined,
          language,
        })
        setInsight(result)
      } catch {
        // Silently fail — insight is non-critical
      } finally {
        setInsightLoading(false)
      }
      return
    }

    navigate('/')
  }

  const allDone = activeWorkout.sets.every((s) => s.completed)
  const isRealization = weekInfo.phase === 'realization'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-surface-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold">{t(`lifts.${lift}`)}</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {t(`waves.${weekInfo.wave}`)} — {t(`phases.${weekInfo.phase}`)}
          </p>
        </div>
      </div>

      {isRunning && (
        <Card className="bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 text-center">
          <div className="text-sm text-primary-600 dark:text-primary-400">{t('workout.restTimer')}</div>
          <div className="text-3xl font-mono font-bold text-primary-700 dark:text-primary-300">
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {activeWorkout.sets.map((set, i) => {
          const prescriptionSet = prescription.sets[i]
          const isAmrap = prescriptionSet?.reps === 'amrap'

          return (
            <Card
              key={i}
              className={`flex items-center justify-between transition-opacity ${set.completed ? 'opacity-60' : ''}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
                    {t('workout.set', { number: i + 1 })}
                  </span>
                  {prescriptionSet?.isWarmup && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-500">
                      {t('workout.warmup')}
                    </span>
                  )}
                  {isAmrap && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold">
                      {t('workout.amrap')}
                    </span>
                  )}
                </div>
                <div className="font-semibold mt-1">
                  {set.targetWeight} {t('common.kg')} ×{' '}
                  {isAmrap ? 'AMRAP' : set.targetReps}
                </div>
              </div>

              {isAmrap ? (
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={t('workout.actualReps')}
                  value={amrapReps}
                  onChange={(e) => {
                    setAmrapReps(e.target.value)
                    if (e.target.value) {
                      updateSet(i, { actualReps: Number(e.target.value), completed: true })
                    }
                  }}
                  className="w-20 px-3 py-2 text-center rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-lg font-bold"
                />
              ) : (
                <button
                  onClick={() => handleSetComplete(i)}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                    set.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-surface-300 dark:border-surface-600'
                  }`}
                >
                  {set.completed && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )}
            </Card>
          )
        })}
      </div>

      <Card className="mt-2">
        <textarea
          placeholder={t('workout.notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-transparent resize-none text-sm placeholder:text-surface-400 focus:outline-none"
          rows={2}
        />
      </Card>

      <p className="text-sm text-center text-surface-500 dark:text-surface-400 italic">
        {t(`effort.${weekInfo.phase}`)}
      </p>

      <Button
        size="lg"
        className="w-full"
        onClick={handleFinish}
        disabled={!allDone || (isRealization && !amrapReps)}
      >
        {t('workout.finish')}
      </Button>

      {(insightLoading || insight) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-sm w-full">
            <h3 className="font-semibold mb-2">{t('coach.insight.title')}</h3>
            {insightLoading ? (
              <p className="text-sm text-surface-500 dark:text-surface-400 animate-pulse">
                {t('coach.insight.generating')}
              </p>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap mb-4">{insight}</p>
                <Button className="w-full" onClick={() => navigate('/')}>
                  {t('coach.insight.dismiss')}
                </Button>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
