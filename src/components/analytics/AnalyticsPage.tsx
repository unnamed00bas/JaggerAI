import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useCycleStore } from '../../stores/cycleStore'
import { db } from '../../lib/db'
import { estimateOneRepMax } from '../../lib/juggernaut'
import { Card } from '../ui/Card'
import { LIFTS, WAVES } from '../../types'
import type { AmrapResult, WorkoutLog, CompletedSet, CycleConfig } from '../../types'

const LIFT_COLORS: Record<string, string> = {
  squat: '#ef4444',
  bench: '#3b82f6',
  ohp: '#f59e0b',
  deadlift: '#10b981',
}

export function AnalyticsPage() {
  const { t } = useTranslation()
  const activeCycleId = useCycleStore((s) => s.activeCycleId)

  const cycle = useLiveQuery(
    () => (activeCycleId
      ? db.cycles.get(activeCycleId)
      : Promise.resolve(undefined as CycleConfig | undefined)),
    [activeCycleId],
  )

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

  if (!amrapResults?.length && !workoutLogs?.length) {
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

  // TM progression: start with initial TM, then newTrainingMax from each AMRAP wave
  const tmChartData = (() => {
    if (!cycle) return []
    const data: Record<string, string | number>[] = [
      { label: 'Start', ...cycle.trainingMaxes },
    ]
    const running: Record<string, number> = { ...cycle.trainingMaxes }
    for (const wave of WAVES) {
      let hasWaveData = false
      for (const lift of LIFTS) {
        const result = (amrapResults ?? []).find((r) => r.wave === wave && r.lift === lift)
        if (result) {
          running[lift] = result.newTrainingMax
          hasWaveData = true
        }
      }
      if (hasWaveData) {
        data.push({ label: wave, ...running })
      }
    }
    return data
  })()

  // Group e1RM by wave for chart
  const e1rmByWave = (amrapResults ?? []).reduce<Record<string, Record<string, number>>>((acc, r) => {
    if (!acc[r.wave]) acc[r.wave] = {}
    acc[r.wave][r.lift] = estimateOneRepMax(r.weight, r.actualReps)
    return acc
  }, {})

  const e1rmChartData = Object.entries(e1rmByWave).map(([wave, lifts]) => ({
    wave,
    ...lifts,
  }))

  // Volume data by week
  const volumeByWeek = (workoutLogs ?? []).reduce<Record<number, Record<string, number>>>((acc, log) => {
    if (!acc[log.week]) acc[log.week] = {}
    const tonnage = log.sets.reduce((sum: number, s: CompletedSet) => sum + (s.completed ? s.actualWeight * s.actualReps : 0), 0)
    acc[log.week][log.lift] = (acc[log.week][log.lift] ?? 0) + tonnage
    return acc
  }, {})

  const volumeChartData = Object.entries(volumeByWeek)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([week, lifts]) => ({
      week: `W${week}`,
      ...lifts,
    }))

  // AMRAP reps data
  const amrapChartData = (amrapResults ?? []).map((r) => ({
    label: `${t(`lifts.${r.lift}`)} (${r.wave})`,
    target: Number(r.wave.replace('s', '')),
    actual: r.actualReps,
    lift: r.lift,
  }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">{t('analytics.title')}</h1>

      {tmChartData.length > 1 && (
        <Card>
          <h2 className="text-sm font-semibold mb-3">{t('analytics.tmProgress')}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={tmChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip />
              {LIFTS.map((lift) => (
                <Line
                  key={lift}
                  type="monotone"
                  dataKey={lift}
                  stroke={LIFT_COLORS[lift]}
                  strokeWidth={2}
                  name={t(`lifts.${lift}`)}
                  dot={{ r: 4 }}
                />
              ))}
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {e1rmChartData.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold mb-3">{t('analytics.estimatedOneRM')}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={e1rmChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="wave" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              {LIFTS.map((lift) => (
                <Line
                  key={lift}
                  type="monotone"
                  dataKey={lift}
                  stroke={LIFT_COLORS[lift]}
                  strokeWidth={2}
                  name={t(`lifts.${lift}`)}
                  dot={{ r: 4 }}
                />
              ))}
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {volumeChartData.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold mb-3">{t('analytics.volume')}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={volumeChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              {LIFTS.map((lift) => (
                <Bar
                  key={lift}
                  dataKey={lift}
                  fill={LIFT_COLORS[lift]}
                  name={t(`lifts.${lift}`)}
                  stackId="volume"
                />
              ))}
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {amrapChartData.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold mb-3">{t('analytics.amrapResults')}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={amrapChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={100} />
              <Tooltip />
              <Bar dataKey="target" fill="#94a3b8" name="Target" />
              <Bar dataKey="actual" fill="#3b82f6" name="Actual" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}
