export type Lift = 'squat' | 'bench' | 'ohp' | 'deadlift'

export type Wave = '10s' | '8s' | '5s' | '3s'

export type Phase = 'accumulation' | 'intensification' | 'realization' | 'deload'

export type MethodVariant = 'classic' | 'inverted'

export interface SetPrescription {
  percentage: number
  reps: number | 'amrap'
  isWarmup?: boolean
}

export interface WorkoutPrescription {
  wave: Wave
  phase: Phase
  lift: Lift
  sets: SetPrescription[]
  effortNote: string
}

export interface TrainingMaxes {
  squat: number
  bench: number
  ohp: number
  deadlift: number
}

export interface CycleConfig {
  id: string
  variant: MethodVariant
  trainingMaxes: TrainingMaxes
  startDate: string
  createdAt: string
}

export interface CompletedSet {
  targetWeight: number
  targetReps: number | 'amrap'
  actualWeight: number
  actualReps: number
  completed: boolean
}

export interface WorkoutLog {
  id: string
  cycleId: string
  lift: Lift
  wave: Wave
  phase: Phase
  week: number
  sets: CompletedSet[]
  date: string
  notes: string
}

export interface AmrapResult {
  id: string
  cycleId: string
  lift: Lift
  wave: Wave
  weight: number
  targetReps: number
  actualReps: number
  date: string
  estimatedOneRepMax: number
  newTrainingMax: number
}

export interface WeekInfo {
  weekNumber: number
  wave: Wave
  phase: Phase
}

export const LIFTS: Lift[] = ['squat', 'bench', 'ohp', 'deadlift']

export const WAVES: Wave[] = ['10s', '8s', '5s', '3s']

export const PHASES: Phase[] = ['accumulation', 'intensification', 'realization', 'deload']

export const WAVE_TARGET_REPS: Record<Wave, number> = {
  '10s': 10,
  '8s': 8,
  '5s': 5,
  '3s': 3,
}
