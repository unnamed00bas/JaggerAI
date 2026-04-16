import { useToastStore, type Toast } from '../../stores/toastStore'

const KIND_STYLES: Record<Toast['kind'], string> = {
  error: 'bg-red-950/90 border-red-800 text-red-100',
  success: 'bg-emerald-950/90 border-emerald-800 text-emerald-100',
  info: 'bg-surface-800/95 border-surface-600 text-surface-100',
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed top-2 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-[min(92vw,28rem)] safe-top"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`border rounded-xl px-3 py-2.5 shadow-lg text-sm backdrop-blur flex items-start gap-2 ${KIND_STYLES[t.kind]}`}
          role={t.kind === 'error' ? 'alert' : 'status'}
        >
          <span className="flex-1 whitespace-pre-wrap break-words">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="text-xs opacity-70 hover:opacity-100 px-1"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
