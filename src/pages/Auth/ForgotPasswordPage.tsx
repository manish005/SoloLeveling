import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { resetPassword } from '../../lib/auth'
import toast from 'react-hot-toast'

const schema = z.object({ email: z.string().email('Invalid email address') })
type FormData = z.infer<typeof schema>

export const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await resetPassword(data.email)
      setSent(true)
      toast.success('Reset email sent!')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-3xl p-8 w-full">
      <Link to="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Login
      </Link>

      {sent ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-success/20 border border-success/30 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
          <p className="text-sm text-gray-400">We've sent a password reset link to your email address.</p>
          <Link to="/login" className="btn-primary inline-flex mt-6">Back to Login</Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-black text-white">Reset Password</h1>
            <p className="text-sm text-gray-500 mt-1">Enter your email to receive a reset link</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input {...register('email')} type="email" placeholder="hunter@example.com"
                  className={`input-field pl-10 ${errors.email ? 'error' : ''}`} />
              </div>
              {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Send size={18} /> Send Reset Link</>}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
