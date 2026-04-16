import Dexie, { type EntityTable } from 'dexie'
import type {
  WorkoutLog,
  RowingSession,
  PersonalRecord,
} from '../../types'

export class RowFitDatabase extends Dexie {
  workouts!: EntityTable<WorkoutLog, 'id'>
  rowingSessions!: EntityTable<RowingSession, 'id'>
  personalRecords!: EntityTable<PersonalRecord, 'id'>

  constructor() {
    super('RowFitDB')

    this.version(1).stores({
      workouts: 'id, cycleId, dayType, phase, week, date, completed, updatedAt',
      rowingSessions: 'id, workoutId, protocolId, date, updatedAt',
      personalRecords: 'id, exerciseId, date, updatedAt',
    })
  }
}

export const db = new RowFitDatabase()

/**
 * Open DB. If it fails, reset and recreate. Local-only data.
 */
export async function initDatabase(): Promise<void> {
  try {
    await db.open()
  } catch {
    console.warn('Database failed to open, resetting to fresh state...')
    await Dexie.delete('RowFitDB')
    await db.open()
  }
}
