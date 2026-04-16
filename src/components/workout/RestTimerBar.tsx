import { useTranslation } from 'react-i18next'
import { useRestTimer } from '../../hooks/useRestTimer'

export function RestTimerBar() {
  const { t } = useTranslation()
  const { secondsLeft, isRunning, stop } = useRestTimer()

  if (!isRunning) return null

  const mm = Math.floor(secondsLeft / 60)
  const ss = (secondsLeft % 60).toString().padStart(2, '0')

  return (
    <div className="fixed bottom-16 left-0 right-0 safe-bottom z-40">
      <div className="mx-auto max-w-lg px-4 pb-2">
        <div className="bg-[color:var(--color-accent-500)] text-surface-950 rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wide">
              {t('workout.rest_timer')}
            </span>
            <span className="text-2xl font-black tabular-nums">
              {mm}:{ss}
            </span>
          </div>
          <button
            onClick={stop}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-surface-950/15 hover:bg-surface-950/25"
          >
            {t('workout.skip_rest')}
          </button>
        </div>
      </div>
    </div>
  )
}
