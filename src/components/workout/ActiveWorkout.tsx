import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useProfileStore } from '../../stores/profileStore'
import { useWorkoutStore } from '../../stores/workoutStore'
import { useToastStore } from '../../stores/toastStore'
import { db } from '../../lib/db'
import { DAY_CATALOG, getExercise } from '../../lib/exercises'
import { phaseForWeek, PHASE_NAME_KEYS } from '../../lib/program'
import { DAY_COLORS } from '../../lib/ui/dayStyle'
import { detectPrsFromWorkout } from '../../lib/records'
import { Skeleton } from '../ui/Skeleton'
import { confirmAsync } from '../ui/ConfirmDialog'
import { ExerciseBlock } from './ExerciseBlock'
import { RecoveryDay } from './RecoveryDay'
import { RestTimerBar } from './RestTimerBar'
import { RowingEntry } from './RowingEntry'
import type { DayType } from '../../types'

export function ActiveWorkout() {
  const { t } = useTranslation()
  const { dayType: paramDay } = useParams<{ dayType: DayType }>()
  const navigate = useNavigate()

  const cycle = useProfileStore((s) => s.cycle)
  const profile = useProfileStore((s) => s.profile)
  const active = useWorkoutStore((s) => s.active)
  const startWorkout = useWorkoutStore((s) => s.startWorkout)
  const completeWorkout = useWorkoutStore((s) => s.completeWorkout)
  const cancelWorkout = useWorkoutStore((s) => s.cancelWorkout)
  const setNotes = useWorkoutStore((s) => s.setNotes)
  const errorToast = useToastStore((s) => s.error)
  const successToast = useToastStore((s) => s.success)

  const phase = phaseForWeek(cycle.currentWeek)
  const dayType: DayType =
    active?.dayType ??
    (paramDay && ['A', 'B', 'C', 'D'].includes(paramDay) ? paramDay : 'A')

  useEffect(() => {
    if (!active) {
      startWorkout({ cycleId: cycle.id, dayType, phase, week: cycle.currentWeek })
    }
  }, [active, cycle.id, cycle.currentWeek, dayType, phase, startWorkout])

  if (!active) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-32 w-full" rounded="rounded-2xl" />
        <Skeleton className="h-32 w-full" rounded="rounded-2xl" />
      </div>
    )
  }

  const exerciseIds = DAY_CATALOG[dayType].exerciseIds
  const colors = DAY_COLORS[dayType]

  async function handleFinish() {
    const finished = completeWorkout()
    if (!finished) return
    try {
      await db.workouts.put(finished)
      await detectPrsFromWorkout(finished)
      successToast(t('common.done'))
      navigate('/workout')
    } catch (e) {
      errorToast(
        `${t('errors.save_workout_failed')} ${e instanceof Error ? `(${e.message})` : ''}`,
      )
    }
  }

  async function handleCancel() {
    const ok = await confirmAsync({
      title: t('confirm.cancel_workout_title'),
      message: t('confirm.cancel_workout_text'),
      confirmLabel: t('workout.cancel'),
      destructive: true,
    })
    if (!ok) return
    cancelWorkout()
    navigate('/')
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <header className="flex items-start justify-between">
        <div>
          <h1 className={`text-xl font-bold ${colors.text}`}>
            {t(`day.${dayType.toLowerCase()}`)}
          </h1>
          <p className="text-xs text-surface-400">
            {t('dashboard.week_of', { week: cycle.currentWeek })} ·{' '}
            {t(PHASE_NAME_KEYS[phase])}
          </p>
        </div>
        <button onClick={handleCancel} className="text-xs text-surface-400 hover:text-red-400">
          {t('common.cancel')}
        </button>
      </header>

      {dayType === 'D' ? (
        <RecoveryDay />
      ) : (
        <>
          {exerciseIds.map((id) => {
            const ex = getExercise(id)
            if (!ex) return null
            return (
              <ExerciseBlock
                key={id}
                exercise={ex}
                phase={phase}
                workingWeightKg={cycle.workingWeightsKg[id]}
              />
            )
          })}
        </>
      )}

      <RowingEntry dayType={dayType} phase={phase} />

      <Card>
        <label className="text-xs text-surface-400 block mb-1.5">{t('workout.note')}</label>
        <textarea
          value={active.notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-sm text-surface-100 min-h-[60px]"
          placeholder={t('workout.note')}
        />
      </Card>

      <Button
        onClick={handleFinish}
        size="lg"
        className="!bg-[color:var(--color-accent-500)] hover:!bg-[color:var(--color-accent-600)] !text-surface-950 w-full"
      >
        {t('workout.finish')}
      </Button>

      <p className="text-[10px] text-surface-600 text-center">
        {profile.name} · {new Date(active.date).toLocaleString()}
      </p>

      <RestTimerBar />
    </div>
  )
}
