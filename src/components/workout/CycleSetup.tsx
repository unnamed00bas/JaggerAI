import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCycleStore } from '../../stores/cycleStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { calculateTrainingMax } from '../../lib/juggernaut'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type { Lift, MethodVariant, TabataEquipment, TrainingMaxes } from '../../types'

const LIFT_KEYS: Lift[] = ['squat', 'bench', 'ohp', 'deadlift']

export function CycleSetup() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createCycle = useCycleStore((s) => s.createCycle)
  const variant = useSettingsStore((s) => s.variant)
  const setVariant = useSettingsStore((s) => s.setVariant)
  const setTabataEnabled = useSettingsStore((s) => s.setTabataEnabled)
  const setTabataEquipment = useSettingsStore((s) => s.setTabataEquipment)
  const tabataEnabled = useSettingsStore((s) => s.tabataEnabled)
  const tabataEquipment = useSettingsStore((s) => s.tabataEquipment)

  const [oneRepMaxes, setOneRepMaxes] = useState<Record<Lift, string>>({
    squat: '',
    bench: '',
    ohp: '',
    deadlift: '',
  })

  const [selectedVariant, setSelectedVariant] = useState<MethodVariant>(variant)
  const [selectedTabata, setSelectedTabata] = useState(tabataEnabled)
  const [selectedEquipment, setSelectedEquipment] = useState<TabataEquipment>(tabataEquipment)

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
    setTabataEnabled(selectedTabata)
    setTabataEquipment(selectedEquipment)
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

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t('tabata.settings.enabled')}</h2>
            <p className="text-sm text-surface-500 dark:text-surface-400">{t('tabata.settings.enabledDesc')}</p>
          </div>
          <button
            onClick={() => setSelectedTabata(!selectedTabata)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              selectedTabata
                ? 'bg-primary-500'
                : 'bg-surface-300 dark:bg-surface-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                selectedTabata ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
        {selectedTabata && (
          <div className="mt-3">
            <h3 className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-2">
              {t('tabata.equipment.title')}
            </h3>
            <div className="flex gap-2">
              {(['bodyweight', 'kettlebell', 'cardio_machines', 'mixed'] as const).map((eq) => (
                <button
                  key={eq}
                  onClick={() => setSelectedEquipment(eq)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                    selectedEquipment === eq
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400'
                  }`}
                >
                  {t(`tabata.equipment.${eq}`)}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Button size="lg" className="w-full" onClick={handleSubmit} disabled={!allFilled}>
        {t('cycle.startCycle')}
      </Button>
    </div>
  )
}
