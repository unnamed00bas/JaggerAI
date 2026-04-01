import { describe, it, expect } from 'vitest'
import {
  roundWeight,
  estimateOneRepMax,
  calculateInitialWorkingWeights,
  getDayPrescription,
  getExerciseWeight,
  getCycleWeeks,
  getBlock,
  isDeloadWeek,
  isAmrapTestWeek,
  shouldProgress,
} from './calculator'
import type { OneRepMaxes } from '../../types'

const TEST_MAXES: OneRepMaxes = {
  squat: 180,
  bench: 100,
  ohp: 60,
  deadlift: 200,
}

describe('roundWeight', () => {
  it('rounds to nearest 2.5 kg', () => {
    expect(roundWeight(100)).toBe(100)
    expect(roundWeight(101)).toBe(100)
    expect(roundWeight(101.25)).toBe(102.5)
    expect(roundWeight(101.5)).toBe(102.5)
    expect(roundWeight(103.75)).toBe(105)
    expect(roundWeight(98.7)).toBe(97.5)
  })

  it('handles exact multiples', () => {
    expect(roundWeight(97.5)).toBe(97.5)
    expect(roundWeight(102.5)).toBe(102.5)
  })
})

describe('estimateOneRepMax', () => {
  it('uses Epley formula and rounds', () => {
    expect(estimateOneRepMax(100, 10)).toBe(132.5)
    expect(estimateOneRepMax(80, 8)).toBe(102.5)
  })

  it('returns weight for 1 rep', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100)
  })

  it('returns weight for 0 reps', () => {
    expect(estimateOneRepMax(100, 0)).toBe(100)
  })
})

describe('calculateInitialWorkingWeights', () => {
  it('calculates working weights for main lifts', () => {
    const weights = calculateInitialWorkingWeights(TEST_MAXES)

    // squat hypertrophy = 180 * 0.70 = 126 → 125
    expect(weights['squat_hypertrophy']).toBe(125)
    // squat strength = 180 * 0.80 = 144 → 145
    expect(weights['squat_strength']).toBe(145)

    // bench hypertrophy = 100 * 0.70 = 70
    expect(weights['bench_hypertrophy']).toBe(70)

    // squat is NOT on volume day, so no squat_volume key
    expect(weights['squat_volume']).toBeUndefined()
  })

  it('includes accessory exercise weights', () => {
    const weights = calculateInitialWorkingWeights(TEST_MAXES)

    // Accessories should have non-zero weights
    expect(weights['dumbbell_curl_hypertrophy']).toBeGreaterThan(0)
    expect(weights['plank_hypertrophy']).toBeGreaterThan(0)
  })
})

describe('getDayPrescription', () => {
  const weights = calculateInitialWorkingWeights(TEST_MAXES)

  it('returns exercises for hypertrophy day', () => {
    const rx = getDayPrescription(1, 'hypertrophy', weights)
    expect(rx.dayType).toBe('hypertrophy')
    expect(rx.week).toBe(1)
    expect(rx.block).toBe(1)
    expect(rx.exercises.length).toBeGreaterThan(0)
  })

  it('marks deload weeks', () => {
    const rx = getDayPrescription(4, 'strength', weights)
    expect(rx.isDeload).toBe(true)
  })

  it('marks AMRAP test week for non-volume days', () => {
    const rx = getDayPrescription(12, 'strength', weights)
    expect(rx.isAmrapTest).toBe(true)
  })

  it('does not mark AMRAP for volume day', () => {
    const rx = getDayPrescription(12, 'volume', weights)
    expect(rx.isAmrapTest).toBe(false)
  })

  it('has primary exercises with correct rep ranges for week 1 hypertrophy', () => {
    const rx = getDayPrescription(1, 'hypertrophy', weights)
    const squat = rx.exercises.find(e => e.exerciseId === 'squat')
    expect(squat).toBeDefined()
    expect(squat!.sets).toBe(3)
    expect(squat!.repsMin).toBe(6)
    expect(squat!.repsMax).toBe(8)
  })

  it('has effort note', () => {
    const rx = getDayPrescription(1, 'hypertrophy', weights)
    expect(rx.effortNote).toBeTruthy()
  })
})

describe('getExerciseWeight', () => {
  const weights = calculateInitialWorkingWeights(TEST_MAXES)

  it('returns working weight for normal weeks', () => {
    const w = getExerciseWeight('squat', 'hypertrophy', 1, weights)
    expect(w).toBe(weights['squat_hypertrophy'])
  })

  it('reduces weight during deload weeks', () => {
    const normal = getExerciseWeight('squat', 'hypertrophy', 1, weights)
    const deload = getExerciseWeight('squat', 'hypertrophy', 4, weights)
    expect(deload).toBeLessThan(normal)
  })
})

describe('getCycleWeeks', () => {
  it('returns 12 weeks', () => {
    const weeks = getCycleWeeks()
    expect(weeks).toHaveLength(12)
  })

  it('first week is block 1', () => {
    const weeks = getCycleWeeks()
    expect(weeks[0]).toEqual({
      weekNumber: 1,
      block: 1,
      isDeload: false,
      isAmrapTest: false,
    })
  })

  it('week 4 is deload', () => {
    const weeks = getCycleWeeks()
    expect(weeks[3].isDeload).toBe(true)
  })

  it('week 12 is AMRAP test', () => {
    const weeks = getCycleWeeks()
    expect(weeks[11].isAmrapTest).toBe(true)
  })

  it('has correct block progression', () => {
    const weeks = getCycleWeeks()
    expect(weeks[0].block).toBe(1)
    expect(weeks[4].block).toBe(2)
    expect(weeks[8].block).toBe(3)
  })
})

describe('getBlock', () => {
  it('returns correct block for each week range', () => {
    expect(getBlock(1)).toBe(1)
    expect(getBlock(4)).toBe(1)
    expect(getBlock(5)).toBe(2)
    expect(getBlock(8)).toBe(2)
    expect(getBlock(9)).toBe(3)
    expect(getBlock(12)).toBe(3)
  })
})

describe('isDeloadWeek', () => {
  it('identifies deload weeks', () => {
    expect(isDeloadWeek(4)).toBe(true)
    expect(isDeloadWeek(8)).toBe(true)
    expect(isDeloadWeek(1)).toBe(false)
    expect(isDeloadWeek(12)).toBe(false)
  })
})

describe('isAmrapTestWeek', () => {
  it('identifies AMRAP test week', () => {
    expect(isAmrapTestWeek(12)).toBe(true)
    expect(isAmrapTestWeek(11)).toBe(false)
  })
})

describe('shouldProgress', () => {
  it('returns false with less than 2 logs', () => {
    expect(shouldProgress('squat', 'hypertrophy', [])).toBe(false)
    expect(shouldProgress('squat', 'hypertrophy', [{
      exercises: [{ exerciseId: 'squat', sets: [{ actualReps: 8, targetRepsMax: 8, completed: true }] }],
    }])).toBe(false)
  })

  it('returns true when upper reps hit 2 sessions in a row', () => {
    const logs = [
      { exercises: [{ exerciseId: 'squat', sets: [{ actualReps: 8, targetRepsMax: 8, completed: true }, { actualReps: 8, targetRepsMax: 8, completed: true }] }] },
      { exercises: [{ exerciseId: 'squat', sets: [{ actualReps: 8, targetRepsMax: 8, completed: true }, { actualReps: 8, targetRepsMax: 8, completed: true }] }] },
    ]
    expect(shouldProgress('squat', 'hypertrophy', logs)).toBe(true)
  })
})
