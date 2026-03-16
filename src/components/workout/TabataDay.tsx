import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCycleStore } from '../../stores/cycleStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { db } from '../../lib/db'
import { getCycleWeeks } from '../../lib/juggernaut'
import { getTabataWorkout, getTabataFrequency, getTotalWorkoutSeconds } from '../../lib/tabata'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { TabataCompletedBlock, TabataExerciseId } from '../../types'

type TimerPhase = 'idle' | 'work' | 'rest' | 'block_rest' | 'done'

export function TabataDay() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const activeCycleId = useCycleStore((s) => s.activeCycleId)
  const currentWeek = useCycleStore((s) => s.currentWeek)
  const tabataEquipment = useSettingsStore((s) => s.tabataEquipment)

  const [isActive, setIsActive] = useState(false)
  const [currentBlock, setCurrentBlock] = useState(0)
  const [currentRound, setCurrentRound] = useState(0)
  const [phase, setPhase] = useState<TimerPhase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [completedBlocks, setCompletedBlocks] = useState<TabataCompletedBlock[]>([])
  const [rpe, setRpe] = useState('')
  const [notes, setNotes] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cycle = useLiveQuery(
    () => (activeCycleId ? db.cycles.get(activeCycleId) : undefined),
    [activeCycleId],
  )

  const weeks = getCycleWeeks()
  const weekInfo = weeks[currentWeek - 1]

  const workout = weekInfo
    ? getTabataWorkout(weekInfo.wave, weekInfo.phase, currentWeek, tabataEquipment)
    : null

  const frequency = weekInfo ? getTabataFrequency(weekInfo.phase) : null

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return clearTimer
  }, [clearTimer])

  useEffect(() => {
    if (phase === 'idle' || phase === 'done') {
      clearTimer()
      return
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          advancePhase()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return clearTimer
  }, [phase, currentBlock, currentRound])

  function advancePhase() {
    if (!workout) return

    const block = workout.blocks[currentBlock]

    if (phase === 'work') {
      if (currentRound < block.rounds - 1) {
        setPhase('rest')
        setSecondsLeft(block.restSeconds)
      } else {
        // Block finished
        setCompletedBlocks((prev) => [
          ...prev,
          {
            exerciseId: block.exerciseId,
            targetRounds: block.rounds,
            completedRounds: block.rounds,
            completed: true,
          },
        ])

        if (currentBlock < workout.blocks.length - 1) {
          setPhase('block_rest')
          setSecondsLeft(60)
        } else {
          setPhase('done')
          setIsActive(false)
        }
      }
    } else if (phase === 'rest') {
      setCurrentRound((prev) => prev + 1)
      setPhase('work')
      setSecondsLeft(workout.blocks[currentBlock].workSeconds)
    } else if (phase === 'block_rest') {
      setCurrentBlock((prev) => prev + 1)
      setCurrentRound(0)
      setPhase('work')
      setSecondsLeft(workout.blocks[currentBlock + 1].workSeconds)
    }
  }

  function handleStart() {
    if (!workout) return
    setIsActive(true)
    setCurrentBlock(0)
    setCurrentRound(0)
    setCompletedBlocks([])
    setPhase('work')
    setSecondsLeft(workout.blocks[0].workSeconds)
  }

  async function handleFinish() {
    if (!workout || !activeCycleId || !weekInfo) return

    const blocks: TabataCompletedBlock[] = workout.blocks.map((block, i) => {
      const completed = completedBlocks[i]
      return completed ?? {
        exerciseId: block.exerciseId,
        targetRounds: block.rounds,
        completedRounds: 0,
        completed: false,
      }
    })

    await db.tabataLogs.add({
      id: crypto.randomUUID(),
      cycleId: activeCycleId,
      wave: weekInfo.wave,
      phase: weekInfo.phase,
      week: currentWeek,
      blocks,
      date: new Date().toISOString(),
      rpe: Number(rpe) || 0,
      notes,
    })

    navigate('/')
  }

  if (!cycle || !weekInfo || !workout) return null

  const totalSeconds = getTotalWorkoutSeconds(workout.blocks)
  const exerciseName = (id: TabataExerciseId) => t(`tabata.exercises.${id}`)

  const phaseColor = {
    idle: '',
    work: 'bg-red-500 dark:bg-red-600',
    rest: 'bg-green-500 dark:bg-green-600',
    block_rest: 'bg-blue-500 dark:bg-blue-600',
    done: 'bg-primary-500 dark:bg-primary-600',
  }[phase]

  const phaseLabel = {
    idle: '',
    work: t('tabata.work'),
    rest: t('tabata.rest'),
    block_rest: t('tabata.blockRest'),
    done: t('tabata.completed'),
  }[phase]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-surface-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold">{t('tabata.title')}</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {t(`waves.${weekInfo.wave}`)} — {t(`phases.${weekInfo.phase}`)}
          </p>
        </div>
      </div>

      {/* Timer display during active workout */}
      {isActive && phase !== 'done' && (
        <Card className={`${phaseColor} text-white border-0 text-center py-6`}>
          <div className="text-sm font-medium opacity-80">{phaseLabel}</div>
          <div className="text-6xl font-mono font-bold my-2">{secondsLeft}</div>
          <div className="text-sm opacity-80">
            {t('tabata.roundProgress', {
              current: currentRound + 1,
              total: workout.blocks[currentBlock]?.rounds ?? 8,
            })}
          </div>
          <div className="text-lg font-semibold mt-2">
            {exerciseName(workout.blocks[currentBlock]?.exerciseId)}
          </div>
        </Card>
      )}

      {/* Completion card */}
      {phase === 'done' && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-center py-6">
          <div className="text-4xl mb-2">&#10003;</div>
          <div className="text-lg font-bold text-green-700 dark:text-green-300">
            {t('tabata.completed')}
          </div>
        </Card>
      )}

      {/* Workout info */}
      <Card>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
            {t('tabata.totalTime', { minutes: Math.ceil(totalSeconds / 60) })}
          </span>
          {frequency && (
            <span className="text-sm text-surface-500 dark:text-surface-400">
              {t('tabata.frequency', { min: frequency.min, max: frequency.max })}
            </span>
          )}
        </div>
        <p className="text-sm italic text-surface-500 dark:text-surface-400">
          {t(workout.intensityNote)}
        </p>
      </Card>

      {/* Block list */}
      {workout.blocks.map((block, i) => {
        const isCurrentBlock = isActive && i === currentBlock
        const isDone = completedBlocks[i]?.completed

        return (
          <Card
            key={i}
            className={`flex items-center justify-between ${
              isCurrentBlock ? 'ring-2 ring-primary-500' : ''
            } ${isDone ? 'opacity-60' : ''}`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
                  {t('tabata.block', { number: i + 1 })}
                </span>
              </div>
              <div className="font-semibold mt-1">{exerciseName(block.exerciseId)}</div>
              <div className="text-sm text-surface-500 dark:text-surface-400">
                {t('tabata.rounds', { count: block.rounds })} &middot;{' '}
                {t('tabata.timing', { work: block.workSeconds, rest: block.restSeconds })}
              </div>
            </div>
            {isDone ? (
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-surface-300 dark:border-surface-600 flex-shrink-0" />
            )}
          </Card>
        )
      })}

      {/* RPE & Notes (shown after completion) */}
      {phase === 'done' && (
        <>
          <Card>
            <label className="text-sm font-medium text-surface-500 dark:text-surface-400">
              {t('tabata.rpe')}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={10}
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-lg font-bold"
            />
          </Card>
          <Card>
            <textarea
              placeholder={t('workout.notes')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-transparent resize-none text-sm placeholder:text-surface-400 focus:outline-none"
              rows={2}
            />
          </Card>
        </>
      )}

      {/* Action buttons */}
      {!isActive && phase !== 'done' && (
        <Button size="lg" className="w-full" onClick={handleStart}>
          {t('tabata.startTabata')}
        </Button>
      )}

      {phase === 'done' && (
        <Button size="lg" className="w-full" onClick={handleFinish}>
          {t('tabata.finishTabata')}
        </Button>
      )}
    </div>
  )
}
