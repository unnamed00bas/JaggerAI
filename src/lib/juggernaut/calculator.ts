import type {
  Wave,
  Phase,
  Lift,
  MethodVariant,
  SetPrescription,
  WorkoutPrescription,
  TrainingMaxes,
  WeekInfo,
} from '../../types'

const ROUNDING_STEP = 2.5

export function roundWeight(weight: number): number {
  return Math.round(weight / ROUNDING_STEP) * ROUNDING_STEP
}

export function calculateTrainingMax(oneRepMax: number): number {
  return roundWeight(oneRepMax * 0.9)
}

export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0) return weight
  if (reps === 1) return weight
  return roundWeight(weight * (1 + reps / 30))
}

export function calculateNewTrainingMax(
  oldTM: number,
  wave: Wave,
  amrapReps: number,
  lift: Lift,
): number {
  const targetReps = WAVE_TARGET_MAP[wave]
  const extraReps = Math.max(0, amrapReps - targetReps)
  const increment = getIncrementPerRep(lift)
  return roundWeight(oldTM + extraReps * increment)
}

const WAVE_TARGET_MAP: Record<Wave, number> = {
  '10s': 10,
  '8s': 8,
  '5s': 5,
  '3s': 3,
}

function getIncrementPerRep(lift: Lift): number {
  switch (lift) {
    case 'squat':
    case 'deadlift':
      return 2.5
    case 'bench':
    case 'ohp':
      return 1.25
  }
}

// --- Accumulation Phase ---

function getAccumulationSets(
  wave: Wave,
  variant: MethodVariant,
): SetPrescription[] {
  const config: Record<Wave, { percentage: number; sets: number; reps: number }> = {
    '10s': { percentage: 0.6, sets: 5, reps: 10 },
    '8s': { percentage: 0.65, sets: 5, reps: 8 },
    '5s': { percentage: 0.7, sets: 6, reps: 5 },
    '3s': { percentage: 0.75, sets: 7, reps: 3 },
  }

  const c = config[wave]
  let { sets, reps } = c

  if (variant === 'inverted') {
    const temp = sets
    sets = reps
    reps = temp
    if (wave === '5s') {
      sets = 5
      reps = 6
    } else if (wave === '3s') {
      sets = 3
      reps = 7
    }
  }

  return Array.from({ length: sets }, () => ({
    percentage: c.percentage,
    reps,
  }))
}

// --- Intensification Phase ---

function getIntensificationSets(wave: Wave): SetPrescription[] {
  const configs: Record<Wave, { warmups: SetPrescription[]; workPercentage: number; workSets: number; workReps: number }> = {
    '10s': {
      warmups: [
        { percentage: 0.55, reps: 5, isWarmup: true },
        { percentage: 0.60, reps: 3, isWarmup: true },
      ],
      workPercentage: 0.675,
      workSets: 3,
      workReps: 10,
    },
    '8s': {
      warmups: [
        { percentage: 0.625, reps: 5, isWarmup: true },
        { percentage: 0.675, reps: 3, isWarmup: true },
      ],
      workPercentage: 0.725,
      workSets: 3,
      workReps: 8,
    },
    '5s': {
      warmups: [
        { percentage: 0.65, reps: 2, isWarmup: true },
        { percentage: 0.70, reps: 1, isWarmup: true },
      ],
      workPercentage: 0.775,
      workSets: 4,
      workReps: 5,
    },
    '3s': {
      warmups: [
        { percentage: 0.725, reps: 2, isWarmup: true },
        { percentage: 0.775, reps: 1, isWarmup: true },
      ],
      workPercentage: 0.825,
      workSets: 5,
      workReps: 3,
    },
  }

  const c = configs[wave]
  const workSets: SetPrescription[] = Array.from({ length: c.workSets }, () => ({
    percentage: c.workPercentage,
    reps: c.workReps,
  }))

  return [...c.warmups, ...workSets]
}

// --- Realization Phase (AMRAP) ---

function getRealizationSets(wave: Wave): SetPrescription[] {
  const configs: Record<Wave, SetPrescription[]> = {
    '10s': [
      { percentage: 0.50, reps: 5, isWarmup: true },
      { percentage: 0.60, reps: 3, isWarmup: true },
      { percentage: 0.70, reps: 1, isWarmup: true },
      { percentage: 0.75, reps: 'amrap' },
    ],
    '8s': [
      { percentage: 0.50, reps: 5, isWarmup: true },
      { percentage: 0.60, reps: 3, isWarmup: true },
      { percentage: 0.70, reps: 2, isWarmup: true },
      { percentage: 0.75, reps: 1, isWarmup: true },
      { percentage: 0.80, reps: 'amrap' },
    ],
    '5s': [
      { percentage: 0.50, reps: 5, isWarmup: true },
      { percentage: 0.60, reps: 3, isWarmup: true },
      { percentage: 0.70, reps: 2, isWarmup: true },
      { percentage: 0.75, reps: 1, isWarmup: true },
      { percentage: 0.80, reps: 1, isWarmup: true },
      { percentage: 0.85, reps: 'amrap' },
    ],
    '3s': [
      { percentage: 0.50, reps: 5, isWarmup: true },
      { percentage: 0.60, reps: 3, isWarmup: true },
      { percentage: 0.70, reps: 2, isWarmup: true },
      { percentage: 0.75, reps: 1, isWarmup: true },
      { percentage: 0.80, reps: 1, isWarmup: true },
      { percentage: 0.85, reps: 1, isWarmup: true },
      { percentage: 0.90, reps: 'amrap' },
    ],
  }

  return configs[wave]
}

// --- Deload Phase ---

function getDeloadSets(): SetPrescription[] {
  return [
    { percentage: 0.40, reps: 5 },
    { percentage: 0.50, reps: 5 },
    { percentage: 0.60, reps: 5 },
  ]
}

// --- Effort Notes ---

const EFFORT_NOTES: Record<Phase, string> = {
  accumulation: 'effort.accumulation',
  intensification: 'effort.intensification',
  realization: 'effort.realization',
  deload: 'effort.deload',
}

// --- Main API ---

export function getWorkoutPrescription(
  wave: Wave,
  phase: Phase,
  lift: Lift,
  _tm: number,
  variant: MethodVariant = 'classic',
): WorkoutPrescription {
  let sets: SetPrescription[]

  switch (phase) {
    case 'accumulation':
      sets = getAccumulationSets(wave, variant)
      break
    case 'intensification':
      sets = getIntensificationSets(wave)
      break
    case 'realization':
      sets = getRealizationSets(wave)
      break
    case 'deload':
      sets = getDeloadSets()
      break
  }

  return {
    wave,
    phase,
    lift,
    sets,
    effortNote: EFFORT_NOTES[phase],
  }
}

export function getWeightForSet(tm: number, percentage: number): number {
  return roundWeight(tm * percentage)
}

export function getCycleWeeks(): WeekInfo[] {
  const waves: Wave[] = ['10s', '8s', '5s', '3s']
  const phases: Phase[] = ['accumulation', 'intensification', 'realization', 'deload']
  const weeks: WeekInfo[] = []
  let weekNumber = 1

  for (const wave of waves) {
    for (const phase of phases) {
      weeks.push({ weekNumber, wave, phase })
      weekNumber++
    }
  }

  return weeks
}

export function generateFullCycle(
  trainingMaxes: TrainingMaxes,
  variant: MethodVariant,
): { weeks: WeekInfo[]; workouts: WorkoutPrescription[][] } {
  const weeks = getCycleWeeks()
  const lifts: Lift[] = ['squat', 'bench', 'ohp', 'deadlift']
  const workouts: WorkoutPrescription[][] = []

  for (const week of weeks) {
    const weekWorkouts: WorkoutPrescription[] = []
    for (const lift of lifts) {
      const tm = trainingMaxes[lift]
      weekWorkouts.push(
        getWorkoutPrescription(week.wave, week.phase, lift, tm, variant),
      )
    }
    workouts.push(weekWorkouts)
  }

  return { weeks, workouts }
}
