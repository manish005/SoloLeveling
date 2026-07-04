import { create } from 'zustand'
import type { UserProfile, UserStats, Skills, AppNotification } from '../types'

interface UserState {
  profile: UserProfile | null
  stats: UserStats | null
  skills: Skills | null
  notifications: AppNotification[]
  // Setters
  setProfile: (profile: UserProfile | null) => void
  setStats: (stats: UserStats | null) => void
  setSkills: (skills: Skills | null) => void
  setNotifications: (notifs: AppNotification[]) => void
  addNotification: (notif: AppNotification) => void
  markNotificationRead: (id: string) => void
  // Level-up tracking
  levelUpPending: boolean
  pendingLevel: number
  setLevelUp: (level: number) => void
  clearLevelUp: () => void
}

export const useUserStore = create<UserState>()((set) => ({
  profile: null,
  stats: null,
  skills: null,
  notifications: [],
  levelUpPending: false,
  pendingLevel: 0,

  setProfile: (profile) => set({ profile }),
  setStats: (stats) => set({ stats }),
  setSkills: (skills) => set({ skills }),
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notif) =>
    set((state) => ({ notifications: [notif, ...state.notifications].slice(0, 50) })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  setLevelUp: (level) => set({ levelUpPending: true, pendingLevel: level }),
  clearLevelUp: () => set({ levelUpPending: false, pendingLevel: 0 }),
}))
