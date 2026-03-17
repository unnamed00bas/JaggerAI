import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCycleStore } from '../../stores/cycleStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { db } from '../../lib/db'
import { getCycleWeeks } from '../../lib/juggernaut'
import { getTabataWorkout, getTabataFrequency, getTotalWorkoutSeconds } from '../../lib/tabata'
import { useTabataTimer } from '../../hooks/useTabataTimer'
import { useTabataAudio } from '../../hooks/useTabataAudio'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { TabataCompletedBlock, TabataExerciseId } from '../../types'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0
    ? `${m}:${String(s).padStart(2, '0')}`
    : String(s)
}

function CircularProgress({
  secondsLeft,
  totalDuration,
  color,
}: {
  secondsLeft: number
  totalDuration: number
  color: string
}) {
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const progress = totalDuration > 0 ? (totalDuration - secondsLeft) / totalDuration : 0
  const offset = circumference * (1 - progress)

  return (
    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        className="text-surface-200 dark:text-surface-700"
      />
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-1000 ease-linear"
      />
    </svg>
  )
}

export function TabataDay() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const activeCycleId = useCycleStore((s) => s.activeCycleId)
  const currentWeek = useCycleStore((s) => s.currentWeek)
  const tabataEquipment = useSettingsStore((s) => s.tabataEquipment)

  const [rpe, setRpe] = useState('')
  const [notes, setNotes] = useState('')
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

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

  const { initAudio, onPhaseChange: audioOnPhaseChange, onCountdownTick, onTimerTick } = useTabataAudio()

  const handlePhaseChange = useCallback(
    (...args: [Parameters<typeof audioOnPhaseChange>[0], number]) => audioOnPhaseChange(args[0]),
    [audioOnPhaseChange],
  )

  const {
    phase,
    secondsLeft,
    currentBlock,
    currentRound,
    totalSeconds,
    completedBlocks,
    isPaused,
    start,
    pause,
    resume,
    stop,
  } = useTabataTimer(workout?.blocks ?? [], handlePhaseChange)

  // Audio ticks for countdown and work/rest warnings
  useEffect(() => {
    if (phase === 'countdown') {
      onCountdownTick(secondsLeft)
    } else if (phase === 'work' || phase === 'rest') {
      onTimerTick(secondsLeft, phase)
    }
  }, [secondsLeft, phase, onCountdownTick, onTimerTick])

  // Screen Wake Lock
  useEffect(() => {
    async function acquireWakeLock() {
      if ('wakeLock' in navigator && phase !== 'idle' && phase !== 'done') {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        } catch {
          // Wake lock not available
        }
      }
    }

    function releaseWakeLock() {
      if (wakeLockRef.current) {
        wakeLockRef.current.release()
        wakeLockRef.current = null
      }
    }

    if (phase !== 'idle' && phase !== 'done') {
      acquireWakeLock()
    } else {
      releaseWakeLock()
    }

    return releaseWakeLock
  }, [phase])

  function handleStart() {
    initAudio()
    start()
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

  const totalWorkoutSeconds = getTotalWorkoutSeconds(workout.blocks)
  const exerciseName = (id: TabataExerciseId) => t(`tabata.exercises.${id}`)
  const isActive = phase !== 'idle' && phase !== 'done'

  const phaseColorMap = {
    idle: { bg: '', ring: '#888', text: '' },
    countdown: { bg: 'bg-amber-500 dark:bg-amber-600', ring: '#f59e0b', text: 'text-white' },
    work: { bg: 'bg-red-500 dark:bg-red-600', ring: '#ef4444', text: 'text-white' },
    rest: { bg: 'bg-green-500 dark:bg-green-600', ring: '#22c55e', text: 'text-white' },
    block_rest: { bg: 'bg-blue-500 dark:bg-blue-600', ring: '#3b82f6', text: 'text-white' },
    done: { bg: '', ring: '#888', text: '' },
  }

  const currentPhaseColor = phaseColorMap[phase]

  const phaseLabel = {
    idle: '',
    countdown: t('tabata.getReady'),
    work: t('tabata.work'),
    rest: t('tabata.rest'),
    block_rest: t('tabata.blockRest'),
    done: t('tabata.completed'),
  }[phase]

  const phaseDuration = {
    idle: 0,
    countdown: 3,
    work: workout.blocks[currentBlock]?.workSeconds ?? 20,
    rest: workout.blocks[currentBlock]?.restSeconds ?? 10,
    block_rest: 60,
    done: 0,
  }[phase]

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
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
      {isActive && (
        <div className={`${currentPhaseColor.bg} ${currentPhaseColor.text} rounded-2xl border-0 py-6 px-4`}>
          <div className="text-center">
            <div className="text-sm font-medium opacity-80 mb-1">{phaseLabel}</div>

            {/* Circular progress timer */}
            <div className="relative w-48 h-48 mx-auto my-2">
              <CircularProgress
                secondsLeft={secondsLeft}
                totalDuration={phaseDuration}
                color={phase === 'countdown' ? '#fbbf24' : 'white'}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-6xl font-mono font-bold tabular-nums">
                  {formatTime(secondsLeft)}
                </div>
                {phase !== 'countdown' && (
                  <div className="text-sm opacity-80 mt-1">
                    {t('tabata.roundProgress', {
                      current: currentRound + 1,
                      total: workout.blocks[currentBlock]?.rounds ?? 8,
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Current exercise name */}
            {phase !== 'countdown' && (
              <div className="text-lg font-semibold mt-1">
                {exerciseName(workout.blocks[currentBlock]?.exerciseId)}
              </div>
            )}

            {/* Pause / Resume / Stop buttons */}
            <div className="flex justify-center gap-3 mt-4">
              {isPaused ? (
                <button
                  onClick={resume}
                  className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"
                  aria-label={t('tabata.resume')}
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={pause}
                  className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"
                  aria-label={t('tabata.pause')}
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                  </svg>
                </button>
              )}
              <button
                onClick={stop}
                className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"
                aria-label={t('tabata.stop')}
              >
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z" />
                </svg>
              </button>
            </div>

            {/* Paused indicator */}
            {isPaused && (
              <div className="text-sm font-medium opacity-80 mt-2 animate-pulse">
                {t('tabata.paused')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completion card */}
      {phase === 'done' && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-center py-6">
          <div className="text-4xl mb-2">&#10003;</div>
          <div className="text-lg font-bold text-green-700 dark:text-green-300">
            {t('tabata.completed')}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400 mt-1">
            {t('tabata.totalElapsed', { time: formatTime(totalSeconds) })}
          </div>
        </Card>
      )}

      {/* Workout info */}
      <Card>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
            {t('tabata.totalTime', { minutes: Math.ceil(totalWorkoutSeconds / 60) })}
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
        const completedBlock = completedBlocks[i]
        const isDone = completedBlock?.completed
        const isPartial = completedBlock && !completedBlock.completed

        return (
          <Card
            key={i}
            className={`flex items-center justify-between ${
              isCurrentBlock ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''
            } ${isDone ? 'opacity-60' : ''}`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
                  {t('tabata.block', { number: i + 1 })}
                </span>
                {isCurrentBlock && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium">
                    {t('tabata.current')}
                  </span>
                )}
              </div>
              <div className="font-semibold mt-1">{exerciseName(block.exerciseId)}</div>
              <div className="text-sm text-surface-500 dark:text-surface-400">
                {t('tabata.rounds', { count: block.rounds })} &middot;{' '}
                {t('tabata.timing', { work: block.workSeconds, rest: block.restSeconds })}
              </div>
              {isPartial && (
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  {t('tabata.partialRounds', {
                    completed: completedBlock.completedRounds,
                    total: completedBlock.targetRounds,
                  })}
                </div>
              )}
            </div>
            {isDone ? (
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : isPartial ? (
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">
                  {completedBlock.completedRounds}/{completedBlock.targetRounds}
                </span>
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
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                <button
                  key={val}
                  onClick={() => setRpe(String(val))}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    String(val) === rpe
                      ? val <= 3
                        ? 'bg-green-500 text-white'
                        : val <= 6
                          ? 'bg-amber-500 text-white'
                          : 'bg-red-500 text-white'
                      : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
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
      {phase === 'idle' && (
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
