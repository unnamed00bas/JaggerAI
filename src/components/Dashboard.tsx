import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCycleStore } from '../stores/cycleStore'
import { db } from '../lib/db'
import { getCycleWeeks, getWeightForSet, getWorkoutPrescription } from '../lib/juggernaut'
import { useSettingsStore } from '../stores/settingsStore'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import type { Lift } from '../types'

export function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const activeCycleId = useCycleStore((s) => s.activeCycleId)
  const currentWeek = useCycleStore((s) => s.currentWeek)
  const variant = useSettingsStore((s) => s.variant)

  const cycle = useLiveQuery(
    () => (activeCycleId ? db.cycles.get(activeCycleId) : undefined),
    [activeCycleId],
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

        return (
          <Card
            key={lift}
            onClick={() => navigate(`/workout/${lift}`)}
            className="flex items-center justify-between"
          >
            <div>
              <div className="font-semibold">{t(`lifts.${lift}`)}</div>
              <div className="text-sm text-surface-500 dark:text-surface-400">
                {mainSet.reps === 'amrap'
                  ? `${weight} ${t('common.kg')} × AMRAP`
                  : `${weight} ${t('common.kg')} × ${mainSet.reps}`}
              </div>
            </div>
            <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
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
