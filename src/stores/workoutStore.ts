import { create } from 'zustand'
import type { CompletedSet, ExerciseLog, WorkoutLog, TrainingDayType, Block } from '../types'
import { db } from '../lib/db'

interface ActiveWorkout {
  cycleId: string
  dayType: TrainingDayType
  week: number
  block: Block
  exercises: ExerciseLog[]
  startedAt: string
}

interface WorkoutState {
  activeWorkout: ActiveWorkout | null
  restTimerEnd: number | null

  startWorkout: (workout: Omit<ActiveWorkout, 'startedAt'>) => void
  updateExerciseSet: (exerciseIndex: number, setIndex: number, update: Partial<CompletedSet>) => void
  startRestTimer: (durationSeconds: number) => void
  clearRestTimer: () => void
  finishWorkout: (notes?: string) => Promise<string>
  cancelWorkout: () => void
}

export const useWorkoutStore = create<WorkoutState>()((set, get) => ({
  activeWorkout: null,
  restTimerEnd: null,

  startWorkout: (workout) =>
    set({
      activeWorkout: {
        ...workout,
        startedAt: new Date().toISOString(),
      },
    }),

  updateExerciseSet: (exerciseIndex, setIndex, update) =>
    set((state) => {
      if (!state.activeWorkout) return state
      const exercises = [...state.activeWorkout.exercises]
      const exercise = { ...exercises[exerciseIndex] }
      const sets = [...exercise.sets]
      sets[setIndex] = { ...sets[setIndex], ...update }
      exercise.sets = sets
      exercises[exerciseIndex] = exercise
      return { activeWorkout: { ...state.activeWorkout, exercises } }
    }),

  startRestTimer: (durationSeconds) =>
    set({ restTimerEnd: Date.now() + durationSeconds * 1000 }),

  clearRestTimer: () => set({ restTimerEnd: null }),

  finishWorkout: async (notes = '') => {
    const { activeWorkout } = get()
    if (!activeWorkout) throw new Error('No active workout')

    const now = new Date().toISOString()
    const log: WorkoutLog = {
      id: crypto.randomUUID(),
      cycleId: activeWorkout.cycleId,
      dayType: activeWorkout.dayType,
      week: activeWorkout.week,
      block: activeWorkout.block,
      exercises: activeWorkout.exercises,
      date: now,
      notes,
      updatedAt: now,
    }

    await db.workoutLogs.add(log)
    set({ activeWorkout: null, restTimerEnd: null })
    return log.id
  },

  cancelWorkout: () => set({ activeWorkout: null, restTimerEnd: null }),
}))
