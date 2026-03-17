import { useState, useEffect, useRef, useCallback } from 'react'
import type { TabataBlock, TabataCompletedBlock } from '../types'

export type TimerPhase = 'idle' | 'countdown' | 'work' | 'rest' | 'block_rest' | 'done'

interface UseTabataTimerReturn {
  phase: TimerPhase
  secondsLeft: number
  currentBlock: number
  currentRound: number
  totalSeconds: number
  completedBlocks: TabataCompletedBlock[]
  isPaused: boolean
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
}

const COUNTDOWN_SECONDS = 3

export function useTabataTimer(
  blocks: TabataBlock[],
  onPhaseChange?: (phase: TimerPhase, blockIndex: number) => void,
): UseTabataTimerReturn {
  const [phase, setPhase] = useState<TimerPhase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [currentBlock, setCurrentBlock] = useState(0)
  const [currentRound, setCurrentRound] = useState(0)
  const [completedBlocks, setCompletedBlocks] = useState<TabataCompletedBlock[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(0)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Keep refs in sync via effects (React 19 lint compliance)
  const phaseRef = useRef(phase)
  const currentBlockRef = useRef(currentBlock)
  const currentRoundRef = useRef(currentRound)
  const blocksRef = useRef(blocks)
  const onPhaseChangeRef = useRef(onPhaseChange)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { currentBlockRef.current = currentBlock }, [currentBlock])
  useEffect(() => { currentRoundRef.current = currentRound }, [currentRound])
  useEffect(() => { blocksRef.current = blocks }, [blocks])
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
    const bi = currentBlockRef.current
    const ri = currentRoundRef.current
    const b = blocksRef.current

    if (p === 'countdown') {
      setPhase('work')
      setSecondsLeft(b[0].workSeconds)
      onPhaseChangeRef.current?.('work', 0)
      return
    }

    const block = b[bi]

    if (p === 'work') {
      if (ri < block.rounds - 1) {
        setPhase('rest')
        setSecondsLeft(block.restSeconds)
        onPhaseChangeRef.current?.('rest', bi)
      } else {
        setCompletedBlocks((prev) => [
          ...prev,
          {
            exerciseId: block.exerciseId,
            targetRounds: block.rounds,
            completedRounds: block.rounds,
            completed: true,
          },
        ])

        if (bi < b.length - 1) {
          setPhase('block_rest')
          setSecondsLeft(60)
          onPhaseChangeRef.current?.('block_rest', bi)
        } else {
          setPhase('done')
          setIsPaused(false)
          clearTimer()
          onPhaseChangeRef.current?.('done', bi)
        }
      }
    } else if (p === 'rest') {
      const nextRound = ri + 1
      setCurrentRound(nextRound)
      setPhase('work')
      setSecondsLeft(block.workSeconds)
      onPhaseChangeRef.current?.('work', bi)
    } else if (p === 'block_rest') {
      const nextBlock = bi + 1
      setCurrentBlock(nextBlock)
      setCurrentRound(0)
      setPhase('work')
      setSecondsLeft(b[nextBlock].workSeconds)
      onPhaseChangeRef.current?.('work', nextBlock)
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

  const start = useCallback(() => {
    setCurrentBlock(0)
    setCurrentRound(0)
    setCompletedBlocks([])
    setTotalSeconds(0)
    setIsPaused(false)
    setPhase('countdown')
    setSecondsLeft(COUNTDOWN_SECONDS)
    onPhaseChangeRef.current?.('countdown', 0)
  }, [])

  const pause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  const stop = useCallback(() => {
    clearTimer()
    const bi = currentBlockRef.current
    const ri = currentRoundRef.current
    const b = blocksRef.current

    setCompletedBlocks((prev) => {
      const result = [...prev]
      if (bi < b.length && !result[bi]) {
        result.push({
          exerciseId: b[bi].exerciseId,
          targetRounds: b[bi].rounds,
          completedRounds: ri,
          completed: false,
        })
      }
      return result
    })

    setPhase('done')
    setIsPaused(false)
    onPhaseChangeRef.current?.('done', currentBlockRef.current)
  }, [clearTimer])

  return {
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
  }
}
