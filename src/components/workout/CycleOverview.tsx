import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCycleStore } from '../../stores/cycleStore'
import { db } from '../../lib/db'
import { getCycleWeeks } from '../../lib/juggernaut'
import { Card } from '../ui/Card'
import type { Phase } from '../../types'

const PHASE_COLORS: Record<Phase, string> = {
  accumulation: 'bg-blue-500',
  intensification: 'bg-yellow-500',
  realization: 'bg-red-500',
  deload: 'bg-green-500',
}

export function CycleOverview() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const activeCycleId = useCycleStore((s) => s.activeCycleId)
  const currentWeek = useCycleStore((s) => s.currentWeek)
  const setCurrentWeek = useCycleStore((s) => s.setCurrentWeek)

  const cycle = useLiveQuery(
    () => (activeCycleId ? db.cycles.get(activeCycleId) : undefined),
    [activeCycleId],
  )

  const weeks = getCycleWeeks()

  if (!cycle) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-surface-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">{t('cycle.overview')}</h1>
      </div>

      <div className="flex gap-2 text-xs">
        {(['accumulation', 'intensification', 'realization', 'deload'] as const).map((phase) => (
          <div key={phase} className="flex items-center gap-1">
            <span className={`w-3 h-3 rounded-full ${PHASE_COLORS[phase]}`} />
            <span className="text-surface-500 dark:text-surface-400">{t(`phases.${phase}`)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {weeks.map((week) => {
          const isCurrent = week.weekNumber === currentWeek
          const isPast = week.weekNumber < currentWeek

          return (
            <Card
              key={week.weekNumber}
              onClick={() => {
                setCurrentWeek(week.weekNumber)
                navigate('/')
              }}
              className={`text-center p-3 ${
                isCurrent ? 'ring-2 ring-primary-500' : ''
              } ${isPast ? 'opacity-60' : ''}`}
            >
              <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${PHASE_COLORS[week.phase]}`} />
              <div className="text-xs text-surface-500 dark:text-surface-400">
                {t('cycle.week', { number: week.weekNumber })}
              </div>
              <div className="text-xs font-medium mt-0.5">
                {t(`waves.${week.wave}`).replace(' Wave', '').replace('Волна ', '')}
              </div>
            </Card>
          )
        })}
      </div>

      <Card>
        <h2 className="text-sm font-semibold mb-2">{t('cycle.trainingMax')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {(['squat', 'bench', 'ohp', 'deadlift'] as const).map((lift) => (
            <div key={lift} className="text-center">
              <div className="text-xs text-surface-500 dark:text-surface-400">
                {t(`lifts.${lift}`)}
              </div>
              <div className="text-lg font-bold">
                {cycle.trainingMaxes[lift]} {t('common.kg')}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
