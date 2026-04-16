import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts'
import { Card } from '../ui/Card'
import { db } from '../../lib/db'
import { EXERCISES } from '../../lib/exercises'
import { parseSplit } from '../../lib/rowing'
import { computeStreak } from '../../lib/program'

export function AnalyticsPage() {
  const { t } = useTranslation()

  const workouts = useLiveQuery(async () => {
    return (await db.workouts.orderBy('date').toArray()) ?? []
  }, []) ?? []

  const rowings = useLiveQuery(async () => {
    return (await db.rowingSessions.orderBy('date').toArray()) ?? []
  }, []) ?? []

  const prs = useLiveQuery(async () => {
    return (await db.personalRecords.orderBy('updatedAt').reverse().toArray()) ?? []
  }, []) ?? []

  const exerciseIds = useMemo(() => {
    const s = new Set<string>()
    workouts.forEach((w) => w.exercises.forEach((e) => s.add(e.exerciseId)))
    return Array.from(s)
  }, [workouts])

  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const chosenExerciseId = selectedExerciseId ?? exerciseIds[0] ?? null

  const exerciseData = useMemo(() => {
    if (!chosenExerciseId) return []
    return workouts
      .filter((w) => w.exercises.some((e) => e.exerciseId === chosenExerciseId))
      .map((w) => {
        const ex = w.exercises.find((e) => e.exerciseId === chosenExerciseId)!
        const top = ex.sets.reduce<number>(
          (m, s) => Math.max(m, s.actualWeightKg ?? 0),
          0,
        )
        return { date: w.date.slice(5, 10), weight: top }
      })
      .filter((p) => p.weight > 0)
  }, [workouts, chosenExerciseId])

  const rowingPaceData = useMemo(() => {
    return rowings
      .map((r) => {
        const sec = parseSplit(r.avgSplit)
        if (sec == null) return null
        return { date: r.date.slice(5, 10), splitSec: sec, label: r.avgSplit }
      })
      .filter((p): p is { date: string; splitSec: number; label: string } => p != null)
  }, [rowings])

  const rowingPowerData = useMemo(() => {
    return rowings
      .filter((r) => r.avgPower > 0)
      .map((r) => ({ date: r.date.slice(5, 10), power: r.avgPower }))
  }, [rowings])

  const weeklyTonnage = useMemo(() => {
    const map = new Map<number, number>()
    for (const w of workouts) {
      if (!w.completed) continue
      const weekKey = w.week
      let tonnage = 0
      for (const e of w.exercises) {
        for (const s of e.sets) {
          if (s.actualWeightKg && s.actualReps)
            tonnage += s.actualWeightKg * s.actualReps
        }
      }
      map.set(weekKey, (map.get(weekKey) ?? 0) + tonnage)
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([week, tonnage]) => ({ week: `W${week}`, tonnage: Math.round(tonnage) }))
  }, [workouts])

  const streak = computeStreak(workouts)

  return (
    <div className="flex flex-col gap-4 pb-4">
      <header>
        <h1 className="text-2xl font-bold">{t('analytics.title')}</h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-xs text-surface-400">{t('analytics.current_streak')}</div>
          <div className="mt-2 text-3xl font-bold text-[color:var(--color-accent-500)]">{streak}</div>
        </Card>
        <Card>
          <div className="text-xs text-surface-400">{t('analytics.personal_records')}</div>
          <div className="mt-2 text-3xl font-bold text-[color:var(--color-accent-500)]">{prs.length}</div>
        </Card>
      </div>

      {workouts.length === 0 && rowings.length === 0 ? (
        <Card>
          <p className="text-sm text-surface-400 text-center py-4">{t('analytics.no_data')}</p>
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">{t('analytics.exercise_weight')}</h2>
              <select
                value={chosenExerciseId ?? ''}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="text-xs bg-surface-800 border border-surface-700 rounded px-2 py-1 text-surface-200"
              >
                {exerciseIds.map((id) => (
                  <option key={id} value={id}>
                    {EXERCISES[id]?.name ?? id}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-48">
              {exerciseData.length > 0 ? (
                <ResponsiveContainer>
                  <LineChart data={exerciseData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
                      labelStyle={{ color: '#cbd5e1' }}
                    />
                    <Line type="monotone" dataKey="weight" stroke="#f07a4a" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-surface-500 text-center py-6">{t('analytics.no_data')}</p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold mb-2">{t('analytics.rowing_pace')}</h2>
            <div className="h-40">
              {rowingPaceData.length > 0 ? (
                <ResponsiveContainer>
                  <LineChart data={rowingPaceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      reversed
                      domain={['auto', 'auto']}
                      tickFormatter={(s) =>
                        `${Math.floor(s / 60)}:${(Math.floor(s) % 60).toString().padStart(2, '0')}`
                      }
                    />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
                      labelStyle={{ color: '#cbd5e1' }}
                      formatter={(_, __, p) => [p.payload.label ?? '-', 'темп']}
                    />
                    <Line type="monotone" dataKey="splitSec" stroke="#4af0c4" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-surface-500 text-center py-6">{t('analytics.no_data')}</p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold mb-2">{t('analytics.rowing_power')}</h2>
            <div className="h-40">
              {rowingPowerData.length > 0 ? (
                <ResponsiveContainer>
                  <LineChart data={rowingPowerData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
                      labelStyle={{ color: '#cbd5e1' }}
                    />
                    <Line type="monotone" dataKey="power" stroke="#c8f135" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-surface-500 text-center py-6">{t('analytics.no_data')}</p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold mb-2">{t('analytics.weekly_tonnage')}</h2>
            <div className="h-40">
              {weeklyTonnage.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={weeklyTonnage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
                      labelStyle={{ color: '#cbd5e1' }}
                    />
                    <Bar dataKey="tonnage" fill="#f07a4a" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-surface-500 text-center py-6">{t('analytics.no_data')}</p>
              )}
            </div>
          </Card>

          {prs.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold mb-2">{t('analytics.personal_records')}</h2>
              <div className="flex flex-col gap-1.5">
                {prs.slice(0, 10).map((pr) => (
                  <div key={pr.id} className="flex items-center justify-between text-xs">
                    <span className="text-surface-300">
                      {EXERCISES[pr.exerciseId]?.name ?? pr.exerciseId}
                    </span>
                    <span className="tabular-nums text-surface-200">
                      {pr.weightKg != null && pr.reps != null
                        ? `${pr.weightKg}×${pr.reps} (1RM ${pr.estOneRepMax} кг)`
                        : pr.bestSplit
                        ? `${pr.bestSplit}/500м`
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
