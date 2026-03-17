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
    this.version(3).stores({
      cycles: 'id, createdAt, updatedAt, _dirty',
      workoutLogs: 'id, cycleId, [cycleId+lift+wave+phase], date, updatedAt, _dirty',
      amrapResults: 'id, cycleId, [cycleId+lift+wave], date, updatedAt, _dirty',
      tabataLogs: 'id, cycleId, [cycleId+wave+phase], date, updatedAt, _dirty',
    }).upgrade(tx => {
      const now = new Date().toISOString()
      const addSyncMeta = (table: string) =>
        tx.table(table).toCollection().modify(record => {
          if (!record.updatedAt) record.updatedAt = record.createdAt || record.date || now
          if (record._dirty === undefined) record._dirty = 1
        })
      return Promise.all([
        addSyncMeta('cycles'),
        addSyncMeta('workoutLogs'),
        addSyncMeta('amrapResults'),
        addSyncMeta('tabataLogs'),
      ])
    })
  }
}

export const db = new JaggerDatabase()
