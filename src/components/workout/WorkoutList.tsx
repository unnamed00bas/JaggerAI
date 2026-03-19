import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCycleStore } from '../../stores/cycleStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { db } from '../../lib/db'
import { getCycleWeeks, getWorkoutPrescription, getWeightForSet } from '../../lib/juggernaut'
import { getTabataWorkout, getTabataFrequency, getBlockDurationSeconds } from '../../lib/tabata'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { Lift, WorkoutLog, TabataLog } from '../../types'

export function WorkoutList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const activeCycleId = useCycleStore((s) => s.activeCycleId)
  const currentWeek = useCycleStore((s) => s.currentWeek)
  const variant = useSettingsStore((s) => s.variant)
  const tabataEnabled = useSettingsStore((s) => s.tabataEnabled)
  const tabataEquipment = useSettingsStore((s) => s.tabataEquipment)

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

  const weeks = getCycleWeeks()
  const weekInfo = weeks[currentWeek - 1]
  if (!weekInfo) return null

  const lifts: Lift[] = ['squat', 'bench', 'ohp', 'deadlift']
  const completedLifts = new Set(weekLogs?.map((log) => log.lift) ?? [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('workout.title')}</h1>
        <span className="text-sm text-surface-500 dark:text-surface-400">
          {t(`waves.${weekInfo.wave}`)} — {t(`phases.${weekInfo.phase}`)}
        </span>
      </div>

      <p className="text-sm text-surface-500 dark:text-surface-400 italic">
        {t(`effort.${weekInfo.phase}`)}
      </p>

      {lifts.map((lift) => {
        const prescription = getWorkoutPrescription(
          weekInfo.wave,
          weekInfo.phase,
          lift,
          cycle.trainingMaxes[lift],
          variant,
        )
        const isDone = completedLifts.has(lift)

        return (
          <Card
            key={lift}
            onClick={() => navigate(`/workout/${lift}`)}
            className={`${isDone ? 'opacity-60' : ''}`}
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
                  <div className="font-semibold">{t(`lifts.${lift}`)}</div>
                  <div className="text-sm text-surface-500 dark:text-surface-400">
                    {prescription.sets.filter(s => !s.isWarmup).map((s) => {
                      const weight = getWeightForSet(cycle.trainingMaxes[lift], s.percentage)
                      return s.reps === 'amrap'
                        ? `${weight} ${t('common.kg')} × AMRAP`
                        : `${weight} ${t('common.kg')} × ${s.reps}`
                    }).filter((v, i, a) => a.indexOf(v) === i).join(' | ')}
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

      {/* Tabata conditioning */}
      {tabataEnabled && (() => {
        const tabataWorkout = getTabataWorkout(weekInfo.wave, weekInfo.phase, currentWeek, tabataEquipment)
        const freq = getTabataFrequency(weekInfo.phase)
        const blockMin = Math.ceil(getBlockDurationSeconds(tabataWorkout.blocks[0]) / 60)
        const isDone = !!tabataLog

        return (
          <Card
            onClick={() => navigate('/workout/tabata')}
            className={`${isDone ? 'opacity-60' : ''}`}
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
                  <div className="w-8 h-8 rounded-full border-2 border-orange-400 dark:border-orange-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                )}
                <div>
                  <div className="font-semibold">{t('tabata.title')}</div>
                  <div className="text-sm text-surface-500 dark:text-surface-400">
                    {tabataWorkout.blocks.length} {tabataWorkout.blocks.length === 1 ? 'block' : 'blocks'} &middot; ~{blockMin} {t('tabata.min')}
                  </div>
                  <div className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                    {t('tabata.frequency', { min: freq.min, max: freq.max })}
                  </div>
                </div>
              </div>
              <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        )
      })()}

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
