import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useCycleStore } from '../../stores/cycleStore'
import { db } from '../../lib/db'
import { Card } from '../ui/Card'
import type { AmrapResult, WorkoutLog, CompletedSet } from '../../types'
import { MAIN_LIFTS } from '../../types'

const EXERCISE_COLORS: Record<string, string> = {
  squat: '#ef4444',
  bench: '#3b82f6',
  ohp: '#f59e0b',
  deadlift: '#10b981',
  barbell_row: '#8b5cf6',
}

export function AnalyticsPage() {
  const { t } = useTranslation()
  const activeCycleId = useCycleStore((s) => s.activeCycleId)

  const amrapResults = useLiveQuery(
    () => (activeCycleId
      ? db.amrapResults.where('cycleId').equals(activeCycleId).sortBy('date')
      : Promise.resolve([] as AmrapResult[])),
    [activeCycleId],
  )

  const workoutLogs = useLiveQuery(
    () => (activeCycleId
      ? db.workoutLogs.where('cycleId').equals(activeCycleId).sortBy('date')
      : Promise.resolve([] as WorkoutLog[])),
    [activeCycleId],
  )

  if (!workoutLogs?.length && !amrapResults?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl">📊</div>
        <h1 className="text-xl font-bold">{t('analytics.title')}</h1>
        <p className="text-surface-500 dark:text-surface-400 text-center">
          {t('analytics.noData')}
        </p>
      </div>
    )
  }

  // Weight progression: track max actual weight used per exercise per week
  const weightByWeek = (workoutLogs ?? []).reduce<Record<number, Record<string, number>>>((acc, log) => {
    if (!acc[log.week]) acc[log.week] = {}
    for (const exercise of log.exercises) {
      if (!MAIN_LIFTS.includes(exercise.exerciseId as typeof MAIN_LIFTS[number])) continue
      const maxWeight = exercise.sets.reduce((max: number, s: CompletedSet) =>
        s.completed && s.actualWeight > max ? s.actualWeight : max, 0)
      if (maxWeight > (acc[log.week][exercise.exerciseId] ?? 0)) {
        acc[log.week][exercise.exerciseId] = maxWeight
      }
    }
    return acc
  }, {})

  const weightChartData = Object.entries(weightByWeek)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([week, exercises]) => ({
      week: `W${week}`,
      ...exercises,
    }))

  // Volume (tonnage) by week
  const volumeByWeek = (workoutLogs ?? []).reduce<Record<number, Record<string, number>>>((acc, log) => {
    if (!acc[log.week]) acc[log.week] = {}
    for (const exercise of log.exercises) {
      const tonnage = exercise.sets.reduce((sum: number, s: CompletedSet) =>
        sum + (s.completed ? s.actualWeight * s.actualReps : 0), 0)
      const key = log.dayType
      acc[log.week][key] = (acc[log.week][key] ?? 0) + tonnage
    }
    return acc
  }, {})

  const volumeChartData = Object.entries(volumeByWeek)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([week, days]) => ({
      week: `W${week}`,
      ...days,
    }))

  // AMRAP test results
  const amrapChartData = (amrapResults ?? []).map((r) => ({
    label: `${t(`exercises.short.${r.exerciseId}`)}`,
    reps: r.actualReps,
    weight: r.weight,
    e1rm: r.estimatedOneRepMax,
  }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">{t('analytics.title')}</h1>

      {weightChartData.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold mb-3">{t('analytics.weightProgress')}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weightChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip />
              {MAIN_LIFTS.map((lift) => (
                <Line
                  key={lift}
                  type="monotone"
                  dataKey={lift}
                  stroke={EXERCISE_COLORS[lift]}
                  strokeWidth={2}
                  name={t(`exercises.short.${lift}`)}
                  dot={{ r: 4 }}
                  connectNulls
                />
              ))}
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {volumeChartData.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold mb-3">{t('analytics.volumeByWeek')}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={volumeChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="hypertrophy" fill="#3b82f6" name={t('dayTypes.hypertrophy')} stackId="vol" />
              <Bar dataKey="volume" fill="#f59e0b" name={t('dayTypes.volume')} stackId="vol" />
              <Bar dataKey="strength" fill="#ef4444" name={t('dayTypes.strength')} stackId="vol" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {amrapChartData.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold mb-3">{t('analytics.amrapResults')}</h2>
          <div className="space-y-2">
            {amrapChartData.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <span className="font-medium text-sm">{r.label}</span>
                <div className="text-right">
                  <span className="text-sm font-bold">{r.reps} reps @ {r.weight} kg</span>
                  <span className="text-xs text-surface-500 ml-2">e1RM: {r.e1rm} kg</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
