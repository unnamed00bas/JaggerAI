import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabase } from '../lib/sync/supabaseClient'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null

  initialize: () => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    const supabase = getSupabase()
    if (!supabase) {
      set({ isLoading: false })
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    set({
      user: session?.user ?? null,
      session,
      isLoading: false,
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        session,
      })
    })
  },

  signUp: async (email, password) => {
    const supabase = getSupabase()
    if (!supabase) return
    set({ error: null, isLoading: true })

    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      set({ error: error.message, isLoading: false })
    } else {
      set({ isLoading: false })
    }
  },

  signIn: async (email, password) => {
    const supabase = getSupabase()
    if (!supabase) return
    set({ error: null, isLoading: true })

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ error: error.message, isLoading: false })
    } else {
      set({ user: data.user, session: data.session, isLoading: false })
    }
  },

  signOut: async () => {
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  clearError: () => set({ error: null }),
}))
