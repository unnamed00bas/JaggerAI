import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { useTheme } from '../../hooks/useTheme'

export function AppShell() {
  useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const onCoach = location.pathname.startsWith('/coach')

  return (
    <div className="min-h-dvh bg-surface-950 text-surface-50">
      <main className="max-w-lg mx-auto px-4 pt-4 pb-24 safe-top">
        <Outlet />
      </main>

      {!onCoach && (
        <button
          onClick={() => navigate('/coach')}
          aria-label="AI coach"
          className="fixed bottom-20 right-4 safe-bottom z-40 w-14 h-14 rounded-full bg-[color:var(--color-accent-500)] text-surface-950 shadow-lg flex items-center justify-center active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}

      <BottomNav />
    </div>
  )
}
