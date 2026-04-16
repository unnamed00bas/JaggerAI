// ─────────────────────────────────────────────────────────────
// 16-Week Personal Strength + Rowing Program
// 4 phases × 4 weeks, 4 training days/week (A/B/C/D)
// ─────────────────────────────────────────────────────────────

// --- Program structure -------------------------------------------------

/** Day codes — ordering A→B→C is mandatory; D is recovery placed elsewhere */
export type DayType = 'A' | 'B' | 'C' | 'D'

export const DAY_TYPES: DayType[] = ['A', 'B', 'C', 'D']

/** Training phase across the macrocycle. 5 = deload (week 16 only). */
export type Phase = 1 | 2 | 3 | 4 | 'deload'

export const TOTAL_WEEKS = 16
export const DELOAD_WEEK = 16

// --- Progression rules ------------------------------------------------

export type ProgressionRule =
  | 'add_weight'           // +2.5 kg when cleared
  | 'add_weight_slow'      // +2.5 kg only every few sessions
  | 'reduce_assist'        // lower assist on gravitron
  | 'add_weight_or_reps'   // bodyweight → add reps, then +5 kg
  | 'add_time'             // isometric progressions (plank)
  | 'none'

export type TrackingField =
  | 'sets'
  | 'reps'
  | 'weight_kg'
  | 'weight_kg_per_hand'
  | 'assist_weight_kg'
  | 'added_weight_kg'
  | 'duration_sec'
  | 'perceived_effort'

/** Phase-specific prescription for a strength exercise */
export interface PhasePrescription {
  sets: number
  /** Either reps or duration_sec is present */
  reps?: number
  duration_sec?: number
  weight_kg?: number
  assist_kg?: number
  added_weight_kg?: number
  /** Multiplier applied to last working weight on deload (e.g. 0.6) */
  weight_modifier?: number
  note?: string
}

export type PhaseMap = Partial<Record<Phase | 'all', PhasePrescription>>

/** Catalog definition of a strength exercise */
export interface ExerciseDef {
  id: string
  /** i18n key for the human name — defaults to `exercise.<id>.name` */
  nameKey?: string
  /** Display name fallback if no translation loaded */
  name: string
  muscles: string[]
  equipment: string
  tracking: TrackingField[]
  progressionRule: ProgressionRule
  restSec?: number
  note?: string
  /** How the exercise is prescribed in each phase */
  phases: PhaseMap
  technique: {
    steps: string[]
    errors: string[]
  }
}

// --- Day catalog ------------------------------------------------------

export interface DayCatalog {
  dayType: DayType
  /** Exercises in canonical order */
  exerciseIds: string[]
  /** Rowing protocol ids applicable to this day (chosen by phase) */
  rowingProtocolIds: string[]
}

// --- Rowing (Technogym) -----------------------------------------------

export type RowingProtocolType =
  | 'neuromuscular'
  | 'aerobic'
  | 'intensive'
  | 'intensive_plus'
  | 'test'
  | 'recovery'

export interface RowingProtocol {
  id: string
  nameKey: string
  type: RowingProtocolType
  /** Day codes where this protocol is used */
  days: DayType[]
  /** Phases (1-4) where this protocol is active */
  activePhases: (1 | 2 | 3 | 4)[]
  /** Short human format e.g. "5 × 15 rows / 1:00r" */
  format: string
  /** Target split range per phase (mm:ss per 500 m) */
  targetSplitByPhase?: Partial<Record<1 | 2 | 3 | 4, string>>
  /** Target SPM range per phase */
  targetSpmByPhase?: Partial<Record<1 | 2 | 3 | 4, string>>
}

/** Rowing split entry (per 500m) */
export interface RowingSplit {
  splitNum: number
  distanceM: number
  /** mm:ss string */
  splitTime: string
  spm: number
}

export interface RowingSession {
  id: string
  workoutId: string
  protocolId: string
  durationSec: number
  distanceM: number
  /** Average split mm:ss per 500m */
  avgSplit: string
  avgPower: number
  maxPower: number
  avgSpm: number
  level: number
  calories: number
  splits: RowingSplit[]
  screenshotDataUrl?: string
  note?: string
  date: string
  updatedAt: string
}

// --- Workouts & sets --------------------------------------------------

export interface CompletedSet {
  setNum: number
  targetReps?: number
  targetDurationSec?: number
  targetWeightKg?: number
  actualReps?: number
  actualDurationSec?: number
  actualWeightKg?: number
  /** Used for gravitron (assist) and weighted dips (added) */
  assistWeightKg?: number
  addedWeightKg?: number
  completed: boolean
  note?: string
}

export interface ExerciseLog {
  exerciseId: string
  sets: CompletedSet[]
}

export interface WorkoutLog {
  id: string
  /** User profile id / cycle id */
  cycleId: string
  dayType: DayType
  phase: Phase
  week: number
  date: string
  durationMin: number
  exercises: ExerciseLog[]
  /** Reference to rowing session id (if any) */
  rowingSessionId?: string
  stretching: StretchingLog[]
  cardio?: CardioLog
  notes: string
  completed: boolean
  updatedAt: string
}

export interface StretchingLog {
  stretchId: string
  setsCompleted: number
  skipped: boolean
}

export interface CardioLog {
  equipment: string
  durationMin: number
  perceivedEffort?: number
  note?: string
}

// --- Stretching catalog (Day D) --------------------------------------

export interface StretchExercise {
  id: string
  name: string
  nameKey?: string
  durationSec: number
  sets: number
  sides?: boolean
  target: string
}

// --- User profile & cycle --------------------------------------------

export interface UserProfile {
  name: string
  age: number
  heightCm: number
  weightKg: number
  experience: string
  goal: string
  sessionsPerWeek: number
  sessionDurationMin: number
  equipment: string
  reminderHourLocal?: number // 0-23
}

export interface CycleState {
  id: string
  /** ISO date when week 1, day A started (or was planned to start) */
  startDate: string
  /** Current week number (1-16). After 16, auto-advances to cycle 2 */
  currentWeek: number
  /** Number of completed cycles of 16 weeks */
  completedCycles: number
  /** Working weights overridden by the user per exercise id */
  workingWeightsKg: Record<string, number>
  /** Bodyweight assist for gravitron per phase (optional overrides) */
  gravitronAssistKg: Record<string, number>
  /** Dips added weight per phase (optional overrides) */
  dipsAddedKg: Record<string, number>
  updatedAt: string
}

// --- Personal records --------------------------------------------------

export interface PersonalRecord {
  id: string
  exerciseId: string
  /** Best weight × reps pair (strength) */
  weightKg?: number
  reps?: number
  /** 1RM estimate via Brzycki for strength lifts */
  estOneRepMax?: number
  /** Best time for fixed distance (rowing) */
  bestSplit?: string
  bestAvgPower?: number
  bestMaxPower?: number
  /** Reference protocol for rowing PR */
  protocolId?: string
  date: string
  updatedAt: string
}

// --- Analytics helpers ------------------------------------------------

export interface WeekSnapshot {
  week: number
  phase: Phase
  completedDays: number
  totalDays: number
  totalTonnageKg: number
}
