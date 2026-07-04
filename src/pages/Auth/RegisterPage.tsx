import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Zap } from 'lucide-react'
import { registerWithEmail, loginWithGoogle } from '../../lib/auth'
import { dbSet, PATHS } from '../../lib/database'
import { generateDefaultDailyQuests } from '../../services/questService'
import toast from 'react-hot-toast'
import type { UserProfile, UserStats, Skills } from '../../types'
import { format } from 'date-fns'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const levels = [
    { label: 'Very Weak', color: '#EF4444' },
    { label: 'Weak', color: '#F97316' },
    { label: 'Fair', color: '#F59E0B' },
    { label: 'Strong', color: '#10B981' },
    { label: 'Very Strong', color: '#3B82F6' },
  ]
  return { score, ...levels[Math.min(score, 4)] }
}

export const RegisterPage = () => {
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const strength = getPasswordStrength(password)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const initUserData = async (uid: string, firstName: string, lastName: string, email: string) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const name = `${firstName} ${lastName}`
    const profile: UserProfile = {
      uid, name, username: `${firstName}_${lastName}`.toLowerCase().replace(/\s+/g, '_'),
      email, createdAt: Date.now(), updatedAt: Date.now(),
      onboardingComplete: false, emailVerified: false, role: 'user',
    }
    const stats: UserStats = {
      xp: 0, totalXpEarned: 0, level: 1, rank: 'E',
      coins: 100, currentStreak: 0, longestStreak: 0,
      totalTasksCompleted: 0, totalQuestsCompleted: 0,
      lastActiveDate: today, weeklyXp: 0, monthlyXp: 0,
    }
    const skills: Skills = Object.fromEntries(
      ['strength','intelligence','discipline','focus','charisma','knowledge',
       'fitness','trading','coding','communication','business','leadership']
        .map(k => [k, { level: 1, xp: 0, totalXp: 0 }])
    ) as Skills

    await Promise.all([
      dbSet(PATHS.profile(uid), profile),
      dbSet(PATHS.stats(uid), stats),
      dbSet(PATHS.skills(uid), skills),
    ])
    await generateDefaultDailyQuests(uid)
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const name = `${data.firstName} ${data.lastName}`
      const user = await registerWithEmail(data.email, data.password, name)
      await initUserData(user.uid, data.firstName, data.lastName, data.email)
      toast.success('Account created! Welcome to the System.')
      navigate('/onboarding')
    } catch (err: any) {
      toast.error(err?.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    try {
      const user = await loginWithGoogle()
      await initUserData(user.uid, user.displayName?.split(' ')[0] ?? 'Hunter', user.displayName?.split(' ')[1] ?? '', user.email ?? '')
      toast.success('Welcome to the System!')
      navigate('/onboarding')
    } catch (err: any) {
      toast.error(err?.message ?? 'Google sign-in failed')
    }
  }

  return (
    <div className="glass rounded-3xl p-8 w-full">
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-16 h-16 rounded-2xl bg-accent-gradient flex items-center justify-center mx-auto mb-4"
          style={{ boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}
        >
          <Zap className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-2xl font-black text-white">Begin Your Journey</h1>
        <p className="text-sm text-gray-500 mt-1">Create your Hunter profile</p>
      </div>

      <button onClick={handleGoogle} className="btn-secondary w-full mb-5 py-3 gap-3">
        <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" width="18" height="18">
          <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.62 14.98 1 12 1 7.35 1 3.39 3.67 1.5 7.57l3.86 3c.92-2.75 3.49-4.53 6.64-4.53z"/>
          <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2 3.7-5.02 3.7-8.71z"/>
          <path fill="#FBBC05" d="M5.36 14.43c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.5 6.87C.54 8.77 0 10.82 0 13s.54 4.23 1.5 6.13l3.86-3.7z"/>
          <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.1.74-2.51 1.18-4.23 1.18-3.15 0-5.72-1.78-6.64-4.53L1.5 17.57C3.39 21.33 7.35 24 12 24z"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-xs text-gray-600">or</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* First & Last Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">First Name</label>
            <input {...register('firstName')} type="text" placeholder="John"
              className={`input-field ${errors.firstName ? 'error' : ''}`} />
            {errors.firstName && <p className="text-xs text-danger mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Last Name</label>
            <input {...register('lastName')} type="text" placeholder="Wick"
              className={`input-field ${errors.lastName ? 'error' : ''}`} />
            {errors.lastName && <p className="text-xs text-danger mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1.5 block">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input {...register('email')} type="email" placeholder="hunter@example.com"
              className={`input-field pl-10 ${errors.email ? 'error' : ''}`} />
          </div>
          {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Password</label>
            <div className="relative">
              <input {...register('password')} type={showPass ? 'text' : 'password'}
                placeholder="Min. 8 chars" onChange={e => setPassword(e.target.value)}
                className={`input-field pr-10 ${errors.password ? 'error' : ''}`} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Confirm</label>
            <input {...register('confirmPassword')} type="password" placeholder="Repeat"
              className={`input-field ${errors.confirmPassword ? 'error' : ''}`} />
            {errors.confirmPassword && <p className="text-xs text-danger mt-1">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        {/* Strength meter */}
        {password.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                  style={{ background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.06)' }} />
              ))}
            </div>
            <p className="text-2xs" style={{ color: strength.color }}>{strength.label}</p>
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Zap size={18} /> Awaken Your Power</>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        Already a Hunter?{' '}
        <Link to="/login" className="text-primary hover:text-primary-400 font-semibold transition-colors">
          Sign In
        </Link>
      </p>
    </div>
  )
}
