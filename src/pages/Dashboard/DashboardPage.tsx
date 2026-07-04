import { motion } from 'framer-motion'
import { useUserStore } from '../../store/userStore'
import { useAuthStore } from '../../store/authStore'
import { Link } from 'react-router-dom'
import {
  Zap, Flame, Trophy, Target, TrendingUp,
  CheckSquare, Star, Shield, Activity, Dumbbell,
  Apple, Droplets, Timer, Calendar, Coffee, Sun,
  Moon, UtensilsCrossed,
} from 'lucide-react'
import { RANK_COLORS, RANK_TITLES } from '../../types'
import type { Quest, WorkoutProfile, WorkoutStats, WorkoutLog, DailyChecklist } from '../../types'
import { DAILY_REWARDS } from '../../types'
import { xpProgress, xpInLevel, xpForLevel } from '../../services/xpService'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { AbilityGraph } from '../../components/ui/AbilityGraph'
import { useEffect, useState, useCallback } from 'react'
import { dbGet, PATHS } from '../../lib/database'
import { updateDailyChecklistItem } from '../../services/workoutService'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const stagger = { animate: { transition: { staggerChildren: 0.07 } } }
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }

export const DashboardPage = () => {
  const { user } = useAuthStore()
  const { stats, profile, skills, setStats } = useUserStore()
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([])
  const [workoutProfile, setWorkoutProfile] = useState<WorkoutProfile | null>(null)
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null)
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([])
  const [checklist, setChecklist] = useState<DailyChecklist | null>(null)

  const rank = stats?.rank ?? 'E'
  const rankColor = RANK_COLORS[rank]
  const title = RANK_TITLES[rank]
  const xpPct = stats ? xpProgress(stats.totalXpEarned) * 100 : 0
  const currentXp = stats ? xpInLevel(stats.totalXpEarned) : 0
  const neededXp = stats ? xpForLevel(stats.level) : 100
  const today = format(new Date(), 'yyyy-MM-dd')

  const load = useCallback(async () => {
    if (!user) return
    const [d, wp, ws, wl, cl] = await Promise.all([
      dbGet<Record<string, Quest>>(PATHS.quests(user.uid, 'daily')),
      dbGet<WorkoutProfile>(PATHS.workoutProfile(user.uid)),
      dbGet<WorkoutStats>(PATHS.workoutStats(user.uid)),
      dbGet<Record<string, WorkoutLog>>(PATHS.workoutLogs(user.uid)),
      dbGet<DailyChecklist>(PATHS.dailyChecklistDay(user.uid, today)),
    ])
    if (d) setDailyQuests(Object.entries(d).map(([id, q]) => ({ ...q, id })))
    if (wp) setWorkoutProfile(wp)
    if (ws) setWorkoutStats(ws)
    if (wl) setRecentLogs(Object.entries(wl).map(([id, l]) => ({ ...l, id })).sort((a, b) => b.createdAt - a.createdAt).slice(0, 5))
    if (cl) setChecklist(cl)
    else setChecklist(null)
  }, [user, today])

  useEffect(() => { load() }, [load])

  const completedToday = dailyQuests.filter(q => q.completed).length
  const todayWorkout = recentLogs.find(l => l.date === today)

  const handleChecklistToggle = async (key: keyof DailyChecklist, reward?: { xp: number; coins: number }) => {
    if (!user) return
    const current = checklist ?? {
      date: today, water: false, waterLiters: 0, workout: false,
      breakfast: false, lunch: false, dinner: false, snacks: false,
      allMeals: false, completed: false, progress: 0, xpEarned: 0,
      coinsEarned: 0, updatedAt: Date.now(),
    }
    const newVal = !(current as any)[key]
    let newWaterLiters = current.waterLiters
    if (key === 'water') {
      newWaterLiters = newVal ? 4 : 0
    }

    const updated = await updateDailyChecklistItem(user.uid, today, {
      [key]: newVal,
      ...(key === 'water' ? { waterLiters: newWaterLiters } : {}),
    } as any)
    setChecklist(updated)

    if (newVal && reward) {
      // Award XP/coins
      const store = useUserStore.getState()
      if (store.stats) {
        const updatedStats = {
          ...store.stats,
          xp: store.stats.xp + reward.xp,
          totalXpEarned: store.stats.totalXpEarned + reward.xp,
          coins: store.stats.coins + reward.coins,
        }
        store.setStats(updatedStats)
      }
      toast.success(`+${reward.xp} XP • +${reward.coins} coins`, { icon: '✅' })

      // Check if all completed
      if (updated.completed) {
        const allReward = DAILY_REWARDS.allComplete
        const store2 = useUserStore.getState()
        if (store2.stats) {
          const updatedStats2 = {
            ...store2.stats,
            xp: store2.stats.xp + allReward.xp,
            totalXpEarned: store2.stats.totalXpEarned + allReward.xp,
            coins: store2.stats.coins + allReward.coins,
          }
          store2.setStats(updatedStats2)
        }
        toast.success(`All daily tasks done! Bonus +${allReward.xp} XP • +${allReward.coins} coins`, { icon: '🏆' })
      }
    }
  }

  const statCards = [
    { label: 'Level', value: stats?.level ?? 1, icon: Zap, color: '#3B82F6', glow: 'rgba(59,130,246,0.2)' },
    { label: 'Rank', value: rank, icon: Shield, color: rankColor, glow: `${rankColor}30` },
    { label: 'Streak', value: `${stats?.currentStreak ?? 0}d`, icon: Flame, color: '#F97316', glow: 'rgba(249,115,22,0.2)' },
    { label: 'Total XP', value: (stats?.totalXpEarned ?? 0).toLocaleString(), icon: Star, color: '#F59E0B', glow: 'rgba(245,158,11,0.2)' },
    { label: 'Quests Done', value: stats?.totalQuestsCompleted ?? 0, icon: Trophy, color: '#10B981', glow: 'rgba(16,185,129,0.2)' },
    { label: 'Today', value: `${completedToday}/${dailyQuests.length}`, icon: Target, color: '#8B5CF6', glow: 'rgba(139,92,246,0.2)' },
  ]

  const topSkills = skills
    ? Object.entries(skills).sort(([, a], [, b]) => b.level - a.level).slice(0, 4)
    : []

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  const cl = checklist ?? {
    date: today, water: false, waterLiters: 0, workout: false,
    breakfast: false, lunch: false, dinner: false, snacks: false,
    allMeals: false, completed: false, progress: 0, xpEarned: 0,
    coinsEarned: 0, updatedAt: Date.now(),
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative glass rounded-3xl p-8 overflow-hidden"
        style={{ borderColor: `${rankColor}30` }}>
        <div className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top left, ${rankColor}10 0%, transparent 60%)` }} />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <motion.div className="relative" animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black relative overflow-hidden"
              style={{ background: `${rankColor}20`, border: `3px solid ${rankColor}60`, color: rankColor, boxShadow: `0 0 30px ${rankColor}40` }}>
              {profile?.avatar ? (
                <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                (profile?.firstName?.[0] || profile?.name?.[0] || 'H').toUpperCase()
              )}
              <div className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ border: `3px solid ${rankColor}` }} />
            </div>
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 mb-0.5">{greeting},</p>
            <h1 className="text-3xl font-black text-white mb-1 truncate">{profile?.firstName || profile?.name?.split(' ')[0] || 'Hunter'}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="rank-badge text-xs px-2 py-0.5 rounded"
                style={{ background: `${rankColor}20`, color: rankColor, border: `1px solid ${rankColor}40` }}>
                {rank} RANK
              </span>
              <span className="text-sm text-gray-400">{title}</span>
              {stats?.currentStreak && stats.currentStreak > 0 && (
                <span className="flex items-center gap-1 text-sm text-orange-400">
                  <Flame size={14} /> {stats.currentStreak}d streak
                </span>
              )}
            </div>
            <div className="mt-4 max-w-md">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span className="font-mono">Level {stats?.level ?? 1}</span>
                <span className="font-mono">{currentXp.toLocaleString()} / {neededXp.toLocaleString()} XP</span>
              </div>
              <ProgressBar value={xpPct} color="xp" size="lg" />
            </div>
          </div>
          <div className="text-center">
            <div className="glass rounded-2xl px-6 py-4" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
              <p className="text-3xl mb-1">🪙</p>
              <p className="text-2xl font-black text-yellow-400">{(stats?.coins ?? 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Coins</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={stagger} initial="initial" animate="animate"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <motion.div key={card.label} variants={fadeUp} className="stat-card" style={{ borderColor: `${card.color}20` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
              style={{ background: card.glow, border: `1px solid ${card.color}30` }}>
              <card.icon size={18} style={{ color: card.color }} />
            </div>
            <p className="text-lg font-black text-white">{card.value}</p>
            <p className="text-xs text-gray-500">{card.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Daily Checklist + Quests row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== DAILY CHECKLIST WIDGET ===== */}
        <motion.div variants={fadeUp} initial="initial" animate="animate" className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-white flex items-center gap-2">
                <Target size={18} className="text-primary" /> Daily Checklist
              </h2>
              <p className="text-xs text-gray-500">Complete all tasks for a bonus reward</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Daily Progress</span>
              <span className="font-mono">{cl.progress}%</span>
            </div>
            <ProgressBar value={cl.progress} color={cl.completed ? 'success' : 'xp'} size="md" />
          </div>

          {/* Checklist items */}
          <div className="space-y-2">
            {/* Water */}
            <button onClick={() => handleChecklistToggle('water', DAILY_REWARDS.water)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03] border border-white/[0.06]">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                cl.water ? 'bg-primary/20 text-primary' : 'bg-white/[0.04] text-gray-600'
              }`}>
                <Droplets size={16} />
              </div>
              <div className="flex-1 text-left">
                <span className={`text-sm font-medium ${cl.water ? 'text-primary line-through' : 'text-white'}`}>
                  Drink 4L Water
                </span>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4].map(l => (
                    <div key={l} className={`w-5 h-1.5 rounded-full transition-all ${
                      cl.waterLiters >= l ? 'bg-primary' : 'bg-white/[0.06]'
                    }`} />
                  ))}
                </div>
              </div>
              <span className="text-2xs text-gray-500">+{DAILY_REWARDS.water.xp} XP</span>
            </button>

            {/* Workout */}
            <button onClick={() => handleChecklistToggle('workout', DAILY_REWARDS.workout)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03] border border-white/[0.06]">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                cl.workout ? 'bg-accent/20 text-accent' : 'bg-white/[0.04] text-gray-600'
              }`}>
                <Dumbbell size={16} />
              </div>
              <div className="flex-1 text-left">
                <span className={`text-sm font-medium ${cl.workout ? 'text-accent line-through' : 'text-white'}`}>
                  Workout Done
                </span>
                <p className="text-2xs text-gray-600">Complete today's exercise</p>
              </div>
              <span className="text-2xs text-gray-500">+{DAILY_REWARDS.workout.xp} XP</span>
            </button>

            {/* Breakfast */}
            <button onClick={() => handleChecklistToggle('breakfast', DAILY_REWARDS.breakfast)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03] border border-white/[0.06]">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                cl.breakfast ? 'bg-warning/20 text-warning' : 'bg-white/[0.04] text-gray-600'
              }`}>
                <Coffee size={16} />
              </div>
              <div className="flex-1 text-left">
                <span className={`text-sm font-medium ${cl.breakfast ? 'text-warning line-through' : 'text-white'}`}>
                  Breakfast
                </span>
                <p className="text-2xs text-gray-600">Eat a healthy morning meal</p>
              </div>
              <span className="text-2xs text-gray-500">+{DAILY_REWARDS.breakfast.xp} XP</span>
            </button>

            {/* Lunch */}
            <button onClick={() => handleChecklistToggle('lunch', DAILY_REWARDS.lunch)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03] border border-white/[0.06]">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                cl.lunch ? 'bg-success/20 text-success' : 'bg-white/[0.04] text-gray-600'
              }`}>
                <Sun size={16} />
              </div>
              <div className="flex-1 text-left">
                <span className={`text-sm font-medium ${cl.lunch ? 'text-success line-through' : 'text-white'}`}>
                  Lunch
                </span>
                <p className="text-2xs text-gray-600">Have a balanced lunch</p>
              </div>
              <span className="text-2xs text-gray-500">+{DAILY_REWARDS.lunch.xp} XP</span>
            </button>

            {/* Dinner */}
            <button onClick={() => handleChecklistToggle('dinner', DAILY_REWARDS.dinner)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03] border border-white/[0.06]">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                cl.dinner ? 'text-danger' : 'bg-white/[0.04] text-gray-600'
              }`} style={{ background: cl.dinner ? 'rgba(239,68,68,0.2)' : undefined }}>
                <Moon size={16} />
              </div>
              <div className="flex-1 text-left">
                <span className={`text-sm font-medium ${cl.dinner ? 'line-through' : 'text-white'}`}
                  style={{ color: cl.dinner ? '#EF4444' : undefined }}>
                  Dinner
                </span>
                <p className="text-2xs text-gray-600">Light dinner before 8 PM</p>
              </div>
              <span className="text-2xs text-gray-500">+{DAILY_REWARDS.dinner.xp} XP</span>
            </button>
          </div>

          {/* Completion bonus */}
          {cl.completed && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
              <Trophy size={20} className="text-success shrink-0" />
              <div>
                <p className="text-sm font-semibold text-success">All Tasks Complete!</p>
                <p className="text-xs text-gray-500">+{DAILY_REWARDS.allComplete.xp} XP • +{DAILY_REWARDS.allComplete.coins} coins bonus</p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Active Quests Widget */}
        <motion.div variants={fadeUp} initial="initial" animate="animate" className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-white">Active Quests</h2>
              <p className="text-xs text-gray-500">{completedToday} of {dailyQuests.length} today</p>
            </div>
            <Link to="/quests" className="btn-ghost text-xs text-primary">View all →</Link>
          </div>
          {dailyQuests.length > 0 ? (
            <div className="space-y-3">
              {dailyQuests.slice(0, 4).map(q => (
                <div key={q.id} className="glass rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border mt-0.5 ${
                      q.completed ? 'bg-success/20 border-success/50' : 'border-white/10'}`}>
                      {q.completed && <CheckCircle size={10} className="text-success" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${q.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                          {q.title}
                        </span>
                        <span className="text-2xs capitalize px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-500">{q.type}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <span className="text-primary font-mono font-bold"><Zap size={11} className="inline" /> +{q.xpReward} XP</span>
                        {q.dueDate && (
                          <span className="text-gray-600 flex items-center gap-1">
                            <Calendar size={10} /> {format(new Date(q.dueDate), 'MMM d')}
                          </span>
                        )}
                      </div>
                      {q.checklist && q.checklist.length > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-2xs text-gray-600 mb-0.5">
                            <span>{q.checklist.filter(c => c.completed).length}/{q.checklist.length} tasks</span>
                            <span>{Math.round((q.checklist.filter(c => c.completed).length / q.checklist.length) * 100)}%</span>
                          </div>
                          <ProgressBar value={(q.checklist.filter(c => c.completed).length / q.checklist.length) * 100}
                            color={q.completed ? 'success' : 'primary'} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🗡️</p>
              <p className="text-sm text-gray-500">No active quests</p>
              <Link to="/quests" className="btn-primary text-xs mt-3 inline-flex gap-1">
                <Target size={14} /> Create Quest
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Workout + Diet Progress row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workout Widget */}
        <motion.div variants={fadeUp} initial="initial" animate="animate" className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-white">Workout</h2>
              <p className="text-xs text-gray-500">{workoutStats?.totalWorkouts ?? 0} total workouts</p>
            </div>
            <Link to="/workout" className="btn-ghost text-xs text-primary">Open →</Link>
          </div>

          {workoutProfile ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  todayWorkout?.completed ? 'bg-success/20' : 'bg-primary/20'
                }`}>
                  {todayWorkout?.completed
                    ? <CheckCircleIcon size={24} className="text-success" />
                    : <Dumbbell size={24} className="text-primary" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {todayWorkout?.completed ? "Today's Workout Done!" : 'Workout Pending'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {todayWorkout?.completed
                      ? `+${todayWorkout.xpEarned} XP • ${todayWorkout.duration} min`
                      : 'Log your workout to earn rewards'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-2xs text-gray-600 mb-0.5">BMI</p>
                  <p className="text-lg font-black gradient-text">{workoutProfile.bmi}</p>
                  <p className="text-2xs text-gray-500">{workoutProfile.bmiCategory}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-2xs text-gray-600 mb-0.5">Streak</p>
                  <p className="text-lg font-black text-white flex items-center gap-1">
                    <Flame size={16} className="text-orange-400" /> {workoutStats?.currentStreak ?? 0}d
                  </p>
                  <p className="text-2xs text-gray-500">Best: {workoutStats?.longestStreak ?? 0}d</p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-2xs text-gray-600 mb-0.5">
                    <span className="flex items-center gap-1"><Flame size={10} /> Calories</span>
                    <span>{workoutStats?.totalCaloriesBurned?.toLocaleString() ?? 0} burned</span>
                  </div>
                  <ProgressBar value={Math.min(100, (recentLogs.reduce((s, l) => s + l.caloriesBurned, 0) / (workoutProfile.dailyCalories * 7)) * 100)} color="warning" size="sm" />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Dumbbell size={32} className="text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-1">No workout data yet</p>
              <p className="text-xs text-gray-600 mb-3">Set up your fitness profile</p>
              <Link to="/workout" className="btn-primary text-xs inline-flex gap-1">
                <Target size={14} /> Get Started
              </Link>
            </div>
          )}
        </motion.div>

        {/* Diet & Nutrition Widget */}
        <motion.div variants={fadeUp} initial="initial" animate="animate" className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-white flex items-center gap-2">
                <Apple size={18} className="text-success" /> Diet & Nutrition
              </h2>
              <p className="text-xs text-gray-500">Track your meals for the day</p>
            </div>
            <Link to="/workout" className="btn-ghost text-xs text-primary">Plan →</Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                cl.breakfast ? 'bg-warning/20' : 'bg-white/[0.04]'
              }`}>
                <Coffee size={20} className={cl.breakfast ? 'text-warning' : 'text-gray-600'} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${cl.breakfast ? 'text-warning line-through' : 'text-white'}`}>Breakfast</p>
                <p className="text-2xs text-gray-600">{cl.breakfast ? 'Done ✅' : 'Pending'}</p>
              </div>
              {cl.breakfast && <span className="text-xs text-yellow-500">+10 XP</span>}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                cl.lunch ? 'bg-success/20' : 'bg-white/[0.04]'
              }`}>
                <Sun size={20} className={cl.lunch ? 'text-success' : 'text-gray-600'} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${cl.lunch ? 'text-success line-through' : 'text-white'}`}>Lunch</p>
                <p className="text-2xs text-gray-600">{cl.lunch ? 'Done ✅' : 'Pending'}</p>
              </div>
              {cl.lunch && <span className="text-xs text-green-500">+10 XP</span>}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                cl.dinner ? 'bg-danger/20' : 'bg-white/[0.04]'
              }`}>
                <Moon size={20} className={cl.dinner ? 'text-danger' : 'text-gray-600'} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${cl.dinner ? 'line-through' : 'text-white'}`}
                  style={{ color: cl.dinner ? '#EF4444' : undefined }}>Dinner</p>
                <p className="text-2xs text-gray-600">{cl.dinner ? 'Done ✅' : 'Pending'}</p>
              </div>
              {cl.dinner && <span className="text-xs text-red-500">+10 XP</span>}
            </div>

            {/* Water progress */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <Droplets size={16} className="text-primary" />
                <span className="text-sm font-medium text-white">Water Intake</span>
                <span className="text-xs text-gray-500 ml-auto">{cl.waterLiters}/4 L</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(l => (
                  <button key={l} onClick={() => {
                    if (!user) return
                    const newLiters = cl.waterLiters === l ? l - 1 : l
                    updateDailyChecklistItem(user.uid, today, {
                      water: newLiters >= 4,
                      waterLiters: Math.max(0, newLiters),
                    } as any).then(updated => {
                      setChecklist(updated)
                      if (newLiters > (checklist?.waterLiters ?? 0) && newLiters >= 4) {
                        toast.success(`+${DAILY_REWARDS.water.xp} XP • +${DAILY_REWARDS.water.coins} coins`, { icon: '💧' })
                      }
                    })
                  }}
                    className={`flex-1 h-8 rounded-lg transition-all ${
                      cl.waterLiters >= l
                        ? 'bg-primary/30 border border-primary/50'
                        : 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]'
                    }`}>
                    <span className={`text-xs font-mono ${cl.waterLiters >= l ? 'text-primary' : 'text-gray-600'}`}>
                      {l}L
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Workout Streak Calendar */}
      <motion.div variants={fadeUp} initial="initial" animate="animate" className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Flame size={18} className="text-orange-400" /> Workout Streak
            </h2>
            <p className="text-xs text-gray-500">{workoutStats?.currentStreak ?? 0} day streak • Best: {workoutStats?.longestStreak ?? 0}d</p>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 28 }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (27 - i))
            const dateStr = format(d, 'yyyy-MM-dd')
            const hasWorkout = recentLogs.some(l => l.date === dateStr && l.completed)
            const wl = recentLogs.find(l => l.date === dateStr)
            const intensity = wl ? (wl.xpEarned > 50 ? 3 : 1) : 0
            return (
              <div key={dateStr}
                className="aspect-square rounded-md flex items-center justify-center text-2xs transition-all"
                style={{
                  background: intensity === 0 ? 'var(--overlay-bg)' :
                    intensity === 1 ? 'rgba(59,130,246,0.25)' :
                    'rgba(59,130,246,0.55)',
                  border: '1px solid var(--color-border)',
                  color: intensity > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                }}
                title={`${format(d, 'MMM d')}${hasWorkout ? ' - Workout done' : ''}`}>
                {d.getDate()}
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-2 mt-3 text-2xs text-gray-500">
          <span>Less</span>
          <div className="w-3 h-3 rounded" style={{ background: 'var(--overlay-bg)', border: '1px solid var(--color-border)' }} />
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(59,130,246,0.2)' }} />
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(59,130,246,0.4)' }} />
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(59,130,246,0.6)' }} />
          <span>More</span>
        </div>
      </motion.div>

      {/* Skills + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} initial="initial" animate="animate" className="glass rounded-2xl p-6 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-2">
            <div>
              <h2 className="font-bold text-white">Ability Graph</h2>
              <p className="text-xs text-gray-500">Hunter skill spectrum</p>
            </div>
            <Link to="/skills" className="btn-ghost text-xs text-primary">View all →</Link>
          </div>
          <AbilityGraph skills={skills} size={280} />
          {topSkills.length > 0 && (
            <div className="grid grid-cols-3 gap-2 w-full mt-2">
              {topSkills.slice(0, 6).map(([key, skill]) => (
                <div key={key} className="text-center">
                  <p className="text-[10px] font-semibold text-gray-400 capitalize truncate">{key}</p>
                  <p className="text-xs font-black font-mono text-white">Lv.{skill.level}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4">
          {[
            { label: 'Quests', icon: CheckSquare, to: '/quests', color: '#3B82F6' },
            { label: 'Workout', icon: Dumbbell, to: '/workout', color: '#8B5CF6' },
            { label: 'Achievements', icon: Trophy, to: '/achievements', color: '#F59E0B' },
            { label: 'Leaderboard', icon: TrendingUp, to: '/leaderboard', color: '#10B981' },
          ].map(item => (
            <Link key={item.to} to={item.to}
              className="glass-hover rounded-2xl p-4 flex items-center gap-3 group"
              style={{ borderColor: `${item.color}20` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                style={{ background: `${item.color}20` }}>
                <item.icon size={20} style={{ color: item.color }} />
              </div>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{item.label}</span>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

function CheckCircle({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function CheckCircleIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
