import { useRef, useCallback, useEffect } from 'react'
import type { TimerPhase } from './useTabataTimer'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioCtx
}

function playBeep(frequency: number, duration: number, volume = 0.3) {
  const ctx = getAudioContext()
  if (!ctx) return

  // Resume if suspended (autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.connect(gain)
  gain.connect(ctx.destination)

  oscillator.frequency.value = frequency
  oscillator.type = 'sine'
  gain.gain.value = volume

  // Fade out to avoid clicks
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration)
}

function playCountdownBeep() {
  playBeep(880, 0.1, 0.4)
}

function playWorkBeep() {
  // Two quick high beeps = GO
  playBeep(1200, 0.15, 0.5)
  setTimeout(() => playBeep(1200, 0.15, 0.5), 200)
}

function playRestBeep() {
  // Low tone = rest
  playBeep(440, 0.3, 0.3)
}

function playDoneBeep() {
  // Ascending tones
  playBeep(880, 0.15, 0.4)
  setTimeout(() => playBeep(1100, 0.15, 0.4), 150)
  setTimeout(() => playBeep(1320, 0.25, 0.4), 300)
}

function vibrate(pattern: number | number[]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export function useTabataAudio() {
  const prevPhaseRef = useRef<TimerPhase>('idle')

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    getAudioContext()
  }, [])

  const onPhaseChange = useCallback((phase: TimerPhase) => {
    const prev = prevPhaseRef.current
    prevPhaseRef.current = phase

    if (prev === phase) return

    switch (phase) {
      case 'work':
        playWorkBeep()
        vibrate([100, 50, 100])
        break
      case 'rest':
        playRestBeep()
        vibrate(200)
        break
      case 'block_rest':
        playRestBeep()
        vibrate([200, 100, 200])
        break
      case 'done':
        playDoneBeep()
        vibrate([100, 50, 100, 50, 300])
        break
    }
  }, [])

  const onCountdownTick = useCallback((secondsLeft: number) => {
    if (secondsLeft > 0 && secondsLeft <= 3) {
      playCountdownBeep()
      vibrate(50)
    }
  }, [])

  // Also beep when 3 seconds left in work/rest
  const onTimerTick = useCallback((secondsLeft: number, phase: TimerPhase) => {
    if (secondsLeft <= 3 && secondsLeft > 0 && (phase === 'work' || phase === 'rest')) {
      playCountdownBeep()
      vibrate(30)
    }
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      prevPhaseRef.current = 'idle'
    }
  }, [])

  return { initAudio, onPhaseChange, onCountdownTick, onTimerTick }
}
