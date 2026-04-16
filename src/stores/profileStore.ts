import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, CycleState } from '../types'

const DEFAULT_PROFILE: UserProfile = {
  name: 'User',
  age: 34,
  heightCm: 182,
  weightKg: 95,
  experience: 'CrossFit background, 4 years off',
  goal: 'Strength + endurance',
  sessionsPerWeek: 4,
  sessionDurationMin: 45,
  equipment:
    'Full gym: barbell, gravitron, cable machine, assault bike, rowing machine (Technogym)',
  reminderHourLocal: 19,
}

function createDefaultCycle(): CycleState {
  const now = new Date().toISOString()
  return {
    id: 'cycle-1',
    startDate: now,
    currentWeek: 1,
    completedCycles: 0,
    workingWeightsKg: {},
    gravitronAssistKg: {},
    dipsAddedKg: {},
    updatedAt: now,
  }
}

interface ProfileState {
  profile: UserProfile
  cycle: CycleState
  setProfile: (patch: Partial<UserProfile>) => void
  setWorkingWeight: (exerciseId: string, kg: number | undefined) => void
  applyWorkingWeights: (weights: Record<string, number>) => void
  setCurrentWeek: (week: number) => void
  advanceWeek: () => void
  resetCycle: () => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      cycle: createDefaultCycle(),

      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

      setWorkingWeight: (exerciseId, kg) =>
        set((s) => {
          const next = { ...s.cycle.workingWeightsKg }
          if (kg == null || !isFinite(kg)) delete next[exerciseId]
          else next[exerciseId] = kg
          return {
            cycle: { ...s.cycle, workingWeightsKg: next, updatedAt: new Date().toISOString() },
          }
        }),

      applyWorkingWeights: (weights) =>
        set((s) => ({
          cycle: {
            ...s.cycle,
            workingWeightsKg: { ...s.cycle.workingWeightsKg, ...weights },
            updatedAt: new Date().toISOString(),
          },
        })),

      setCurrentWeek: (week) =>
        set((s) => ({
          cycle: {
            ...s.cycle,
            currentWeek: Math.max(1, Math.min(16, Math.floor(week))),
            updatedAt: new Date().toISOString(),
          },
        })),

      advanceWeek: () => {
        const { cycle } = get()
        const nextWeek = cycle.currentWeek + 1
        if (nextWeek > 16) {
          set({
            cycle: {
              ...cycle,
              currentWeek: 1,
              completedCycles: cycle.completedCycles + 1,
              startDate: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          })
        } else {
          set({ cycle: { ...cycle, currentWeek: nextWeek, updatedAt: new Date().toISOString() } })
        }
      },

      resetCycle: () => set({ cycle: createDefaultCycle() }),
    }),
    { name: 'rowfit-profile' },
  ),
)
