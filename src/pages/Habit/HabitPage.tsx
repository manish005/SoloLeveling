import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Plus, X, CheckCircle2, Circle, Calendar, Flame, Trash2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns'

interface Habit {
  id: string
  name: string
  createdAt: number
  logs: string[] // array of YYYY-MM-DD strings
}

const STORAGE_KEY = 'solo_habits'

const loadHabits = (): Habit[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

const saveHabits = (habits: Habit[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits))
}

export const HabitPage = () => {
  const [habits, setHabits] = useState<Habit[]>(loadHabits)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [calendarDate, setCalendarDate] = useState(new Date())

  const today = format(new Date(), 'yyyy-MM-dd')

  const addHabit = () => {
    if (!newName.trim()) return
    const habit: Habit = { id: crypto.randomUUID(), name: newName.trim(), createdAt: Date.now(), logs: [] }
    const updated = [habit, ...habits]
    setHabits(updated)
    saveHabits(updated)
    setNewName('')
    setShowAdd(false)
  }

  const toggleDay = (habitId: string) => {
    const updated = habits.map(h => {
      if (h.id !== habitId) return h
      const has = h.logs.includes(today)
      return { ...h, logs: has ? h.logs.filter(d => d !== today) : [...h.logs, today] }
    })
    setHabits(updated)
    saveHabits(updated)
  }

  const deleteHabit = (habitId: string) => {
    const updated = habits.filter(h => h.id !== habitId)
    setHabits(updated)
    saveHabits(updated)
  }

  const getStreak = (logs: string[]): number => {
    if (logs.length === 0) return 0
    let streak = 0
    const d = new Date()
    while (logs.includes(format(d, 'yyyy-MM-dd'))) {
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  }

  const monthStart = startOfMonth(calendarDate)
  const monthEnd = endOfMonth(calendarDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = getDay(monthStart)
  const calendarDays = [...Array(startPadding).fill(null), ...daysInMonth]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">21 Days Habit</h1>
          <p className="text-sm text-gray-500">Build new habits — 21 days to form a routine.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary gap-2">
          <Plus size={16} /> {showAdd ? 'Cancel' : 'New Habit'}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass rounded-2xl overflow-hidden">
            <form onSubmit={e => { e.preventDefault(); addHabit() }} className="p-6 flex gap-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Habit name (e.g. Meditate 10min)" className="input-field flex-1" autoFocus />
              <button type="submit" className="btn-primary">Add Habit</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {habits.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <RefreshCw size={48} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No habits created yet</p>
          <p className="text-sm text-gray-600 mt-1">Add a habit to start your 21-day journey</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {habits.map(habit => {
            const streak = getStreak(habit.logs)
            const totalDone = habit.logs.length
            return (
              <motion.div key={habit.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-5 border border-white/[0.06]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm">{habit.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Flame size={12} className="text-orange-400" /> {streak} day streak</span>
                      <span>{totalDone}/21 days</span>
                    </div>
                  </div>
                  <button onClick={() => deleteHabit(habit.id)} className="p-1 rounded text-gray-600 hover:text-danger transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Mini 21-day progress */}
                <div className="flex gap-1 mb-3 flex-wrap">
                  {Array.from({ length: 21 }, (_, i) => {
                    const d = new Date()
                    d.setDate(d.getDate() - (20 - i))
                    const key = format(d, 'yyyy-MM-dd')
                    const done = habit.logs.includes(key)
                    return (
                      <div key={key} className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${
                        done ? 'bg-success/30 text-success' : 'bg-white/[0.04] text-gray-600'
                      }`}>
                        {done ? '✓' : ''}
                      </div>
                    )
                  })}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] mb-3 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-success transition-all"
                    style={{ width: `${Math.min(100, (totalDone / 21) * 100)}%` }} />
                </div>

                {/* Today's toggle */}
                <button onClick={() => toggleDay(habit.id)}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${
                    habit.logs.includes(today)
                      ? 'bg-success/20 text-success border border-success/30'
                      : 'bg-white/[0.04] text-gray-400 hover:text-white border border-white/[0.06]'
                  }`}>
                  {habit.logs.includes(today) ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  {habit.logs.includes(today) ? 'Done Today' : 'Mark Today'}
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
