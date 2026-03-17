import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import { useSyncStore } from '../../stores/syncStore'
import { isSupabaseConfigured } from '../../lib/sync'
import { Card } from '../ui/Card'

export function SyncSection() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { syncEnabled, setSyncEnabled, isSyncing, lastSyncAt, syncError, triggerSync } = useSyncStore()

  if (!isSupabaseConfigured() || !user) return null

  function formatLastSync(): string {
    if (!lastSyncAt) return t('sync.never')
    const diff = Date.now() - new Date(lastSyncAt).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return t('sync.justNow')
    if (minutes < 60) return t('sync.minutesAgo', { count: minutes })
    const hours = Math.floor(minutes / 60)
    return t('sync.hoursAgo', { count: hours })
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold">{t('settings.sync')}</h2>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {formatLastSync()}
          </p>
        </div>
        <button
          onClick={() => setSyncEnabled(!syncEnabled)}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            syncEnabled
              ? 'bg-primary-500'
              : 'bg-surface-300 dark:bg-surface-600'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
              syncEnabled ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {syncError && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-2">{syncError}</p>
      )}

      {syncEnabled && (
        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="w-full py-2 rounded-xl border-2 border-surface-200 dark:border-surface-600 text-sm font-medium disabled:opacity-50"
        >
          {isSyncing ? t('sync.syncing') : t('sync.syncNow')}
        </button>
      )}
    </Card>
  )
}
