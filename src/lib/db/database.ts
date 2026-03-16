import Dexie, { type EntityTable } from 'dexie'
import type { CycleConfig, WorkoutLog, AmrapResult } from '../../types'

export class JaggerDatabase extends Dexie {
  cycles!: EntityTable<CycleConfig, 'id'>
  workoutLogs!: EntityTable<WorkoutLog, 'id'>
  amrapResults!: EntityTable<AmrapResult, 'id'>

  constructor() {
    super('JaggerAI')
    this.version(1).stores({
      cycles: 'id, createdAt',
      workoutLogs: 'id, cycleId, [cycleId+lift+wave+phase], date',
      amrapResults: 'id, cycleId, [cycleId+lift+wave], date',
    })
  }
}

export const db = new JaggerDatabase()
