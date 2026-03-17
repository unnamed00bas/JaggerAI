import { useSyncStore } from '../../stores/syncStore'
import { useAuthStore } from '../../stores/authStore'

export function SyncIndicator() {
  const { syncEnabled, isSyncing, syncError } = useSyncStore()
  const { user } = useAuthStore()

  if (!user || !syncEnabled) return null

  if (isSyncing) {
    return (
      <span className="inline-block w-4 h-4 text-primary-500 animate-spin" title="Syncing...">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </span>
    )
  }

  if (syncError) {
    return (
      <span className="inline-block w-4 h-4 text-amber-500" title={syncError}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        </svg>
      </span>
    )
  }

  return (
    <span className="inline-block w-4 h-4 text-green-500" title="Synced">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 13l4 4L19 7" />
      </svg>
    </span>
  )
}
