import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { WeightInput } from './WeightInput'
import { useSettingsStore } from '../../stores/settingsStore'
import { useWorkoutStore } from '../../stores/workoutStore'
import { getPrescription } from '../../lib/program'
import { parsePositiveFloat, parsePositiveInt } from '../../lib/validation'
import type { ExerciseDef, Phase, CompletedSet } from '../../types'

interface ExerciseBlockProps {
  exercise: ExerciseDef
  phase: Phase
  workingWeightKg?: number
}

export function ExerciseBlock({ exercise, phase, workingWeightKg }: ExerciseBlockProps) {
  const { t } = useTranslation()
  const prescription = getPrescription(exercise, phase) ?? exercise.phases.all
  const restTimerSec = useSettingsStore((s) => s.defaultRestTimerSec)
  const startRestTimer = useWorkoutStore((s) => s.startRestTimer)
  const active = useWorkoutStore((s) => s.active)!
  const addExerciseSet = useWorkoutStore((s) => s.addExerciseSet)
  const [showTechnique, setShowTechnique] = useState(false)

  const logged = active.exercises.find((e) => e.exerciseId === exercise.id)
  const setsDone = logged?.sets.length ?? 0
  const targetSets = prescription?.sets ?? 3
  const targetReps = prescription?.reps
  const targetDuration = prescription?.duration_sec
  const targetWeight = workingWeightKg ?? prescription?.weight_kg
  const targetAssist = prescription?.assist_kg
  const targetAdded = prescription?.added_weight_kg

  const [weight, setWeight] = useState(targetWeight != null ? String(targetWeight) : '')
  const [reps, setReps] = useState(targetReps != null ? String(targetReps) : '')
  const [duration, setDuration] = useState(targetDuration != null ? String(targetDuration) : '')
  const [assist, setAssist] = useState(targetAssist != null ? String(targetAssist) : '')
  const [added, setAdded] = useState(targetAdded != null ? String(targetAdded) : '')
  const [note, setNote] = useState('')
  const [failed, setFailed] = useState(false)

  const usesWeight =
    exercise.tracking.includes('weight_kg') || exercise.tracking.includes('weight_kg_per_hand')
  const usesAssist = exercise.tracking.includes('assist_weight_kg')
  const usesAdded = exercise.tracking.includes('added_weight_kg')
  const usesDuration = exercise.tracking.includes('duration_sec')
  const usesReps = exercise.tracking.includes('reps')

  function saveSet() {
    const set: CompletedSet = {
      setNum: setsDone + 1,
      targetReps,
      targetDurationSec: targetDuration,
      targetWeightKg: targetWeight,
      actualReps: usesReps ? parsePositiveInt(reps, { max: 999 }) : undefined,
      actualDurationSec: usesDuration ? parsePositiveInt(duration, { max: 7200 }) : undefined,
      actualWeightKg: usesWeight ? parsePositiveFloat(weight, { max: 1000 }) : undefined,
      assistWeightKg: usesAssist ? parsePositiveFloat(assist, { max: 500 }) : undefined,
      addedWeightKg: usesAdded ? parsePositiveFloat(added, { max: 500 }) : undefined,
      completed: !failed,
      note: note || undefined,
    }
    addExerciseSet(exercise.id, set)
    setFailed(false)
    setNote('')
    startRestTimer(exercise.restSec ?? restTimerSec)
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <h3 className="font-semibold text-surface-100">{exercise.name}</h3>
          <p className="text-[11px] text-surface-400 mt-0.5">{exercise.muscles.join(' · ')}</p>
        </div>
        <span className="text-xs text-surface-500 tabular-nums">
          {setsDone}/{targetSets}
        </span>
      </div>

      {prescription && (
        <p className="text-xs text-surface-400 mb-3">
          {t('workout.target')}: {targetSets}×
          {targetReps ?? (targetDuration != null ? `${targetDuration}s` : '?')}
          {targetWeight != null ? ` · ${targetWeight} кг` : ''}
          {targetAssist != null ? ` · облегч. ${targetAssist} кг` : ''}
          {targetAdded != null ? ` · доп. ${targetAdded} кг` : ''}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 mb-2">
        {usesWeight && (
          <WeightInput label={t('workout.weight_kg')} value={weight} setValue={setWeight} step={2.5} />
        )}
        {usesReps && (
          <WeightInput label={t('workout.reps')} value={reps} setValue={setReps} step={1} />
        )}
        {usesDuration && (
          <WeightInput label={t('workout.duration_sec')} value={duration} setValue={setDuration} step={5} />
        )}
        {usesAssist && (
          <WeightInput label={t('workout.assist_kg')} value={assist} setValue={setAssist} step={2.5} />
        )}
        {usesAdded && (
          <WeightInput label={t('workout.added_kg')} value={added} setValue={setAdded} step={2.5} />
        )}
      </div>

      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('workout.note')}
        className="mb-2 text-xs"
      />

      <div className="flex gap-2 mb-2">
        <label className="flex items-center gap-2 text-xs text-surface-400">
          <input type="checkbox" checked={failed} onChange={(e) => setFailed(e.target.checked)} />
          {t('workout.missed_set')}
        </label>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={saveSet}
          size="sm"
          className="flex-1 !bg-[color:var(--color-accent-500)] !text-surface-950 hover:!bg-[color:var(--color-accent-600)]"
        >
          {t('workout.complete_set')}
        </Button>
        <Button onClick={() => setShowTechnique((s) => !s)} variant="secondary" size="sm">
          {t('workout.technique')}
        </Button>
      </div>

      {showTechnique && (
        <div className="mt-3 p-3 rounded-lg bg-surface-900 border border-surface-700 text-xs text-surface-300">
          <div className="font-semibold text-surface-200 mb-1">{t('workout.steps')}</div>
          <ol className="list-decimal pl-4 space-y-1">
            {exercise.technique.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <div className="font-semibold text-surface-200 mt-2 mb-1">{t('workout.common_errors')}</div>
          <ul className="list-disc pl-4 space-y-0.5 text-red-300/80">
            {exercise.technique.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {logged && logged.sets.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-1">
          {logged.sets.map((s) => (
            <div
              key={s.setNum}
              className={`text-[11px] rounded-md py-1 text-center tabular-nums ${
                s.completed
                  ? 'bg-surface-800 text-surface-200'
                  : 'bg-red-900/30 text-red-300'
              }`}
            >
              {s.actualWeightKg != null ? `${s.actualWeightKg}` : ''}
              {s.actualReps != null
                ? `×${s.actualReps}`
                : s.actualDurationSec != null
                  ? `${s.actualDurationSec}s`
                  : ''}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
