import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Skeleton, SkeletonCard } from './ui/Skeleton'
import { EmptyState } from './ui/EmptyState'
import { useProfileStore } from '../stores/profileStore'
import { useWorkoutStore } from '../stores/workoutStore'
import { db } from '../lib/db'
import {
  phaseForWeek,
  PHASE_NAME_KEYS,
  nextDayType,
  workoutsCompletedThisWeek,
  computeStreak,
  startOfWeek,
} from '../lib/program'
import { DAY_CATALOG } from '../lib/exercises'
import { DAY_COLORS } from '../lib/ui/dayStyle'
import { getProtocolForDay } from '../lib/rowing'

export function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const cycle = useProfileStore((s) => s.cycle)
  const profile = useProfileStore((s) => s.profile)
  const active = useWorkoutStore((s) => s.active)

  const phase = phaseForWeek(cycle.currentWeek)

  const weekLogs = useLiveQuery(async () => {
    const since = startOfWeek(new Date()).toISOString()
    return db.workouts.where('date').aboveOrEqual(since).toArray()
  }, [])

  const allLogs = useLiveQuery(
    async () => (await db.workouts.orderBy('date').reverse().limit(50).toArray()) ?? [],
    [],
  )

  const lastRowing = useLiveQuery(async () => {
    return db.rowingSessions.orderBy('date').reverse().first()
  }, [])

  const loadingDb = weekLogs === undefined || allLogs === undefined

  if (loadingDb) {
    return (
      <div className="flex flex-col gap-4 pb-4">
        <header className="pt-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </header>
        <SkeletonCard />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    )
  }

  const safeWeekLogs = weekLogs ?? []
  const safeAllLogs = allLogs ?? []
  const doneThisWeek = workoutsCompletedThisWeek(safeWeekLogs)
  const streak = computeStreak(safeAllLogs)
  const todayDay = active?.dayType ?? nextDayType(safeWeekLogs)
  const isFirstRun = safeAllLogs.length === 0 && !active
  const todayColors = DAY_COLORS[todayDay]
  const protocol = getProtocolForDay(todayDay, phase)
  const activePhase = phase === 'deload' ? null : (phase as 1 | 2 | 3 | 4)
  const targetSplit = activePhase ? protocol.targetSplitByPhase?.[activePhase] : undefined

  const exerciseIds = DAY_CATALOG[todayDay].exerciseIds

  function startOrContinue() {
    if (active) {
      navigate('/workout/active')
      return
    }
    navigate(`/workout/start/${todayDay}`)
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-sm text-surface-400">
          {t('dashboard.week_of', { week: cycle.currentWeek })} ·{' '}
          {t('dashboard.current_phase', { phase: t(PHASE_NAME_KEYS[phase]) })}
        </p>
      </header>

      {isFirstRun && (
        <EmptyState
          title={t('onboarding.welcome_title')}
          description={t('onboarding.welcome_text')}
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => navigate('/settings')}>
                {t('onboarding.go_settings')}
              </Button>
              <Button size="sm" onClick={startOrContinue}>
                {t('onboarding.first_workout')}
              </Button>
            </div>
          }
        />
      )}

      <Card className={`${todayColors.bg} border ${todayColors.border}`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className={`text-xs font-semibold uppercase tracking-wide ${todayColors.text}`}>
              {t('dashboard.next_workout')}
            </div>
            <div className="text-lg font-bold mt-0.5 text-white">
              {t(`day.${todayDay.toLowerCase()}`)}
            </div>
          </div>
          <span className={`text-3xl font-black ${todayColors.text}`}>{todayDay}</span>
        </div>
        {exerciseIds.length > 0 ? (
          <p className="text-xs text-surface-300 mb-2">
            {exerciseIds.length} упр. · {t('rowing.protocol')}: {t(protocol.nameKey)}
          </p>
        ) : (
          <p className="text-xs text-surface-300 mb-2">{t('workout.recovery_day')}</p>
        )}
        {targetSplit && (
          <p className="text-xs text-surface-400 mb-3">
            {t('rowing.target_split')}: {targetSplit}
          </p>
        )}
        <Button
          onClick={startOrContinue}
          className="w-full !bg-[color:var(--color-accent-500)] hover:!bg-[color:var(--color-accent-600)] !text-surface-950"
        >
          {active ? t('dashboard.continue_workout') : t('dashboard.start_workout')}
        </Button>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-xs text-surface-400">
            {t('dashboard.week_progress', { done: doneThisWeek, total: 4 })}
          </div>
          <div className="mt-2 flex gap-1">
            {(['A', 'B', 'D', 'C'] as const).map((d) => {
              const done = safeWeekLogs.some((w) => w.dayType === d && w.completed)
              const color = DAY_COLORS[d]
              return (
                <div
                  key={d}
                  className={`flex-1 h-8 rounded-md flex items-center justify-center text-xs font-bold border ${color.border} ${
                    done ? `${color.bg} ${color.text}` : 'text-surface-500 bg-surface-800/40'
                  }`}
                >
                  {d}
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <div className="text-xs text-surface-400">
            {t('dashboard.streak', { count: streak })}
          </div>
          <div className="mt-2 text-3xl font-bold text-[color:var(--color-accent-500)]">
            {streak}
          </div>
          <div className="text-xs text-surface-500 mt-1">{t('common.done')}</div>
        </Card>
      </div>

      <Card>
        <div className="text-xs text-surface-400 mb-2">{t('dashboard.last_rowing')}</div>
        {lastRowing ? (
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-surface-400">{t('rowing.avg_split')}</span>
              <span className="font-semibold">{lastRowing.avgSplit}/500м</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">{t('rowing.avg_power')}</span>
              <span className="font-semibold">{lastRowing.avgPower} Вт</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">{t('rowing.avg_spm')}</span>
              <span className="font-semibold">{lastRowing.avgSpm}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-surface-500">{t('dashboard.no_rowing')}</p>
        )}
      </Card>

      <p className="text-xs text-surface-500 text-center pt-2">
        {profile.name} · {profile.weightKg} кг · {profile.goal}
      </p>
    </div>
  )
}
