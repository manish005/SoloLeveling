import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Search, Menu, Moon, Sun, Coins,
  ChevronDown, Settings, User, Palette, MessageCircle,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'
import { useUserStore } from '../../store/userStore'
import { RANK_COLORS } from '../../types'
import { xpProgress, xpInLevel, xpForLevel } from '../../services/xpService'
import { cn } from '../../utils/cn'
import { ThemeToggle } from '../ui/ThemeToggle'

export const Header = () => {
  const { toggleSidebar, themeMode } = useUIStore()
  const { stats, profile, notifications } = useUserStore()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const rank = stats?.rank ?? 'E'
  const rankColor = RANK_COLORS[rank]
  const unread = notifications.filter((n) => !n.read).length
  const xpPct = stats ? xpProgress(stats.totalXpEarned) * 100 : 0
  const currentXp = stats ? xpInLevel(stats.totalXpEarned) : 0
  const neededXp = stats ? xpForLevel(stats.level) : 100

  return (
    <header className="fixed top-0 right-0 left-0 h-16 z-30 flex items-center px-4 gap-4 border-b border-white/[0.06] dark:border-white/[0.06]"
      style={{ background: themeMode === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(5,7,13,0.85)', backdropFilter: 'blur(20px)' }}>

      {/* Sidebar toggle */}
      <button onClick={toggleSidebar} className="btn-ghost p-2 rounded-lg">
        <Menu size={20} />
      </button>

      <div className="ml-auto flex items-center gap-2">
        {/* Coins */}
        {stats && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-yellow-500/20 bg-yellow-500/10">
            <span className="text-yellow-400">🪙</span>
            <span className="text-sm font-bold text-yellow-400">{stats.coins.toLocaleString()}</span>
          </div>
        )}

        {/* XP / Level */}
        {stats && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03]">
            <div className="text-right">
              <p className="text-2xs text-gray-500 leading-none">Level</p>
              <p className="text-sm font-bold leading-none" style={{ color: rankColor }}>
                {stats.level} <span className="text-2xs font-mono opacity-70">{rank}</span>
              </p>
            </div>
            <div className="w-20">
              <div className="xp-bar-track h-1.5">
                <div className="xp-bar-fill transition-all" style={{ width: `${xpPct}%` }} />
              </div>
              <p className="text-2xs text-gray-600 mt-0.5">{currentXp}/{neededXp} XP</p>
            </div>
          </div>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false) }}
            className="btn-ghost p-2 relative"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-danger text-white text-2xs flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 glass rounded-2xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  <span className="text-2xs text-gray-500">{unread} unread</span>
                </div>
                <div className="max-h-72 overflow-y-auto no-scrollbar">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 text-center">No notifications yet</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div key={n.id} className={cn(
                        'p-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors',
                        !n.read && 'bg-primary/5'
                      )}>
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false) }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/[0.05] transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden"
              style={{ background: `${rankColor}30`, border: `2px solid ${rankColor}60`, color: rankColor }}
            >
              {profile?.avatar ? (
                <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                (profile?.firstName?.[0] || profile?.name?.[0] || 'H').toUpperCase()
              )}
            </div>
            <ChevronDown size={14} className="text-gray-500" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-52 glass rounded-2xl overflow-hidden z-50"
              >
                <div className="p-3 border-b border-white/[0.06]">
                  <p className="font-semibold text-sm">{profile?.firstName || profile?.name?.split(' ')[0] || 'Hunter'} {profile?.lastName || ''}</p>
                  <p className="text-xs text-gray-500">@{profile?.username}</p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  <Link to="/profile" onClick={() => setShowProfile(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/[0.05] transition-colors">
                    <User size={15} /> Profile
                  </Link>
                  <Link to="/settings" onClick={() => setShowProfile(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/[0.05] transition-colors">
                    <Settings size={15} /> Settings
                  </Link>
                  <Link to="/settings" onClick={() => setShowProfile(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/[0.05] transition-colors">
                    <Palette size={15} /> Appearance
                  </Link>
                  <Link to="/settings" onClick={() => setShowProfile(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/[0.05] transition-colors">
                    <MessageCircle size={15} /> Support
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
