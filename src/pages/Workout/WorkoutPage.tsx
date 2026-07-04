import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dumbbell, Zap, Timer, Trophy, Flame, Target, Apple,
  Activity, CheckCircle2, Circle, TrendingUp, Ruler,
  Weight, Clock, Droplets, ChevronRight, ChevronLeft,
  Calendar, Star, Plus, X, BarChart3, Moon, Edit3, Trash2,
  Save, RefreshCw, Flag,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUserStore } from '../../store/userStore'
import {
  getWorkoutProfile, saveWorkoutProfile, calculateBMI,
  getDailyCalories, getProteinTarget, getWaterTarget,
  generateWorkoutPlan, generateDietPlan,
  saveWorkoutLog, updateWorkoutLog, deleteWorkoutLog, getWorkoutLogs, getDietPlans, saveDietPlans,
  getWorkoutStats, saveWorkoutStats, getWorkoutPlans, saveWorkoutPlan,
} from '../../services/workoutService'
import { completeQuest } from '../../services/questService'
import type {
  WorkoutProfile, WorkoutPlan, WorkoutLog, DietPlan,
  WorkoutStats, WorkoutDay, Quest, Challenge,
} from '../../types'
import toast from 'react-hot-toast'
import { format, startOfWeek, addDays, differenceInDays, parseISO } from 'date-fns'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { Select } from '../../components/ui/Select'
import type { DietaryPreference, ChallengeDuration } from '../../types'

type Step = 'welcome' | 'info' | 'bmi' | 'plan' | 'diet' | 'dashboard'

interface WizardData {
  height: number
  weight: number
  age: number
  gender: string
  fitnessGoal: string
  workoutLocation: string
  availableEquipment: string[]
  workoutFrequency: number
  workoutDuration: number
  workoutIntensity: string
  activityLevel: string
}

const WORKOUT_XP = 50
const WORKOUT_COINS = 20

export const WorkoutPage = () => {
  const { user } = useAuthStore()
  const [step, setStep] = useState<Step>('welcome')
  const [wizard, setWizard] = useState<WizardData>({
    height: 175, weight: 75, age: 25, gender: 'male',
    fitnessGoal: 'General Fitness', workoutLocation: 'Home',
    availableEquipment: ['Dumbbells'], workoutFrequency: 3,
    workoutDuration: 45, workoutIntensity: 'Beginner',
    activityLevel: 'Moderately Active',
  })
  const [profile, setProfile] = useState<WorkoutProfile | null>(null)
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([])
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [stats, setStats] = useState<WorkoutStats | null>(null)
  const [bmiResult, setBmiResult] = useState<{ bmi: number; category: string; recommendation: string; healthyWeightRange: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'track' | 'diet' | 'history' | 'challenges'>('overview')
  const [todayLog, setTodayLog] = useState<Partial<WorkoutLog>>({})
  const [showLogModal, setShowLogModal] = useState(false)
  const [selectedDietDay, setSelectedDietDay] = useState<string | null>(null)
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>('veg')
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<WorkoutLog>>({})
  const [editingPlanDay, setEditingPlanDay] = useState<WorkoutDay | null>(null)
  const [editExercises, setEditExercises] = useState<WorkoutDay['exercises']>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [deficit, setDeficit] = useState<number>(500)
  const [deficitResult, setDeficitResult] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      try {
        const [p, pl, d, l, s] = await Promise.all([
          getWorkoutProfile(user.uid),
          getWorkoutPlans(user.uid).then(plans => plans[0] ?? null),
          getDietPlans(user.uid),
          getWorkoutLogs(user.uid),
          getWorkoutStats(user.uid),
        ])
        if (p) {
          setProfile(p)
          setWizard({
            height: p.height, weight: p.weight, age: p.age, gender: p.gender,
            fitnessGoal: p.fitnessGoal, workoutLocation: p.workoutLocation,
            availableEquipment: p.availableEquipment, workoutFrequency: p.workoutFrequency,
            workoutDuration: p.workoutDuration, workoutIntensity: p.workoutIntensity,
            activityLevel: p.activityLevel,
          })
          const bmi = calculateBMI(p.height, p.weight)
          setBmiResult(bmi)
          if (p.onboardingComplete) setStep('dashboard')
        }
        if (pl) setPlan(pl)
        if (d.length > 0) setDietPlans(d)
        if (l) setLogs(l)
        if (s) setStats(s)
      } catch (err: any) {
        console.error('Failed to load workout data:', err)
      }
      setLoading(false)
    }
    load()
  }, [user])

  const handleEquipmentToggle = (eq: string) => {
    setWizard(prev => ({
      ...prev,
      availableEquipment: prev.availableEquipment.includes(eq)
        ? prev.availableEquipment.filter(e => e !== eq)
        : [...prev.availableEquipment, eq],
    }))
  }

  const handleCalculate = () => {
    const bmi = calculateBMI(wizard.height, wizard.weight)
    setBmiResult(bmi)
    setStep('bmi')
  }

  const handleGeneratePlan = async () => {
    if (!user) {
      toast.error('You must be logged in')
      return
    }
    try {
      const bmi = calculateBMI(wizard.height, wizard.weight)
      const dailyCalories = getDailyCalories(
        wizard.weight, wizard.height, wizard.age,
        wizard.gender, wizard.activityLevel, wizard.fitnessGoal
      )
      const proteinTarget = getProteinTarget(wizard.weight, wizard.fitnessGoal)
      const waterTarget = getWaterTarget(wizard.weight)

      const newProfile: WorkoutProfile = {
        ...wizard,
        bmi: bmi.bmi,
        bmiCategory: bmi.category,
        healthyWeightRange: bmi.healthyWeightRange,
        bmiRecommendation: bmi.recommendation,
        dailyCalories,
        proteinTarget,
        waterTarget,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        onboardingComplete: true,
      }
      setProfile(newProfile)

      await saveWorkoutProfile(user.uid, newProfile)

      const generated = generateWorkoutPlan(newProfile)
      const planId = await saveWorkoutPlan(user.uid, generated)
      const savedPlan = { ...generated, id: planId, createdAt: Date.now() }
      setPlan(savedPlan)

      const dietGenerated = generateDietPlan(dailyCalories, proteinTarget, wizard.fitnessGoal, dietaryPreference)
      await saveDietPlans(user.uid, dietGenerated)
      setDietPlans(dietGenerated)

      const newStats: WorkoutStats = {
        totalWorkouts: 0, currentStreak: 0, longestStreak: 0,
        totalCaloriesBurned: 0, totalDuration: 0,
        lastWorkoutDate: '', xpEarned: 0, coinsEarned: 0,
      }
      await saveWorkoutStats(user.uid, newStats)
      setStats(newStats)

      setBmiResult(bmi)
      setStep('dashboard')
      toast.success('Workout plan generated!')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to generate workout plan')
    }
  }

  const handleLogWorkout = async () => {
    if (!user) return
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const logData: Omit<WorkoutLog, 'id' | 'createdAt'> = {
        date: today,
        exercises: todayLog.exercises ?? plan?.schedule.flatMap(d =>
          d.exercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps, completed: false }))
        ) ?? [],
        duration: todayLog.duration ?? wizard.workoutDuration,
        caloriesBurned: todayLog.caloriesBurned ?? Math.round(wizard.weight * 0.1 * wizard.workoutDuration),
        waterIntake: todayLog.waterIntake ?? 0,
        meals: todayLog.meals ?? [],
        mood: todayLog.mood ?? 3,
        energyLevel: todayLog.energyLevel ?? 3,
        completed: true,
        xpEarned: WORKOUT_XP,
        coinsEarned: WORKOUT_COINS,
      }
      await saveWorkoutLog(user.uid, logData)

      const today2 = format(new Date(), 'yyyy-MM-dd')
      let newStreak = stats?.currentStreak ?? 0
      if (stats?.lastWorkoutDate) {
        const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
        if (stats.lastWorkoutDate === yesterday) newStreak++
        else if (stats.lastWorkoutDate !== today2) newStreak = 1
      } else {
        newStreak = 1
      }
      const updatedStats: WorkoutStats = {
        totalWorkouts: (stats?.totalWorkouts ?? 0) + 1,
        currentStreak: newStreak,
        longestStreak: Math.max(stats?.longestStreak ?? 0, newStreak),
        totalCaloriesBurned: (stats?.totalCaloriesBurned ?? 0) + (logData.caloriesBurned),
        totalDuration: (stats?.totalDuration ?? 0) + (logData.duration),
        lastWorkoutDate: today2,
        xpEarned: (stats?.xpEarned ?? 0) + WORKOUT_XP,
        coinsEarned: (stats?.coinsEarned ?? 0) + WORKOUT_COINS,
      }
      await saveWorkoutStats(user.uid, updatedStats)
      setStats(updatedStats)
      setLogs(prev => [{ ...logData, id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), createdAt: Date.now() }, ...prev])

      const store = useUserStore.getState()
      if (store.stats) {
        const updatedUserStats = {
          ...store.stats,
          xp: store.stats.xp + WORKOUT_XP,
          totalXpEarned: store.stats.totalXpEarned + WORKOUT_XP,
          coins: store.stats.coins + WORKOUT_COINS,
          totalTasksCompleted: store.stats.totalTasksCompleted + 1,
          totalQuestsCompleted: store.stats.totalQuestsCompleted + 1,
        }
        store.setStats(updatedUserStats)
      }

      setShowLogModal(false)
      setTodayLog({})
      toast.success(`Workout logged! +${WORKOUT_XP} XP, +${WORKOUT_COINS} coins`)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to log workout')
    }
  }

  const handleUpdateLog = async (logId: string) => {
    if (!user) return
    try {
      await updateWorkoutLog(user.uid, logId, editForm as any)
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, ...editForm } : l))
      setEditingLogId(null)
      setEditForm({})
      toast.success('Workout log updated!')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update log')
    }
  }

  const handleDeleteLog = async (logId: string) => {
    if (!user || !stats) return
    try {
      const log = logs.find(l => l.id === logId)
      if (!log) return
      await deleteWorkoutLog(user.uid, logId)
      const updatedStats: WorkoutStats = {
        ...stats,
        totalWorkouts: Math.max(0, stats.totalWorkouts - 1),
        totalCaloriesBurned: Math.max(0, stats.totalCaloriesBurned - (log.caloriesBurned || 0)),
        totalDuration: Math.max(0, stats.totalDuration - (log.duration || 0)),
        xpEarned: Math.max(0, stats.xpEarned - (log.xpEarned || 0)),
        coinsEarned: Math.max(0, stats.coinsEarned - (log.coinsEarned || 0)),
      }
      await saveWorkoutStats(user.uid, updatedStats)
      setStats(updatedStats)
      setLogs(prev => prev.filter(l => l.id !== logId))
      toast.success('Workout log deleted')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete log')
    }
  }

  const handleSaveExercises = async () => {
    if (!plan || !user) return
    const updatedSchedule = plan.schedule.map(d =>
      d.day === editingPlanDay?.day ? { ...d, exercises: editExercises } : d
    )
    await saveWorkoutPlan(user.uid, { ...plan, schedule: updatedSchedule })
    toast.success('Exercises updated! Calorie burn recalculated.')
    setEditingPlanDay(null)
  }

  const calcCalories = (ex: WorkoutDay['exercises'][0]): number => {
    const met: Record<string, number> = { 'Beginner': 3.5, 'Intermediate': 5.0, 'Advanced': 6.5 }
    const m = met[wizard.workoutIntensity] ?? 4.0
    return Math.round(m * wizard.weight * 0.0175 * ex.sets * (parseInt(ex.reps) || 10) * 0.5)
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayWorkout = logs.find(l => l.date === today)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekLogs = logs.filter(l => weekDays.some(d => format(d, 'yyyy-MM-dd') === l.date))
  const weekCompletion = weekLogs.filter(l => l.completed).length / 7 * 100

  const todayPlan = plan?.schedule[new Date().getDay() % (plan.schedule.length || 1)]

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="skeleton h-48 rounded-3xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  // ── Welcome / Onboarding ──
  if (step === 'welcome') {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-accent-gradient flex items-center justify-center mx-auto mb-6"
            style={{ boxShadow: '0 0 40px rgba(139,92,246,0.4)' }}>
            <Dumbbell className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Workout Center</h1>
          <p className="text-gray-400 mb-6">Set up your fitness profile to get a personalized workout and diet plan.</p>

          <div className="grid grid-cols-2 gap-4 mb-8 text-left">
            {[
              { icon: Target, label: 'Personalized Plans', desc: 'AI-generated workouts' },
              { icon: Apple, label: 'Diet Planning', desc: 'Custom meal plans' },
              { icon: Activity, label: 'Track Progress', desc: 'Log every workout' },
              { icon: Trophy, label: 'Earn Rewards', desc: 'XP, coins & streaks' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <item.icon size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setStep('info')} className="btn-primary px-8 py-3 text-base gap-2">
            Get Started <ChevronRight size={18} />
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Info Form ──
  if (step === 'info') {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              {['info', 'bmi', 'plan', 'diet'].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === s || ['bmi', 'plan', 'diet'].includes(s) ? 'bg-primary text-white' : 'bg-white/[0.06] text-gray-500'
                  }`}>{i + 1}</div>
                  {i < 3 && <div className="w-6 h-px bg-white/[0.06]" />}
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-6">Personal Information</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Height (cm)</label>
              <input type="number" value={wizard.height}
                onChange={e => setWizard(prev => ({ ...prev, height: Number(e.target.value) }))}
                className="input-field" min={100} max={250} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Weight (kg)</label>
              <input type="number" value={wizard.weight}
                onChange={e => setWizard(prev => ({ ...prev, weight: Number(e.target.value) }))}
                className="input-field" min={30} max={300} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Age</label>
              <input type="number" value={wizard.age}
                onChange={e => setWizard(prev => ({ ...prev, age: Number(e.target.value) }))}
                className="input-field" min={13} max={120} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Gender</label>
              <Select value={wizard.gender} onChange={value => setWizard(prev => ({ ...prev, gender: value }))}
                options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
            </div>
          </div>

          <h3 className="font-semibold text-white mb-4">Fitness Profile</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Fitness Goal</label>
              <Select value={wizard.fitnessGoal} onChange={value => setWizard(prev => ({ ...prev, fitnessGoal: value }))}
                options={['Weight Loss', 'Fat Loss', 'Muscle Gain', 'Strength', 'Endurance', 'General Fitness'].map(g => ({ value: g, label: g }))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Workout Location</label>
              <Select value={wizard.workoutLocation} onChange={value => setWizard(prev => ({ ...prev, workoutLocation: value }))}
                options={[{ value: 'Home', label: 'Home' }, { value: 'Gym', label: 'Gym' }]} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Frequency</label>
              <Select value={String(wizard.workoutFrequency)} onChange={value => setWizard(prev => ({ ...prev, workoutFrequency: Number(value) }))}
                options={[3, 4, 5, 6].map(n => ({ value: String(n), label: `${n} Days` }))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Duration</label>
              <Select value={String(wizard.workoutDuration)} onChange={value => setWizard(prev => ({ ...prev, workoutDuration: Number(value) }))}
                options={[30, 45, 60, 90].map(n => ({ value: String(n), label: `${n} min` }))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Intensity</label>
              <Select value={wizard.workoutIntensity} onChange={value => setWizard(prev => ({ ...prev, workoutIntensity: value }))}
                options={['Beginner', 'Intermediate', 'Advanced'].map(l => ({ value: l, label: l }))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Activity Level</label>
              <Select value={wizard.activityLevel} onChange={value => setWizard(prev => ({ ...prev, activityLevel: value }))}
                options={['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'].map(l => ({ value: l, label: l }))} />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Available Equipment</label>
            <div className="flex flex-wrap gap-2">
              {['Dumbbells', 'Resistance Bands', 'Barbell', 'Machines', 'None'].map(eq => (
                <button key={eq} onClick={() => handleEquipmentToggle(eq)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                    wizard.availableEquipment.includes(eq)
                      ? 'bg-primary/20 text-primary border-primary/30'
                      : 'bg-white/[0.04] text-gray-500 border-white/[0.06] hover:text-white'
                  }`}>
                  {eq}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button onClick={() => setStep('welcome')} className="btn-secondary flex-1">Back</button>
            <button onClick={handleCalculate} className="btn-primary flex-1">Calculate BMI <ChevronRight size={16} /></button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── BMI Result ──
  if (step === 'bmi') {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary-gradient flex items-center justify-center mx-auto mb-6"
            style={{ boxShadow: '0 0 40px rgba(59,130,246,0.4)' }}>
            <Activity className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Your BMI Result</h2>

          <div className="flex justify-center items-baseline gap-2 mb-2">
            <span className="text-5xl font-black gradient-text">{bmiResult?.bmi}</span>
            <span className="text-lg text-gray-500">kg/m²</span>
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 ${
            bmiResult?.category === 'Normal' ? 'bg-success/20 text-success' :
            bmiResult?.category === 'Underweight' ? 'bg-warning/20 text-warning' :
            'bg-danger/20 text-danger'
          }`}>
            {bmiResult?.category}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-2xs text-gray-600 mb-1">Healthy Weight Range</p>
              <p className="text-sm font-bold text-white">{bmiResult?.healthyWeightRange}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-2xs text-gray-600 mb-1">Daily Calories (est.)</p>
              <p className="text-sm font-bold text-white">
                {getDailyCalories(wizard.weight, wizard.height, wizard.age, wizard.gender, wizard.activityLevel, wizard.fitnessGoal)} kcal
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-8 text-left">
            <p className="text-xs text-gray-400">{bmiResult?.recommendation}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('info')} className="btn-secondary flex-1">Adjust Values</button>
            <button onClick={handleGeneratePlan} className="btn-primary flex-1 gap-2">
              Generate Plan <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Dashboard ──
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'plan', label: 'Workout Plan', icon: Dumbbell },
          { key: 'track', label: 'Track', icon: Activity },
          { key: 'diet', label: 'Diet Plan', icon: Apple },
          { key: 'history', label: 'History', icon: Calendar },
          { key: 'challenges', label: 'Challenges', icon: Flag },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary/20 text-white border border-primary/30'
                : 'text-gray-500 hover:text-white bg-white/[0.04] border border-white/[0.06]'
            }`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
        <button onClick={() => { setStep('info'); setProfile(null) }}
          className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-white bg-white/[0.04] border border-white/[0.06] ml-auto">
          Re-calculate
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass rounded-2xl p-5">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center mb-2">
                <Flame size={18} className="text-primary" />
              </div>
              <p className="text-2xl font-black text-white">{stats?.currentStreak ?? 0}</p>
              <p className="text-xs text-gray-500">Day Streak</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="w-9 h-9 rounded-xl bg-warning/20 flex items-center justify-center mb-2">
                <Zap size={18} className="text-warning" />
              </div>
              <p className="text-2xl font-black text-white">{stats?.totalWorkouts ?? 0}</p>
              <p className="text-xs text-gray-500">Workouts</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="w-9 h-9 rounded-xl bg-danger/20 flex items-center justify-center mb-2">
                <Flame size={18} className="text-danger" />
              </div>
              <p className="text-2xl font-black text-white">{(stats?.totalCaloriesBurned ?? 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Calories Burned</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="w-9 h-9 rounded-xl bg-success/20 flex items-center justify-center mb-2">
                <Timer size={18} className="text-success" />
              </div>
              <p className="text-2xl font-black text-white">{stats?.totalDuration ?? 0}</p>
              <p className="text-xs text-gray-500">Total Minutes</p>
            </div>
          </div>

          {/* BMI + Today */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">BMI Summary</h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-4xl font-black gradient-text">{bmiResult?.bmi}</p>
                  <p className="text-2xs text-gray-500">BMI</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      bmiResult?.category === 'Normal' ? 'bg-success/20 text-success' :
                      bmiResult?.category === 'Underweight' ? 'bg-warning/20 text-warning' :
                      'bg-danger/20 text-danger'
                    }`}>{bmiResult?.category}</span>
                  </div>
                  <p className="text-xs text-gray-500">Healthy: {bmiResult?.healthyWeightRange}</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-2xs text-gray-600 mb-0.5">
                      <span>Calories</span>
                      <span>{profile?.dailyCalories ?? 0} kcal</span>
                    </div>
                    <ProgressBar value={Math.min(100, ((todayLog.caloriesBurned ?? 0) / (profile?.dailyCalories ?? 2000)) * 100)} color="primary" size="sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Today's Workout</h3>
                {!todayWorkout?.completed && (
                  <button onClick={() => setShowLogModal(true)} className="btn-primary text-xs py-1.5 px-3 gap-1">
                    <Plus size={14} /> Log
                  </button>
                )}
              </div>
              {todayWorkout?.completed ? (
                <div className="text-center py-4">
                  <CheckCircle2 size={32} className="text-success mx-auto mb-2" />
                  <p className="text-sm font-medium text-white">Workout Complete!</p>
                  <p className="text-xs text-gray-500">+{WORKOUT_XP} XP • +{WORKOUT_COINS} coins</p>
                </div>
              ) : todayPlan ? (
                <div>
                  <p className="text-sm font-medium text-white mb-1">{todayPlan.focus}</p>
                  <p className="text-xs text-gray-500 mb-3">{todayPlan.exercises.length} exercises</p>
                  <div className="space-y-1.5">
                    {todayPlan.exercises.slice(0, 4).map((ex, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                        <Circle size={8} className="text-gray-600 shrink-0" />
                        <span className="flex-1">{ex.name}</span>
                        <span>{ex.sets}x{ex.reps}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-6">No plan generated yet</p>
              )}
            </div>
          </div>

          {/* Weekly Progress */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">This Week</h3>
            <div className="flex items-center gap-4 mb-4">
              {weekDays.map(d => {
                const key = format(d, 'yyyy-MM-dd')
                const log = logs.find(l => l.date === key)
                const isToday = key === today
                return (
                  <div key={key} className="flex-1 text-center">
                    <p className="text-2xs text-gray-600 mb-1">{format(d, 'EEE')}</p>
                    <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                      log?.completed ? 'bg-success/20 text-success' :
                      isToday ? 'bg-primary/20 text-primary' :
                      'bg-white/[0.04] text-gray-500'
                    }`}>
                      {log?.completed ? <CheckCircle2 size={14} /> : format(d, 'd')}
                    </div>
                  </div>
                )
              })}
            </div>
            <ProgressBar value={weekCompletion} color="xp" size="md" showLabel />
          </div>

          {/* Water & Protein */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <Droplets size={14} className="text-primary" /> Water Intake
                </span>
                <span className="text-xs text-gray-500">Target: {profile?.waterTarget ?? 2.5}L</span>
              </div>
              <ProgressBar value={Math.min(100, (todayLog.waterIntake ?? 0) / (profile?.waterTarget ?? 2.5) * 100)} color="primary" size="md" />
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <Zap size={14} className="text-warning" /> Protein
                </span>
                <span className="text-xs text-gray-500">Target: {profile?.proteinTarget ?? 120}g</span>
              </div>
              <ProgressBar value={0} color="warning" size="md" />
            </div>
          </div>
        </>
      )}

      {/* Workout Plan Tab */}
      {activeTab === 'plan' && plan && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-bold text-lg text-white mb-1">{plan.name}</h3>
            <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plan.schedule.map((day: WorkoutDay) => (
                <div key={day.day} className="glass rounded-2xl p-5 cursor-pointer hover:border-primary/30 transition-all"
                  onClick={() => { setEditingPlanDay(day); setEditExercises(day.exercises.map(e => ({ ...e }))); }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {day.day}
                      </div>
                      <h4 className="font-semibold text-sm text-white">{day.focus}</h4>
                    </div>
                    <Edit3 size={14} className="text-gray-500 hover:text-primary" />
                  </div>
                  <div className="space-y-2">
                    {day.exercises.map((ex, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-1 h-1 rounded-full bg-gray-600" />
                        <span className="flex-1">{ex.name}</span>
                        <span className="font-mono text-gray-500">{ex.sets}x{ex.reps}</span>
                        <span className="text-2xs text-gray-600">{ex.restTime}</span>
                        <span className="text-2xs text-primary">{calcCalories(ex)} cal</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'plan' && !plan && (
        <div className="glass rounded-2xl p-12 text-center">
          <Dumbbell size={48} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Complete setup to generate your plan</p>
        </div>
      )}

      {/* Track Tab */}
      {activeTab === 'track' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">Today's Log</h3>
            <button onClick={() => setShowLogModal(true)}
              disabled={!!todayWorkout?.completed}
              className="btn-primary text-sm gap-1">
              {todayWorkout?.completed ? <CheckCircle2 size={16} /> : <Plus size={16} />}
              {todayWorkout?.completed ? 'Completed' : 'Log Workout'}
            </button>
          </div>

          {todayPlan && (
            <div className="glass rounded-2xl p-6">
              <h4 className="font-semibold text-white mb-3">{todayPlan.focus}</h4>
              <div className="space-y-2">
                {todayPlan.exercises.map((ex, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03]">
                    <input type="checkbox"
                      checked={todayLog.exercises?.find((e: any) => e.name === ex.name)?.completed ?? false}
                      onChange={() => setTodayLog(prev => ({
                        ...prev,
                        exercises: (prev.exercises ?? plan?.schedule.flatMap(d => d.exercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps, completed: false }))) ?? []).map((e: any) =>
                          e.name === ex.name ? { ...e, completed: !e.completed } : e
                        ),
                      }))}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-sm text-gray-300 flex-1">{ex.name}</span>
                    <span className="text-xs text-gray-500">{ex.sets}x{ex.reps}</span>
                    <span className="text-2xs text-gray-600">{ex.restTime}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass rounded-2xl p-6">
            <h4 className="font-semibold text-white mb-4">Log Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Duration (min)</label>
                <input type="number" value={todayLog.duration ?? wizard.workoutDuration}
                  onChange={e => setTodayLog(prev => ({ ...prev, duration: Number(e.target.value) }))}
                  className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Calories Burned</label>
                <input type="number" value={todayLog.caloriesBurned ?? Math.round(wizard.weight * 0.1 * wizard.workoutDuration)}
                  onChange={e => setTodayLog(prev => ({ ...prev, caloriesBurned: Number(e.target.value) }))}
                  className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Water (L)</label>
                <input type="number" step="0.1" value={todayLog.waterIntake ?? 0}
                  onChange={e => setTodayLog(prev => ({ ...prev, waterIntake: Number(e.target.value) }))}
                  className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Mood (1-5)</label>
                <Select value={String(todayLog.mood ?? 3)} onChange={value => setTodayLog(prev => ({ ...prev, mood: Number(value) }))}
                options={[1, 2, 3, 4, 5].map(n => ({ value: String(n), label: String(n) }))} />
              </div>
            </div>
            <button onClick={handleLogWorkout} className="btn-primary w-full mt-4 gap-2">
              <CheckCircle2 size={16} /> Complete Workout (+{WORKOUT_XP} XP, +{WORKOUT_COINS} coins)
            </button>
          </div>
        </div>
      )}

      {/* Diet Plan Tab */}
      {activeTab === 'diet' && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Daily Meal Plan</h3>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Diet:</label>
                <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
                  <button onClick={() => {
                    setDietaryPreference('veg')
                    if (profile) {
                      const d = generateDietPlan(profile.dailyCalories, profile.proteinTarget, wizard.fitnessGoal, 'veg')
                      setDietPlans(d)
                      saveDietPlans(user!.uid, d)
                      toast.success('Veg meal plan generated!')
                    }
                  }}
                    className={`px-3 py-1.5 text-xs font-medium transition-all ${dietaryPreference === 'veg' ? 'bg-success/20 text-success' : 'text-gray-400 hover:text-white'}`}>
                    🥦 Veg
                  </button>
                  <button onClick={() => {
                    setDietaryPreference('non-veg')
                    if (profile) {
                      const d = generateDietPlan(profile.dailyCalories, profile.proteinTarget, wizard.fitnessGoal, 'non-veg')
                      setDietPlans(d)
                      saveDietPlans(user!.uid, d)
                      toast.success('Non-veg meal plan generated!')
                    }
                  }}
                    className={`px-3 py-1.5 text-xs font-medium transition-all ${dietaryPreference === 'non-veg' ? 'bg-warning/20 text-warning' : 'text-gray-400 hover:text-white'}`}>
                    🍗 Non-Veg
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-2xl font-black text-white">{profile?.dailyCalories ?? 0}</p>
                <p className="text-2xs text-gray-500">Daily Calories</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-2xl font-black text-white">{profile?.proteinTarget ?? 0}g</p>
                <p className="text-2xs text-gray-500">Protein</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-2xl font-black text-white">{profile?.waterTarget ?? 0}L</p>
                <p className="text-2xs text-gray-500">Water</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-2xl font-black text-white">{plan?.schedule.length ?? 0}</p>
                <p className="text-2xs text-gray-500">Workouts/Week</p>
              </div>
            </div>

            {/* Calorie Deficit Calculator */}
            <div className="glass rounded-2xl p-5 mb-6">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">📉 Calorie Deficit Calculator</h4>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1">
                  <label className="text-2xs text-gray-500 mb-1 block">Daily Deficit (kcal)</label>
                  <input type="number" value={deficit} onChange={e => {
                    setDeficit(Number(e.target.value))
                    const d = Number(e.target.value)
                    const lbsPerWeek = d * 7 / 7700
                    const kgPerWeek = lbsPerWeek
                    const daysToLose1kg = Math.round(7700 / d)
                    if (d > 0) {
                      setDeficitResult(
                        `~${kgPerWeek.toFixed(1)} kg/week • 1 kg in ~${daysToLose1kg} days • ${profile?.weight ? `Target ${(profile.weight - 5).toFixed(0)} kg in ~${Math.round(7700 * 5 / d)} days` : ''}`
                      )
                    } else { setDeficitResult(null) }
                  }} className="input-field !py-2 !px-3" min={0} max={2000} />
                </div>
                <div className="text-center">
                  <p className="text-2xs text-gray-500">Maintenance</p>
                  <p className="text-lg font-black text-white">{profile?.dailyCalories ?? 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xs text-gray-500">Deficit Diet</p>
                  <p className="text-lg font-black gradient-text">{(profile?.dailyCalories ?? 0) - deficit}</p>
                </div>
              </div>
              {deficitResult && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-sm text-primary font-medium">{deficitResult}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {dietPlans.map(day => (
                <div key={day.day} className="glass rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setSelectedDietDay(selectedDietDay === day.day ? null : day.day)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Apple size={16} className="text-primary" />
                      </div>
                      <span className="font-semibold text-white">{day.day}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{day.calories} cal</span>
                      <span>{day.protein}g protein</span>
                      <ChevronDown size={14} className={`transition-transform ${selectedDietDay === day.day ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {selectedDietDay === day.day && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 space-y-3 border-t border-white/[0.06]">
                          <div className="p-3 rounded-xl bg-white/[0.02]">
                            <p className="text-2xs text-gray-600 mb-1">Breakfast</p>
                            <p className="text-sm text-gray-300">{day.breakfast}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02]">
                            <p className="text-2xs text-gray-600 mb-1">Lunch</p>
                            <p className="text-sm text-gray-300">{day.lunch}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02]">
                            <p className="text-2xs text-gray-600 mb-1">Dinner</p>
                            <p className="text-sm text-gray-300">{day.dinner}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02]">
                            <p className="text-2xs text-gray-600 mb-1">Snacks</p>
                            {day.snacks.map((s, i) => <p key={i} className="text-sm text-gray-300">• {s}</p>)}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 rounded-lg bg-white/[0.02] text-center">
                              <p className="text-xs font-bold text-white">{day.calories}</p>
                              <p className="text-2xs text-gray-600">Calories</p>
                            </div>
                            <div className="p-2 rounded-lg bg-white/[0.02] text-center">
                              <p className="text-xs font-bold text-white">{day.protein}g</p>
                              <p className="text-2xs text-gray-600">Protein</p>
                            </div>
                            <div className="p-2 rounded-lg bg-white/[0.02] text-center">
                              <p className="text-xs font-bold text-white">{day.waterIntake}L</p>
                              <p className="text-2xs text-gray-600">Water</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <Calendar size={48} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No workouts logged yet</p>
              <p className="text-sm text-gray-600 mt-1">Start tracking your progress</p>
            </div>
          ) : (
            logs.slice(0, 30).map(log => (
              <div key={log.id} className="glass rounded-2xl p-4">
                {editingLogId === log.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{format(new Date(log.date), 'MMM d, yyyy')}</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateLog(log.id)} className="btn-primary !py-1.5 !px-3 text-xs">Save</button>
                        <button onClick={() => { setEditingLogId(null); setEditForm({}) }} className="btn-secondary !py-1.5 !px-3 text-xs">Cancel</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-2xs text-gray-500 mb-1 block">Duration (min)</label>
                        <input type="number" value={editForm.duration ?? log.duration}
                          onChange={e => setEditForm(f => ({ ...f, duration: Number(e.target.value) }))}
                          className="input-field !py-2 !px-3 text-sm" />
                      </div>
                      <div>
                        <label className="text-2xs text-gray-500 mb-1 block">Calories</label>
                        <input type="number" value={editForm.caloriesBurned ?? log.caloriesBurned}
                          onChange={e => setEditForm(f => ({ ...f, caloriesBurned: Number(e.target.value) }))}
                          className="input-field !py-2 !px-3 text-sm" />
                      </div>
                      <div>
                        <label className="text-2xs text-gray-500 mb-1 block">Mood (1-5)</label>
                        <input type="number" min={1} max={5} value={editForm.mood ?? log.mood}
                          onChange={e => setEditForm(f => ({ ...f, mood: Number(e.target.value) }))}
                          className="input-field !py-2 !px-3 text-sm" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      log.completed ? 'bg-success/20' : 'bg-white/[0.04]'
                    }`}>
                      {log.completed
                        ? <CheckCircle2 size={20} className="text-success" />
                        : <Circle size={20} className="text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{format(new Date(log.date), 'MMM d, yyyy')}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1"><Timer size={12} /> {log.duration} min</span>
                        <span className="flex items-center gap-1"><Flame size={12} /> {log.caloriesBurned} cal</span>
                        <span className="flex items-center gap-1"><Zap size={12} className="text-primary" /> +{log.xpEarned} XP</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500 text-xs font-bold">🪙 {log.coinsEarned}</span>
                      <button onClick={() => { setEditingLogId(log.id); setEditForm({}) }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDeleteLog(log.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-danger hover:bg-danger/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Flag size={18} className="text-primary" /> Challenges</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {(['30', '60', '90', '365'] as ChallengeDuration[]).map(d => {
                const days = Number(d)
                const existing = challenges.find(c => c.duration === d)
                const isActive = existing?.active
                return (
                  <button key={d} onClick={() => {
                    if (!user || isActive) return
                    const newChallenge: Challenge = {
                      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
                      title: `${days}-Day Challenge`,
                      description: `Complete workouts consistently for ${days} days`,
                      duration: d, startDate: today,
                      targetWorkouts: days >= 90 ? days / 2 : days >= 60 ? Math.round(days * 0.6) : Math.round(days * 0.75),
                      targetCalories: days * 300,
                      completedWorkouts: 0, completedCalories: 0,
                      active: true, completed: false, createdAt: Date.now(),
                    }
                    setChallenges(prev => [...prev, newChallenge])
                    toast.success(`${days}-Day Challenge started!`)
                  }}
                    className={`glass rounded-2xl p-4 text-center transition-all ${isActive ? 'border-primary/40 ring-1 ring-primary/30' : 'hover:border-primary/20'}`}>
                    <p className="text-2xl font-black gradient-text mb-1">{days}</p>
                    <p className="text-xs text-gray-500">Days</p>
                    {isActive && <p className="text-2xs text-primary mt-1">Active 🔥</p>}
                    {existing?.completed && <p className="text-2xs text-success mt-1">Completed 🏆</p>}
                  </button>
                )
              })}
            </div>
            {challenges.filter(c => c.active || c.completed).map(c => {
              const daysElapsed = differenceInDays(new Date(), parseISO(c.startDate))
              const progress = Math.min(100, (c.completedWorkouts / c.targetWorkouts) * 100)
              return (
                <div key={c.id} className="glass rounded-2xl p-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white">{c.title}</p>
                      <p className="text-2xs text-gray-500">{daysElapsed}d elapsed • {c.completedWorkouts}/{c.targetWorkouts} workouts</p>
                    </div>
                    {c.completed ? <span className="text-success text-xs font-bold">✅ Done</span> :
                      <span className="text-primary text-xs">{Math.round(progress)}%</span>}
                  </div>
                  <ProgressBar value={progress} color={c.completed ? 'success' : 'primary'} size="sm" />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Workout Plan Edit Modal */}
      <AnimatePresence>
        {editingPlanDay && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setEditingPlanDay(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Day {editingPlanDay.day}: {editingPlanDay.focus}</h3>
                <button onClick={() => setEditingPlanDay(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
              </div>
              <div className="space-y-3">
                {editExercises.map((ex, i) => (
                  <div key={i} className="glass p-3 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={ex.name} onChange={e => {
                        const next = [...editExercises]; next[i] = { ...next[i], name: e.target.value }; setEditExercises(next)
                      }} className="input-field !py-1.5 !px-2 text-sm flex-1" placeholder="Exercise name" />
                      <button onClick={() => setEditExercises(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-danger/70 hover:text-danger p-1"><X size={14} /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-2xs text-gray-500">Sets</label>
                        <input type="number" value={ex.sets} onChange={e => {
                          const next = [...editExercises]; next[i] = { ...next[i], sets: Number(e.target.value) }; setEditExercises(next)
                        }} className="input-field !py-1.5 !px-2 text-sm" min={1} />
                      </div>
                      <div>
                        <label className="text-2xs text-gray-500">Reps</label>
                        <input value={ex.reps} onChange={e => {
                          const next = [...editExercises]; next[i] = { ...next[i], reps: e.target.value }; setEditExercises(next)
                        }} className="input-field !py-1.5 !px-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-2xs text-gray-500">Rest</label>
                        <input value={ex.restTime} onChange={e => {
                          const next = [...editExercises]; next[i] = { ...next[i], restTime: e.target.value }; setEditExercises(next)
                        }} className="input-field !py-1.5 !px-2 text-sm" />
                      </div>
                    </div>
                    <p className="text-2xs text-primary">~{calcCalories(ex)} cal estimated</p>
                  </div>
                ))}
                <button onClick={() => setEditExercises(prev => [...prev, { name: '', sets: 3, reps: '10', restTime: '60s' }])}
                  className="btn-secondary w-full text-xs gap-1"><Plus size={14} /> Add Exercise</button>
                <button onClick={handleSaveExercises} className="btn-primary w-full gap-1"><Save size={14} /> Save Changes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Inline ChevronDown for diet expand
const ChevronDown = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)
