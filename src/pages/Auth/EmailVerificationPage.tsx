import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, RefreshCw, CheckCircle } from 'lucide-react'
import { resendVerificationEmail } from '../../lib/auth'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export const EmailVerificationPage = () => {
  const { user } = useAuthStore()
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleResend = async () => {
    setLoading(true)
    try {
      await resendVerificationEmail()
      setResent(true)
      toast.success('Verification email sent!')
    } catch {
      toast.error('Failed to resend email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-3xl p-8 w-full text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-6">
        <Mail className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Verify Your Email</h1>
      <p className="text-sm text-gray-400 mb-2">
        We sent a verification email to
      </p>
      <p className="text-sm font-semibold text-primary mb-6">{user?.email}</p>
      <p className="text-sm text-gray-500 mb-8">
        Click the link in the email to activate your account, then come back and log in.
      </p>
      {resent ? (
        <div className="flex items-center justify-center gap-2 text-success text-sm mb-6">
          <CheckCircle size={16} /> Email resent!
        </div>
      ) : (
        <button onClick={handleResend} disabled={loading}
          className="btn-secondary w-full py-3 mb-4">
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><RefreshCw size={16} /> Resend Email</>}
        </button>
      )}
      <Link to="/login" className="text-sm text-gray-500 hover:text-white transition-colors">
        Back to Login
      </Link>
    </div>
  )
}
