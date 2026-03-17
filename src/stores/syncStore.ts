import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sync } from '../lib/sync'

interface SyncState {
  syncEnabled: boolean
  isSyncing: boolean
  lastSyncAt: string | null
  syncError: string | null

  setSyncEnabled: (enabled: boolean) => void
  triggerSync: () => Promise<void>
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      syncEnabled: false,
      isSyncing: false,
      lastSyncAt: null,
      syncError: null,

      setSyncEnabled: (enabled) => set({ syncEnabled: enabled }),

      triggerSync: async () => {
        const { isSyncing, syncEnabled } = get()
        if (isSyncing || !syncEnabled) return

        set({ isSyncing: true, syncError: null })

        try {
          const result = await sync(get().lastSyncAt)
          if (result.errors.length > 0) {
            set({
              syncError: result.errors[0],
              isSyncing: false,
              lastSyncAt: new Date().toISOString(),
            })
          } else {
            set({
              lastSyncAt: new Date().toISOString(),
              isSyncing: false,
              syncError: null,
            })
          }
        } catch (err) {
          set({
            syncError: err instanceof Error ? err.message : 'Sync failed',
            isSyncing: false,
          })
        }
      },
    }),
    { name: 'jagger-sync', partialize: (state) => ({
      syncEnabled: state.syncEnabled,
      lastSyncAt: state.lastSyncAt,
    }) },
  ),
)
