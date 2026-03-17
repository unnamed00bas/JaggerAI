import { useEffect } from 'react'
import { useSyncStore } from '../stores/syncStore'
import { useAuthStore } from '../stores/authStore'

export function useSyncOnReconnect() {
  const { syncEnabled, triggerSync } = useSyncStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!syncEnabled || !user) return

    // Sync on app load
    triggerSync()

    // Sync when coming back online
    function handleOnline() {
      triggerSync()
    }

    // Sync when tab becomes visible again
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        triggerSync()
      }
    }

    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [syncEnabled, user, triggerSync])
}
