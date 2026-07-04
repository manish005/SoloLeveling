import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Zap, Shield, Target, Trophy, Flame, Play, ChevronRight, MessageSquare, HelpCircle, Info } from 'lucide-react'
import { ParticleBackground } from '../../components/animations/ParticleBackground'

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-bg-primary text-white relative overflow-hidden">
      <ParticleBackground />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 h-16 z-50 border-b border-white/[0.06] bg-bg-primary/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-gradient flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg gradient-text tracking-tight">SoloLevel</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="btn-secondary !px-4 !py-1.5 text-xs">Login</Link>
          <Link to="/register" className="btn-primary !px-4 !py-1.5 text-xs">Register</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 max-w-5xl mx-auto text-center space-y-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-xs text-primary font-semibold"
        >
          <SparklesIcon size={12} /> Unveiling SoloLevel System
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-black tracking-tight leading-tight"
        >
          Level Up Your <br />
          <span className="gradient-text">Real Life Experience</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed"
        >
          Complete workouts, learn coding, read books, or manage finances. Convert your everyday habits into XP, levels, and ranks in a stunning RPG-inspired interface.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-4 flex-wrap pt-4"
        >
          <Link to="/register" className="btn-primary py-3 px-8 text-sm gap-2">
            Awaken Now <ChevronRight size={16} />
          </Link>
          <Link to="/login" className="btn-secondary py-3 px-8 text-sm gap-2">
            <Play size={14} fill="currentColor" /> Watch Demo
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 max-w-6xl mx-auto relative z-10 border-t border-white/[0.04]">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-12">The Leveling System Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Habit Quests', desc: 'Define daily, weekly, or monthly missions. Earn rewards upon completion.', icon: Target, color: '#3B82F6' },
            { title: 'Skill Trees', desc: 'Invest points and level up attributes like coding, fitness, and intelligence.', icon: Zap, color: '#8B5CF6' },
            { title: 'Achievements', desc: 'Over 100+ challenges to certify your growth and unlock items.', icon: Trophy, color: '#F59E0B' },
          ].map((feat, i) => (
            <div key={i} className="glass p-6 space-y-4 border border-white/[0.04]">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${feat.color}20` }}>
                <feat.icon size={20} style={{ color: feat.color }} />
              </div>
              <h3 className="font-bold text-white text-base">{feat.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing / CTA */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center space-y-6 relative z-10 border-t border-white/[0.04]">
        <h2 className="text-2xl md:text-3xl font-black">Ready to Rise in Rank?</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Start for free today. Upgrade your attributes and build compound progression rules.
        </p>
        <Link to="/register" className="btn-primary py-3 px-8 text-sm">
          Initialize System — Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12 px-6 text-center text-xs text-gray-600 relative z-10">
        <p>© 2026 SoloLevel System. Inspired by progression mechanics. All rights reserved.</p>
      </footer>
    </div>
  )
}

function SparklesIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
}
