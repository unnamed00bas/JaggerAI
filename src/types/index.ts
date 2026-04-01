// ─────────────────────────────────────────────────────────
// 3-Day Undulating Periodization Program Types
// 12-week cycle, 3 blocks, 3 training days per week
// ─────────────────────────────────────────────────────────

// --- Training Day Types ---

/** Mon = Hypertrophy (6-8), Wed = Volume (10-12), Fri = Strength (3-5) */
export type TrainingDayType = 'hypertrophy' | 'volume' | 'strength'

/** 3 blocks of 4 weeks each */
export type Block = 1 | 2 | 3

export const TRAINING_DAYS: TrainingDayType[] = ['hypertrophy', 'volume', 'strength']
export const BLOCKS: Block[] = [1, 2, 3]
export const TOTAL_WEEKS = 12
export const DELOAD_WEEKS = [4, 8] as const
export const AMRAP_TEST_WEEK = 12

// --- Exercise Definitions ---

export type ExerciseId =
  // Day 1 (Hypertrophy) & Day 3 (Strength) compounds
  | 'squat'
  | 'bench'
  | 'barbell_row'
  | 'ohp'
  // Day 1 only
  | 'romanian_deadlift'
  | 'dumbbell_curl'
  | 'tricep_pushdown'
  | 'plank'
  // Day 2 (Volume) exercises
  | 'leg_press'
  | 'pullup'
  | 'incline_db_press'
  | 'cable_row'
  | 'bulgarian_split_squat'
  | 'lateral_raise'
  | 'leg_curl'
  | 'cable_crunch'
  // Day 3 only
  | 'deadlift'
  | 'farmers_walk'

/** Category determines how sets/reps change with periodization */
export type ExerciseCategory = 'primary' | 'secondary' | 'accessory'

export interface ExerciseDefinition {
  id: ExerciseId
  category: ExerciseCategory
  bodyPart: 'upper' | 'lower' | 'core'
  isCompound: boolean
  /** Weight increment on progression (kg) */
  increment: number
  /** If true, uses time/distance instead of reps */
  isTimeBased?: boolean
  isDistanceBased?: boolean
}

/** All exercises used in the program */
export const EXERCISES: Record<ExerciseId, ExerciseDefinition> = {
  squat:                { id: 'squat',                category: 'primary',   bodyPart: 'lower', isCompound: true,  increment: 5 },
  bench:                { id: 'bench',                category: 'primary',   bodyPart: 'upper', isCompound: true,  increment: 2.5 },
  barbell_row:          { id: 'barbell_row',          category: 'primary',   bodyPart: 'upper', isCompound: true,  increment: 2.5 },
  ohp:                  { id: 'ohp',                  category: 'secondary', bodyPart: 'upper', isCompound: true,  increment: 2.5 },
  romanian_deadlift:    { id: 'romanian_deadlift',    category: 'secondary', bodyPart: 'lower', isCompound: true,  increment: 5 },
  dumbbell_curl:        { id: 'dumbbell_curl',        category: 'accessory', bodyPart: 'upper', isCompound: false, increment: 1.25 },
  tricep_pushdown:      { id: 'tricep_pushdown',      category: 'accessory', bodyPart: 'upper', isCompound: false, increment: 2.5 },
  plank:                { id: 'plank',                category: 'accessory', bodyPart: 'core',  isCompound: false, increment: 0, isTimeBased: true },
  leg_press:            { id: 'leg_press',            category: 'primary',   bodyPart: 'lower', isCompound: true,  increment: 5 },
  pullup:               { id: 'pullup',               category: 'primary',   bodyPart: 'upper', isCompound: true,  increment: 2.5 },
  incline_db_press:     { id: 'incline_db_press',     category: 'primary',   bodyPart: 'upper', isCompound: true,  increment: 2.5 },
  cable_row:            { id: 'cable_row',            category: 'secondary', bodyPart: 'upper', isCompound: true,  increment: 2.5 },
  bulgarian_split_squat:{ id: 'bulgarian_split_squat',category: 'secondary', bodyPart: 'lower', isCompound: true,  increment: 2.5 },
  lateral_raise:        { id: 'lateral_raise',        category: 'accessory', bodyPart: 'upper', isCompound: false, increment: 1.25 },
  leg_curl:             { id: 'leg_curl',             category: 'accessory', bodyPart: 'lower', isCompound: false, increment: 2.5 },
  cable_crunch:         { id: 'cable_crunch',         category: 'accessory', bodyPart: 'core',  isCompound: false, increment: 2.5 },
  deadlift:             { id: 'deadlift',             category: 'primary',   bodyPart: 'lower', isCompound: true,  increment: 5 },
  farmers_walk:         { id: 'farmers_walk',         category: 'accessory', bodyPart: 'core',  isCompound: false, increment: 5, isDistanceBased: true },
}

/** Main compound lifts for which user enters 1RM at setup */
export const MAIN_LIFTS = ['squat', 'bench', 'ohp', 'deadlift'] as const
export type MainLift = typeof MAIN_LIFTS[number]

/** Exercises for each training day (ordered) */
export const DAY_EXERCISES: Record<TrainingDayType, ExerciseId[]> = {
  hypertrophy: ['squat', 'bench', 'barbell_row', 'ohp', 'romanian_deadlift', 'dumbbell_curl', 'tricep_pushdown', 'plank'],
  volume:      ['leg_press', 'pullup', 'incline_db_press', 'cable_row', 'bulgarian_split_squat', 'lateral_raise', 'leg_curl', 'cable_crunch'],
  strength:    ['squat', 'deadlift', 'bench', 'ohp', 'barbell_row', 'farmers_walk'],
}

// --- 1RM & Working Weights ---

export interface OneRepMaxes {
  squat: number
  bench: number
  ohp: number
  deadlift: number
}

/**
 * Working weights stored as a flat record.
 * Keys use format: exerciseId_dayType (e.g. "squat_hypertrophy", "leg_press_volume")
 */
export type WorkingWeights = Record<string, number>

/** Helper to create working weight key */
export function workingWeightKey(exerciseId: string, dayType: TrainingDayType): string {
  return `${exerciseId}_${dayType}`
}

// --- Sync Meta ---

export interface SyncMeta {
  updatedAt: string
  _dirty?: number // 1 = needs sync
}

// --- Cycle Config ---

export interface CycleConfig extends SyncMeta {
  id: string
  oneRepMaxes: OneRepMaxes
  workingWeights: WorkingWeights
  startDate: string
  createdAt: string
}

// --- Workout Prescriptions ---

export interface ExercisePrescription {
  exerciseId: ExerciseId
  sets: number
  repsMin: number
  repsMax: number
  restSeconds: number
  category: ExerciseCategory
  isAmrap?: boolean
  notes?: string // e.g. "per leg", "30-45 sec"
}

export interface DayPrescription {
  dayType: TrainingDayType
  week: number
  block: Block
  exercises: ExercisePrescription[]
  isDeload: boolean
  isAmrapTest: boolean
  effortNote: string
}

// --- Completed Sets & Workout Logs ---

export interface CompletedSet {
  targetWeight: number
  targetRepsMin: number
  targetRepsMax: number
  actualWeight: number
  actualReps: number
  rpe?: number // 6-10 RPE scale
  completed: boolean
}

export interface ExerciseLog {
  exerciseId: string
  sets: CompletedSet[]
}

export interface WorkoutLog extends SyncMeta {
  id: string
  cycleId: string
  dayType: TrainingDayType
  week: number
  block: Block
  exercises: ExerciseLog[]
  date: string
  notes: string
}

// --- AMRAP Test Results (Week 12) ---

export interface AmrapResult extends SyncMeta {
  id: string
  cycleId: string
  exerciseId: string
  weight: number
  actualReps: number
  date: string
  estimatedOneRepMax: number
}

// --- Week Info ---

export interface WeekInfo {
  weekNumber: number
  block: Block
  isDeload: boolean
  isAmrapTest: boolean
}

// --- RPE Scale ---

export const RPE_DESCRIPTIONS: Record<number, string> = {
  6: 'rpe.6',
  7: 'rpe.7',
  8: 'rpe.8',
  9: 'rpe.9',
  10: 'rpe.10',
}

// --- Workout Types (AI Trainer multi-modal planning) ---

export type WorkoutType = 'strength' | 'crossfit' | 'tabata' | 'stretching' | 'aerobic'

export type MuscleGroup = 'legs' | 'posterior' | 'push' | 'pull' | 'core' | 'full' | 'shoulders' | 'hips' | 'thoracic' | 'ankles'

export type CrossfitWodFormat = 'for_time' | 'amrap' | 'emom' | 'rounds_for_time'

export interface CrossfitWod {
  id: string
  name: string
  format: CrossfitWodFormat
  timeCap?: number
  rounds?: number
  exercises: CrossfitWodExercise[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  targetMuscles: MuscleGroup[]
  scalingNotes: string
}

export interface CrossfitWodExercise {
  name: string
  reps: number | string
  weight?: string
}

export interface StretchExercise {
  id: string
  name: string
  type: 'dynamic' | 'static' | 'mobility'
  targetMuscles: MuscleGroup[]
  holdSeconds?: number
  reps?: number
  description: string
}

export interface AerobicWorkout {
  id: string
  name: string
  equipment: 'assault_bike' | 'rowing' | 'run' | 'ski_erg' | 'jump_rope' | 'none'
  format: 'steady_state' | 'intervals' | 'pyramid' | 'emom'
  durationMinutes: number
  intensity: 'low' | 'moderate' | 'high'
  description: string
  phases: AerobicPhase[]
}

export interface AerobicPhase {
  type: 'work' | 'rest' | 'warmup' | 'cooldown'
  durationSeconds: number
  intensity: string
  repeats?: number
}

// --- Tabata Conditioning (standalone, not tied to cycle) ---

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
  rounds: number
  workSeconds: number
  restSeconds: number
}

export interface TabataWorkoutPrescription {
  blocks: TabataBlock[]
  totalMinutes: number
  intensityNote: string
}

export interface TabataLog extends SyncMeta {
  id: string
  cycleId?: string
  blocks: TabataCompletedBlock[]
  date: string
  rpe: number
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
