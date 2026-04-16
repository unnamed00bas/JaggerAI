import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/Card'
import { DAY_COLORS } from '../../lib/ui/dayStyle'
import { DAY_CATALOG } from '../../lib/exercises'
import { useProfileStore } from '../../stores/profileStore'
import { getProtocolForDay } from '../../lib/rowing'
import { phaseForWeek, PHASE_NAME_KEYS } from '../../lib/program'
import type { DayType } from '../../types'

export function WorkoutStartPicker() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const cycle = useProfileStore((s) => s.cycle)
  const phase = phaseForWeek(cycle.currentWeek)

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">{t('workout.start')}</h1>
        <p className="text-sm text-surface-400">
          {t('dashboard.week_of', { week: cycle.currentWeek })} ·{' '}
          {t(PHASE_NAME_KEYS[phase])}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3">
        {(['A', 'B', 'C', 'D'] as DayType[]).map((d) => {
          const c = DAY_COLORS[d]
          const exCount = DAY_CATALOG[d].exerciseIds.length
          const protocol = getProtocolForDay(d, phase)
          return (
            <Card
              key={d}
              className={`${c.bg} border ${c.border}`}
              onClick={() => navigate(`/workout/active/${d}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-[11px] font-semibold uppercase ${c.text}`}>
                    {t(`day.${d.toLowerCase()}`)}
                  </div>
                  <div className="text-sm mt-0.5">
                    {exCount > 0 ? `${exCount} упр.` : t('workout.recovery_day')} ·{' '}
                    {t(protocol.nameKey)}
                  </div>
                </div>
                <div className={`text-3xl font-black ${c.text}`}>{d}</div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
