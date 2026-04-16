import type { WorkoutLog, DayType } from '../../types'
import { DAY_ORDER } from './phase'

/**
 * Figure out which day (A/B/C/D) the user should do next based on what
 * they've completed this week. Rotation is fixed: A → B → D → C.
 *
 * If nothing done yet → A.
 * If all four done → next cycle rotation starts from A.
 */
export function nextDayType(weekLogs: WorkoutLog[]): DayType {
  const doneThisWeek = new Set<DayType>()
  for (const w of weekLogs) if (w.completed) doneThisWeek.add(w.dayType)

  for (const d of DAY_ORDER) {
    if (!doneThisWeek.has(d)) return d
  }
  return 'A'
}

/**
 * Count unique workout days completed this week (Mon–Sun, local time).
 */
export function workoutsCompletedThisWeek(logs: WorkoutLog[], now = new Date()): number {
  const monday = startOfWeek(now)
  const done = new Set<DayType>()
  for (const w of logs) {
    if (!w.completed) continue
    const d = new Date(w.date)
    if (d >= monday) done.add(w.dayType)
  }
  return done.size
}

/**
 * Compute a rough streak of consecutive days with at least one completed workout.
 */
export function computeStreak(logs: WorkoutLog[], now = new Date()): number {
  const dates = new Set(
    logs
      .filter((l) => l.completed)
      .map((l) => l.date.slice(0, 10)),
  )
  let streak = 0
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  for (;;) {
    const iso = d.toISOString().slice(0, 10)
    if (dates.has(iso)) {
      streak += 1
      d.setDate(d.getDate() - 1)
    } else break
    if (streak > 365) break
  }
  return streak
}

/** Returns number of full days since last completed workout. */
export function daysSinceLast(logs: WorkoutLog[], now = new Date()): number | null {
  const last = logs.find((l) => l.completed)
  if (!last) return null
  const diff = now.getTime() - new Date(last.date).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/** Monday 00:00 local time of week containing `d`. */
export function startOfWeek(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  const dow = (copy.getDay() + 6) % 7 // Monday = 0
  copy.setDate(copy.getDate() - dow)
  return copy
}
