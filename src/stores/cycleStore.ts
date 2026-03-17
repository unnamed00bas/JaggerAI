import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CycleConfig, Wave, Lift } from '../types'
import { db } from '../lib/db'
import { calculateNewTrainingMax } from '../lib/juggernaut'
import { useSyncStore } from './syncStore'

function deferSync() {
  setTimeout(() => useSyncStore.getState().triggerSync(), 2000)
}

interface CycleState {
  activeCycleId: string | null
  currentWeek: number

  setActiveCycleId: (id: string | null) => void
  setCurrentWeek: (week: number) => void

  createCycle: (config: Omit<CycleConfig, 'id' | 'createdAt' | 'updatedAt' | '_dirty'>) => Promise<string>
  updateTrainingMax: (cycleId: string, lift: Lift, wave: Wave, amrapReps: number) => Promise<number>
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

      createCycle: async (config) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        const cycle: CycleConfig = {
          ...config,
          id,
          createdAt: now,
          updatedAt: now,
          _dirty: 1,
        }
        await db.cycles.add(cycle)
        set({ activeCycleId: id, currentWeek: 1 })
        deferSync()
        return id
      },

      updateTrainingMax: async (cycleId, lift, wave, amrapReps) => {
        const cycle = await db.cycles.get(cycleId)
        if (!cycle) throw new Error('Cycle not found')

        const oldTM = cycle.trainingMaxes[lift]
        const newTM = calculateNewTrainingMax(oldTM, wave, amrapReps, lift)

        await db.cycles.update(cycleId, {
          trainingMaxes: {
            ...cycle.trainingMaxes,
            [lift]: newTM,
          },
          updatedAt: new Date().toISOString(),
          _dirty: 1,
        })

        deferSync()
        return newTM
      },

      resetCycle: async () => {
        const { activeCycleId } = useCycleStore.getState()
        if (activeCycleId) {
          await db.workoutLogs.where('cycleId').equals(activeCycleId).delete()
          await db.amrapResults.where('cycleId').equals(activeCycleId).delete()
          await db.tabataLogs.where('cycleId').equals(activeCycleId).delete()
          await db.cycles.delete(activeCycleId)
        }
        set({ activeCycleId: null, currentWeek: 1 })
      },

      startNextCycle: async () => {
        const { activeCycleId } = useCycleStore.getState()
        if (!activeCycleId) return null

        const oldCycle = await db.cycles.get(activeCycleId)
        if (!oldCycle) return null

        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        const cycle: CycleConfig = {
          id,
          variant: oldCycle.variant,
          trainingMaxes: { ...oldCycle.trainingMaxes },
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
