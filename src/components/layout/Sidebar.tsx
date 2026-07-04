import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, CheckSquare, Trophy,
  Calendar, Archive, Users,
  FileText, Bot, ShoppingBag, Settings, LogOut, ChevronLeft,
  Zap, Dumbbell,
} from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useUserStore } from '../../store/userStore'
import { useAuthStore } from '../../store/authStore'
import { logout } from '../../lib/auth'
import { cn } from '../../utils/cn'
import { RANK_COLORS } from '../../types'
import { xpProgress, xpInLevel, xpForLevel } from '../../services/xpService'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Quests', icon: CheckSquare, to: '/quests' },
  { label: 'Workout', icon: Dumbbell, to: '/workout' },
  { label: 'Achievements', icon: Trophy, to: '/achievements' },
  { label: 'Skills', icon: Zap, to: '/skills' },
  { label: 'Calendar', icon: Calendar, to: '/calendar' },
  { label: 'Inventory', icon: Archive, to: '/inventory' },
  { label: 'Leaderboard', icon: Users, to: '/leaderboard' },
  { label: 'Notes', icon: FileText, to: '/notes' },
  { label: 'AI Assistant', icon: Bot, to: '/assistant' },
  { label: 'Shop', icon: ShoppingBag, to: '/shop' },
]

const SETTINGS_ITEMS = [
  { label: 'Settings', icon: Settings, to: '/settings' },
]

export const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore()
  const { stats, profile } = useUserStore()
  const navigate = useNavigate()

  const rank = stats?.rank ?? 'E'
  const rankColor = RANK_COLORS[rank]
  const xpPct = stats ? xpProgress(stats.totalXpEarned) * 100 : 0
  const currentXp = stats ? xpInLevel(stats.totalXpEarned) : 0
  const neededXp = stats ? xpForLevel(stats.level) : 100

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-bg-secondary border-r border-white/[0.06] overflow-hidden"
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 border-b border-white/[0.06] shrink-0 transition-colors",
        sidebarCollapsed ? "justify-center" : "justify-between px-4"
      )}>
        <AnimatePresence mode="popLayout">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-primary-gradient flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg gradient-text tracking-tight">SoloLevel</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={toggleSidebarCollapse}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0 z-10"
          aria-label="Toggle Sidebar"
        >
          <motion.div
            animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.div>
        </button>
      </div>

      {/* User mini-card */}
      <AnimatePresence>
        {!sidebarCollapsed && stats && profile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-3 mt-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden"
                style={{ background: `${rankColor}30`, border: `2px solid ${rankColor}60`, color: rankColor }}
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (profile.firstName?.[0] || profile.name?.[0] || 'H').toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{profile.firstName || profile.name?.split(' ')[0] || 'Hunter'}</p>
                <p className="text-xs font-mono" style={{ color: rankColor }}>
                  Lv.{stats.level} • {rank}
                </p>
              </div>
            </div>
            {/* XP Bar */}
            <div className="space-y-0.5">
              <div className="xp-bar-track h-1.5">
                <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
              </div>
              <div className="flex justify-between text-2xs text-gray-600">
                <span>{currentXp.toLocaleString()} XP</span>
                <span>{neededXp.toLocaleString()} XP</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {({ isActive }) => (
              <div className={cn('sidebar-item', isActive && 'active')}>
                <item.icon className="w-4.5 h-4.5 shrink-0" size={18} />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-white/[0.06] space-y-0.5">
        {SETTINGS_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {({ isActive }) => (
              <div className={cn('sidebar-item', isActive && 'active')}>
                <item.icon size={18} className="shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </div>
            )}
          </NavLink>
        ))}
        <button onClick={handleLogout} className="sidebar-item w-full text-danger/70 hover:text-danger hover:bg-danger/10">
          <LogOut size={18} className="shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </motion.aside>
  )
}