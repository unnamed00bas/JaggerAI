import { useState, useEffect, useCallback } from 'react'
import { useWorkoutStore } from '../stores/workoutStore'

function remainingSec(end: number | null): number {
  if (!end) return 0
  return Math.max(0, Math.ceil((end - Date.now()) / 1000))
}

export function useRestTimer() {
  const restTimerEnd = useWorkoutStore((s) => s.restTimerEnd)
  const startRestTimer = useWorkoutStore((s) => s.startRestTimer)
  const clearRestTimer = useWorkoutStore((s) => s.clearRestTimer)
  const [secondsLeft, setSecondsLeft] = useState(() => remainingSec(restTimerEnd))

  useEffect(() => {
    if (!restTimerEnd) {
      if (secondsLeft !== 0) setSecondsLeft(0)
      return
    }
    let cancelled = false
    function tick() {
      if (cancelled) return
      const remaining = remainingSec(restTimerEnd)
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.([200, 100, 200])
        }
        clearRestTimer()
      }
    }
    tick()
    const interval = setInterval(tick, 250)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
    // `secondsLeft` intentionally omitted — we only need to re-sync on end changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restTimerEnd, clearRestTimer])

  const start = useCallback(
    (seconds: number) => startRestTimer(seconds),
    [startRestTimer],
  )

  const stop = useCallback(() => clearRestTimer(), [clearRestTimer])

  return {
    secondsLeft,
    isRunning: secondsLeft > 0,
    start,
    stop,
  }
}
