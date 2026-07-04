import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Zap } from 'lucide-react'
import { loginWithEmail, loginWithGoogle } from '../../lib/auth'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean(),
})
type FormData = z.infer<typeof schema>

export const LoginPage = () => {
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rememberMe: true },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await loginWithEmail(data.email, data.password, data.rememberMe)
      toast.success('Welcome back, Hunter!')
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err?.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : err?.message ?? 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      toast.success('Welcome, Hunter!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err?.message ?? 'Google sign-in failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="glass rounded-3xl p-8 w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-16 h-16 rounded-2xl bg-primary-gradient flex items-center justify-center mx-auto mb-4"
          style={{ boxShadow: '0 0 30px rgba(59,130,246,0.4)' }}
        >
          <Zap className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-2xl font-black text-white">Welcome Back</h1>
        <p className="text-sm text-gray-500 mt-1">Continue your leveling journey</p>
      </div>

      {/* Google Sign In */}
      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className="btn-secondary w-full mb-6 py-3 gap-3"
      >
        {googleLoading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" width="18" height="18">
            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.62 14.98 1 12 1 7.35 1 3.39 3.67 1.5 7.57l3.86 3c.92-2.75 3.49-4.53 6.64-4.53z"/>
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2 3.7-5.02 3.7-8.71z"/>
            <path fill="#FBBC05" d="M5.36 14.43c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.5 6.87C.54 8.77 0 10.82 0 13s.54 4.23 1.5 6.13l3.86-3.7z"/>
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.1.74-2.51 1.18-4.23 1.18-3.15 0-5.72-1.78-6.64-4.53L1.5 17.57C3.39 21.33 7.35 24 12 24z"/>
          </svg>
        )}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-xs text-gray-600">or</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1.5 block">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              {...register('email')}
              type="email"
              placeholder="hunter@example.com"
              className={`input-field pl-10 ${errors.email ? 'error' : ''}`}
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1.5 block">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              {...register('password')}
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              className={`input-field pl-10 pr-10 ${errors.password ? 'error' : ''}`}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
        </div>

        {/* Remember me + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              {...register('rememberMe')}
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-white/10 bg-white/5 accent-primary"
            />
            <span className="text-xs text-gray-400">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-xs text-primary hover:text-primary-400 transition-colors">
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-base"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Zap size={18} />
              Enter the System
            </>
          )}
        </button>
      </form>

      {/* Sign up link */}
      <p className="text-center text-sm text-gray-500 mt-6">
        New Hunter?{' '}
        <Link to="/register" className="text-primary hover:text-primary-400 font-semibold transition-colors">
          Create Account
        </Link>
      </p>
    </div>
  )
}
