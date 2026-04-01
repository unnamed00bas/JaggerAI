import type { CycleConfig, WorkoutLog, AmrapResult, TabataLog } from '../../types'

type SnakeCaseRecord = Record<string, unknown>

export function cycleToRemote(cycle: CycleConfig, userId: string): SnakeCaseRecord {
  return {
    id: cycle.id,
    user_id: userId,
    one_rep_maxes: cycle.oneRepMaxes,
    working_weights: cycle.workingWeights,
    start_date: cycle.startDate,
    created_at: cycle.createdAt,
    updated_at: cycle.updatedAt,
  }
}

export function cycleFromRemote(row: SnakeCaseRecord): Omit<CycleConfig, '_dirty'> {
  return {
    id: row.id as string,
    oneRepMaxes: row.one_rep_maxes as CycleConfig['oneRepMaxes'],
    workingWeights: row.working_weights as CycleConfig['workingWeights'],
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
    day_type: log.dayType,
    week: log.week,
    block: log.block,
    exercises: log.exercises,
    date: log.date,
    notes: log.notes,
    updated_at: log.updatedAt,
  }
}

export function workoutLogFromRemote(row: SnakeCaseRecord): Omit<WorkoutLog, '_dirty'> {
  return {
    id: row.id as string,
    cycleId: row.cycle_id as string,
    dayType: row.day_type as WorkoutLog['dayType'],
    week: row.week as number,
    block: row.block as WorkoutLog['block'],
    exercises: row.exercises as WorkoutLog['exercises'],
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
    exercise_id: result.exerciseId,
    weight: result.weight,
    actual_reps: result.actualReps,
    date: result.date,
    estimated_one_rep_max: result.estimatedOneRepMax,
    updated_at: result.updatedAt,
  }
}

export function amrapResultFromRemote(row: SnakeCaseRecord): Omit<AmrapResult, '_dirty'> {
  return {
    id: row.id as string,
    cycleId: row.cycle_id as string,
    exerciseId: row.exercise_id as string,
    weight: row.weight as number,
    actualReps: row.actual_reps as number,
    date: row.date as string,
    estimatedOneRepMax: row.estimated_one_rep_max as number,
    updatedAt: row.updated_at as string,
  }
}

export function tabataLogToRemote(log: TabataLog, userId: string): SnakeCaseRecord {
  return {
    id: log.id,
    user_id: userId,
    cycle_id: log.cycleId ?? null,
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
    cycleId: row.cycle_id as string | undefined,
    blocks: row.blocks as TabataLog['blocks'],
    date: row.date as string,
    rpe: row.rpe as number,
    notes: row.notes as string,
    updatedAt: row.updated_at as string,
  }
}
