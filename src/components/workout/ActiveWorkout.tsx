import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useProfileStore } from '../../stores/profileStore'
import { useWorkoutStore } from '../../stores/workoutStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { db } from '../../lib/db'
import {
  DAY_CATALOG,
  STRETCHING,
  DAY_D_CARDIO,
  getExercise,
} from '../../lib/exercises'
import { phaseForWeek, getPrescription, PHASE_NAME_KEYS } from '../../lib/program'
import { DAY_COLORS } from '../../lib/ui/dayStyle'
import { detectPrsFromWorkout } from '../../lib/records'
import { RestTimerBar } from './RestTimerBar'
import { RowingEntry } from './RowingEntry'
import type {
  DayType,
  Phase,
  CompletedSet,
  ExerciseDef,
} from '../../types'

export function ActiveWorkout() {
  const { t } = useTranslation()
  const { dayType: paramDay } = useParams<{ dayType: DayType }>()
  const navigate = useNavigate()

  const cycle = useProfileStore((s) => s.cycle)
  const profile = useProfileStore((s) => s.profile)
  const active = useWorkoutStore((s) => s.active)
  const startWorkout = useWorkoutStore((s) => s.startWorkout)
  const completeWorkout = useWorkoutStore((s) => s.completeWorkout)
  const cancelWorkout = useWorkoutStore((s) => s.cancelWorkout)
  const setNotes = useWorkoutStore((s) => s.setNotes)

  const phase = phaseForWeek(cycle.currentWeek)
  const dayType: DayType =
    active?.dayType ?? (paramDay && ['A', 'B', 'C', 'D'].includes(paramDay) ? paramDay : 'A')

  useEffect(() => {
    if (!active) {
      startWorkout({ cycleId: cycle.id, dayType, phase, week: cycle.currentWeek })
    }
  }, [active, cycle.id, cycle.currentWeek, dayType, phase, startWorkout])

  if (!active) return <div className="p-4 text-sm text-surface-500">{t('common.loading')}</div>

  const exerciseIds = DAY_CATALOG[dayType].exerciseIds
  const colors = DAY_COLORS[dayType]

  async function handleFinish() {
    const finished = completeWorkout()
    if (!finished) return
    try {
      await db.workouts.put(finished)
      await detectPrsFromWorkout(finished)
    } catch (e) {
      console.error('Save workout failed', e)
    }
    navigate('/workout')
  }

  function handleCancel() {
    if (!confirm(t('workout.cancel') + '?')) return
    cancelWorkout()
    navigate('/')
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <header className="flex items-start justify-between">
        <div>
          <h1 className={`text-xl font-bold ${colors.text}`}>
            {t(`day.${dayType.toLowerCase()}`)}
          </h1>
          <p className="text-xs text-surface-400">
            {t('dashboard.week_of', { week: cycle.currentWeek })} ·{' '}
            {t(PHASE_NAME_KEYS[phase])}
          </p>
        </div>
        <button onClick={handleCancel} className="text-xs text-surface-400 hover:text-red-400">
          {t('common.cancel')}
        </button>
      </header>

      {dayType === 'D' ? (
        <RecoveryDay />
      ) : (
        <>
          {exerciseIds.map((id) => {
            const ex = getExercise(id)
            if (!ex) return null
            return <ExerciseBlock key={id} exercise={ex} phase={phase} />
          })}
        </>
      )}

      <RowingEntry dayType={dayType} phase={phase} />

      <Card>
        <label className="text-xs text-surface-400 block mb-1.5">{t('workout.note')}</label>
        <textarea
          value={active.notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-sm text-surface-100 min-h-[60px]"
          placeholder={t('workout.note')}
        />
      </Card>

      <Button
        onClick={handleFinish}
        size="lg"
        className="!bg-[color:var(--color-accent-500)] hover:!bg-[color:var(--color-accent-600)] !text-surface-950 w-full"
      >
        {t('workout.finish')}
      </Button>

      <p className="text-[10px] text-surface-600 text-center">
        {profile.name} · {new Date(active.date).toLocaleString()}
      </p>

      <RestTimerBar />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────

function ExerciseBlock({ exercise, phase }: { exercise: ExerciseDef; phase: Phase }) {
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
  const targetWeight = prescription?.weight_kg
  const targetAssist = prescription?.assist_kg
  const targetAdded = prescription?.added_weight_kg

  const [weight, setWeight] = useState<string>(
    targetWeight != null ? String(targetWeight) : '',
  )
  const [reps, setReps] = useState<string>(targetReps != null ? String(targetReps) : '')
  const [duration, setDuration] = useState<string>(
    targetDuration != null ? String(targetDuration) : '',
  )
  const [assist, setAssist] = useState<string>(
    targetAssist != null ? String(targetAssist) : '',
  )
  const [added, setAdded] = useState<string>(
    targetAdded != null ? String(targetAdded) : '',
  )
  const [note, setNote] = useState('')
  const [failed, setFailed] = useState(false)

  const usesWeight = exercise.tracking.includes('weight_kg') || exercise.tracking.includes('weight_kg_per_hand')
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
      actualReps: usesReps ? parseInt(reps, 10) || 0 : undefined,
      actualDurationSec: usesDuration ? parseInt(duration, 10) || 0 : undefined,
      actualWeightKg: usesWeight ? parseFloat(weight) || 0 : undefined,
      assistWeightKg: usesAssist ? parseFloat(assist) || 0 : undefined,
      addedWeightKg: usesAdded ? parseFloat(added) || 0 : undefined,
      completed: !failed,
      note: note || undefined,
    }
    addExerciseSet(exercise.id, set)
    setFailed(false)
    setNote('')
    startRestTimer(exercise.restSec ?? restTimerSec)
  }

  function adjust(setter: (v: string) => void, current: string, delta: number) {
    const n = parseFloat(current || '0') + delta
    setter(String(n))
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <h3 className="font-semibold text-surface-100">{exercise.name}</h3>
          <p className="text-[11px] text-surface-400 mt-0.5">
            {exercise.muscles.join(' · ')}
          </p>
        </div>
        <span className="text-xs text-surface-500 tabular-nums">
          {setsDone}/{targetSets}
        </span>
      </div>

      {prescription && (
        <p className="text-xs text-surface-400 mb-3">
          {t('workout.target')}:{' '}
          {targetSets}×
          {targetReps ?? targetDuration != null ? `${targetDuration}s` : '?'}
          {targetWeight != null ? ` · ${targetWeight} кг` : ''}
          {targetAssist != null ? ` · облегч. ${targetAssist} кг` : ''}
          {targetAdded != null ? ` · доп. ${targetAdded} кг` : ''}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 mb-2">
        {usesWeight && (
          <WeightInput label={t('workout.weight_kg')} value={weight} setValue={setWeight} step={2.5} adjust={adjust} />
        )}
        {usesReps && (
          <WeightInput label={t('workout.reps')} value={reps} setValue={setReps} step={1} adjust={adjust} />
        )}
        {usesDuration && (
          <WeightInput label={t('workout.duration_sec')} value={duration} setValue={setDuration} step={5} adjust={adjust} />
        )}
        {usesAssist && (
          <WeightInput label={t('workout.assist_kg')} value={assist} setValue={setAssist} step={2.5} adjust={adjust} />
        )}
        {usesAdded && (
          <WeightInput label={t('workout.added_kg')} value={added} setValue={setAdded} step={2.5} adjust={adjust} />
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
        <Button onClick={saveSet} size="sm" className="flex-1 !bg-[color:var(--color-accent-500)] !text-surface-950 hover:!bg-[color:var(--color-accent-600)]">
          {t('workout.complete_set')}
        </Button>
        <Button
          onClick={() => setShowTechnique((s) => !s)}
          variant="secondary"
          size="sm"
        >
          {t('workout.technique')}
        </Button>
      </div>

      {showTechnique && (
        <div className="mt-3 p-3 rounded-lg bg-surface-900 border border-surface-700 text-xs text-surface-300">
          <div className="font-semibold text-surface-200 mb-1">{t('workout.steps')}</div>
          <ol className="list-decimal pl-4 space-y-1">
            {exercise.technique.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          <div className="font-semibold text-surface-200 mt-2 mb-1">{t('workout.common_errors')}</div>
          <ul className="list-disc pl-4 space-y-0.5 text-red-300/80">
            {exercise.technique.errors.map((e, i) => <li key={i}>{e}</li>)}
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
              {s.actualReps != null ? `×${s.actualReps}` : s.actualDurationSec != null ? `${s.actualDurationSec}s` : ''}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function WeightInput({
  label,
  value,
  setValue,
  step,
  adjust,
}: {
  label: string
  value: string
  setValue: (v: string) => void
  step: number
  adjust: (setter: (v: string) => void, current: string, delta: number) => void
}) {
  return (
    <div>
      <label className="text-[11px] text-surface-400 block mb-1">{label}</label>
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => adjust(setValue, value, -step)}
          className="px-2 bg-surface-800 border border-r-0 border-surface-700 rounded-l-lg text-surface-300"
        >
          −
        </button>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="decimal"
          className="flex-1 w-full px-2 py-1.5 bg-surface-800 border border-surface-700 text-center text-sm text-surface-100 tabular-nums"
        />
        <button
          type="button"
          onClick={() => adjust(setValue, value, step)}
          className="px-2 bg-surface-800 border border-l-0 border-surface-700 rounded-r-lg text-surface-300"
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────

function RecoveryDay() {
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
                onClick={() =>
                  setStretchDone((p) => ({ ...p, [s.id]: !p[s.id] }))
                }
                className="text-xs px-3 py-1.5 rounded-full bg-surface-700 text-surface-200"
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
