import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { STRETCHING, DAY_D_CARDIO } from '../../lib/exercises'

export function RecoveryDay() {
  const { t } = useTranslation()
  const [cardioDone, setCardioDone] = useState(false)
  const [stretchDone, setStretchDone] = useState<Record<string, boolean>>({})

  return (
    <>
      <Card>
        <h3 className="font-semibold mb-1">{t('workout.cardio_title')}</h3>
        <p className="text-xs text-surface-400 mb-3">
          {DAY_D_CARDIO.durationMin} {t('common.minutes_short')} · ЧСС {DAY_D_CARDIO.targetHr}
        </p>
        <Button
          variant={cardioDone ? 'secondary' : 'primary'}
          onClick={() => setCardioDone((v) => !v)}
          size="sm"
          className="w-full"
        >
          {cardioDone ? t('common.done') : t('workout.complete_set')}
        </Button>
      </Card>

      <Card>
        <h3 className="font-semibold mb-2">{t('workout.stretch_title')}</h3>
        <div className="flex flex-col gap-2">
          {STRETCHING.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between p-2 rounded-lg border ${
                stretchDone[s.id]
                  ? 'bg-surface-900 border-surface-700 opacity-60'
                  : 'bg-surface-800 border-surface-700'
              }`}
            >
              <div>
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-[11px] text-surface-400">
                  {s.sets} × {s.durationSec}s {s.sides ? '· по каждой стороне' : ''} · {s.target}
                </div>
              </div>
              <button
                onClick={() => setStretchDone((p) => ({ ...p, [s.id]: !p[s.id] }))}
                className="text-xs px-3 py-1.5 rounded-full bg-surface-700 text-surface-200"
                aria-label={t('workout.complete_set')}
              >
                {stretchDone[s.id] ? '✓' : t('workout.complete_set')}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
