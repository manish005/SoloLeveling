import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from 'firebase/auth'
import { onAuthChange } from '../lib/auth'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  initAuth: () => () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      initialized: false,

      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),

      initAuth: () => {
        const unsubscribe = onAuthChange((user) => {
          set({ user, loading: false, initialized: true })
        })
        return unsubscribe
      },
    }),
    {
      name: 'sl-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
