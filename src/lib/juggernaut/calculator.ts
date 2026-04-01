import type {
  TrainingDayType,
  Block,
  ExerciseId,
  ExercisePrescription,
  DayPrescription,
  OneRepMaxes,
  WorkingWeights,
  WeekInfo,
  ExerciseCategory,
  ExerciseSelections,
} from '../../types'
import { EXERCISES, DAY_EXERCISES, DELOAD_WEEKS, AMRAP_TEST_WEEK, workingWeightKey, getSelectedExercises } from '../../types'

// ─────────────────────────────────────────────────────────
// 3-Day Undulating Periodization Calculator
// 12-week cycle, 3 blocks of 4 weeks
// Mon: Hypertrophy (6-8) | Wed: Volume (10-12) | Fri: Strength (3-5)
// ─────────────────────────────────────────────────────────

const ROUNDING_STEP = 2.5

export function roundWeight(weight: number): number {
  return Math.round(weight / ROUNDING_STEP) * ROUNDING_STEP
}

export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0) return weight
  if (reps === 1) return weight
  return roundWeight(weight * (1 + reps / 30))
}

export function getBlock(week: number): Block {
  if (week <= 4) return 1
  if (week <= 8) return 2
  return 3
}

export function isDeloadWeek(week: number): boolean {
  return (DELOAD_WEEKS as readonly number[]).includes(week)
}

export function isAmrapTestWeek(week: number): boolean {
  return week === AMRAP_TEST_WEEK
}

// --- Initial Working Weights from 1RM ---

/** Percentage of 1RM for initial working weight per day type */
const INITIAL_PERCENTAGES: Record<TrainingDayType, number> = {
  hypertrophy: 0.70,
  volume: 0.65,
  strength: 0.80,
}

/** Estimate initial weights for exercises not directly covered by 1RM */
function estimateAccessoryWeight(oneRepMaxes: OneRepMaxes, exerciseId: ExerciseId): number {
  switch (exerciseId) {
    case 'barbell_row':       return roundWeight(oneRepMaxes.deadlift * 0.50)
    case 'dumbbell_row':      return roundWeight(oneRepMaxes.deadlift * 0.25)
    case 't_bar_row':         return roundWeight(oneRepMaxes.deadlift * 0.45)
    case 'romanian_deadlift': return roundWeight(oneRepMaxes.deadlift * 0.55)
    case 'stiff_leg_deadlift':return roundWeight(oneRepMaxes.deadlift * 0.50)
    case 'dumbbell_curl':     return roundWeight(oneRepMaxes.bench * 0.15)
    case 'barbell_curl':      return roundWeight(oneRepMaxes.bench * 0.30)
    case 'hammer_curl':       return roundWeight(oneRepMaxes.bench * 0.15)
    case 'tricep_pushdown':   return roundWeight(oneRepMaxes.bench * 0.30)
    case 'overhead_tricep_ext': return roundWeight(oneRepMaxes.bench * 0.25)
    case 'dips':              return 0 // bodyweight
    case 'leg_press':         return roundWeight(oneRepMaxes.squat * 1.20)
    case 'pullup':            return 0 // bodyweight
    case 'lat_pulldown':      return roundWeight(oneRepMaxes.deadlift * 0.40)
    case 'incline_db_press':  return roundWeight(oneRepMaxes.bench * 0.30)
    case 'incline_barbell_press': return roundWeight(oneRepMaxes.bench * 0.65)
    case 'cable_row':         return roundWeight(oneRepMaxes.deadlift * 0.35)
    case 'bulgarian_split_squat': return roundWeight(oneRepMaxes.squat * 0.25)
    case 'lunges':            return roundWeight(oneRepMaxes.squat * 0.25)
    case 'step_ups':          return roundWeight(oneRepMaxes.squat * 0.20)
    case 'lateral_raise':     return roundWeight(Math.max(5, oneRepMaxes.ohp * 0.10))
    case 'cable_lateral_raise': return roundWeight(Math.max(5, oneRepMaxes.ohp * 0.10))
    case 'leg_curl':          return roundWeight(oneRepMaxes.squat * 0.25)
    case 'nordic_curl':       return 0 // bodyweight
    case 'cable_crunch':      return roundWeight(oneRepMaxes.squat * 0.20)
    case 'ab_wheel':          return 0 // bodyweight
    case 'hanging_leg_raise': return 0 // bodyweight
    case 'farmers_walk':      return roundWeight(oneRepMaxes.deadlift * 0.35)
    case 'kettlebell_swing':  return roundWeight(oneRepMaxes.deadlift * 0.20)
    default:                  return 20
  }
}

export function calculateInitialWorkingWeights(
  oneRepMaxes: OneRepMaxes,
  selections?: ExerciseSelections,
): WorkingWeights {
  const weights: WorkingWeights = {}

  // Main lifts: calculate per day type using percentages
  const mainLiftMap: Record<string, keyof OneRepMaxes> = {
    squat: 'squat',
    front_squat: 'squat',
    hack_squat: 'squat',
    bench: 'bench',
    dumbbell_bench: 'bench',
    machine_chest_press: 'bench',
    ohp: 'ohp',
    dumbbell_ohp: 'ohp',
    deadlift: 'deadlift',
    sumo_deadlift: 'deadlift',
    trap_bar_deadlift: 'deadlift',
  }

  for (const dayType of ['hypertrophy', 'volume', 'strength'] as TrainingDayType[]) {
    const exercises = selections
      ? getSelectedExercises(dayType, selections)
      : DAY_EXERCISES[dayType]

    for (const exerciseId of exercises) {
      const key = workingWeightKey(exerciseId, dayType)
      if (weights[key] !== undefined) continue // already calculated

      const oneRmKey = mainLiftMap[exerciseId]

      if (oneRmKey) {
        weights[key] = roundWeight(oneRepMaxes[oneRmKey] * INITIAL_PERCENTAGES[dayType])
      } else {
        weights[key] = estimateAccessoryWeight(oneRepMaxes, exerciseId)
      }
    }
  }

  return weights
}

// --- Periodization Table ---

interface PeriodizationEntry {
  sets: number
  repsMin: number
  repsMax: number
}

/**
 * Main periodization table for PRIMARY exercises.
 * Week -> DayType -> { sets, repsMin, repsMax }
 */
const PRIMARY_PERIODIZATION: Record<number, Record<TrainingDayType, PeriodizationEntry>> = {
  1:  { hypertrophy: { sets: 3, repsMin: 6, repsMax: 8 },  volume: { sets: 3, repsMin: 10, repsMax: 12 }, strength: { sets: 3, repsMin: 3, repsMax: 5 } },
  2:  { hypertrophy: { sets: 3, repsMin: 6, repsMax: 8 },  volume: { sets: 3, repsMin: 10, repsMax: 12 }, strength: { sets: 3, repsMin: 3, repsMax: 5 } },
  3:  { hypertrophy: { sets: 4, repsMin: 6, repsMax: 8 },  volume: { sets: 4, repsMin: 10, repsMax: 12 }, strength: { sets: 4, repsMin: 3, repsMax: 5 } },
  4:  { hypertrophy: { sets: 2, repsMin: 6, repsMax: 8 },  volume: { sets: 2, repsMin: 10, repsMax: 12 }, strength: { sets: 2, repsMin: 3, repsMax: 5 } },
  5:  { hypertrophy: { sets: 4, repsMin: 6, repsMax: 7 },  volume: { sets: 4, repsMin: 10, repsMax: 12 }, strength: { sets: 4, repsMin: 3, repsMax: 4 } },
  6:  { hypertrophy: { sets: 4, repsMin: 6, repsMax: 7 },  volume: { sets: 4, repsMin: 10, repsMax: 12 }, strength: { sets: 4, repsMin: 3, repsMax: 4 } },
  7:  { hypertrophy: { sets: 5, repsMin: 5, repsMax: 6 },  volume: { sets: 5, repsMin: 8, repsMax: 10 },  strength: { sets: 4, repsMin: 3, repsMax: 4 } },
  8:  { hypertrophy: { sets: 3, repsMin: 5, repsMax: 6 },  volume: { sets: 3, repsMin: 8, repsMax: 10 },  strength: { sets: 3, repsMin: 3, repsMax: 4 } },
  9:  { hypertrophy: { sets: 4, repsMin: 4, repsMax: 5 },  volume: { sets: 4, repsMin: 8, repsMax: 10 },  strength: { sets: 5, repsMin: 2, repsMax: 3 } },
  10: { hypertrophy: { sets: 4, repsMin: 4, repsMax: 5 },  volume: { sets: 4, repsMin: 8, repsMax: 10 },  strength: { sets: 5, repsMin: 2, repsMax: 3 } },
  11: { hypertrophy: { sets: 4, repsMin: 3, repsMax: 4 },  volume: { sets: 3, repsMin: 6, repsMax: 8 },   strength: { sets: 5, repsMin: 1, repsMax: 2 } },
  12: { hypertrophy: { sets: 1, repsMin: 1, repsMax: 99 }, volume: { sets: 2, repsMin: 8, repsMax: 10 },  strength: { sets: 1, repsMin: 1, repsMax: 99 } },
}

/** Secondary exercises: follow primary but with fewer sets */
function getSecondaryPrescription(week: number, dayType: TrainingDayType): PeriodizationEntry {
  const primary = PRIMARY_PERIODIZATION[week][dayType]
  const sets = Math.max(2, primary.sets - 1)

  // Secondary exercises have slightly higher rep ranges
  if (dayType === 'strength') {
    return { sets, repsMin: primary.repsMin + 1, repsMax: primary.repsMax + 1 }
  }
  return { sets, repsMin: primary.repsMin, repsMax: primary.repsMax + 2 }
}

/** Accessory exercises: mostly fixed, dropped during deload */
function getAccessoryPrescription(week: number, dayType: TrainingDayType, exerciseId: ExerciseId): PeriodizationEntry {
  if (isDeloadWeek(week) || isAmrapTestWeek(week)) {
    return { sets: 0, repsMin: 0, repsMax: 0 } // skip accessories on deload/test
  }

  const def = EXERCISES[exerciseId]

  // Time-based exercises (plank)
  if (def?.isTimeBased) {
    const block = getBlock(week)
    return { sets: 3, repsMin: block >= 3 ? 45 : 30, repsMax: block >= 3 ? 45 : 30 } // seconds
  }

  // Distance-based exercises (farmers walk)
  if (def?.isDistanceBased) {
    return { sets: 3, repsMin: 20, repsMax: 30 } // meters
  }

  // Standard accessories
  if (dayType === 'hypertrophy') {
    return { sets: 3, repsMin: 10, repsMax: 12 }
  }
  if (dayType === 'volume') {
    return { sets: 3, repsMin: 12, repsMax: 15 }
  }
  return { sets: 3, repsMin: 8, repsMax: 10 }
}

// --- Rest Times ---

function getRestSeconds(dayType: TrainingDayType, category: ExerciseCategory): number {
  if (category === 'accessory') {
    return dayType === 'volume' ? 60 : 90
  }
  switch (dayType) {
    case 'strength':    return category === 'primary' ? 270 : 180 // 4-5 min / 3 min
    case 'hypertrophy': return category === 'primary' ? 150 : 120 // 2-3 min / 2 min
    case 'volume':      return 90 // 90 sec
  }
}

// --- Effort Notes ---

const EFFORT_NOTES: Record<string, string> = {
  hypertrophy: 'effort.hypertrophy',
  volume: 'effort.volume',
  strength: 'effort.strength',
  deload: 'effort.deload',
  amrap: 'effort.amrap',
}

// --- Deload Weight Factor ---

function getDeloadFactor(week: number): number {
  if (week === 4) return 0.55 // Block 1 deload: 50-60%
  if (week === 8) return 0.60 // Block 2 deload: 60%
  return 1.0
}

// --- Main API ---

export function getDayPrescription(
  week: number,
  dayType: TrainingDayType,
  _workingWeights?: WorkingWeights,
  selections?: ExerciseSelections,
): DayPrescription {
  const block = getBlock(week)
  const deload = isDeloadWeek(week)
  const amrapTest = isAmrapTestWeek(week)
  const exercises = selections
    ? getSelectedExercises(dayType, selections)
    : DAY_EXERCISES[dayType]

  let effortNote: string
  if (amrapTest && dayType !== 'volume') {
    effortNote = EFFORT_NOTES.amrap
  } else if (deload) {
    effortNote = EFFORT_NOTES.deload
  } else {
    effortNote = EFFORT_NOTES[dayType]
  }

  const prescriptions: ExercisePrescription[] = []

  for (const exerciseId of exercises) {
    const def = EXERCISES[exerciseId]
    const category = def.category

    let entry: PeriodizationEntry
    switch (category) {
      case 'primary':
        entry = PRIMARY_PERIODIZATION[week][dayType]
        break
      case 'secondary':
        entry = getSecondaryPrescription(week, dayType)
        break
      case 'accessory':
        entry = getAccessoryPrescription(week, dayType, exerciseId)
        break
    }

    // Skip exercises with 0 sets (accessories during deload)
    if (entry.sets === 0) continue

    const isAmrapExercise = amrapTest && dayType !== 'volume' && category === 'primary'
    const restSeconds = getRestSeconds(dayType, category)

    // Build notes
    let notes: string | undefined
    if (def.isTimeBased) {
      notes = `${entry.repsMin}-${entry.repsMax}s`
    } else if (def.isDistanceBased) {
      notes = `${entry.repsMin}-${entry.repsMax}m`
    } else if (['bulgarian_split_squat', 'lunges', 'step_ups'].includes(exerciseId)) {
      notes = 'exercises.perLeg'
    }

    prescriptions.push({
      exerciseId,
      sets: isAmrapExercise ? 1 : entry.sets,
      repsMin: isAmrapExercise ? 0 : entry.repsMin,
      repsMax: isAmrapExercise ? 0 : entry.repsMax,
      restSeconds,
      category,
      isAmrap: isAmrapExercise,
      notes,
    })
  }

  return {
    dayType,
    week,
    block,
    exercises: prescriptions,
    isDeload: deload,
    isAmrapTest: amrapTest && dayType !== 'volume',
    effortNote,
  }
}

/**
 * Get the working weight for an exercise, accounting for deload reduction.
 */
export function getExerciseWeight(
  exerciseId: string,
  dayType: TrainingDayType,
  week: number,
  workingWeights: WorkingWeights,
): number {
  const key = workingWeightKey(exerciseId, dayType)
  const baseWeight = workingWeights[key] ?? 0

  if (isDeloadWeek(week)) {
    return roundWeight(baseWeight * getDeloadFactor(week))
  }

  if (isAmrapTestWeek(week) && dayType !== 'volume') {
    // AMRAP test: 90% of estimated 1RM
    // Estimate 1RM from working weight (assume ~5 rep range for strength day)
    const repsEstimate = dayType === 'strength' ? 3 : 6
    const estimated1RM = estimateOneRepMax(baseWeight, repsEstimate)
    return roundWeight(estimated1RM * 0.90)
  }

  return baseWeight
}

/**
 * Get all 12 weeks info.
 */
export function getCycleWeeks(): WeekInfo[] {
  const weeks: WeekInfo[] = []
  for (let w = 1; w <= 12; w++) {
    weeks.push({
      weekNumber: w,
      block: getBlock(w),
      isDeload: isDeloadWeek(w),
      isAmrapTest: isAmrapTestWeek(w),
    })
  }
  return weeks
}

/**
 * Weight increment for progression based on exercise type.
 */
export function getWeightIncrement(exerciseId: string): number {
  const def = EXERCISES[exerciseId as ExerciseId]
  return def?.increment ?? 2.5
}

/**
 * Check if the "2 for 2" rule is met: athlete hit upper rep range on 2 consecutive sessions.
 * Returns true if weight should be increased.
 */
export function shouldProgress(
  exerciseId: string,
  _dayType: TrainingDayType,
  logs: { exercises: { exerciseId: string; sets: { actualReps: number; targetRepsMax: number; completed: boolean }[] }[] }[],
): boolean {
  // Find last 2 logs that contain this exercise
  const relevantLogs = logs
    .filter(log => log.exercises.some(e => e.exerciseId === exerciseId))
    .slice(-2)

  if (relevantLogs.length < 2) return false

  return relevantLogs.every(log => {
    const exerciseLog = log.exercises.find(e => e.exerciseId === exerciseId)
    if (!exerciseLog) return false

    // All completed sets must be at or above upper rep range
    const completedSets = exerciseLog.sets.filter(s => s.completed)
    if (completedSets.length === 0) return false

    return completedSets.every(s => s.actualReps >= s.targetRepsMax)
  })
}

/**
 * Calculate new working weight after AMRAP test (week 12).
 * New estimated 1RM = Epley formula, then recalculate working weight.
 */
export function calculateNewOneRepMax(weight: number, reps: number): number {
  return estimateOneRepMax(weight, reps)
}

/**
 * Recalculate working weights from new 1RM values for a new cycle.
 */
export function recalculateWorkingWeights(
  oneRepMaxes: OneRepMaxes,
  boostPercent: number = 0.05, // 5% increase for next cycle
  selections?: ExerciseSelections,
): { oneRepMaxes: OneRepMaxes; workingWeights: WorkingWeights } {
  const boosted: OneRepMaxes = {
    squat: roundWeight(oneRepMaxes.squat * (1 + boostPercent)),
    bench: roundWeight(oneRepMaxes.bench * (1 + boostPercent)),
    ohp: roundWeight(oneRepMaxes.ohp * (1 + boostPercent)),
    deadlift: roundWeight(oneRepMaxes.deadlift * (1 + boostPercent)),
  }
  return {
    oneRepMaxes: boosted,
    workingWeights: calculateInitialWorkingWeights(boosted, selections),
  }
}
