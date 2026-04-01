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
  // --- Alternatives ---
  | 'front_squat'
  | 'hack_squat'
  | 'dumbbell_bench'
  | 'machine_chest_press'
  | 'dumbbell_row'
  | 't_bar_row'
  | 'dumbbell_ohp'
  | 'stiff_leg_deadlift'
  | 'barbell_curl'
  | 'hammer_curl'
  | 'overhead_tricep_ext'
  | 'dips'
  | 'ab_wheel'
  | 'hanging_leg_raise'
  | 'lat_pulldown'
  | 'incline_barbell_press'
  | 'lunges'
  | 'step_ups'
  | 'cable_lateral_raise'
  | 'nordic_curl'
  | 'sumo_deadlift'
  | 'trap_bar_deadlift'
  | 'kettlebell_swing'

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
  // --- Alternatives ---
  front_squat:          { id: 'front_squat',          category: 'primary',   bodyPart: 'lower', isCompound: true,  increment: 5 },
  hack_squat:           { id: 'hack_squat',           category: 'primary',   bodyPart: 'lower', isCompound: true,  increment: 5 },
  dumbbell_bench:       { id: 'dumbbell_bench',       category: 'primary',   bodyPart: 'upper', isCompound: true,  increment: 2.5 },
  machine_chest_press:  { id: 'machine_chest_press',  category: 'primary',   bodyPart: 'upper', isCompound: true,  increment: 2.5 },
  dumbbell_row:         { id: 'dumbbell_row',         category: 'primary',   bodyPart: 'upper', isCompound: true,  increment: 2.5 },
  t_bar_row:            { id: 't_bar_row',            category: 'primary',   bodyPart: 'upper', isCompound: true,  increment: 2.5 },
  dumbbell_ohp:         { id: 'dumbbell_ohp',         category: 'secondary', bodyPart: 'upper', isCompound: true,  increment: 2.5 },
  stiff_leg_deadlift:   { id: 'stiff_leg_deadlift',   category: 'secondary', bodyPart: 'lower', isCompound: true,  increment: 5 },
  barbell_curl:         { id: 'barbell_curl',         category: 'accessory', bodyPart: 'upper', isCompound: false, increment: 1.25 },
  hammer_curl:          { id: 'hammer_curl',          category: 'accessory', bodyPart: 'upper', isCompound: false, increment: 1.25 },
  overhead_tricep_ext:  { id: 'overhead_tricep_ext',  category: 'accessory', bodyPart: 'upper', isCompound: false, increment: 2.5 },
  dips:                 { id: 'dips',                 category: 'accessory', bodyPart: 'upper', isCompound: true,  increment: 2.5 },
  ab_wheel:             { id: 'ab_wheel',             category: 'accessory', bodyPart: 'core',  isCompound: false, increment: 0 },
  hanging_leg_raise:    { id: 'hanging_leg_raise',    category: 'accessory', bodyPart: 'core',  isCompound: false, increment: 0 },
  lat_pulldown:         { id: 'lat_pulldown',         category: 'primary',   bodyPart: 'upper', isCompound: true,  increment: 2.5 },
  incline_barbell_press:{ id: 'incline_barbell_press',category: 'primary',   bodyPart: 'upper', isCompound: true,  increment: 2.5 },
  lunges:               { id: 'lunges',               category: 'secondary', bodyPart: 'lower', isCompound: true,  increment: 2.5 },
  step_ups:             { id: 'step_ups',             category: 'secondary', bodyPart: 'lower', isCompound: true,  increment: 2.5 },
  cable_lateral_raise:  { id: 'cable_lateral_raise',  category: 'accessory', bodyPart: 'upper', isCompound: false, increment: 1.25 },
  nordic_curl:          { id: 'nordic_curl',          category: 'accessory', bodyPart: 'lower', isCompound: false, increment: 0 },
  sumo_deadlift:        { id: 'sumo_deadlift',        category: 'primary',   bodyPart: 'lower', isCompound: true,  increment: 5 },
  trap_bar_deadlift:    { id: 'trap_bar_deadlift',    category: 'primary',   bodyPart: 'lower', isCompound: true,  increment: 5 },
  kettlebell_swing:     { id: 'kettlebell_swing',     category: 'accessory', bodyPart: 'core',  isCompound: true,  increment: 5 },
}

/** Main compound lifts for which user enters 1RM at setup */
export const MAIN_LIFTS = ['squat', 'bench', 'ohp', 'deadlift'] as const
export type MainLift = typeof MAIN_LIFTS[number]

/** Default exercises for each training day (ordered) */
export const DAY_EXERCISES: Record<TrainingDayType, ExerciseId[]> = {
  hypertrophy: ['squat', 'bench', 'barbell_row', 'ohp', 'romanian_deadlift', 'dumbbell_curl', 'tricep_pushdown', 'plank'],
  volume:      ['leg_press', 'pullup', 'incline_db_press', 'cable_row', 'bulgarian_split_squat', 'lateral_raise', 'leg_curl', 'cable_crunch'],
  strength:    ['squat', 'deadlift', 'bench', 'ohp', 'barbell_row', 'farmers_walk'],
}

/**
 * Exercise alternatives per slot.
 * Key = "dayType_slotIndex" (e.g. "hypertrophy_0" = first exercise in hypertrophy day).
 * Each array starts with the default exercise.
 */
export const EXERCISE_SLOT_ALTERNATIVES: Record<string, ExerciseId[]> = {
  // --- Hypertrophy day ---
  hypertrophy_0: ['squat', 'front_squat', 'hack_squat'],
  hypertrophy_1: ['bench', 'dumbbell_bench', 'machine_chest_press'],
  hypertrophy_2: ['barbell_row', 'dumbbell_row', 't_bar_row'],
  hypertrophy_3: ['ohp', 'dumbbell_ohp'],
  hypertrophy_4: ['romanian_deadlift', 'stiff_leg_deadlift'],
  hypertrophy_5: ['dumbbell_curl', 'barbell_curl', 'hammer_curl'],
  hypertrophy_6: ['tricep_pushdown', 'overhead_tricep_ext', 'dips'],
  hypertrophy_7: ['plank', 'ab_wheel', 'hanging_leg_raise'],
  // --- Volume day ---
  volume_0: ['leg_press', 'hack_squat'],
  volume_1: ['pullup', 'lat_pulldown'],
  volume_2: ['incline_db_press', 'incline_barbell_press'],
  volume_3: ['cable_row', 'dumbbell_row', 't_bar_row'],
  volume_4: ['bulgarian_split_squat', 'lunges', 'step_ups'],
  volume_5: ['lateral_raise', 'cable_lateral_raise'],
  volume_6: ['leg_curl', 'nordic_curl'],
  volume_7: ['cable_crunch', 'ab_wheel', 'hanging_leg_raise'],
  // --- Strength day ---
  strength_0: ['squat', 'front_squat', 'hack_squat'],
  strength_1: ['deadlift', 'sumo_deadlift', 'trap_bar_deadlift'],
  strength_2: ['bench', 'dumbbell_bench'],
  strength_3: ['ohp', 'dumbbell_ohp'],
  strength_4: ['barbell_row', 'dumbbell_row', 't_bar_row'],
  strength_5: ['farmers_walk', 'kettlebell_swing'],
}

/** Helper to get slot key */
export function exerciseSlotKey(dayType: TrainingDayType, slotIndex: number): string {
  return `${dayType}_${slotIndex}`
}

/** User's exercise selections: slotKey -> chosen exerciseId */
export type ExerciseSelections = Record<string, ExerciseId>

/**
 * Resolve the actual exercise list for a day, applying user selections.
 */
export function getSelectedExercises(
  dayType: TrainingDayType,
  selections: ExerciseSelections,
): ExerciseId[] {
  return DAY_EXERCISES[dayType].map((defaultExercise, idx) => {
    const slotKey = exerciseSlotKey(dayType, idx)
    return selections[slotKey] ?? defaultExercise
  })
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

// --- Cycle Config ---

export interface CycleConfig {
  id: string
  oneRepMaxes: OneRepMaxes
  workingWeights: WorkingWeights
  startDate: string
  createdAt: string
  updatedAt: string
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

export interface WorkoutLog {
  id: string
  cycleId: string
  dayType: TrainingDayType
  week: number
  block: Block
  exercises: ExerciseLog[]
  date: string
  notes: string
  updatedAt: string
}

// --- AMRAP Test Results (Week 12) ---

export interface AmrapResult {
  id: string
  cycleId: string
  exerciseId: string
  weight: number
  actualReps: number
  date: string
  estimatedOneRepMax: number
  updatedAt: string
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

export interface TabataLog {
  id: string
  cycleId?: string
  blocks: TabataCompletedBlock[]
  date: string
  rpe: number
  notes: string
  updatedAt: string
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
