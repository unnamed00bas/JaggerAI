import { describe, it, expect } from 'vitest'
import {
  roundWeight,
  calculateTrainingMax,
  estimateOneRepMax,
  calculateNewTrainingMax,
  getWorkoutPrescription,
  getWeightForSet,
  getCycleWeeks,
  generateFullCycle,
} from './calculator'

describe('roundWeight', () => {
  it('rounds to nearest 2.5 kg', () => {
    expect(roundWeight(100)).toBe(100)
    expect(roundWeight(101)).toBe(100)
    expect(roundWeight(101.25)).toBe(102.5) // 101.25 is exactly between 100 and 102.5, rounds up
    expect(roundWeight(101.5)).toBe(102.5)
    expect(roundWeight(103.75)).toBe(105)
    expect(roundWeight(98.7)).toBe(97.5) // 98.7 is closer to 97.5 than 100
  })

  it('handles exact multiples', () => {
    expect(roundWeight(97.5)).toBe(97.5)
    expect(roundWeight(102.5)).toBe(102.5)
  })
})

describe('calculateTrainingMax', () => {
  it('calculates 90% of 1RM and rounds', () => {
    expect(calculateTrainingMax(100)).toBe(90)
    expect(calculateTrainingMax(150)).toBe(135)
    expect(calculateTrainingMax(200)).toBe(180)
    expect(calculateTrainingMax(143)).toBe(127.5) // 143 * 0.9 = 128.7 -> 127.5
  })
})

describe('estimateOneRepMax', () => {
  it('uses Epley formula and rounds', () => {
    // weight * (1 + reps/30)
    expect(estimateOneRepMax(100, 10)).toBe(132.5) // 100 * (1 + 10/30) = 133.33 -> 132.5
    expect(estimateOneRepMax(80, 8)).toBe(102.5) // 80 * (1 + 8/30) = 101.33 -> 102.5
  })

  it('returns weight for 1 rep', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100)
  })

  it('returns weight for 0 reps', () => {
    expect(estimateOneRepMax(100, 0)).toBe(100)
  })
})

describe('calculateNewTrainingMax', () => {
  it('adds increment per extra rep for upper body', () => {
    // Bench: 1.25 kg per extra rep over target
    // 10s wave, target = 10, actual = 16, extras = 6
    // New TM = 100 + 6 * 1.25 = 107.5
    expect(calculateNewTrainingMax(100, '10s', 16, 'bench')).toBe(107.5)
  })

  it('adds increment per extra rep for lower body', () => {
    // Squat: 2.5 kg per extra rep over target
    // 10s wave, target = 10, actual = 15, extras = 5
    // New TM = 180 + 5 * 2.5 = 192.5
    expect(calculateNewTrainingMax(180, '10s', 15, 'squat')).toBe(192.5)
  })

  it('does not decrease TM if reps equal target', () => {
    expect(calculateNewTrainingMax(100, '8s', 8, 'bench')).toBe(100)
  })

  it('does not decrease TM if reps below target', () => {
    expect(calculateNewTrainingMax(100, '5s', 3, 'deadlift')).toBe(100)
  })

  it('works for 3s wave', () => {
    // Deadlift: 2.5 kg per extra rep, target 3, actual 7, extras = 4
    // 200 + 4 * 2.5 = 210
    expect(calculateNewTrainingMax(200, '3s', 7, 'deadlift')).toBe(210)
  })
})

describe('getWorkoutPrescription', () => {
  const tm = 100

  describe('accumulation phase', () => {
    it('classic 10s wave: 5 sets of 10 at 60%', () => {
      const workout = getWorkoutPrescription('10s', 'accumulation', 'squat', tm, 'classic')
      expect(workout.sets).toHaveLength(5)
      expect(workout.sets[0].percentage).toBe(0.6)
      expect(workout.sets[0].reps).toBe(10)
    })

    it('classic 8s wave: 5 sets of 8 at 65%', () => {
      const workout = getWorkoutPrescription('8s', 'accumulation', 'bench', tm, 'classic')
      expect(workout.sets).toHaveLength(5)
      expect(workout.sets[0].percentage).toBe(0.65)
      expect(workout.sets[0].reps).toBe(8)
    })

    it('classic 5s wave: 6 sets of 5 at 70%', () => {
      const workout = getWorkoutPrescription('5s', 'accumulation', 'ohp', tm, 'classic')
      expect(workout.sets).toHaveLength(6)
      expect(workout.sets[0].percentage).toBe(0.7)
      expect(workout.sets[0].reps).toBe(5)
    })

    it('classic 3s wave: 7 sets of 3 at 75%', () => {
      const workout = getWorkoutPrescription('3s', 'accumulation', 'deadlift', tm, 'classic')
      expect(workout.sets).toHaveLength(7)
      expect(workout.sets[0].percentage).toBe(0.75)
      expect(workout.sets[0].reps).toBe(3)
    })

    it('inverted 10s wave: 10 sets of 5 at 60%', () => {
      const workout = getWorkoutPrescription('10s', 'accumulation', 'squat', tm, 'inverted')
      expect(workout.sets).toHaveLength(10)
      expect(workout.sets[0].reps).toBe(5)
      expect(workout.sets[0].percentage).toBe(0.6)
    })

    it('inverted 8s wave: 8 sets of 5 at 65%', () => {
      const workout = getWorkoutPrescription('8s', 'accumulation', 'bench', tm, 'inverted')
      expect(workout.sets).toHaveLength(8)
      expect(workout.sets[0].reps).toBe(5)
    })

    it('inverted 5s wave: 5 sets of 6 at 70%', () => {
      const workout = getWorkoutPrescription('5s', 'accumulation', 'ohp', tm, 'inverted')
      expect(workout.sets).toHaveLength(5)
      expect(workout.sets[0].reps).toBe(6)
    })

    it('inverted 3s wave: 3 sets of 7 at 75%', () => {
      const workout = getWorkoutPrescription('3s', 'accumulation', 'deadlift', tm, 'inverted')
      expect(workout.sets).toHaveLength(3)
      expect(workout.sets[0].reps).toBe(7)
    })
  })

  describe('intensification phase', () => {
    it('10s wave: warmups + 3x10 at 67.5%', () => {
      const workout = getWorkoutPrescription('10s', 'intensification', 'squat', tm)
      expect(workout.sets).toHaveLength(5) // 2 warmup + 3 work
      expect(workout.sets[0].isWarmup).toBe(true)
      expect(workout.sets[0].percentage).toBe(0.55)
      expect(workout.sets[2].percentage).toBe(0.675)
      expect(workout.sets[2].reps).toBe(10)
    })

    it('3s wave: warmups + 5x3 at 82.5%', () => {
      const workout = getWorkoutPrescription('3s', 'intensification', 'deadlift', tm)
      expect(workout.sets).toHaveLength(7) // 2 warmup + 5 work
      expect(workout.sets[2].percentage).toBe(0.825)
      expect(workout.sets[2].reps).toBe(3)
    })
  })

  describe('realization phase', () => {
    it('10s wave: 3 ramping + AMRAP at 75%', () => {
      const workout = getWorkoutPrescription('10s', 'realization', 'bench', tm)
      expect(workout.sets).toHaveLength(4)
      const amrapSet = workout.sets[workout.sets.length - 1]
      expect(amrapSet.percentage).toBe(0.75)
      expect(amrapSet.reps).toBe('amrap')
    })

    it('3s wave: 6 ramping + AMRAP at 90%', () => {
      const workout = getWorkoutPrescription('3s', 'realization', 'squat', tm)
      expect(workout.sets).toHaveLength(7)
      const amrapSet = workout.sets[workout.sets.length - 1]
      expect(amrapSet.percentage).toBe(0.90)
      expect(amrapSet.reps).toBe('amrap')
    })
  })

  describe('deload phase', () => {
    it('has 3 sets at 40%, 50%, 60%', () => {
      const workout = getWorkoutPrescription('10s', 'deload', 'ohp', tm)
      expect(workout.sets).toHaveLength(3)
      expect(workout.sets[0].percentage).toBe(0.4)
      expect(workout.sets[1].percentage).toBe(0.5)
      expect(workout.sets[2].percentage).toBe(0.6)
      expect(workout.sets.every(s => s.reps === 5)).toBe(true)
    })
  })
})

describe('getWeightForSet', () => {
  it('calculates weight from TM and percentage', () => {
    expect(getWeightForSet(100, 0.6)).toBe(60)
    expect(getWeightForSet(135, 0.675)).toBe(90) // 91.125 -> 90
    expect(getWeightForSet(180, 0.775)).toBe(140) // 139.5 -> 140
  })
})

describe('getCycleWeeks', () => {
  it('returns 16 weeks', () => {
    const weeks = getCycleWeeks()
    expect(weeks).toHaveLength(16)
  })

  it('starts with 10s accumulation', () => {
    const weeks = getCycleWeeks()
    expect(weeks[0]).toEqual({ weekNumber: 1, wave: '10s', phase: 'accumulation' })
  })

  it('ends with 3s deload', () => {
    const weeks = getCycleWeeks()
    expect(weeks[15]).toEqual({ weekNumber: 16, wave: '3s', phase: 'deload' })
  })

  it('has correct wave/phase progression', () => {
    const weeks = getCycleWeeks()
    expect(weeks[4]).toEqual({ weekNumber: 5, wave: '8s', phase: 'accumulation' })
    expect(weeks[10]).toEqual({ weekNumber: 11, wave: '5s', phase: 'realization' })
  })
})

describe('generateFullCycle', () => {
  it('generates 16 weeks with 4 workouts each', () => {
    const tms = { squat: 180, bench: 100, ohp: 60, deadlift: 200 }
    const { weeks, workouts } = generateFullCycle(tms, 'classic')
    expect(weeks).toHaveLength(16)
    expect(workouts).toHaveLength(16)
    expect(workouts[0]).toHaveLength(4)
  })
})
