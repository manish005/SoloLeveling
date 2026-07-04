import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useUserStore } from '../../store/userStore'
import { dbGet, PATHS } from '../../lib/database'
import type { AnalyticsHistory } from '../../types'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { Activity, BarChart3, TrendingUp } from 'lucide-react'

export const AnalyticsPage = () => {
  const { user } = useAuthStore()
  const { skills } = useUserStore()
  const [history, setHistory] = useState<AnalyticsHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    dbGet<Record<string, AnalyticsHistory>>(PATHS.analytics(user.uid)).then((data) => {
      if (data && data.history) {
        setHistory(Object.values(data.history))
      } else {
        // Fallback mockup data if history is empty
        setHistory([
          { date: 'Mon', xp: 120, level: 1, tasks: 2, coins: 50, questsCompleted: 2 },
          { date: 'Tue', xp: 250, level: 1, tasks: 4, coins: 80, questsCompleted: 3 },
          { date: 'Wed', xp: 480, level: 2, tasks: 7, coins: 120, questsCompleted: 5 },
          { date: 'Thu', xp: 550, level: 2, tasks: 8, coins: 140, questsCompleted: 6 },
          { date: 'Fri', xp: 750, level: 3, tasks: 11, coins: 210, questsCompleted: 8 },
          { date: 'Sat', xp: 900, level: 3, tasks: 13, coins: 250, questsCompleted: 9 },
          { date: 'Sun', xp: 1100, level: 4, tasks: 16, coins: 300, questsCompleted: 11 },
        ])
      }
      setLoading(false)
    })
  }, [user])

  // Map skills to format required by Recharts RadarChart
  const radarData = skills
    ? Object.entries(skills).map(([key, skill]) => ({
        subject: key.charAt(0).toUpperCase() + key.slice(1),
        A: skill.level * 10,
        fullMark: 100,
      }))
    : [
        { subject: 'Strength', A: 20, fullMark: 100 },
        { subject: 'Intelligence', A: 30, fullMark: 100 },
        { subject: 'Discipline', A: 40, fullMark: 100 },
        { subject: 'Focus', A: 50, fullMark: 100 },
        { subject: 'Charisma', A: 25, fullMark: 100 },
        { subject: 'Knowledge', A: 35, fullMark: 100 },
      ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">System Analytics</h1>
        <p className="text-sm text-gray-500">Analyze your training patterns and XP progression.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-2xl" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* XP Line Graph */}
          <div className="glass p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-primary" size={18} />
              <h3 className="font-bold text-white">XP Progression</h3>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0D1117', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    labelStyle={{ color: '#9CA3AF', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="xp" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorXp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quests Completion Bar Graph */}
          <div className="glass p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-accent" size={18} />
              <h3 className="font-bold text-white">Quests Completed</h3>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0D1117', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    labelStyle={{ color: '#9CA3AF', fontSize: '12px' }}
                  />
                  <Bar dataKey="questsCompleted" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart (Ability Grid) */}
          <div className="glass p-6 space-y-4 lg:col-span-2 flex flex-col items-center">
            <div className="flex items-center gap-2 self-start">
              <Activity className="text-cyan" size={18} />
              <h3 className="font-bold text-white">Ability Graph</h3>
            </div>
            <div className="h-80 w-full max-w-md">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4B5563" style={{ fontSize: '10px' }} />
                  <Radar name="Ability Value" dataKey="A" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
