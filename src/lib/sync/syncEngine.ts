import { db } from '../db'
import { getSupabase } from './supabaseClient'
import {
  cycleToRemote, cycleFromRemote,
  workoutLogToRemote, workoutLogFromRemote,
  amrapResultToRemote, amrapResultFromRemote,
  tabataLogToRemote, tabataLogFromRemote,
} from './syncHelpers'
import type { CycleConfig, WorkoutLog, AmrapResult, TabataLog } from '../../types'

export interface SyncResult {
  pushed: number
  pulled: number
  errors: string[]
}

type SnakeCaseRecord = Record<string, unknown>
type ToRemoteFn<T> = (item: T, userId: string) => SnakeCaseRecord
type FromRemoteFn<T> = (row: SnakeCaseRecord) => Omit<T, '_dirty'>

async function pushTable<T extends { id: string; _dirty?: number }>(
  tableName: string,
  remoteTableName: string,
  toRemote: ToRemoteFn<T>,
  userId: string,
): Promise<{ pushed: number; errors: string[] }> {
  const supabase = getSupabase()!
  const dexieTable = db.table(tableName)
  const dirtyRecords: T[] = await dexieTable.where('_dirty').equals(1).toArray()
  if (dirtyRecords.length === 0) return { pushed: 0, errors: [] }

  const errors: string[] = []
  let pushed = 0

  const chunkSize = 50
  for (let i = 0; i < dirtyRecords.length; i += chunkSize) {
    const chunk = dirtyRecords.slice(i, i + chunkSize)
    const remoteRows = chunk.map((r) => toRemote(r, userId))

    const { error } = await supabase
      .from(remoteTableName)
      .upsert(remoteRows, { onConflict: 'id,user_id' })

    if (error) {
      errors.push(`Push ${remoteTableName}: ${error.message}`)
    } else {
      const ids = chunk.map((r) => r.id)
      await dexieTable.where('id').anyOf(ids).modify({ _dirty: 0 })
      pushed += chunk.length
    }
  }

  return { pushed, errors }
}

async function pullTable<T extends { id: string; updatedAt: string; _dirty?: number }>(
  tableName: string,
  remoteTableName: string,
  fromRemote: FromRemoteFn<T>,
  userId: string,
  since: string | null,
): Promise<{ pulled: number; errors: string[] }> {
  const supabase = getSupabase()!
  const dexieTable = db.table(tableName)

  let query = supabase
    .from(remoteTableName)
    .select('*')
    .eq('user_id', userId)

  if (since) {
    query = query.gt('updated_at', since)
  }

  const { data, error } = await query

  if (error) {
    return { pulled: 0, errors: [`Pull ${remoteTableName}: ${error.message}`] }
  }

  if (!data || data.length === 0) return { pulled: 0, errors: [] }

  let pulled = 0

  for (const row of data) {
    const remoteRecord = fromRemote(row as SnakeCaseRecord) as T & { updatedAt: string }
    const remoteUpdatedAt = remoteRecord.updatedAt

    // Handle soft deletes
    if ((row as SnakeCaseRecord).deleted_at) {
      const existing = await dexieTable.get(remoteRecord.id)
      if (existing) {
        await dexieTable.delete(remoteRecord.id)
        pulled++
      }
      continue
    }

    const localRecord = await dexieTable.get(remoteRecord.id) as T | undefined

    if (!localRecord) {
      await dexieTable.add({ ...remoteRecord, _dirty: 0 })
      pulled++
    } else {
      const localUpdatedAt = (localRecord as T & { updatedAt: string }).updatedAt
      const localDirty = localRecord._dirty

      if (!localDirty || remoteUpdatedAt > localUpdatedAt) {
        await dexieTable.update(remoteRecord.id, { ...remoteRecord, _dirty: 0 })
        pulled++
      }
    }
  }

  return { pulled, errors: [] }
}

interface TableDef<T> {
  dexie: string
  remote: string
  toRemote: ToRemoteFn<T>
  fromRemote: FromRemoteFn<T>
}

const tables: TableDef<CycleConfig | WorkoutLog | AmrapResult | TabataLog>[] = [
  { dexie: 'cycles', remote: 'cycles', toRemote: cycleToRemote as ToRemoteFn<CycleConfig | WorkoutLog | AmrapResult | TabataLog>, fromRemote: cycleFromRemote as FromRemoteFn<CycleConfig | WorkoutLog | AmrapResult | TabataLog> },
  { dexie: 'workoutLogs', remote: 'workout_logs', toRemote: workoutLogToRemote as ToRemoteFn<CycleConfig | WorkoutLog | AmrapResult | TabataLog>, fromRemote: workoutLogFromRemote as FromRemoteFn<CycleConfig | WorkoutLog | AmrapResult | TabataLog> },
  { dexie: 'amrapResults', remote: 'amrap_results', toRemote: amrapResultToRemote as ToRemoteFn<CycleConfig | WorkoutLog | AmrapResult | TabataLog>, fromRemote: amrapResultFromRemote as FromRemoteFn<CycleConfig | WorkoutLog | AmrapResult | TabataLog> },
  { dexie: 'tabataLogs', remote: 'tabata_logs', toRemote: tabataLogToRemote as ToRemoteFn<CycleConfig | WorkoutLog | AmrapResult | TabataLog>, fromRemote: tabataLogFromRemote as FromRemoteFn<CycleConfig | WorkoutLog | AmrapResult | TabataLog> },
]

export async function sync(lastSyncAt: string | null): Promise<SyncResult> {
  const supabase = getSupabase()
  if (!supabase) {
    return { pushed: 0, pulled: 0, errors: ['Supabase not configured'] }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { pushed: 0, pulled: 0, errors: ['Not authenticated'] }
  }

  const result: SyncResult = { pushed: 0, pulled: 0, errors: [] }

  for (const t of tables) {
    const pushResult = await pushTable(t.dexie, t.remote, t.toRemote, user.id)
    result.pushed += pushResult.pushed
    result.errors.push(...pushResult.errors)
  }

  for (const t of tables) {
    const pullResult = await pullTable(t.dexie, t.remote, t.fromRemote, user.id, lastSyncAt)
    result.pulled += pullResult.pulled
    result.errors.push(...pullResult.errors)
  }

  return result
}
