import { motion } from 'framer-motion'
import { useUserStore } from '../../store/userStore'
import { Zap, Flame, Shield, Award, Calendar, Trophy, Star } from 'lucide-react'
import { RANK_COLORS, RANK_TITLES } from '../../types'

export const StatsPage = () => {
  const { stats, profile } = useUserStore()

  const rank = stats?.rank ?? 'E'
  const rankColor = RANK_COLORS[rank]
  const title = RANK_TITLES[rank]

  const metrics = [
    { label: 'Current Level', value: stats?.level ?? 1, icon: Zap, color: '#3B82F6' },
    { label: 'System Rank', value: rank, icon: Shield, color: rankColor },
    { label: 'Active Streak', value: `${stats?.currentStreak ?? 0} days`, icon: Flame, color: '#F97316' },
    { label: 'Longest Streak', value: `${stats?.longestStreak ?? 0} days`, icon: Award, color: '#10B981' },
    { label: 'Total Quests', value: stats?.totalQuestsCompleted ?? 0, icon: Trophy, color: '#8B5CF6' },
    { label: 'Total XP Earned', value: (stats?.totalXpEarned ?? 0).toLocaleString(), icon: Star, color: '#F59E0B' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Hunter Statistics</h1>
        <p className="text-sm text-gray-500">Historical logs and performance data compiled by the System.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass p-6 flex flex-col justify-between h-36 relative overflow-hidden"
            style={{ borderColor: `${m.color}20` }}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{m.label}</span>
              <m.icon size={20} style={{ color: m.color }} />
            </div>
            <div className="text-2xl font-black text-white mt-4">{m.value}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
