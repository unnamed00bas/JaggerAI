import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCycleStore } from '../../stores/cycleStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { calculateTrainingMax } from '../../lib/juggernaut'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type { Lift, MethodVariant, TrainingMaxes } from '../../types'

const LIFT_KEYS: Lift[] = ['squat', 'bench', 'ohp', 'deadlift']

export function CycleSetup() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createCycle = useCycleStore((s) => s.createCycle)
  const variant = useSettingsStore((s) => s.variant)
  const setVariant = useSettingsStore((s) => s.setVariant)

  const [oneRepMaxes, setOneRepMaxes] = useState<Record<Lift, string>>({
    squat: '',
    bench: '',
    ohp: '',
    deadlift: '',
  })

  const [selectedVariant, setSelectedVariant] = useState<MethodVariant>(variant)

  function handleChange(lift: Lift, value: string) {
    setOneRepMaxes((prev) => ({ ...prev, [lift]: value }))
  }

  async function handleSubmit() {
    const trainingMaxes: TrainingMaxes = {
      squat: calculateTrainingMax(Number(oneRepMaxes.squat) || 0),
      bench: calculateTrainingMax(Number(oneRepMaxes.bench) || 0),
      ohp: calculateTrainingMax(Number(oneRepMaxes.ohp) || 0),
      deadlift: calculateTrainingMax(Number(oneRepMaxes.deadlift) || 0),
    }

    setVariant(selectedVariant)
    await createCycle({
      variant: selectedVariant,
      trainingMaxes,
      startDate: new Date().toISOString(),
    })
    navigate('/')
  }

  const allFilled = LIFT_KEYS.every((l) => Number(oneRepMaxes[l]) > 0)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">{t('cycle.title')}</h1>

      <Card>
        <h2 className="text-lg font-semibold mb-4">{t('cycle.enterOneRepMax')}</h2>
        <div className="flex flex-col gap-4">
          {LIFT_KEYS.map((lift) => {
            const val = Number(oneRepMaxes[lift]) || 0
            const tm = val > 0 ? calculateTrainingMax(val) : 0

            return (
              <div key={lift}>
                <Input
                  label={t(`lifts.${lift}`)}
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={oneRepMaxes[lift]}
                  onChange={(e) => handleChange(lift, e.target.value)}
                />
                {tm > 0 && (
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                    {t('cycle.trainingMax')}: {tm} {t('common.kg')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-3">{t('cycle.selectVariant')}</h2>
        <div className="flex gap-3">
          {(['classic', 'inverted'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setSelectedVariant(v)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-colors ${
                selectedVariant === v
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400'
              }`}
            >
              {t(`cycle.${v}`)}
            </button>
          ))}
        </div>
      </Card>

      <Button size="lg" className="w-full" onClick={handleSubmit} disabled={!allFilled}>
        {t('cycle.startCycle')}
      </Button>
    </div>
  )
}
