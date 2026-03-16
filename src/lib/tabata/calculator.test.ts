import { describe, it, expect } from 'vitest'
import {
  getTabataWorkout,
  generateTabataCycle,
  getTabataFrequency,
  getBlockDurationSeconds,
  getTotalWorkoutSeconds,
} from './calculator'

describe('Tabata Calculator', () => {
  describe('getTabataWorkout', () => {
    it('returns correct blocks for accumulation phase in 10s wave', () => {
      const workout = getTabataWorkout('10s', 'accumulation', 1)
      // accumulation (2 blocks) + 10s wave modifier (+1) = 3 blocks
      expect(workout.blocks).toHaveLength(3)
      expect(workout.wave).toBe('10s')
      expect(workout.phase).toBe('accumulation')
      expect(workout.weekNumber).toBe(1)
    })

    it('returns correct blocks for intensification phase', () => {
      const workout = getTabataWorkout('8s', 'intensification', 6)
      // intensification (1 block) + 8s wave modifier (0) = 1 block
      expect(workout.blocks).toHaveLength(1)
    })

    it('returns minimum 1 block even with negative modifier', () => {
      const workout = getTabataWorkout('3s', 'intensification', 14)
      // intensification (1) + 3s wave modifier (-1) = 0 → clamped to 1
      expect(workout.blocks).toHaveLength(1)
    })

    it('standard Tabata timing: 20s work, 10s rest, 8 rounds', () => {
      const workout = getTabataWorkout('10s', 'accumulation', 1)
      for (const block of workout.blocks) {
        expect(block.workSeconds).toBe(20)
        expect(block.restSeconds).toBe(10)
        expect(block.rounds).toBe(8)
      }
    })

    it('calculates total minutes', () => {
      const workout = getTabataWorkout('10s', 'accumulation', 1)
      expect(workout.totalMinutes).toBeGreaterThan(0)
    })

    it('has intensity note', () => {
      const workout = getTabataWorkout('8s', 'deload', 8)
      expect(workout.intensityNote).toBe('tabata.intensity.deload')
    })

    it('filters exercises by equipment - bodyweight', () => {
      const workout = getTabataWorkout('10s', 'accumulation', 1, 'bodyweight')
      expect(workout.blocks.length).toBeGreaterThan(0)
      // All exercises should be bodyweight
      const bwIds = ['burpees', 'mountain_climbers', 'squat_jumps', 'push_ups', 'jumping_lunges']
      for (const block of workout.blocks) {
        expect(bwIds).toContain(block.exerciseId)
      }
    })

    it('filters exercises by equipment - kettlebell', () => {
      const workout = getTabataWorkout('10s', 'accumulation', 1, 'kettlebell')
      const kbIds = ['kb_swings', 'kb_snatches', 'kb_goblet_squats', 'kb_push_press', 'kb_cleans']
      for (const block of workout.blocks) {
        expect(kbIds).toContain(block.exerciseId)
      }
    })
  })

  describe('generateTabataCycle', () => {
    it('generates 16 weeks of Tabata workouts', () => {
      const cycle = generateTabataCycle()
      expect(cycle).toHaveLength(16)
    })

    it('week numbers are sequential 1-16', () => {
      const cycle = generateTabataCycle()
      cycle.forEach((workout, i) => {
        expect(workout.weekNumber).toBe(i + 1)
      })
    })

    it('follows wave/phase structure matching JM cycle', () => {
      const cycle = generateTabataCycle()
      // Week 1: 10s accumulation
      expect(cycle[0].wave).toBe('10s')
      expect(cycle[0].phase).toBe('accumulation')
      // Week 5: 8s accumulation
      expect(cycle[4].wave).toBe('8s')
      expect(cycle[4].phase).toBe('accumulation')
      // Week 16: 3s deload
      expect(cycle[15].wave).toBe('3s')
      expect(cycle[15].phase).toBe('deload')
    })

    it('respects equipment parameter', () => {
      const cycle = generateTabataCycle('bodyweight')
      const bwIds = ['burpees', 'mountain_climbers', 'squat_jumps', 'push_ups', 'jumping_lunges']
      for (const workout of cycle) {
        for (const block of workout.blocks) {
          expect(bwIds).toContain(block.exerciseId)
        }
      }
    })
  })

  describe('getTabataFrequency', () => {
    it('accumulation: 2-3 sessions per week', () => {
      const freq = getTabataFrequency('accumulation')
      expect(freq.min).toBe(2)
      expect(freq.max).toBe(3)
    })

    it('realization: 1 session per week', () => {
      const freq = getTabataFrequency('realization')
      expect(freq.min).toBe(1)
      expect(freq.max).toBe(1)
    })
  })

  describe('duration calculations', () => {
    it('single block is 4 minutes (240 seconds)', () => {
      const duration = getBlockDurationSeconds({
        exerciseId: 'kb_swings',
        rounds: 8,
        workSeconds: 20,
        restSeconds: 10,
      })
      expect(duration).toBe(240)
    })

    it('total workout with 2 blocks = 2×240 + 60 rest = 540 seconds', () => {
      const blocks = [
        { exerciseId: 'kb_swings' as const, rounds: 8, workSeconds: 20, restSeconds: 10 },
        { exerciseId: 'burpees' as const, rounds: 8, workSeconds: 20, restSeconds: 10 },
      ]
      expect(getTotalWorkoutSeconds(blocks)).toBe(540)
    })

    it('empty blocks = 0 seconds', () => {
      expect(getTotalWorkoutSeconds([])).toBe(0)
    })
  })
})
