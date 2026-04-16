import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useNavigate } from 'react-router-dom'
import { db } from '../../lib/db'
import { DAY_COLORS } from '../../lib/ui/dayStyle'
import { useWorkoutStore } from '../../stores/workoutStore'
import type { DayType } from '../../types'

const FILTER_DAYS: (DayType | 'ALL')[] = ['ALL', 'A', 'B', 'C', 'D']

export function WorkoutHistory() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const active = useWorkoutStore((s) => s.active)
  const [filter, setFilter] = useState<DayType | 'ALL'>('ALL')

  const logs = useLiveQuery(async () => {
    const all = await db.workouts.orderBy('date').reverse().toArray()
    return all
  }, []) ?? []

  const filtered = useMemo(() => {
    if (filter === 'ALL') return logs
    return logs.filter((l) => l.dayType === filter)
  }, [logs, filter])

  return (
    <div className="flex flex-col gap-4 pb-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('workout.history')}</h1>
        <Button size="sm" onClick={() => navigate('/workout/start')}>
          + {t('workout.start')}
        </Button>
      </header>

      {active && (
        <Card
          onClick={() => navigate('/workout/active')}
          className={`${DAY_COLORS[active.dayType].bg} border ${DAY_COLORS[active.dayType].border}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase font-semibold text-surface-300">
                {t('workout.active_workout')}
              </div>
              <div className="text-sm mt-0.5">
                {t(`day.${active.dayType.toLowerCase()}`)} ·{' '}
                {t('dashboard.week_of', { week: active.week })}
              </div>
            </div>
            <span className={`text-3xl font-black ${DAY_COLORS[active.dayType].text}`}>
              {active.dayType}
            </span>
          </div>
        </Card>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setFilter(d)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              filter === d
                ? 'bg-[color:var(--color-accent-500)] text-surface-950 border-transparent'
                : 'bg-surface-800 border-surface-700 text-surface-300'
            }`}
          >
            {d === 'ALL' ? t('workout.filter_all') : d}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-surface-400 text-center py-4">
            {t('workout.no_sessions')}
          </p>
        </Card>
      ) : (
        filtered.map((log) => {
          const c = DAY_COLORS[log.dayType]
          const topSetByExercise = log.exercises
            .map((e) => {
              const best = e.sets.reduce<{ w?: number; r?: number }>((acc, s) => {
                if ((s.actualWeightKg ?? 0) > (acc.w ?? 0)) return { w: s.actualWeightKg, r: s.actualReps }
                return acc
              }, {})
              return { id: e.exerciseId, w: best.w, r: best.r }
            })
            .filter((x) => x.w != null)
            .slice(0, 3)

          return (
            <Card key={log.id}>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className={`text-[11px] uppercase font-semibold ${c.text}`}>
                    {t(`day.${log.dayType.toLowerCase()}_short`)}
                  </div>
                  <div className="text-sm mt-0.5">
                    {new Date(log.date).toLocaleDateString()} ·{' '}
                    {t('workout.duration', { min: log.durationMin || '—' })}
                  </div>
                </div>
                <span className={`text-xl font-black ${c.text}`}>{log.dayType}</span>
              </div>
              {topSetByExercise.length > 0 && (
                <div className="text-xs text-surface-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  {topSetByExercise.map((x) => (
                    <span key={x.id}>
                      {x.id.replace(/_/g, ' ')}: <span className="text-surface-200 tabular-nums">{x.w}×{x.r}</span>
                    </span>
                  ))}
                </div>
              )}
              {log.notes && (
                <p className="text-xs text-surface-500 mt-2 italic">“{log.notes}”</p>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}
