import { useState, useEffect, useCallback } from 'react'
import { useWorkoutStore } from '../stores/workoutStore'

export function useRestTimer() {
  const restTimerEnd = useWorkoutStore((s) => s.restTimerEnd)
  const startRestTimer = useWorkoutStore((s) => s.startRestTimer)
  const clearRestTimer = useWorkoutStore((s) => s.clearRestTimer)
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (!restTimerEnd) {
      setSecondsLeft(0)
      return
    }

    function tick() {
      const remaining = Math.max(0, Math.ceil((restTimerEnd! - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        clearRestTimer()
      }
    }

    tick()
    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
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
