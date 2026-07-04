import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check, Zap } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { dbUpdate, PATHS } from '../../lib/database'
import { ParticleBackground } from '../../components/animations/ParticleBackground'
import { Select } from '../../components/ui/Select'
import toast from 'react-hot-toast'

const PROFESSIONS = ['Student', 'Developer', 'Designer', 'Entrepreneur', 'Trader', 'Athlete', 'Writer', 'Teacher', 'Doctor', 'Other']
const GOALS = ['Build Muscle', 'Learn to Code', 'Read More Books', 'Master Trading', 'Meditate Daily', 'Study Consistently', 'Build a Business', 'Improve Focus', 'Build Discipline', 'Financial Freedom']
const INTERESTS = ['Fitness', 'Coding', 'Trading', 'Reading', 'Meditation', 'Business', 'Learning', 'Nutrition', 'Gaming', 'Music', 'Art', 'Writing']
const COUNTRIES = ['United States', 'United Kingdom', 'India', 'Canada', 'Australia', 'Germany', 'Japan', 'Brazil', 'France', 'Other']
const THEMES = [
  { id: 'dark', label: 'Shadow', color: '#0D1117', accent: '#3B82F6' },
  { id: 'purple', label: 'Monarch', color: '#0D0A1E', accent: '#8B5CF6' },
  { id: 'blue', label: 'Ocean', color: '#050F1A', accent: '#06B6D4' },
  { id: 'darker', label: 'Abyss', color: '#030508', accent: '#EC4899' },
]

interface FormState {
  firstName: string; lastName: string; age: string; gender: string; country: string
  profession: string; goals: string[]; dailyTarget: string
  interests: string[]; preferredTheme: string
}

const STEPS = ['Welcome', 'Personal', 'Profession', 'Goals', 'Theme', 'Done']

export const OnboardingPage = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>({
    firstName: user?.displayName?.split(' ')[0] ?? '', lastName: user?.displayName?.split(' ').slice(1).join(' ') ?? '',
    age: '', gender: '', country: '',
    profession: '', goals: [], dailyTarget: '5', interests: [], preferredTheme: 'dark',
  })

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const prev = () => setStep(s => Math.max(s - 1, 0))

  const toggleArray = (key: 'goals' | 'interests', val: string) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val].slice(0, 5),
    }))
  }

  const finish = async () => {
    if (!user) return
    setSaving(true)
    try {
      const fullName = `${form.firstName} ${form.lastName}`.trim()
      await dbUpdate(PATHS.profile(user.uid), {
        ...form, name: fullName, firstName: form.firstName, lastName: form.lastName,
        age: parseInt(form.age) || undefined,
        dailyTarget: parseInt(form.dailyTarget) || 5,
        onboardingComplete: true, updatedAt: Date.now(),
      })
      toast.success('Profile saved! Your journey begins.')
      navigate('/dashboard')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const progress = ((step) / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center relative overflow-hidden px-4">
      <ParticleBackground />
      <div className="fixed inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s} className={`text-2xs font-medium transition-colors ${i <= step ? 'text-primary' : 'text-gray-600'}`}>
                {i < step ? <Check size={12} className="text-success" /> : i === step ? s : '·'}
              </div>
            ))}
          </div>
          <div className="xp-bar-track h-1.5">
            <motion.div className="xp-bar-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-3xl p-8"
          >
            {/* STEP 0: Welcome */}
            {step === 0 && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary-gradient flex items-center justify-center mx-auto mb-6"
                  style={{ boxShadow: '0 0 40px rgba(59,130,246,0.4)' }}>
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-black text-white mb-3">Welcome, Hunter</h1>
                <p className="text-gray-400 text-sm leading-relaxed mb-2">
                  Before you enter the System, let us learn more about you.
                  Your profile will power your personal leveling journey.
                </p>
                <p className="text-xs text-gray-600">Takes less than 2 minutes</p>
              </div>
            )}

            {/* STEP 1: Personal */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Tell us about yourself</h2>
                <p className="text-sm text-gray-500 mb-6">Basic info to personalize your experience</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-400 mb-1.5 block">First Name</label>
                      <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                        placeholder="First name" className="input-field" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 mb-1.5 block">Last Name</label>
                      <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                        placeholder="Last name" className="input-field" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-400 mb-1.5 block">Age</label>
                      <input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                        placeholder="Age" className="input-field" min="10" max="100" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 mb-1.5 block">Gender</label>
                      <Select value={form.gender} onChange={value => setForm(f => ({ ...f, gender: value }))}
                        options={[
                          { value: '', label: 'Select' },
                          { value: 'male', label: 'Male' },
                          { value: 'female', label: 'Female' },
                          { value: 'other', label: 'Other' },
                          { value: 'prefer-not-to-say', label: 'Prefer not to say' },
                        ]} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">Country</label>
                    <Select value={form.country} onChange={value => setForm(f => ({ ...f, country: value }))}
                      options={[{ value: '', label: 'Select country' }, ...COUNTRIES.map(c => ({ value: c, label: c }))]} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Profession + Daily Target */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Your Profession</h2>
                <p className="text-sm text-gray-500 mb-6">What best describes you?</p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {PROFESSIONS.map(p => (
                    <button key={p} onClick={() => setForm(f => ({ ...f, profession: p }))}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        form.profession === p
                          ? 'bg-primary/20 border-primary/50 text-white'
                          : 'border-white/[0.06] text-gray-400 hover:border-white/20 hover:text-white'
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                    Daily Quest Target: <span className="text-primary">{form.dailyTarget} quests/day</span>
                  </label>
                  <input type="range" min="1" max="10" value={form.dailyTarget}
                    onChange={e => setForm(f => ({ ...f, dailyTarget: e.target.value }))}
                    className="w-full accent-primary" />
                  <div className="flex justify-between text-2xs text-gray-600 mt-1">
                    <span>1</span><span>5</span><span>10</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Goals + Interests */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Your Goals</h2>
                <p className="text-sm text-gray-500 mb-4">Pick up to 5 goals</p>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {GOALS.map(g => (
                    <button key={g} onClick={() => toggleArray('goals', g)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border text-left ${
                        form.goals.includes(g)
                          ? 'bg-accent/20 border-accent/50 text-white'
                          : 'border-white/[0.06] text-gray-400 hover:border-white/20 hover:text-white'
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mb-3">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(i => (
                    <button key={i} onClick={() => toggleArray('interests', i)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        form.interests.includes(i)
                          ? 'bg-cyan/20 border-cyan/50 text-cyan-300'
                          : 'border-white/[0.06] text-gray-400 hover:border-white/20'
                      }`}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Theme */}
            {step === 4 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Choose Your Theme</h2>
                <p className="text-sm text-gray-500 mb-6">Customize your System interface</p>
                <div className="grid grid-cols-2 gap-3">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => setForm(f => ({ ...f, preferredTheme: t.id }))}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        form.preferredTheme === t.id ? 'scale-105' : 'border-white/[0.06] opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        background: t.color,
                        borderColor: form.preferredTheme === t.id ? t.accent : undefined,
                        boxShadow: form.preferredTheme === t.id ? `0 0 20px ${t.accent}40` : undefined,
                      }}>
                      <div className="w-8 h-8 rounded-lg mb-2" style={{ background: t.accent }} />
                      <p className="text-sm font-bold text-white">{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: Done */}
            {step === 5 && (
              <div className="text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 rounded-full bg-success/20 border-2 border-success/50 flex items-center justify-center mx-auto mb-6"
                  style={{ boxShadow: '0 0 30px rgba(16,185,129,0.3)' }}>
                  <Check className="w-10 h-10 text-success" />
                </motion.div>
                <h2 className="text-2xl font-black text-white mb-3">You're Ready!</h2>
                <p className="text-gray-400 text-sm mb-2">Your Hunter profile has been configured.</p>
                <p className="text-sm font-semibold gradient-text mb-6">The System awaits you.</p>
                <div className="glass rounded-2xl p-4 text-left space-y-2 mb-2">
                  {[['Name', `${form.firstName} ${form.lastName}`], ['Profession', form.profession], ['Daily Target', `${form.dailyTarget} quests`]].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-gray-500">{k}</span>
                      <span className="text-white font-medium">{v || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button onClick={prev} className="btn-secondary flex-1 py-2.5">
                  <ChevronLeft size={18} /> Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button onClick={next} className="btn-primary flex-1 py-2.5">
                  Continue <ChevronRight size={18} />
                </button>
              ) : (
                <button onClick={finish} disabled={saving} className="btn-primary flex-1 py-2.5">
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Zap size={18} /> Enter the System</>}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
