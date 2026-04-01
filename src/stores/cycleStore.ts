import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CycleConfig, OneRepMaxes } from '../types'
import { workingWeightKey } from '../types'
import { db } from '../lib/db'
import { calculateInitialWorkingWeights, getWeightIncrement, roundWeight, recalculateWorkingWeights } from '../lib/juggernaut'
import { useSyncStore } from './syncStore'

function deferSync() {
  setTimeout(() => useSyncStore.getState().triggerSync(), 2000)
}

interface CycleState {
  activeCycleId: string | null
  currentWeek: number

  setActiveCycleId: (id: string | null) => void
  setCurrentWeek: (week: number) => void

  createCycle: (oneRepMaxes: OneRepMaxes) => Promise<string>
  updateWorkingWeight: (exerciseId: string, dayType: string, newWeight: number) => Promise<void>
  progressExercise: (cycleId: string, exerciseId: string, dayType: string) => Promise<number>
  resetCycle: () => Promise<void>
  startNextCycle: () => Promise<string | null>
}

export const useCycleStore = create<CycleState>()(
  persist(
    (set) => ({
      activeCycleId: null,
      currentWeek: 1,

      setActiveCycleId: (id) => set({ activeCycleId: id }),
      setCurrentWeek: (week) => set({ currentWeek: week }),

      createCycle: async (oneRepMaxes) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        const workingWeights = calculateInitialWorkingWeights(oneRepMaxes)
        const cycle: CycleConfig = {
          id,
          oneRepMaxes,
          workingWeights,
          startDate: now,
          createdAt: now,
          updatedAt: now,
          _dirty: 1,
        }
        await db.cycles.add(cycle)
        set({ activeCycleId: id, currentWeek: 1 })
        deferSync()
        return id
      },

      updateWorkingWeight: async (exerciseId, dayType, newWeight) => {
        const { activeCycleId } = useCycleStore.getState()
        if (!activeCycleId) return

        const cycle = await db.cycles.get(activeCycleId)
        if (!cycle) return

        const key = workingWeightKey(exerciseId, dayType as 'hypertrophy' | 'volume' | 'strength')
        await db.cycles.update(activeCycleId, {
          workingWeights: {
            ...cycle.workingWeights,
            [key]: roundWeight(newWeight),
          },
          updatedAt: new Date().toISOString(),
          _dirty: 1,
        })
        deferSync()
      },

      progressExercise: async (cycleId, exerciseId, dayType) => {
        const cycle = await db.cycles.get(cycleId)
        if (!cycle) throw new Error('Cycle not found')

        const key = workingWeightKey(exerciseId, dayType as 'hypertrophy' | 'volume' | 'strength')
        const currentWeight = cycle.workingWeights[key] ?? 0
        const increment = getWeightIncrement(exerciseId)
        const newWeight = roundWeight(currentWeight + increment)

        await db.cycles.update(cycleId, {
          workingWeights: {
            ...cycle.workingWeights,
            [key]: newWeight,
          },
          updatedAt: new Date().toISOString(),
          _dirty: 1,
        })

        deferSync()
        return newWeight
      },

      resetCycle: async () => {
        const { activeCycleId } = useCycleStore.getState()
        if (activeCycleId) {
          await db.workoutLogs.where('cycleId').equals(activeCycleId).delete()
          await db.amrapResults.where('cycleId').equals(activeCycleId).delete()
          await db.cycles.delete(activeCycleId)
        }
        set({ activeCycleId: null, currentWeek: 1 })
      },

      startNextCycle: async () => {
        const { activeCycleId } = useCycleStore.getState()
        if (!activeCycleId) return null

        const oldCycle = await db.cycles.get(activeCycleId)
        if (!oldCycle) return null

        const { oneRepMaxes, workingWeights } = recalculateWorkingWeights(oldCycle.oneRepMaxes)

        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        const cycle: CycleConfig = {
          id,
          oneRepMaxes,
          workingWeights,
          startDate: now,
          createdAt: now,
          updatedAt: now,
          _dirty: 1,
        }
        await db.cycles.add(cycle)
        set({ activeCycleId: id, currentWeek: 1 })
        deferSync()
        return id
      },
    }),
    { name: 'jagger-cycle' },
  ),
)
