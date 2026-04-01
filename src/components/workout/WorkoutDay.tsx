import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCycleStore } from '../../stores/cycleStore'
import { useWorkoutStore } from '../../stores/workoutStore'
import { useRestTimer } from '../../hooks/useRestTimer'
import { db } from '../../lib/db'
import { getDayPrescription, getExerciseWeight, getBlock, estimateOneRepMax } from '../../lib/juggernaut'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { TrainingDayType, CompletedSet, ExerciseLog, AmrapResult } from '../../types'
import { EXERCISES } from '../../types'

export function WorkoutDay() {
  const { t } = useTranslation()
  const { dayType: dayTypeParam } = useParams<{ dayType: string }>()
  const navigate = useNavigate()
  const dayType = dayTypeParam as TrainingDayType

  const activeCycleId = useCycleStore((s) => s.activeCycleId)
  const currentWeek = useCycleStore((s) => s.currentWeek)

  const activeWorkout = useWorkoutStore((s) => s.activeWorkout)
  const startWorkout = useWorkoutStore((s) => s.startWorkout)
  const updateExerciseSet = useWorkoutStore((s) => s.updateExerciseSet)
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout)

  const { secondsLeft, isRunning, start: startTimer } = useRestTimer()

  const [notes, setNotes] = useState('')
  const [expandedExercise, setExpandedExercise] = useState<number>(0)
  const workoutFinishedRef = useRef(false)

  const cycle = useLiveQuery(
    () => (activeCycleId ? db.cycles.get(activeCycleId) : undefined),
    [activeCycleId],
  )

  const block = getBlock(currentWeek)

  useEffect(() => {
    if (!cycle || activeWorkout || workoutFinishedRef.current) return

    const prescription = getDayPrescription(currentWeek, dayType, cycle.workingWeights)
    const exercises: ExerciseLog[] = prescription.exercises.map((ex) => {
      const weight = getExerciseWeight(ex.exerciseId, dayType, currentWeek, cycle.workingWeights)
      const sets: CompletedSet[] = Array.from({ length: ex.sets }, () => ({
        targetWeight: weight,
        targetRepsMin: ex.repsMin,
        targetRepsMax: ex.repsMax,
        actualWeight: weight,
        actualReps: ex.isAmrap ? 0 : ex.repsMin,
        completed: false,
      }))
      return { exerciseId: ex.exerciseId, sets }
    })

    startWorkout({
      cycleId: cycle.id,
      dayType,
      week: currentWeek,
      block,
      exercises,
    })
  }, [cycle, dayType, activeWorkout, currentWeek, block, startWorkout])

  if (!cycle || !activeWorkout) return null

  const prescription = getDayPrescription(currentWeek, dayType, cycle.workingWeights)

  function handleSetComplete(exerciseIdx: number, setIdx: number) {
    const set = activeWorkout!.exercises[exerciseIdx].sets[setIdx]
    updateExerciseSet(exerciseIdx, setIdx, { completed: !set.completed })
    if (!set.completed) {
      const restSeconds = prescription.exercises[exerciseIdx]?.restSeconds ?? 120
      startTimer(restSeconds)
    }
  }

  async function handleFinish() {
    workoutFinishedRef.current = true

    // Save AMRAP results if this is test week
    if (prescription.isAmrapTest) {
      for (const exercise of activeWorkout!.exercises) {
        const prescEx = prescription.exercises.find(e => e.exerciseId === exercise.exerciseId)
        if (!prescEx?.isAmrap) continue

        const amrapSet = exercise.sets.find(s => s.actualReps > 0)
        if (!amrapSet) continue

        const result: AmrapResult = {
          id: crypto.randomUUID(),
          cycleId: cycle!.id,
          exerciseId: exercise.exerciseId,
          weight: amrapSet.actualWeight,
          actualReps: amrapSet.actualReps,
          date: new Date().toISOString(),
          estimatedOneRepMax: estimateOneRepMax(amrapSet.actualWeight, amrapSet.actualReps),
          updatedAt: new Date().toISOString(),
          _dirty: 1,
        }
        await db.amrapResults.add(result)
      }
    }

    await finishWorkout(notes)
    navigate('/')
  }

  const allDone = activeWorkout.exercises.every((ex) =>
    ex.sets.every((s) => s.completed),
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-surface-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold">{t(`dayTypes.${dayType}Short`)}</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {t(`blocks.short${block}`)} — {t('cycle.week', { number: currentWeek })}
          </p>
        </div>
      </div>

      {/* Rest Timer */}
      {isRunning && (
        <Card className="bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 text-center">
          <div className="text-sm text-primary-600 dark:text-primary-400">{t('workout.restTimer')}</div>
          <div className="text-3xl font-mono font-bold text-primary-700 dark:text-primary-300">
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </div>
        </Card>
      )}

      {/* Exercise List */}
      <div className="flex flex-col gap-3">
        {activeWorkout.exercises.map((exerciseLog, exIdx) => {
          const prescEx = prescription.exercises[exIdx]
          if (!prescEx) return null

          const def = EXERCISES[prescEx.exerciseId]
          const exerciseDone = exerciseLog.sets.every(s => s.completed)
          const completedSets = exerciseLog.sets.filter(s => s.completed).length
          const isExpanded = expandedExercise === exIdx

          return (
            <Card
              key={exIdx}
              className={exerciseDone ? 'opacity-60' : ''}
            >
              {/* Exercise header - clickable to expand/collapse */}
              <button
                className="w-full flex items-center justify-between"
                onClick={() => setExpandedExercise(isExpanded ? -1 : exIdx)}
              >
                <div className="flex items-center gap-2">
                  {exerciseDone ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-surface-400 w-5 text-center">{exIdx + 1}</span>
                  )}
                  <div className="text-left">
                    <div className="font-semibold text-sm">{t(`exercises.${prescEx.exerciseId}`)}</div>
                    <div className="text-xs text-surface-500 dark:text-surface-400">
                      {prescEx.isAmrap
                        ? `AMRAP @ ${exerciseLog.sets[0]?.targetWeight} ${t('common.kg')}`
                        : def?.isTimeBased
                          ? `${prescEx.sets}×${prescEx.notes ?? `${prescEx.repsMin}s`}`
                          : def?.isDistanceBased
                            ? `${prescEx.sets}×${prescEx.notes ?? `${prescEx.repsMin}m`}`
                            : `${prescEx.sets}×${prescEx.repsMin}${prescEx.repsMin !== prescEx.repsMax ? `-${prescEx.repsMax}` : ''} @ ${exerciseLog.sets[0]?.targetWeight} ${t('common.kg')}`}
                      {prescEx.notes === 'exercises.perLeg' ? ` (${t('exercises.perLeg')})` : ''}
                      {!exerciseDone ? ` — ${completedSets}/${prescEx.sets}` : ''}
                    </div>
                  </div>
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

              {/* Expanded sets */}
              {isExpanded && (
                <div className="mt-3 flex flex-col gap-2">
                  {exerciseLog.sets.map((set, setIdx) => (
                    <div
                      key={setIdx}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        set.completed
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : 'bg-surface-50 dark:bg-surface-800'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-surface-500">
                            {t('workout.set', { number: setIdx + 1 })}
                          </span>
                          {prescEx.isAmrap && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold">
                              AMRAP
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-semibold mt-0.5">
                          {set.targetWeight > 0 ? `${set.targetWeight} ${t('common.kg')}` : ''}{' '}
                          {prescEx.isAmrap
                            ? '× max'
                            : def?.isTimeBased
                              ? `× ${set.targetRepsMin}s`
                              : def?.isDistanceBased
                                ? `× ${set.targetRepsMin}m`
                                : `× ${set.targetRepsMin}${set.targetRepsMin !== set.targetRepsMax ? `-${set.targetRepsMax}` : ''}`}
                        </div>
                      </div>

                      {prescEx.isAmrap ? (
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder={t('workout.actualReps')}
                          value={set.actualReps || ''}
                          onChange={(e) => {
                            const reps = Number(e.target.value)
                            updateExerciseSet(exIdx, setIdx, {
                              actualReps: reps,
                              completed: reps > 0,
                            })
                          }}
                          className="w-20 px-3 py-2 text-center rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-lg font-bold"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {/* Reps input for adjusting */}
                          <input
                            type="number"
                            inputMode="numeric"
                            value={set.actualReps}
                            onChange={(e) => {
                              updateExerciseSet(exIdx, setIdx, { actualReps: Number(e.target.value) })
                            }}
                            className="w-14 px-2 py-1 text-center rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm"
                          />
                          <button
                            onClick={() => handleSetComplete(exIdx, setIdx)}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                              set.completed
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-surface-300 dark:border-surface-600'
                            }`}
                          >
                            {set.completed && (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Notes */}
      <Card className="mt-2">
        <textarea
          placeholder={t('workout.notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-transparent resize-none text-sm placeholder:text-surface-400 focus:outline-none"
          rows={2}
        />
      </Card>

      {/* Effort note */}
      <p className="text-sm text-center text-surface-500 dark:text-surface-400 italic">
        {t(prescription.effortNote)}
      </p>

      <Button
        size="lg"
        className="w-full"
        onClick={handleFinish}
        disabled={!allDone}
      >
        {t('workout.finish')}
      </Button>
    </div>
  )
}
