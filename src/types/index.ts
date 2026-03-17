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

export interface SyncMeta {
  updatedAt: string
  _dirty?: number // 1 = needs sync
}

export interface CycleConfig extends SyncMeta {
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

export interface WorkoutLog extends SyncMeta {
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

export interface AmrapResult extends SyncMeta {
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

// --- Tabata Conditioning ---

export type TabataEquipment = 'bodyweight' | 'kettlebell' | 'cardio_machines' | 'mixed'

export type TabataExerciseId =
  | 'kb_swings'
  | 'kb_snatches'
  | 'kb_goblet_squats'
  | 'kb_push_press'
  | 'burpees'
  | 'mountain_climbers'
  | 'squat_jumps'
  | 'push_ups'
  | 'jumping_lunges'
  | 'assault_bike'
  | 'kb_cleans'
  | 'rowing'

export interface TabataExercise {
  id: TabataExerciseId
  equipment: TabataEquipment
  targetMuscles: ('legs' | 'posterior' | 'push' | 'pull' | 'core' | 'full')[]
}

export interface TabataBlock {
  exerciseId: TabataExerciseId
  rounds: number // typically 8 (= 4 min)
  workSeconds: number // typically 20
  restSeconds: number // typically 10
}

export interface TabataWorkoutPrescription {
  wave: Wave
  phase: Phase
  weekNumber: number
  blocks: TabataBlock[]
  totalMinutes: number
  intensityNote: string
}

export interface TabataLog extends SyncMeta {
  id: string
  cycleId: string
  wave: Wave
  phase: Phase
  week: number
  blocks: TabataCompletedBlock[]
  date: string
  rpe: number // 1-10
  notes: string
}

export interface TabataCompletedBlock {
  exerciseId: TabataExerciseId
  targetRounds: number
  completedRounds: number
  completed: boolean
}

export const TABATA_EXERCISES: TabataExercise[] = [
  { id: 'kb_swings', equipment: 'kettlebell', targetMuscles: ['posterior', 'legs', 'core'] },
  { id: 'kb_snatches', equipment: 'kettlebell', targetMuscles: ['full', 'posterior', 'pull'] },
  { id: 'kb_goblet_squats', equipment: 'kettlebell', targetMuscles: ['legs', 'core'] },
  { id: 'kb_push_press', equipment: 'kettlebell', targetMuscles: ['push', 'core', 'legs'] },
  { id: 'kb_cleans', equipment: 'kettlebell', targetMuscles: ['posterior', 'pull', 'core'] },
  { id: 'burpees', equipment: 'bodyweight', targetMuscles: ['full'] },
  { id: 'mountain_climbers', equipment: 'bodyweight', targetMuscles: ['core', 'legs'] },
  { id: 'squat_jumps', equipment: 'bodyweight', targetMuscles: ['legs'] },
  { id: 'push_ups', equipment: 'bodyweight', targetMuscles: ['push', 'core'] },
  { id: 'jumping_lunges', equipment: 'bodyweight', targetMuscles: ['legs'] },
  { id: 'assault_bike', equipment: 'cardio_machines', targetMuscles: ['legs', 'full'] },
  { id: 'rowing', equipment: 'cardio_machines', targetMuscles: ['full', 'posterior', 'pull'] },
]
