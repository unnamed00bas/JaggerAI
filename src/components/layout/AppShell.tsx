import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { SyncIndicator } from './SyncIndicator'
import { useTheme } from '../../hooks/useTheme'
import { useSyncOnReconnect } from '../../hooks/useSyncOnReconnect'
import { useAuthStore } from '../../stores/authStore'

export function AppShell() {
  useTheme()
  useSyncOnReconnect()

  const initialize = useAuthStore((s) => s.initialize)
  useEffect(() => { initialize() }, [initialize])

  return (
    <div className="min-h-dvh bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50">
      <div className="max-w-lg mx-auto px-4 pt-2 flex justify-end">
        <SyncIndicator />
      </div>
      <main className="max-w-lg mx-auto px-4 pt-2 pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
