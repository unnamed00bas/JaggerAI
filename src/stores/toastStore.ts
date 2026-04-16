import { create } from 'zustand'

export type ToastKind = 'error' | 'success' | 'info'

export interface Toast {
  id: string
  kind: ToastKind
  message: string
  /** ms, 0 = sticky */
  duration: number
}

interface ToastState {
  toasts: Toast[]
  show: (kind: ToastKind, message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  success: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
  dismiss: (id: string) => void
  clear: () => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: (kind, message, duration = 4000) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, kind, message, duration }] }))
    if (duration > 0) {
      setTimeout(() => get().dismiss(id), duration)
    }
    return id
  },

  error: (message, duration = 6000) => get().show('error', message, duration),
  success: (message, duration = 3000) => get().show('success', message, duration),
  info: (message, duration = 4000) => get().show('info', message, duration),

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}))
