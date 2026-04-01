import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExerciseId, ExerciseSelections } from '../types'

interface ExerciseSelectionState {
  selections: ExerciseSelections
  setSelection: (slotKey: string, exerciseId: ExerciseId) => void
  resetSelections: () => void
}

export const useExerciseSelectionStore = create<ExerciseSelectionState>()(
  persist(
    (set) => ({
      selections: {},

      setSelection: (slotKey, exerciseId) =>
        set((state) => ({
          selections: { ...state.selections, [slotKey]: exerciseId },
        })),

      resetSelections: () => set({ selections: {} }),
    }),
    { name: 'jagger-exercise-selections' },
  ),
)
