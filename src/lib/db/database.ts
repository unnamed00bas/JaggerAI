import Dexie, { type EntityTable } from 'dexie'
import type { CycleConfig, WorkoutLog, AmrapResult, TabataLog } from '../../types'

export class JaggerDatabase extends Dexie {
  cycles!: EntityTable<CycleConfig, 'id'>
  workoutLogs!: EntityTable<WorkoutLog, 'id'>
  amrapResults!: EntityTable<AmrapResult, 'id'>
  tabataLogs!: EntityTable<TabataLog, 'id'>

  constructor() {
    super('JaggerAI')

    // v5: Removed sync-related _dirty index, local-only storage
    this.version(5).stores({
      cycles: 'id, createdAt, updatedAt',
      workoutLogs: 'id, cycleId, [cycleId+dayType+week], date, updatedAt',
      amrapResults: 'id, cycleId, [cycleId+exerciseId], date, updatedAt',
      tabataLogs: 'id, date, updatedAt',
    })
  }
}

export const db = new JaggerDatabase()

/**
 * Try to open the database. If it fails (e.g. corrupted data, schema mismatch),
 * delete the database and create a fresh one.
 */
export async function initDatabase(): Promise<void> {
  try {
    await db.open()
  } catch {
    console.warn('Database failed to open, resetting to fresh state...')
    await Dexie.delete('JaggerAI')
    await db.open()
  }
}
