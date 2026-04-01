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
    it('returns correct blocks for block 1 normal week', () => {
      const workout = getTabataWorkout(1, 1)
      // Block 1 config: 2 blocks
      expect(workout.blocks).toHaveLength(2)
    })

    it('returns fewer blocks for block 3', () => {
      const workout = getTabataWorkout(9, 3)
      // Block 3 config: 1 block
      expect(workout.blocks).toHaveLength(1)
    })

    it('returns 1 block during deload', () => {
      const workout = getTabataWorkout(4, 1, 'mixed', true)
      expect(workout.blocks).toHaveLength(1)
      expect(workout.intensityNote).toBe('tabata.intensity.deload')
    })

    it('returns 1 block during AMRAP test week', () => {
      const workout = getTabataWorkout(12, 3, 'mixed', false, true)
      expect(workout.blocks).toHaveLength(1)
    })

    it('standard Tabata timing: 20s work, 10s rest, 8 rounds', () => {
      const workout = getTabataWorkout(1, 1)
      for (const block of workout.blocks) {
        expect(block.workSeconds).toBe(20)
        expect(block.restSeconds).toBe(10)
        expect(block.rounds).toBe(8)
      }
    })

    it('calculates total minutes', () => {
      const workout = getTabataWorkout(1, 1)
      expect(workout.totalMinutes).toBeGreaterThan(0)
    })

    it('has intensity note', () => {
      const workout = getTabataWorkout(1, 1)
      expect(workout.intensityNote).toBe('tabata.intensity.block1')
    })

    it('filters exercises by equipment - bodyweight', () => {
      const workout = getTabataWorkout(1, 1, 'bodyweight')
      expect(workout.blocks.length).toBeGreaterThan(0)
      const bwIds = ['burpees', 'mountain_climbers', 'squat_jumps', 'push_ups', 'jumping_lunges']
      for (const block of workout.blocks) {
        expect(bwIds).toContain(block.exerciseId)
      }
    })

    it('filters exercises by equipment - kettlebell', () => {
      const workout = getTabataWorkout(1, 1, 'kettlebell')
      const kbIds = ['kb_swings', 'kb_snatches', 'kb_goblet_squats', 'kb_push_press', 'kb_cleans']
      for (const block of workout.blocks) {
        expect(kbIds).toContain(block.exerciseId)
      }
    })
  })

  describe('generateTabataCycle', () => {
    it('generates 12 weeks of Tabata workouts', () => {
      const cycle = generateTabataCycle()
      expect(cycle).toHaveLength(12)
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
    it('block 1: 2-3 sessions per week', () => {
      const freq = getTabataFrequency(1, false)
      expect(freq.min).toBe(2)
      expect(freq.max).toBe(3)
    })

    it('block 3: 1-2 sessions per week', () => {
      const freq = getTabataFrequency(3, false)
      expect(freq.min).toBe(1)
      expect(freq.max).toBe(2)
    })

    it('deload: 1 session per week', () => {
      const freq = getTabataFrequency(1, true)
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

    it('total workout with 2 blocks = 480 seconds', () => {
      const blocks = [
        { exerciseId: 'kb_swings' as const, rounds: 8, workSeconds: 20, restSeconds: 10 },
        { exerciseId: 'burpees' as const, rounds: 8, workSeconds: 20, restSeconds: 10 },
      ]
      expect(getTotalWorkoutSeconds(blocks)).toBe(480)
    })

    it('empty blocks = 0 seconds', () => {
      expect(getTotalWorkoutSeconds([])).toBe(0)
    })
  })
})
