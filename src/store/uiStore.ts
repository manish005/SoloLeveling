import { create } from 'zustand'

type ThemeMode = 'dark' | 'light'

interface UIState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  activeModal: string | null
  theme: 'dark' | 'darker' | 'blue' | 'purple'
  themeMode: ThemeMode
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebarCollapse: () => void
  openModal: (id: string) => void
  closeModal: () => void
  setTheme: (theme: UIState['theme']) => void
  toggleThemeMode: () => void
  setThemeMode: (mode: ThemeMode) => void
}

const getInitialThemeMode = (): ThemeMode => {
  const stored = localStorage.getItem('themeMode')
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeModal: null,
  theme: 'dark',
  themeMode: getInitialThemeMode(),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapse: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  setTheme: (theme) => set({ theme }),
  toggleThemeMode: () => set((s) => {
    const next = s.themeMode === 'dark' ? 'light' : 'dark'
    localStorage.setItem('themeMode', next)
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    return { themeMode: next }
  }),
  setThemeMode: (mode) => set(() => {
    localStorage.setItem('themeMode', mode)
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    return { themeMode: mode }
  }),
}))
