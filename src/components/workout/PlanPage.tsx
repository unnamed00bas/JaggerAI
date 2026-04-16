import { useTranslation } from 'react-i18next'
import { Card } from '../ui/Card'
import { useProfileStore } from '../../stores/profileStore'
import { DAY_CATALOG, EXERCISES } from '../../lib/exercises'
import { phaseForWeek, getPrescription, PHASE_NAME_KEYS } from '../../lib/program'
import { DAY_COLORS } from '../../lib/ui/dayStyle'
import type { DayType, Phase } from '../../types'
import { useState } from 'react'

const WEEKS: number[] = Array.from({ length: 16 }, (_, i) => i + 1)

export function PlanPage() {
  const { t } = useTranslation()
  const cycle = useProfileStore((s) => s.cycle)
  const [selectedWeek, setSelectedWeek] = useState<number>(cycle.currentWeek)
  const phase = phaseForWeek(selectedWeek)

  return (
    <div className="flex flex-col gap-4 pb-4">
      <header>
        <h1 className="text-2xl font-bold">{t('plan.title')}</h1>
        <p className="text-sm text-surface-400">
          {t('dashboard.week_of', { week: selectedWeek })} · {t(PHASE_NAME_KEYS[phase])}
        </p>
      </header>

      <div className="grid grid-cols-8 gap-1.5">
        {WEEKS.map((w) => {
          const p = phaseForWeek(w)
          const isCurrent = w === cycle.currentWeek
          const isPast = w < cycle.currentWeek
          const isDeload = p === 'deload'
          return (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className={`aspect-square rounded-lg text-xs font-bold flex flex-col items-center justify-center transition ${
                selectedWeek === w
                  ? 'bg-[color:var(--color-accent-500)] text-surface-950'
                  : isDeload
                  ? 'bg-surface-600 text-surface-100'
                  : isPast
                  ? 'bg-surface-800 text-surface-500'
                  : isCurrent
                  ? 'bg-surface-700 text-surface-100 ring-2 ring-[color:var(--color-accent-500)]'
                  : 'bg-surface-800 text-surface-300'
              }`}
            >
              <span>{w}</span>
              <span className="text-[9px] font-normal opacity-70">
                {p === 'deload' ? 'D' : `Ф${p}`}
              </span>
            </button>
          )
        })}
      </div>

      <Card>
        <h2 className="text-sm font-semibold mb-2">{t('plan.recommended_weights')}</h2>
        <div className="flex flex-col gap-3">
          {(['A', 'B', 'C', 'D'] as DayType[]).map((d) => (
            <DayBreakdown key={d} dayType={d} phase={phase} />
          ))}
        </div>
      </Card>
    </div>
  )
}

function DayBreakdown({ dayType, phase }: { dayType: DayType; phase: Phase }) {
  const { t } = useTranslation()
  const c = DAY_COLORS[dayType]
  const ids = DAY_CATALOG[dayType].exerciseIds
  if (ids.length === 0) {
    return (
      <div className={`rounded-lg p-3 border ${c.border} ${c.bg}`}>
        <div className={`text-xs font-semibold ${c.text}`}>
          {dayType} · {t(`day.${dayType.toLowerCase()}`)}
        </div>
        <p className="text-xs text-surface-400 mt-1">{t('workout.recovery_day')}</p>
      </div>
    )
  }
  return (
    <div className={`rounded-lg p-3 border ${c.border} ${c.bg}`}>
      <div className={`text-xs font-semibold ${c.text} mb-2`}>
        {dayType} · {t(`day.${dayType.toLowerCase()}`)}
      </div>
      <div className="flex flex-col gap-1.5">
        {ids.map((id) => {
          const ex = EXERCISES[id]
          if (!ex) return null
          const p = getPrescription(ex, phase)
          if (!p) return null
          const reps = p.reps ?? (p.duration_sec ? `${p.duration_sec}s` : '—')
          const weight = p.weight_kg ?? (p.assist_kg != null ? `облегч. ${p.assist_kg}` : p.added_weight_kg != null ? `+${p.added_weight_kg}` : '—')
          return (
            <div key={id} className="flex items-center justify-between text-xs">
              <span className="text-surface-200">{ex.name}</span>
              <span className="tabular-nums text-surface-400">
                {p.sets}×{reps} · {weight}
                {typeof weight === 'number' ? ' кг' : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
