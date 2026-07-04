import { motion } from 'framer-motion'
import { useUserStore } from '../../store/userStore'
import { useAuthStore } from '../../store/authStore'
import { ACHIEVEMENTS, checkAchievements } from '../../services/xpService'
import { dbGet, dbSet, dbUpdate, PATHS } from '../../lib/database'
import { useState, useEffect } from 'react'
import type { AchievementDefinition } from '../../types'
import { Lock, Trophy, Star, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

const RARITY_COLORS = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
}

const CATEGORY_LABELS = {
  streak: '🔥 Streak', xp: '⭐ XP', level: '📈 Level',
  tasks: '✅ Tasks', skill: '🎯 Skill', quest: '📜 Quest',
  social: '👥 Social', special: '✨ Special',
}

export const AchievementsPage = () => {
  const { user } = useAuthStore()
  const { stats, skills } = useUserStore()
  const [unlockedIds, setUnlockedIds] = useState<string[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    dbGet<Record<string, { unlockedAt: number }>>(PATHS.achievements(user.uid)).then((data) => {
      setUnlockedIds(data ? Object.keys(data) : [])
      setLoading(false)
    })
  }, [user])

  // Auto-check and unlock new achievements
  useEffect(() => {
    if (!user || !stats || !skills || loading) return
    const newOnes = checkAchievements(stats, skills, unlockedIds)
    if (newOnes.length === 0) return
    const updates: Record<string, unknown> = {}
    newOnes.forEach(a => { updates[a.id] = { unlockedAt: Date.now() } })
    dbUpdate(PATHS.achievements(user.uid), updates)
    setUnlockedIds(prev => [...prev, ...newOnes.map(a => a.id)])
    newOnes.forEach(a => toast.success(`Achievement unlocked: ${a.title}! 🏆`, { duration: 5000 }))
  }, [stats, skills, loading])

  const categories = ['all', ...Object.keys(CATEGORY_LABELS)]
  const filtered = ACHIEVEMENTS.filter(a =>
    filter === 'all' || a.category === filter
  ).sort((a, b) => {
    const aU = unlockedIds.includes(a.id) ? 0 : 1
    const bU = unlockedIds.includes(b.id) ? 0 : 1
    return aU - bU
  })

  const unlockedCount = ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id)).length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Achievements</h1>
          <p className="text-sm text-gray-500">{unlockedCount} / {ACHIEVEMENTS.length} unlocked</p>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
              transition={{ duration: 1 }} />
          </div>
          <span className="text-sm font-bold text-primary">{Math.round(unlockedCount / ACHIEVEMENTS.length * 100)}%</span>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize ${
              filter === cat
                ? 'bg-primary/20 text-white border border-primary/40'
                : 'text-gray-500 border border-white/[0.06] hover:text-white hover:border-white/20'
            }`}>
            {cat === 'all' ? '🏆 All' : CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {filtered.map((achievement) => {
            const isUnlocked = unlockedIds.includes(achievement.id)
            const rarityColor = RARITY_COLORS[achievement.rarity]
            return (
              <motion.div
                key={achievement.id}
                variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
                className="relative glass rounded-2xl p-5 flex flex-col items-center text-center overflow-hidden transition-all duration-300"
                style={{
                  borderColor: isUnlocked ? `${rarityColor}40` : 'rgba(255,255,255,0.05)',
                  opacity: isUnlocked ? 1 : 0.5,
                  boxShadow: isUnlocked ? `0 0 20px ${rarityColor}20` : 'none',
                }}
              >
                {/* Rarity glow */}
                {isUnlocked && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ background: `radial-gradient(circle at top, ${rarityColor}15, transparent 70%)` }} />
                )}

                {/* Lock overlay */}
                {!isUnlocked && (
                  <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-bg-primary/40 backdrop-blur-sm z-10">
                    <Lock size={20} className="text-gray-600" />
                  </div>
                )}

                {/* Rarity badge */}
                <div className="absolute top-3 right-3 text-2xs font-bold px-2 py-0.5 rounded capitalize"
                  style={{ background: `${rarityColor}20`, color: rarityColor }}>
                  {achievement.rarity}
                </div>

                {/* Icon */}
                <div className="text-4xl mb-3 relative z-0">{achievement.icon}</div>

                {/* Info */}
                <h3 className="font-bold text-sm text-white mb-1">{achievement.title}</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{achievement.description}</p>

                {/* Rewards */}
                <div className="flex gap-3 text-xs font-mono mt-auto">
                  <span className="text-primary">+{achievement.xpReward}XP</span>
                  <span className="text-yellow-500">+{achievement.coinReward}🪙</span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
