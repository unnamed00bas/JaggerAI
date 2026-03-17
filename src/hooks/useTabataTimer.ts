import { useState, useEffect, useRef, useCallback } from 'react'
import type { TabataBlock, TabataCompletedBlock } from '../types'

export type TimerPhase = 'idle' | 'countdown' | 'work' | 'rest' | 'done'

interface UseTabataTimerReturn {
  phase: TimerPhase
  secondsLeft: number
  currentRound: number
  totalSeconds: number
  completedBlock: TabataCompletedBlock | null
  isPaused: boolean
  start: (block: TabataBlock) => void
  pause: () => void
  resume: () => void
  stop: () => void
}

const COUNTDOWN_SECONDS = 3

export function useTabataTimer(
  onPhaseChange?: (phase: TimerPhase) => void,
): UseTabataTimerReturn {
  const [phase, setPhase] = useState<TimerPhase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [currentRound, setCurrentRound] = useState(0)
  const [completedBlock, setCompletedBlock] = useState<TabataCompletedBlock | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(0)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeBlockRef = useRef<TabataBlock | null>(null)

  // Keep refs in sync via effects (React 19 lint compliance)
  const phaseRef = useRef(phase)
  const currentRoundRef = useRef(currentRound)
  const onPhaseChangeRef = useRef(onPhaseChange)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { currentRoundRef.current = currentRound }, [currentRound])
  useEffect(() => { onPhaseChangeRef.current = onPhaseChange }, [onPhaseChange])

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => clearTimer, [clearTimer])

  const advancePhase = useCallback(() => {
    const p = phaseRef.current
    const ri = currentRoundRef.current
    const block = activeBlockRef.current
    if (!block) return

    if (p === 'countdown') {
      setPhase('work')
      setSecondsLeft(block.workSeconds)
      onPhaseChangeRef.current?.('work')
      return
    }

    if (p === 'work') {
      if (ri < block.rounds - 1) {
        setPhase('rest')
        setSecondsLeft(block.restSeconds)
        onPhaseChangeRef.current?.('rest')
      } else {
        // Block complete
        setCompletedBlock({
          exerciseId: block.exerciseId,
          targetRounds: block.rounds,
          completedRounds: block.rounds,
          completed: true,
        })
        setPhase('done')
        setIsPaused(false)
        clearTimer()
        onPhaseChangeRef.current?.('done')
      }
    } else if (p === 'rest') {
      const nextRound = ri + 1
      setCurrentRound(nextRound)
      setPhase('work')
      setSecondsLeft(block.workSeconds)
      onPhaseChangeRef.current?.('work')
    }
  }, [clearTimer])

  // Main tick effect
  useEffect(() => {
    if (phase === 'idle' || phase === 'done' || isPaused) {
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
      setTotalSeconds((prev) => prev + 1)
    }, 1000)

    return clearTimer
  }, [phase, isPaused, clearTimer, advancePhase])

  const start = useCallback((block: TabataBlock) => {
    activeBlockRef.current = block
    setCurrentRound(0)
    setCompletedBlock(null)
    setTotalSeconds(0)
    setIsPaused(false)
    setPhase('countdown')
    setSecondsLeft(COUNTDOWN_SECONDS)
    onPhaseChangeRef.current?.('countdown')
  }, [])

  const pause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  const stop = useCallback(() => {
    clearTimer()
    const ri = currentRoundRef.current
    const block = activeBlockRef.current
    if (block) {
      setCompletedBlock({
        exerciseId: block.exerciseId,
        targetRounds: block.rounds,
        completedRounds: ri,
        completed: false,
      })
    }
    setPhase('done')
    setIsPaused(false)
    onPhaseChangeRef.current?.('done')
  }, [clearTimer])

  return {
    phase,
    secondsLeft,
    currentRound,
    totalSeconds,
    completedBlock,
    isPaused,
    start,
    pause,
    resume,
    stop,
  }
}
