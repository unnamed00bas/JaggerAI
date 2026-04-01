import Dexie, { type EntityTable } from 'dexie'
import type { CycleConfig, WorkoutLog, AmrapResult, TabataLog } from '../../types'

export class JaggerDatabase extends Dexie {
  cycles!: EntityTable<CycleConfig, 'id'>
  workoutLogs!: EntityTable<WorkoutLog, 'id'>
  amrapResults!: EntityTable<AmrapResult, 'id'>
  tabataLogs!: EntityTable<TabataLog, 'id'>

  constructor() {
    super('JaggerAI')

    // v4: New schema for 3-day undulating periodization program
    // Breaking change from JM 2.0 schema — old data is not compatible
    this.version(4).stores({
      cycles: 'id, createdAt, updatedAt, _dirty',
      workoutLogs: 'id, cycleId, [cycleId+dayType+week], date, updatedAt, _dirty',
      amrapResults: 'id, cycleId, [cycleId+exerciseId], date, updatedAt, _dirty',
      tabataLogs: 'id, date, updatedAt, _dirty',
    })
  }
}

export const db = new JaggerDatabase()
