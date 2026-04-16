import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorkoutLog, ExerciseLog, CompletedSet, DayType, Phase } from '../types'

interface WorkoutStoreState {
  /** Currently active workout being logged, or null */
  active: WorkoutLog | null
  /** Rest timer end timestamp (ms since epoch) */
  restTimerEnd: number | null

  startWorkout: (args: {
    cycleId: string
    dayType: DayType
    phase: Phase
    week: number
  }) => WorkoutLog
  cancelWorkout: () => void
  completeWorkout: () => WorkoutLog | null

  addExerciseSet: (exerciseId: string, set: CompletedSet) => void
  updateLastSet: (exerciseId: string, patch: Partial<CompletedSet>) => void
  removeExercise: (exerciseId: string) => void
  setExerciseLog: (exerciseId: string, log: ExerciseLog) => void

  setRowingSessionId: (id: string | undefined) => void
  setNotes: (notes: string) => void

  startRestTimer: (seconds: number) => void
  clearRestTimer: () => void
}

function newLog(args: {
  cycleId: string
  dayType: DayType
  phase: Phase
  week: number
}): WorkoutLog {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    cycleId: args.cycleId,
    dayType: args.dayType,
    phase: args.phase,
    week: args.week,
    date: now,
    durationMin: 0,
    exercises: [],
    stretching: [],
    notes: '',
    completed: false,
    updatedAt: now,
  }
}

export const useWorkoutStore = create<WorkoutStoreState>()(
  persist(
    (set, get) => ({
      active: null,
      restTimerEnd: null,

      startWorkout: (args) => {
        const log = newLog(args)
        set({ active: log })
        return log
      },

      cancelWorkout: () => set({ active: null, restTimerEnd: null }),

      completeWorkout: () => {
        const { active } = get()
        if (!active) return null
        const start = new Date(active.date).getTime()
        const finished: WorkoutLog = {
          ...active,
          completed: true,
          durationMin: Math.max(
            1,
            Math.round((Date.now() - start) / 60000),
          ),
          updatedAt: new Date().toISOString(),
        }
        set({ active: null, restTimerEnd: null })
        return finished
      },

      addExerciseSet: (exerciseId, newSet) =>
        set((s) => {
          if (!s.active) return {}
          const exercises = [...s.active.exercises]
          const idx = exercises.findIndex((e) => e.exerciseId === exerciseId)
          if (idx === -1) {
            exercises.push({ exerciseId, sets: [newSet] })
          } else {
            exercises[idx] = { ...exercises[idx], sets: [...exercises[idx].sets, newSet] }
          }
          return {
            active: { ...s.active, exercises, updatedAt: new Date().toISOString() },
          }
        }),

      updateLastSet: (exerciseId, patch) =>
        set((s) => {
          if (!s.active) return {}
          const exercises = s.active.exercises.map((e) => {
            if (e.exerciseId !== exerciseId) return e
            if (e.sets.length === 0) return e
            const sets = [...e.sets]
            sets[sets.length - 1] = { ...sets[sets.length - 1], ...patch }
            return { ...e, sets }
          })
          return { active: { ...s.active, exercises, updatedAt: new Date().toISOString() } }
        }),

      removeExercise: (exerciseId) =>
        set((s) => {
          if (!s.active) return {}
          return {
            active: {
              ...s.active,
              exercises: s.active.exercises.filter((e) => e.exerciseId !== exerciseId),
              updatedAt: new Date().toISOString(),
            },
          }
        }),

      setExerciseLog: (exerciseId, log) =>
        set((s) => {
          if (!s.active) return {}
          const exercises = [...s.active.exercises]
          const idx = exercises.findIndex((e) => e.exerciseId === exerciseId)
          if (idx === -1) exercises.push(log)
          else exercises[idx] = log
          return { active: { ...s.active, exercises, updatedAt: new Date().toISOString() } }
        }),

      setRowingSessionId: (id) =>
        set((s) =>
          s.active
            ? { active: { ...s.active, rowingSessionId: id, updatedAt: new Date().toISOString() } }
            : {},
        ),

      setNotes: (notes) =>
        set((s) =>
          s.active
            ? { active: { ...s.active, notes, updatedAt: new Date().toISOString() } }
            : {},
        ),

      startRestTimer: (seconds) =>
        set({ restTimerEnd: Date.now() + Math.max(0, seconds) * 1000 }),

      clearRestTimer: () => set({ restTimerEnd: null }),
    }),
    {
      name: 'rowfit-workout',
      partialize: (s) => ({ active: s.active }),
    },
  ),
)
