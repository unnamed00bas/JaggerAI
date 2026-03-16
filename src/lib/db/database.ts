import Dexie, { type EntityTable } from 'dexie'
import type { CycleConfig, WorkoutLog, AmrapResult, TabataLog } from '../../types'

export class JaggerDatabase extends Dexie {
  cycles!: EntityTable<CycleConfig, 'id'>
  workoutLogs!: EntityTable<WorkoutLog, 'id'>
  amrapResults!: EntityTable<AmrapResult, 'id'>
  tabataLogs!: EntityTable<TabataLog, 'id'>

  constructor() {
    super('JaggerAI')
    this.version(1).stores({
      cycles: 'id, createdAt',
      workoutLogs: 'id, cycleId, [cycleId+lift+wave+phase], date',
      amrapResults: 'id, cycleId, [cycleId+lift+wave], date',
    })
    this.version(2).stores({
      cycles: 'id, createdAt',
      workoutLogs: 'id, cycleId, [cycleId+lift+wave+phase], date',
      amrapResults: 'id, cycleId, [cycleId+lift+wave], date',
      tabataLogs: 'id, cycleId, [cycleId+wave+phase], date',
    })
  }
}

export const db = new JaggerDatabase()
