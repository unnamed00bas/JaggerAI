import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCycleStore } from '../../stores/cycleStore'
import { useExerciseSelectionStore } from '../../stores/exerciseSelectionStore'
import { db } from '../../lib/db'
import { getDayPrescription, getBlock } from '../../lib/juggernaut'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { WorkoutLog } from '../../types'
import { TRAINING_DAYS } from '../../types'

export function WorkoutList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const activeCycleId = useCycleStore((s) => s.activeCycleId)
  const currentWeek = useCycleStore((s) => s.currentWeek)
  const exerciseSelections = useExerciseSelectionStore((s) => s.selections)

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

  if (!cycle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-6xl">🏋️</div>
        <h1 className="text-2xl font-bold">{t('workout.title')}</h1>
        <p className="text-surface-500 dark:text-surface-400 text-center">
          {t('cycle.createFirst')}
        </p>
        <Button size="lg" onClick={() => navigate('/cycle/new')}>
          {t('cycle.startCycle')}
        </Button>
      </div>
    )
  }

  const block = getBlock(currentWeek)
  const completedDays = new Set(weekLogs?.map((log) => log.dayType) ?? [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('workout.title')}</h1>
        <span className="text-sm text-surface-500 dark:text-surface-400">
          {t(`blocks.short${block}`)} — {t('cycle.week', { number: currentWeek })}
        </span>
      </div>

      {TRAINING_DAYS.map((dayType) => {
        const prescription = getDayPrescription(currentWeek, dayType, cycle.workingWeights, exerciseSelections)
        const isDone = completedDays.has(dayType)
        const exerciseCount = prescription.exercises.length

        return (
          <Card
            key={dayType}
            onClick={() => navigate(`/workout/${dayType}`)}
            className={isDone ? 'opacity-60' : ''}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDone ? (
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-primary-400 dark:border-primary-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                )}
                <div>
                  <div className="font-semibold">{t(`dayTypes.${dayType}Short`)}</div>
                  <div className="text-sm text-surface-500 dark:text-surface-400">
                    {exerciseCount} {t('workout.title').toLowerCase()}
                  </div>
                  <div className="text-xs text-surface-400 dark:text-surface-500 mt-0.5 flex flex-wrap gap-x-2">
                    {prescription.exercises.slice(0, 4).map((ex) => (
                      <span key={ex.exerciseId}>{t(`exercises.short.${ex.exerciseId}`)}</span>
                    ))}
                    {prescription.exercises.length > 4 && <span>+{prescription.exercises.length - 4}</span>}
                  </div>
                </div>
              </div>
              <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        )
      })}

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
