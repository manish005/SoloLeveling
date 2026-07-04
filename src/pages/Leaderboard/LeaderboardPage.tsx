import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { dbGet, PATHS } from '../../lib/database'
import type { LeaderboardEntry } from '../../types'
import { Trophy, Shield, Zap, Search } from 'lucide-react'
import { RANK_COLORS } from '../../types'

export const LeaderboardPage = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dbGet<Record<string, LeaderboardEntry>>(PATHS.leaderboard()).then((data) => {
      if (data) {
        setEntries(
          Object.values(data).sort((a, b) => b.xp - a.xp)
        )
      } else {
        // Mock entries if database has no records
        setEntries([
          { uid: '1', name: 'Sung Jinwoo', username: 'monarch', level: 99, rank: 'Monarch', xp: 58000, currentStreak: 32, updatedAt: Date.now() },
          { uid: '2', name: 'Thomas Andre', username: 'goliath', level: 95, rank: 'National', xp: 49000, currentStreak: 25, updatedAt: Date.now() },
          { uid: '3', name: 'Cha Hae-In', username: 'sword_dance', level: 85, rank: 'S', xp: 32000, currentStreak: 18, updatedAt: Date.now() },
          { uid: '4', name: 'Chae Min-Byeong', username: 'shadow_hunter', level: 75, rank: 'A', xp: 22000, currentStreak: 12, updatedAt: Date.now() },
          { uid: '5', name: 'Lee Joohee', username: 'healer', level: 12, rank: 'B', xp: 1200, currentStreak: 4, updatedAt: Date.now() },
        ])
      }
      setLoading(false)
    })
  }, [])

  const filteredEntries = entries.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.username.toLowerCase().includes(search.toLowerCase())
  )

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-400'
      case 1: return 'text-gray-400'
      case 2: return 'text-amber-600'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Global Leaderboard</h1>
          <p className="text-sm text-gray-500">Compete with Hunters worldwide. Top ranks represent the absolute elite.</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search hunters..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-80 rounded-2xl" />
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 w-20 text-center">Rank</th>
                  <th className="p-4">Hunter</th>
                  <th className="p-4 text-center">Level</th>
                  <th className="p-4 text-center">System Rank</th>
                  <th className="p-4 text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-sm">
                {filteredEntries.map((entry, index) => {
                  const rankColor = RANK_COLORS[entry.rank]
                  return (
                    <motion.tr
                      key={entry.uid}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-4 text-center font-bold font-mono">
                        {index < 3 ? (
                          <Trophy className={`inline ${getMedalColor(index)}`} size={18} />
                        ) : (
                          index + 1
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                            style={{ background: `${rankColor}20`, border: `2px solid ${rankColor}50`, color: rankColor }}
                          >
                            {entry.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{entry.name}</div>
                            <div className="text-xs text-gray-500">@{entry.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono text-white font-semibold">Lv.{entry.level}</td>
                      <td className="p-4 text-center">
                        <span className="rank-badge" style={{ background: `${rankColor}15`, color: rankColor, border: `1px solid ${rankColor}30` }}>
                          {entry.rank}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-primary font-bold">
                        {entry.xp.toLocaleString()} XP
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
