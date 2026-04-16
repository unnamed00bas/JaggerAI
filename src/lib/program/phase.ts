import type { Phase, DayType, PhasePrescription, ExerciseDef } from '../../types'
import { DELOAD_WEEK, TOTAL_WEEKS } from '../../types'

/** Phase for a given week (1..16). Week 16 is deload. */
export function phaseForWeek(week: number): Phase {
  if (week >= DELOAD_WEEK) return 'deload'
  if (week >= 13) return 4
  if (week >= 9) return 3
  if (week >= 5) return 2
  return 1
}

/** Week bounds for a given phase. */
export function weeksInPhase(phase: Phase): number[] {
  switch (phase) {
    case 1: return [1, 2, 3, 4]
    case 2: return [5, 6, 7, 8]
    case 3: return [9, 10, 11, 12]
    case 4: return [13, 14, 15]
    case 'deload': return [16]
  }
}

/**
 * Day rotation in a week: A, B, D (recovery), C.
 * Ensures ≥1 day of rest between heavy days and D is not before B/C.
 * Indices 0-6 → Mon..Sun (display only; no fixed calendar).
 */
export const DAY_ORDER: DayType[] = ['A', 'B', 'D', 'C']

/** Get next scheduled day type in the rotation */
export function nextDayAfter(dayType: DayType): DayType {
  const idx = DAY_ORDER.indexOf(dayType)
  return DAY_ORDER[(idx + 1) % DAY_ORDER.length]
}

/** Clamp any stored week to 1..TOTAL_WEEKS (wrap for next cycles handled elsewhere). */
export function clampWeek(week: number): number {
  if (!isFinite(week) || week < 1) return 1
  if (week > TOTAL_WEEKS) return TOTAL_WEEKS
  return Math.floor(week)
}

/** Resolve the effective prescription for exercise at current phase. */
export function getPrescription(exercise: ExerciseDef, phase: Phase): PhasePrescription | undefined {
  return exercise.phases[phase] ?? exercise.phases.all
}

/**
 * Round to the nearest 2.5 kg (gym plate resolution).
 */
export function roundKg(kg: number): number {
  return Math.round(kg / 2.5) * 2.5
}

/**
 * Compute Brzycki-estimated 1RM from weight × reps (caps at ~12 reps).
 * 1RM = weight × 36 / (37 − reps)
 */
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 0) return 0
  if (reps === 1) return weightKg
  if (reps > 12) reps = 12
  return weightKg * 36 / (37 - reps)
}

/**
 * Deload weight = last rolling weight × modifier (default 0.6).
 */
export function deloadWeight(lastWeightKg: number, modifier = 0.6): number {
  return roundKg(lastWeightKg * modifier)
}

export const PHASE_NAME_KEYS: Record<Phase, string> = {
  1: 'phase.adaptation',
  2: 'phase.volume',
  3: 'phase.intensity',
  4: 'phase.peak',
  deload: 'phase.deload',
}
