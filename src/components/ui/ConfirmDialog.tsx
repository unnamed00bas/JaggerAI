import { useEffect } from 'react'
import { create } from 'zustand'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'

interface ConfirmConfig {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

interface ConfirmState {
  open: boolean
  config: ConfirmConfig | null
  resolver: ((ok: boolean) => void) | null
  ask: (cfg: ConfirmConfig) => Promise<boolean>
  close: (ok: boolean) => void
}

const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  config: null,
  resolver: null,
  ask: (cfg) =>
    new Promise<boolean>((resolve) => {
      set({ open: true, config: cfg, resolver: resolve })
    }),
  close: (ok) => {
    const r = get().resolver
    set({ open: false, config: null, resolver: null })
    r?.(ok)
  },
}))

// eslint-disable-next-line react-refresh/only-export-components
export function confirmAsync(cfg: ConfirmConfig): Promise<boolean> {
  return useConfirmStore.getState().ask(cfg)
}

export function ConfirmDialogHost() {
  const { t } = useTranslation()
  const { open, config, close } = useConfirmStore()

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close(false)
      if (e.key === 'Enter') close(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  if (!open || !config) return null

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 flex items-end sm:items-center justify-center p-4"
      onClick={() => close(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-surface-900 border border-surface-700 rounded-2xl p-5 shadow-xl"
      >
        <h2 className="text-base font-semibold text-surface-100">{config.title}</h2>
        {config.message && (
          <p className="text-sm text-surface-400 mt-1.5">{config.message}</p>
        )}
        <div className="flex gap-2 mt-4">
          <Button
            variant="secondary"
            size="md"
            onClick={() => close(false)}
            className="flex-1"
          >
            {config.cancelLabel ?? t('common.cancel')}
          </Button>
          <Button
            size="md"
            onClick={() => close(true)}
            className={`flex-1 ${config.destructive ? '!bg-red-600 hover:!bg-red-700 !text-white' : ''}`}
          >
            {config.confirmLabel ?? t('common.continue')}
          </Button>
        </div>
      </div>
    </div>
  )
}
