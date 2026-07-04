import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ParticleBackground } from '../components/animations/ParticleBackground'
import { Zap } from 'lucide-react'

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center relative overflow-hidden">
      {/* Particle background */}
      <ParticleBackground />

      {/* Grid overlay */}
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Ambient glow orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />

      {/* Logo top */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary-gradient flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-black text-lg gradient-text tracking-tight">SoloLevel</span>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <Outlet />
      </motion.div>
    </div>
  )
}
