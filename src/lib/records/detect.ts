import type { PersonalRecord, WorkoutLog, RowingSession } from '../../types'
import { estimateOneRepMax } from '../program'
import { parseSplit } from '../rowing'
import { db } from '../db'

/**
 * Detect and persist new PRs from a completed workout.
 * Returns the list of newly-set PRs (or upgraded ones).
 */
export async function detectPrsFromWorkout(
  workout: WorkoutLog,
): Promise<PersonalRecord[]> {
  const existing = await db.personalRecords.toArray()
  const byExercise = new Map<string, PersonalRecord>()
  for (const pr of existing) byExercise.set(pr.exerciseId, pr)

  const newOrUpdated: PersonalRecord[] = []

  for (const ex of workout.exercises) {
    for (const s of ex.sets) {
      if (!s.completed) continue
      if (s.actualWeightKg == null || s.actualReps == null) continue
      const est = estimateOneRepMax(s.actualWeightKg, s.actualReps)
      const current = byExercise.get(ex.exerciseId)
      const beat =
        !current ||
        (current.estOneRepMax ?? 0) < est ||
        (current.weightKg ?? 0) < s.actualWeightKg
      if (beat) {
        const record: PersonalRecord = {
          id: current?.id ?? crypto.randomUUID(),
          exerciseId: ex.exerciseId,
          weightKg: s.actualWeightKg,
          reps: s.actualReps,
          estOneRepMax: Math.round(est * 10) / 10,
          date: workout.date,
          updatedAt: new Date().toISOString(),
        }
        await db.personalRecords.put(record)
        byExercise.set(ex.exerciseId, record)
        newOrUpdated.push(record)
      }
    }
  }

  return newOrUpdated
}

/** Detect rowing PRs (best split & avg power) for a given protocol. */
export async function detectRowingPr(
  session: RowingSession,
): Promise<PersonalRecord | null> {
  const existing = await db.personalRecords
    .where('exerciseId')
    .equals(`rowing_${session.protocolId}`)
    .first()

  const sessionSec = parseSplit(session.avgSplit)
  const currentSec = existing?.bestSplit ? parseSplit(existing.bestSplit) : null
  const beatSplit =
    sessionSec != null && (currentSec == null || sessionSec < currentSec)
  const beatPower =
    !existing || (existing.bestAvgPower ?? 0) < session.avgPower
  const beatMax =
    !existing || (existing.bestMaxPower ?? 0) < session.maxPower

  if (!beatSplit && !beatPower && !beatMax) return null

  const record: PersonalRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    exerciseId: `rowing_${session.protocolId}`,
    protocolId: session.protocolId,
    bestSplit: beatSplit ? session.avgSplit : existing?.bestSplit,
    bestAvgPower: beatPower ? session.avgPower : existing?.bestAvgPower,
    bestMaxPower: beatMax ? session.maxPower : existing?.bestMaxPower,
    date: session.date,
    updatedAt: new Date().toISOString(),
  }
  await db.personalRecords.put(record)
  return record
}
