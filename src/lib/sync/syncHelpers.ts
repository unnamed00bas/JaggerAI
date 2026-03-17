import type { CycleConfig, WorkoutLog, AmrapResult, TabataLog } from '../../types'

// camelCase → snake_case mapping for Supabase tables

type SnakeCaseRecord = Record<string, unknown>

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

export function toSnakeCase(obj: Record<string, unknown>): SnakeCaseRecord {
  const result: SnakeCaseRecord = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key === '_dirty') continue // don't send _dirty to remote
    result[camelToSnake(key)] = value
  }
  return result
}

export function toCamelCase(obj: SnakeCaseRecord): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamel(key)] = value
  }
  return result
}

export function cycleToRemote(cycle: CycleConfig, userId: string): SnakeCaseRecord {
  return {
    id: cycle.id,
    user_id: userId,
    variant: cycle.variant,
    training_maxes: cycle.trainingMaxes,
    start_date: cycle.startDate,
    created_at: cycle.createdAt,
    updated_at: cycle.updatedAt,
  }
}

export function cycleFromRemote(row: SnakeCaseRecord): Omit<CycleConfig, '_dirty'> {
  return {
    id: row.id as string,
    variant: row.variant as CycleConfig['variant'],
    trainingMaxes: row.training_maxes as CycleConfig['trainingMaxes'],
    startDate: row.start_date as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function workoutLogToRemote(log: WorkoutLog, userId: string): SnakeCaseRecord {
  return {
    id: log.id,
    user_id: userId,
    cycle_id: log.cycleId,
    lift: log.lift,
    wave: log.wave,
    phase: log.phase,
    week: log.week,
    sets: log.sets,
    date: log.date,
    notes: log.notes,
    updated_at: log.updatedAt,
  }
}

export function workoutLogFromRemote(row: SnakeCaseRecord): Omit<WorkoutLog, '_dirty'> {
  return {
    id: row.id as string,
    cycleId: row.cycle_id as string,
    lift: row.lift as WorkoutLog['lift'],
    wave: row.wave as WorkoutLog['wave'],
    phase: row.phase as WorkoutLog['phase'],
    week: row.week as number,
    sets: row.sets as WorkoutLog['sets'],
    date: row.date as string,
    notes: row.notes as string,
    updatedAt: row.updated_at as string,
  }
}

export function amrapResultToRemote(result: AmrapResult, userId: string): SnakeCaseRecord {
  return {
    id: result.id,
    user_id: userId,
    cycle_id: result.cycleId,
    lift: result.lift,
    wave: result.wave,
    weight: result.weight,
    target_reps: result.targetReps,
    actual_reps: result.actualReps,
    date: result.date,
    estimated_one_rep_max: result.estimatedOneRepMax,
    new_training_max: result.newTrainingMax,
    updated_at: result.updatedAt,
  }
}

export function amrapResultFromRemote(row: SnakeCaseRecord): Omit<AmrapResult, '_dirty'> {
  return {
    id: row.id as string,
    cycleId: row.cycle_id as string,
    lift: row.lift as AmrapResult['lift'],
    wave: row.wave as AmrapResult['wave'],
    weight: row.weight as number,
    targetReps: row.target_reps as number,
    actualReps: row.actual_reps as number,
    date: row.date as string,
    estimatedOneRepMax: row.estimated_one_rep_max as number,
    newTrainingMax: row.new_training_max as number,
    updatedAt: row.updated_at as string,
  }
}

export function tabataLogToRemote(log: TabataLog, userId: string): SnakeCaseRecord {
  return {
    id: log.id,
    user_id: userId,
    cycle_id: log.cycleId,
    wave: log.wave,
    phase: log.phase,
    week: log.week,
    blocks: log.blocks,
    date: log.date,
    rpe: log.rpe,
    notes: log.notes,
    updated_at: log.updatedAt,
  }
}

export function tabataLogFromRemote(row: SnakeCaseRecord): Omit<TabataLog, '_dirty'> {
  return {
    id: row.id as string,
    cycleId: row.cycle_id as string,
    wave: row.wave as TabataLog['wave'],
    phase: row.phase as TabataLog['phase'],
    week: row.week as number,
    blocks: row.blocks as TabataLog['blocks'],
    date: row.date as string,
    rpe: row.rpe as number,
    notes: row.notes as string,
    updatedAt: row.updated_at as string,
  }
}
