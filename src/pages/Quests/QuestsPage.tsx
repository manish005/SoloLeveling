import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, CheckCircle2, Circle, Trash2, Filter, Zap, Clock, Star, X,
  Calendar, ChevronLeft, ChevronRight, ListTodo, Edit3, AlertCircle,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUserStore } from '../../store/userStore'
import { dbGet, dbSet, dbPush, dbUpdate, dbSubscribe, PATHS } from '../../lib/database'
import { completeQuest as completeQuestService, deleteQuest } from '../../services/questService'
import { DIFFICULTY_COLORS } from '../../types'
import type { Quest, QuestType, QuestDifficulty, QuestCategory, QuestChecklistItem } from '../../types'
import toast from 'react-hot-toast'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { Select } from '../../components/ui/Select'

const DIFFICULTY_LABELS: { value: QuestDifficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'epic', label: 'Epic' },
  { value: 'legendary', label: 'Legendary' },
]

const QUEST_TYPES: { value: QuestType; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const CATEGORIES: { value: QuestCategory; label: string; icon: string }[] = [
  { value: 'health', label: 'Health', icon: '❤️' },
  { value: 'fitness', label: 'Fitness', icon: '💪' },
  { value: 'study', label: 'Study', icon: '📚' },
  { value: 'coding', label: 'Coding', icon: '💻' },
  { value: 'trading', label: 'Trading', icon: '📈' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'spiritual', label: 'Spiritual', icon: '🧘' },
  { value: 'career', label: 'Career', icon: '🎯' },
  { value: 'reading', label: 'Reading', icon: '📖' },
  { value: 'meditation', label: 'Meditation', icon: '🌿' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'custom', label: 'Custom', icon: '⭐' },
]

interface QuestFormData {
  title: string
  description: string
  questType: QuestType
  difficulty: QuestDifficulty
  category: QuestCategory
  dueDate?: string
  startDate?: string
  repeat: 'none' | 'daily' | 'weekly' | 'monthly'
  reminder: boolean
}

const REPEAT_OPTIONS = [
  { value: 'none', label: 'No Repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export const QuestsPage = () => {
  const { user } = useAuthStore()
  const [allQuests, setAllQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all')
  const [typeFilter, setTypeFilter] = useState<QuestType | 'all'>('all')
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [calendarQuests, setCalendarQuests] = useState<{ date: Date; quests: Quest[] } | null>(null)

  // Form state
  const [formData, setFormData] = useState<QuestFormData>({
    title: '',
    description: '',
    questType: 'daily',
    difficulty: 'medium',
    category: 'custom',
    dueDate: '',
    startDate: '',
    repeat: 'none',
    reminder: false,
  })
  const [checklistItems, setChecklistItems] = useState<{ text: string }[]>([])
  const [newCheckItem, setNewCheckItem] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadQuests = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const types: QuestType[] = ['daily', 'weekly', 'monthly']
      const results = await Promise.all(
        types.map(async (t) => {
          const data = await dbGet<Record<string, Quest>>(PATHS.quests(user.uid, t))
          if (!data) return []
          return Object.entries(data).map(([id, q]) => ({ ...q, id }))
        })
      )
      setAllQuests(results.flat().sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)))
    } catch { /* ignore */ }
    setLoading(false)
  }, [user])

  useEffect(() => { loadQuests() }, [loadQuests])

  const xpForDifficulty = (d: QuestDifficulty) =>
    ({ easy: 25, medium: 75, hard: 150, epic: 300, legendary: 600 })[d] ?? 75
  const coinsForDifficulty = (d: QuestDifficulty) =>
    ({ easy: 10, medium: 25, hard: 50, epic: 100, legendary: 250 })[d] ?? 25

  const handleComplete = async (quest: Quest) => {
    if (!user || quest.completed) return
    try {
      const result = await completeQuestService(user.uid, quest)
      setAllQuests(prev => prev.map(q => q.id === quest.id ? { ...q, completed: true, completedAt: Date.now() } : q))
      toast.success(`+${quest.xpReward} XP • +${quest.coinReward} coins`, { icon: '⚡' })
      if (result.leveledUp) {
        useUserStore.getState().setLevelUp(result.newLevel)
      }
    } catch {
      toast.error('Failed to complete quest')
    }
  }

  const handleDelete = async (quest: Quest) => {
    if (!user) return
    await deleteQuest(user.uid, quest.type, quest.id)
    setAllQuests(prev => prev.filter(q => q.id !== quest.id))
    setSelectedQuest(null)
    toast.success('Quest removed')
  }

  const addChecklistItem = () => {
    if (!newCheckItem.trim()) return
    setChecklistItems(prev => [...prev, { text: newCheckItem.trim() }])
    setNewCheckItem('')
  }

  const removeChecklistItem = (index: number) => {
    setChecklistItems(prev => prev.filter((_, i) => i !== index))
  }

  const toggleChecklistItem = async (quest: Quest, itemId: string) => {
    if (!user || quest.completed) return
    const updatedChecklist = quest.checklist?.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ) ?? []
    const allComplete = updatedChecklist.every(i => i.completed)

    await dbUpdate(PATHS.quest(user.uid, quest.type, quest.id), {
      checklist: updatedChecklist,
      ...(allComplete ? { completed: true, completedAt: Date.now() } : {}),
    })

    setAllQuests(prev => prev.map(q =>
      q.id === quest.id ? { ...q, checklist: updatedChecklist, ...(allComplete ? { completed: true, completedAt: Date.now() } : {}) } : q
    ))

    if (allComplete && !quest.completed) {
      const updatedQuest = { ...quest, checklist: updatedChecklist, completed: true }
      try {
        const result = await completeQuestService(user.uid, updatedQuest)
        toast.success(`All tasks done! +${quest.xpReward} XP • +${quest.coinReward} coins`, { icon: '🎉' })
        if (result.leveledUp) {
          useUserStore.getState().setLevelUp(result.newLevel)
        }
      } catch { /* toast already shown */ }
    }

    if (selectedQuest && selectedQuest.id === quest.id) {
      const sq = allQuests.find(q => q.id === quest.id)
      if (sq) setSelectedQuest(sq)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.title.trim()) {
      toast.error('Quest title is required')
      return
    }
    setSubmitting(true)
    try {
      const questData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.questType,
        difficulty: formData.difficulty,
        category: formData.category,
        xpReward: xpForDifficulty(formData.difficulty),
        coinReward: coinsForDifficulty(formData.difficulty),
        isCustom: true,
        dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
        startDate: formData.startDate ? new Date(formData.startDate).getTime() : undefined,
        repeat: formData.repeat,
        reminder: formData.reminder,
        checklist: checklistItems.length > 0
          ? checklistItems.map(item => ({ id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), text: item.text, completed: false }))
          : undefined,
      }
      const newId = await dbPush(PATHS.quests(user.uid, formData.questType), {
        ...questData,
        completed: false,
        createdAt: Date.now(),
      })
      toast.success('Quest created!')
      setFormData({ title: '', description: '', questType: 'daily', difficulty: 'medium', category: 'custom', dueDate: '', startDate: '', repeat: 'none', reminder: false })
      setChecklistItems([])
      setShowAdd(false)
      setAllQuests(prev => [{ id: newId, ...questData, completed: false, createdAt: Date.now() } as unknown as Quest, ...prev])
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create quest')
    }
    setSubmitting(false)
  }

  const filteredQuests = useMemo(() => {
    let qs = allQuests
    if (typeFilter !== 'all') qs = qs.filter(q => q.type === typeFilter)
    if (filter === 'pending') qs = qs.filter(q => !q.completed)
    else if (filter === 'done') qs = qs.filter(q => q.completed)
    return qs
  }, [allQuests, typeFilter, filter])

  const stats = useMemo(() => ({
    total: allQuests.length,
    completed: allQuests.filter(q => q.completed).length,
    pending: allQuests.filter(q => !q.completed).length,
  }), [allQuests])

  // Mini Calendar
  const monthStart = startOfMonth(calendarDate)
  const monthEnd = endOfMonth(calendarDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = getDay(monthStart)

  const questDateMap = useMemo(() => {
    const map = new Map<string, { total: number; completed: number; missed: number }>()
    allQuests.forEach(q => {
      const dateKey = q.dueDate ? format(new Date(q.dueDate), 'yyyy-MM-dd') : null
      if (dateKey) {
        const entry = map.get(dateKey) ?? { total: 0, completed: 0, missed: 0 }
        entry.total++
        if (q.completed) entry.completed++
        else if (q.dueDate && q.dueDate < Date.now()) entry.missed++
        map.set(dateKey, entry)
      }
    })
    return map
  }, [allQuests])

  const calendarDays = useMemo(() => {
    const days: { date: Date; quests: { total: number; completed: number; missed: number } }[] = []
    for (let i = 0; i < startPadding; i++) {
      days.push({ date: new Date(0), quests: { total: 0, completed: 0, missed: 0 } })
    }
    daysInMonth.forEach(d => {
      const key = format(d, 'yyyy-MM-dd')
      const q = questDateMap.get(key) ?? { total: 0, completed: 0, missed: 0 }
      days.push({ date: d, quests: q })
    })
    return days
  }, [daysInMonth, startPadding, questDateMap])

  const handleDateClick = (date: Date) => {
    if (date.getTime() === 0) return
    const key = format(date, 'yyyy-MM-dd')
    const questsForDay = allQuests.filter(q => {
      if (!q.dueDate) return false
      return format(new Date(q.dueDate), 'yyyy-MM-dd') === key
    })
    setCalendarQuests({ date, quests: questsForDay })
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Quests</h1>
          <p className="text-sm text-gray-500">{stats.pending} pending • {stats.completed} completed</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
            {(['all', 'pending', 'done'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filter === f ? 'bg-primary/20 text-white' : 'text-gray-500 hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary gap-2">
            <Plus size={16} /> {showAdd ? 'Cancel' : 'New Quest'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Quest Creation Form */}
          <AnimatePresence>
            {showAdd && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass rounded-2xl overflow-hidden"
              >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Plus size={18} className="text-primary" /> Create New Quest
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <input
                        value={formData.title}
                        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Quest title *"
                        className="input-field"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <textarea
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description (optional)"
                        className="input-field resize-none" rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Quest Type</label>
                      <Select
                        value={formData.questType}
                        onChange={value => setFormData(prev => ({ ...prev, questType: value as QuestType }))}
                        options={QUEST_TYPES}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Difficulty</label>
                      <Select
                        value={formData.difficulty}
                        onChange={value => setFormData(prev => ({ ...prev, difficulty: value as QuestDifficulty }))}
                        options={DIFFICULTY_LABELS}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Category</label>
                      <Select
                        value={formData.category}
                        onChange={value => setFormData(prev => ({ ...prev, category: value as QuestCategory }))}
                        options={CATEGORIES.map(c => ({ value: c.value, label: `${c.icon} ${c.label}` }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Repeat</label>
                      <Select
                        value={formData.repeat}
                        onChange={value => setFormData(prev => ({ ...prev, repeat: value as 'none' | 'daily' | 'weekly' | 'monthly' }))}
                        options={REPEAT_OPTIONS}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Due Date</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.reminder}
                          onChange={e => setFormData(prev => ({ ...prev, reminder: e.target.checked }))}
                          className="w-4 h-4 rounded border-white/10 bg-white/5 accent-primary"
                        />
                        <span className="text-xs text-gray-400">Set Reminder</span>
                      </label>
                    </div>
                  </div>

                  {/* Reward preview */}
                  <div className="flex gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-xs text-gray-400">Rewards:</span>
                    <span className="text-xs text-primary font-mono font-bold">
                      <Zap size={12} className="inline" /> +{xpForDifficulty(formData.difficulty)} XP
                    </span>
                    <span className="text-xs text-yellow-400 font-mono font-bold">
                      🪙 +{coinsForDifficulty(formData.difficulty)}
                    </span>
                  </div>

                  {/* Checklist */}
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block flex items-center gap-1.5">
                      <ListTodo size={14} /> Checklist Items
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        value={newCheckItem}
                        onChange={e => setNewCheckItem(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                        placeholder="Add item..."
                        className="input-field flex-1"
                      />
                      <button type="button" onClick={addChecklistItem} className="btn-secondary px-3 py-2 text-xs">
                        Add
                      </button>
                    </div>
                    <div className="space-y-1">
                      {checklistItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                          <span className="text-sm text-gray-300 flex-1">{item.text}</span>
                          <button type="button" onClick={() => removeChecklistItem(i)}
                            className="text-gray-600 hover:text-danger transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" disabled={submitting || !formData.title.trim()} className="btn-primary flex-1">
                      {submitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><Plus size={16} /> Create Quest</>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Type filter tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${typeFilter === 'all' ? 'bg-primary/20 text-white border border-primary/30' : 'text-gray-500 hover:text-white bg-white/[0.04] border border-white/[0.06]'}`}
            >
              All
            </button>
            {QUEST_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setTypeFilter(t.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${typeFilter === t.value ? 'bg-primary/20 text-white border border-primary/30' : 'text-gray-500 hover:text-white bg-white/[0.04] border border-white/[0.06]'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Quest Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton h-44 rounded-2xl" />
                ))
              ) : filteredQuests.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass rounded-2xl p-12 text-center md:col-span-2">
                  <p className="text-4xl mb-3">🗡️</p>
                  <p className="text-gray-400 font-medium">No quests found</p>
                  <p className="text-sm text-gray-600 mt-1">Create a quest to begin your journey</p>
                </motion.div>
              ) : (
                filteredQuests.map((quest, i) => {
                  const checklistTotal = quest.checklist?.length ?? 0
                  const checklistDone = quest.checklist?.filter(c => c.completed).length ?? 0
                  const progressPct = quest.completed ? 100 : checklistTotal > 0
                    ? Math.round((checklistDone / checklistTotal) * 100)
                    : 0

                  return (
                    <motion.div
                      key={quest.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.03 }}
                      layout
                    >
                      <div
                        onClick={() => setSelectedQuest(quest)}
                        className={`glass rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-primary/30 hover:-translate-y-1 ${quest.completed ? 'opacity-60' : ''}`}
                        style={{ borderColor: quest.completed ? 'rgba(16,185,129,0.2)' : undefined }}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleComplete(quest) }}
                            disabled={quest.completed}
                            className="mt-0.5 shrink-0 transition-transform hover:scale-110 disabled:cursor-default"
                          >
                            {quest.completed
                              ? <CheckCircle2 size={20} className="text-success" />
                              : <Circle size={20} className="text-gray-600 hover:text-primary transition-colors" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-sm ${quest.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                              {quest.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-2xs font-bold px-1.5 py-0.5 rounded capitalize"
                                style={{ background: `${DIFFICULTY_COLORS[quest.difficulty]}20`, color: DIFFICULTY_COLORS[quest.difficulty], border: `1px solid ${DIFFICULTY_COLORS[quest.difficulty]}40` }}>
                                {quest.difficulty}
                              </span>
                              <span className="text-2xs text-gray-500 capitalize bg-white/[0.04] px-1.5 py-0.5 rounded">
                                {quest.type}
                              </span>
                              {quest.category && (
                                <span className="text-2xs text-gray-500">
                                  {CATEGORIES.find(c => c.value === quest.category)?.icon} {quest.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progress */}
                        {checklistTotal > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>{checklistDone}/{checklistTotal} tasks</span>
                              <span>{progressPct}%</span>
                            </div>
                            <ProgressBar value={progressPct} color={quest.completed ? 'success' : 'primary'} size="sm" />
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-primary font-mono font-bold">
                              <Zap size={12} /> +{quest.xpReward} XP
                            </span>
                            <span className="text-yellow-500 font-mono font-bold">🪙 {quest.coinReward}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            {quest.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock size={11} /> {format(new Date(quest.dueDate), 'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mini Calendar Sidebar */}
        <div className="xl:col-span-1">
          <div className="glass rounded-2xl p-4 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCalendarDate(d => subMonths(d, 1))} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors">
                <ChevronLeft size={16} />
              </button>
              <h3 className="text-sm font-semibold text-white">{format(calendarDate, 'MMMM yyyy')}</h3>
              <button onClick={() => setCalendarDate(d => addMonths(d, 1))} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-center text-2xs text-gray-600 font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (day.date.getTime() === 0) return <div key={`empty-${i}`} />
                const key = format(day.date, 'yyyy-MM-dd')
                const isToday = key === todayStr
                const hasQuests = day.quests.total > 0
                const allDone = day.quests.completed === day.quests.total && day.quests.total > 0
                const hasMissed = day.quests.missed > 0

                return (
                  <button
                    key={key}
                    onClick={() => handleDateClick(day.date)}
                    className={`relative p-1.5 rounded-lg text-xs transition-all ${
                      isToday
                        ? 'bg-primary/20 text-primary font-bold ring-1 ring-primary/40'
                        : hasQuests
                          ? 'hover:bg-white/[0.06] text-gray-300'
                          : 'text-gray-600 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span>{format(day.date, 'd')}</span>
                    {hasQuests && (
                      <div className="flex justify-center gap-0.5 mt-0.5">
                        {allDone && <div className="w-1.5 h-1.5 rounded-full bg-success" />}
                        {!allDone && hasMissed && <div className="w-1.5 h-1.5 rounded-full bg-danger" />}
                        {!allDone && !hasMissed && hasQuests && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-2xs text-gray-500">Complete</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-2xs text-gray-500">Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-danger" />
                <span className="text-2xs text-gray-500">Missed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-2xs text-gray-500">Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quest Detail Modal */}
      <AnimatePresence>
        {selectedQuest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedQuest(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleComplete(selectedQuest)}
                    disabled={selectedQuest.completed}
                    className="transition-transform hover:scale-110 disabled:cursor-default"
                  >
                    {selectedQuest.completed
                      ? <CheckCircle2 size={24} className="text-success" />
                      : <Circle size={24} className="text-gray-600 hover:text-primary transition-colors" />}
                  </button>
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedQuest.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xs font-bold px-2 py-0.5 rounded capitalize"
                        style={{ background: `${DIFFICULTY_COLORS[selectedQuest.difficulty]}20`, color: DIFFICULTY_COLORS[selectedQuest.difficulty], border: `1px solid ${DIFFICULTY_COLORS[selectedQuest.difficulty]}40` }}>
                        {selectedQuest.difficulty}
                      </span>
                      <span className="text-2xs text-gray-500 capitalize bg-white/[0.04] px-2 py-0.5 rounded">
                        {selectedQuest.type}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedQuest(null)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <X size={18} />
                </button>
              </div>

              {selectedQuest.description && (
                <p className="text-sm text-gray-400 mb-4">{selectedQuest.description}</p>
              )}

              {/* Checklist */}
              {selectedQuest.checklist && selectedQuest.checklist.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                    <ListTodo size={14} /> Checklist
                  </h4>
                  <div className="space-y-1.5">
                    {selectedQuest.checklist.map(item => (
                      <button
                        key={item.id}
                        onClick={() => toggleChecklistItem(selectedQuest, item.id)}
                        className="flex items-center gap-2.5 w-full p-2 rounded-lg hover:bg-white/[0.03] transition-colors text-left"
                      >
                        {item.completed
                          ? <CheckCircle2 size={16} className="text-success shrink-0" />
                          : <Circle size={16} className="text-gray-600 shrink-0" />}
                        <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Rewards */}
              <div className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
                <span className="text-xs flex items-center gap-1 text-primary font-mono font-bold">
                  <Zap size={14} /> +{selectedQuest.xpReward} XP
                </span>
                <span className="text-xs text-yellow-500 font-mono font-bold">🪙 {selectedQuest.coinReward}</span>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {selectedQuest.createdAt && (
                  <div>
                    <p className="text-2xs text-gray-600">Created</p>
                    <p className="text-xs text-gray-400">{format(new Date(selectedQuest.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                )}
                {selectedQuest.dueDate && (
                  <div>
                    <p className="text-2xs text-gray-600">Due</p>
                    <p className="text-xs text-gray-400">{format(new Date(selectedQuest.dueDate), 'MMM d, yyyy')}</p>
                  </div>
                )}
                {selectedQuest.completedAt && (
                  <div>
                    <p className="text-2xs text-gray-600">Completed</p>
                    <p className="text-xs text-gray-400">{format(new Date(selectedQuest.completedAt), 'MMM d, yyyy')}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedQuest.notes && (
                <div className="mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-2xs text-gray-600 mb-1">Notes</p>
                  <p className="text-sm text-gray-400">{selectedQuest.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-white/[0.06]">
                <button onClick={() => handleDelete(selectedQuest)} className="btn-secondary flex-1 text-danger/70 hover:text-danger">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Day Modal */}
      <AnimatePresence>
        {calendarQuests && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setCalendarQuests(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass rounded-3xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  {format(calendarQuests.date, 'MMMM d, yyyy')}
                </h3>
                <button onClick={() => setCalendarQuests(null)} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06]">
                  <X size={16} />
                </button>
              </div>

              {calendarQuests.quests.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No quests on this date</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {calendarQuests.quests.map(q => (
                    <button
                      key={q.id}
                      onClick={() => { setCalendarQuests(null); setSelectedQuest(q) }}
                      className="w-full text-left p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors border border-white/[0.06]"
                    >
                      <div className="flex items-center gap-2">
                        {q.completed
                          ? <CheckCircle2 size={16} className="text-success shrink-0" />
                          : <Circle size={16} className="text-gray-600 shrink-0" />}
                        <span className={`text-sm font-medium ${q.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                          {q.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 ml-6">
                        <span className="text-2xs text-gray-500 capitalize bg-white/[0.04] px-1.5 py-0.5 rounded">{q.type}</span>
                        <span className="text-2xs text-primary font-mono">+{q.xpReward} XP</span>
                        <span className="text-2xs text-yellow-500 font-mono">🪙 {q.coinReward}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.06] text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-success" /> {calendarQuests.quests.filter(q => q.completed).length} done
                </span>
                <span className="flex items-center gap-1">
                  <Circle size={12} className="text-gray-500" /> {calendarQuests.quests.filter(q => !q.completed).length} pending
                </span>
                <span className="flex items-center gap-1">
                  <Zap size={12} className="text-primary" /> +{calendarQuests.quests.reduce((s, q) => s + (q.completed ? q.xpReward : 0), 0)} XP
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
