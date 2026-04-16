import type { ExerciseDef, Phase, CompletedSet } from '../../types'
import { getPrescription, roundKg } from './phase'

/**
 * Given a set of completed sets from the last session for an exercise, decide
 * what weight to suggest for the next session according to the spec rules.
 *
 * Rules (spec §6.1):
 * - All sets cleanly completed           → +2.5 kg
 * - Last set grinding (1–2 missed reps)  → hold weight
 * - Did not complete a set               → −5%
 * - Technique broke                      → −10%
 *   (technique flag inferred from notes containing "техника" / "form")
 */
export function suggestNextWeight(
  sets: CompletedSet[],
  exercise: ExerciseDef,
): number | undefined {
  if (sets.length === 0) return undefined
  const weighted = sets.find((s) => s.actualWeightKg != null)
  if (!weighted?.actualWeightKg) return undefined
  const baseline = weighted.actualWeightKg

  const missedSet = sets.some((s) => !s.completed)
  const techniqueBroke = sets.some((s) => /техника|form|sloppy/i.test(s.note ?? ''))
  const lastSet = sets[sets.length - 1]
  const lastGrinding =
    lastSet.targetReps != null &&
    lastSet.actualReps != null &&
    lastSet.actualReps >= lastSet.targetReps - 2 &&
    lastSet.actualReps < lastSet.targetReps

  if (techniqueBroke) return roundKg(baseline * 0.9)
  if (missedSet) return roundKg(baseline * 0.95)
  if (lastGrinding) return baseline

  const increment = exercise.progressionRule === 'add_weight_slow' ? 1.25 : 2.5
  return roundKg(baseline + increment)
}

/**
 * Compute the target weight for a given exercise/phase, applying overrides.
 * `lastWorkingWeight` is used for deload multiplier.
 */
export function targetWeightForPhase(
  exercise: ExerciseDef,
  phase: Phase,
  overrideKg: number | undefined,
  lastWorkingWeightKg: number | undefined,
): number | undefined {
  const p = getPrescription(exercise, phase)
  if (!p) return undefined

  if (p.weight_modifier != null && lastWorkingWeightKg != null) {
    return roundKg(lastWorkingWeightKg * p.weight_modifier)
  }

  if (overrideKg != null) return overrideKg

  if (p.weight_kg != null) return p.weight_kg
  return undefined
}

/**
 * Missed-day adjustment (spec §6.3).
 * Returns a multiplier to apply to recent working weights.
 */
export function missedDaysAdjustment(days: number): { multiplier: number; action: string } {
  if (days <= 2) return { multiplier: 1, action: 'continue' }
  if (days <= 7) return { multiplier: 0.95, action: 'reduce_5' }
  if (days <= 14) return { multiplier: 0.9, action: 'restart_phase' }
  return { multiplier: 0.825, action: 'restart_phase_1' }
}
