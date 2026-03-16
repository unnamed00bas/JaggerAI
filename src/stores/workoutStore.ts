import { create } from 'zustand'
import type { CompletedSet, WorkoutLog, Lift, Wave, Phase } from '../types'
import { db } from '../lib/db'

interface ActiveWorkout {
  cycleId: string
  lift: Lift
  wave: Wave
  phase: Phase
  week: number
  sets: CompletedSet[]
  startedAt: string
}

interface WorkoutState {
  activeWorkout: ActiveWorkout | null
  restTimerEnd: number | null

  startWorkout: (workout: Omit<ActiveWorkout, 'startedAt'>) => void
  updateSet: (index: number, update: Partial<CompletedSet>) => void
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

  updateSet: (index, update) =>
    set((state) => {
      if (!state.activeWorkout) return state
      const sets = [...state.activeWorkout.sets]
      sets[index] = { ...sets[index], ...update }
      return { activeWorkout: { ...state.activeWorkout, sets } }
    }),

  startRestTimer: (durationSeconds) =>
    set({ restTimerEnd: Date.now() + durationSeconds * 1000 }),

  clearRestTimer: () => set({ restTimerEnd: null }),

  finishWorkout: async (notes = '') => {
    const { activeWorkout } = get()
    if (!activeWorkout) throw new Error('No active workout')

    const log: WorkoutLog = {
      id: crypto.randomUUID(),
      cycleId: activeWorkout.cycleId,
      lift: activeWorkout.lift,
      wave: activeWorkout.wave,
      phase: activeWorkout.phase,
      week: activeWorkout.week,
      sets: activeWorkout.sets,
      date: new Date().toISOString(),
      notes,
    }

    await db.workoutLogs.add(log)
    set({ activeWorkout: null, restTimerEnd: null })
    return log.id
  },

  cancelWorkout: () => set({ activeWorkout: null, restTimerEnd: null }),
}))
