import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { useTheme } from '../../hooks/useTheme'

export function AppShell() {
  useTheme()

  return (
    <div className="min-h-dvh bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50">
      <main className="max-w-lg mx-auto px-4 pt-4 pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
