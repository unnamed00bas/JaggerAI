import { describe, it, expect } from 'vitest'
import {
  phaseForWeek,
  weeksInPhase,
  clampWeek,
  roundKg,
  estimateOneRepMax,
  deloadWeight,
} from './phase'
import { suggestNextWeight, missedDaysAdjustment } from './progression'
import { EXERCISES } from '../exercises'

describe('phaseForWeek', () => {
  it('maps weeks 1-4 → phase 1', () => {
    expect(phaseForWeek(1)).toBe(1)
    expect(phaseForWeek(4)).toBe(1)
  })
  it('maps weeks 5-8 → phase 2', () => {
    expect(phaseForWeek(5)).toBe(2)
    expect(phaseForWeek(8)).toBe(2)
  })
  it('maps weeks 9-12 → phase 3', () => {
    expect(phaseForWeek(9)).toBe(3)
    expect(phaseForWeek(12)).toBe(3)
  })
  it('maps weeks 13-15 → phase 4', () => {
    expect(phaseForWeek(13)).toBe(4)
    expect(phaseForWeek(15)).toBe(4)
  })
  it('maps week 16 → deload', () => {
    expect(phaseForWeek(16)).toBe('deload')
  })
})

describe('weeksInPhase', () => {
  it('returns week sets correctly', () => {
    expect(weeksInPhase(1)).toEqual([1, 2, 3, 4])
    expect(weeksInPhase(4)).toEqual([13, 14, 15])
    expect(weeksInPhase('deload')).toEqual([16])
  })
})

describe('clampWeek', () => {
  it('clamps within [1,16]', () => {
    expect(clampWeek(-3)).toBe(1)
    expect(clampWeek(99)).toBe(16)
    expect(clampWeek(7)).toBe(7)
  })
})

describe('roundKg', () => {
  it('rounds to nearest 2.5', () => {
    expect(roundKg(82.4)).toBe(82.5)
    expect(roundKg(83.76)).toBe(85)
    expect(roundKg(85.1)).toBe(85)
    expect(roundKg(86.3)).toBe(87.5)
  })
})

describe('estimateOneRepMax', () => {
  it('1 rep → equal to weight', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100)
  })
  it('5 reps at 100 kg → ~112.5', () => {
    const est = estimateOneRepMax(100, 5)
    expect(est).toBeGreaterThan(110)
    expect(est).toBeLessThan(115)
  })
})

describe('deloadWeight', () => {
  it('applies 60% and rounds', () => {
    expect(deloadWeight(100)).toBe(60)
    expect(deloadWeight(102.5)).toBe(62.5)
  })
})

describe('suggestNextWeight', () => {
  const exercise = EXERCISES.bench_press

  it('adds 2.5 kg when all sets completed cleanly', () => {
    const next = suggestNextWeight(
      [
        { setNum: 1, targetReps: 5, actualReps: 5, actualWeightKg: 80, completed: true },
        { setNum: 2, targetReps: 5, actualReps: 5, actualWeightKg: 80, completed: true },
      ],
      exercise,
    )
    expect(next).toBe(82.5)
  })

  it('holds weight if last set was grinding (−1 rep)', () => {
    const next = suggestNextWeight(
      [
        { setNum: 1, targetReps: 5, actualReps: 5, actualWeightKg: 80, completed: true },
        { setNum: 2, targetReps: 5, actualReps: 4, actualWeightKg: 80, completed: true },
      ],
      exercise,
    )
    expect(next).toBe(80)
  })

  it('reduces 5% if any set failed', () => {
    const next = suggestNextWeight(
      [
        { setNum: 1, targetReps: 5, actualReps: 5, actualWeightKg: 80, completed: true },
        { setNum: 2, targetReps: 5, actualReps: 2, actualWeightKg: 80, completed: false },
      ],
      exercise,
    )
    expect(next).toBe(75)
  })
})

describe('missedDaysAdjustment', () => {
  it('1–2 days: no change', () => {
    expect(missedDaysAdjustment(2).multiplier).toBe(1)
  })
  it('3–7 days: −5%', () => {
    expect(missedDaysAdjustment(5).multiplier).toBeCloseTo(0.95)
  })
  it('>14 days: −17.5%', () => {
    expect(missedDaysAdjustment(20).action).toBe('restart_phase_1')
  })
})
