import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCycleStore } from '../../stores/cycleStore'
import { calculateInitialWorkingWeights } from '../../lib/juggernaut'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type { MainLift, OneRepMaxes, TrainingDayType } from '../../types'
import { MAIN_LIFTS, DAY_EXERCISES, workingWeightKey } from '../../types'

export function CycleSetup() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createCycle = useCycleStore((s) => s.createCycle)

  const [oneRepMaxes, setOneRepMaxes] = useState<Record<MainLift, string>>({
    squat: '',
    bench: '',
    ohp: '',
    deadlift: '',
  })

  function handleChange(lift: MainLift, value: string) {
    setOneRepMaxes((prev) => ({ ...prev, [lift]: value }))
  }

  async function handleSubmit() {
    const orms: OneRepMaxes = {
      squat: Number(oneRepMaxes.squat) || 0,
      bench: Number(oneRepMaxes.bench) || 0,
      ohp: Number(oneRepMaxes.ohp) || 0,
      deadlift: Number(oneRepMaxes.deadlift) || 0,
    }
    await createCycle(orms)
    navigate('/')
  }

  const allFilled = MAIN_LIFTS.every((l) => Number(oneRepMaxes[l]) > 0)

  // Preview working weights
  const preview = allFilled
    ? calculateInitialWorkingWeights({
        squat: Number(oneRepMaxes.squat),
        bench: Number(oneRepMaxes.bench),
        ohp: Number(oneRepMaxes.ohp),
        deadlift: Number(oneRepMaxes.deadlift),
      })
    : null

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">{t('cycle.title')}</h1>

      <Card>
        <h2 className="text-lg font-semibold mb-1">{t('cycle.enterOneRepMax')}</h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
          {t('cycle.oneRepMaxDesc')}
        </p>
        <div className="flex flex-col gap-4">
          {MAIN_LIFTS.map((lift) => (
            <div key={lift}>
              <Input
                label={t(`exercises.${lift}`)}
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={oneRepMaxes[lift]}
                onChange={(e) => handleChange(lift, e.target.value)}
              />
              {Number(oneRepMaxes[lift]) > 0 && (
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  1RM: {oneRepMaxes[lift]} {t('common.kg')}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {preview && (
        <Card>
          <h2 className="text-lg font-semibold mb-3">{t('cycle.workingWeightsPreview')}</h2>
          {(['hypertrophy', 'volume', 'strength'] as TrainingDayType[]).map((dayType) => (
            <div key={dayType} className="mb-3">
              <h3 className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-1">
                {t(`dayTypes.${dayType}`)} ({t(`dayTypes.${dayType}Short`)})
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {DAY_EXERCISES[dayType].slice(0, 5).map((exerciseId) => {
                  const key = workingWeightKey(exerciseId, dayType)
                  const weight = preview[key]
                  if (!weight && weight !== 0) return null
                  return (
                    <div key={exerciseId} className="flex justify-between">
                      <span className="text-surface-600 dark:text-surface-400">
                        {t(`exercises.short.${exerciseId}`)}
                      </span>
                      <span className="font-medium">
                        {weight} {t('common.kg')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </Card>
      )}

      <Button size="lg" className="w-full" onClick={handleSubmit} disabled={!allFilled}>
        {t('cycle.startCycle')}
      </Button>
    </div>
  )
}
