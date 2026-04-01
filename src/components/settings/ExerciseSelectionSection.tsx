import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../ui/Card'
import { useExerciseSelectionStore } from '../../stores/exerciseSelectionStore'
import {
  TRAINING_DAYS,
  DAY_EXERCISES,
  EXERCISE_SLOT_ALTERNATIVES,
  exerciseSlotKey,
} from '../../types'
import type { TrainingDayType, ExerciseId } from '../../types'

export function ExerciseSelectionSection() {
  const { t } = useTranslation()
  const { selections, setSelection } = useExerciseSelectionStore()
  const [expandedDay, setExpandedDay] = useState<TrainingDayType | null>(null)

  return (
    <Card>
      <h2 className="text-sm font-semibold mb-3">{t('settings.exercises')}</h2>
      <p className="text-xs text-surface-500 dark:text-surface-400 mb-3">
        {t('settings.exercisesDesc')}
      </p>

      <div className="flex flex-col gap-2">
        {TRAINING_DAYS.map((dayType) => {
          const isExpanded = expandedDay === dayType
          const defaultExercises = DAY_EXERCISES[dayType]
          const hasCustom = defaultExercises.some((_, idx) => {
            const slotKey = exerciseSlotKey(dayType, idx)
            return selections[slotKey] && selections[slotKey] !== defaultExercises[idx]
          })

          return (
            <div key={dayType}>
              <button
                className="w-full flex items-center justify-between py-2"
                onClick={() => setExpandedDay(isExpanded ? null : dayType)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{t(`dayTypes.${dayType}`)}</span>
                  {hasCustom && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                      {t('settings.customized')}
                    </span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 text-surface-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="flex flex-col gap-2 pb-2">
                  {defaultExercises.map((defaultExercise, idx) => {
                    const slotKey = exerciseSlotKey(dayType, idx)
                    const alternatives = EXERCISE_SLOT_ALTERNATIVES[slotKey]
                    if (!alternatives || alternatives.length <= 1) return null

                    const selected = selections[slotKey] ?? defaultExercise

                    return (
                      <ExerciseSlotSelector
                        key={slotKey}
                        alternatives={alternatives}
                        selected={selected}
                        onSelect={(id) => setSelection(slotKey, id)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function ExerciseSlotSelector({
  alternatives,
  selected,
  onSelect,
}: {
  alternatives: ExerciseId[]
  selected: ExerciseId
  onSelect: (id: ExerciseId) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="pl-2">
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value as ExerciseId)}
        className="w-full py-2 px-3 rounded-xl text-sm border-2 border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:border-primary-500 focus:outline-none"
      >
        {alternatives.map((id) => (
          <option key={id} value={id}>
            {t(`exercises.${id}`)}
          </option>
        ))}
      </select>
    </div>
  )
}
