import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { useAuthStore } from '../../store/authStore'
import { dbGet, PATHS } from '../../lib/database'
import type { CalendarDay } from '../../types'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react'

export const CalendarPage = () => {
  const { user } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<Record<string, CalendarDay>>({})
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    dbGet<Record<string, CalendarDay>>(PATHS.calendar(user.uid)).then((data) => {
      setCalendarData(data || {})
      setLoading(false)
    })
  }, [user])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))

  const handleDayClick = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd')
    const dayData = calendarData[key] || {
      date: key,
      tasksCompleted: 0,
      xpEarned: 0,
      questsCompleted: 0,
      streakDay: false,
    }
    setSelectedDay(dayData)
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 glass p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-primary" size={20} />
            <h2 className="text-xl font-black text-white">{format(currentDate, 'MMMM yyyy')}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="btn-secondary !p-2 rounded-lg">
              <ChevronLeft size={16} />
            </button>
            <button onClick={nextMonth} className="btn-secondary !p-2 rounded-lg">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-500">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>

        {/* Calendar days */}
        {loading ? (
          <div className="skeleton h-80 w-full" />
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {days.map((day: Date, idx: number) => {
              const key = format(day, 'yyyy-MM-dd')
              const info = calendarData[key]
              const hasActivity = info && info.xpEarned > 0
              const isCurrentMonth = isSameMonth(day, currentDate)

              return (
                <button
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square p-1 rounded-xl flex flex-col items-center justify-between border text-xs font-mono relative transition-all ${
                    !isCurrentMonth ? 'opacity-25 border-transparent' : 'border-white/[0.04]'
                  } ${isToday(day) ? 'bg-primary/10 border-primary/40 text-primary-400 font-bold' : ''} ${
                    hasActivity ? 'bg-success/5 border-success/20 hover:bg-success/15' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="self-start m-1">{day.getDate()}</span>
                  {hasActivity && (
                    <div className="w-1.5 h-1.5 rounded-full bg-success mb-1" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected Day View / Details */}
      <div className="glass p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Day Details</h3>
          {selectedDay ? (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-primary mb-2">
                {format(new Date(selectedDay.date), 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-xs text-gray-400">XP Gained</span>
                  <span className="text-sm font-bold text-primary font-mono">+{selectedDay.xpEarned} XP</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-xs text-gray-400">Quests Completed</span>
                  <span className="text-sm font-bold text-white font-mono">{selectedDay.questsCompleted}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-xs text-gray-400">Streak Active</span>
                  <span className="text-sm font-bold text-orange-400 font-mono">
                    {selectedDay.questsCompleted > 0 ? '🔥 Yes' : '❌ No'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Select a day on the calendar to see detailed statistics and log metrics.</p>
          )}
        </div>

        {/* Git-like heatmap mock / info */}
        <div className="mt-6 border-t border-white/[0.06] pt-6">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">XP Intensity</h4>
          <div className="flex gap-1.5 items-center">
            <span className="text-2xs text-gray-500">Less</span>
            <div className="w-3.5 h-3.5 rounded bg-white/[0.06]" />
            <div className="w-3.5 h-3.5 rounded bg-success/20" />
            <div className="w-3.5 h-3.5 rounded bg-success/40" />
            <div className="w-3.5 h-3.5 rounded bg-success/60" />
            <div className="w-3.5 h-3.5 rounded bg-success" />
            <span className="text-2xs text-gray-500">More</span>
          </div>
        </div>
      </div>
    </div>
  )
}
