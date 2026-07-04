import { motion } from 'framer-motion'
import { useUserStore } from '../../store/userStore'
import { skillXpProgress } from '../../services/xpService'
import { SKILL_CATEGORIES } from '../../types'
import type { SkillKey } from '../../types'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { Zap, Brain, Shield, Target, Star, BookOpen, Activity, TrendingUp, Code2, MessageCircle, Briefcase, Crown } from 'lucide-react'

const ICON_MAP: Record<string, any> = {
  Dumbbell: Activity,
  Brain: Brain,
  Shield: Shield,
  Target: Target,
  Star: Star,
  BookOpen: BookOpen,
  Activity: Activity,
  TrendingUp: TrendingUp,
  Code2: Code2,
  MessageCircle: MessageCircle,
  Briefcase: Briefcase,
  Crown: Crown,
}

export const SkillsPage = () => {
  const { skills } = useUserStore()

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Skill Tree</h1>
        <p className="text-sm text-gray-500">Each action increases your level in corresponding skills.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {skills &&
          Object.entries(skills).map(([key, skill]) => {
            const cat = SKILL_CATEGORIES[key as SkillKey]
            const Icon = ICON_MAP[cat.icon] || Zap
            const progress = skillXpProgress(skill.xp) * 100

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass p-5 flex flex-col relative overflow-hidden group hover:border-primary/20 transition-all duration-300"
                style={{ borderColor: `${cat.color}20` }}
              >
                {/* Glow Background */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `radial-gradient(circle at center, ${cat.color}, transparent 70%)` }}
                />

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${cat.color}20`, border: `1px solid ${cat.color}30` }}
                  >
                    <Icon size={20} style={{ color: cat.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white capitalize">{cat.label}</h3>
                    <p className="text-xs text-gray-500 font-mono">Level {skill.level}</p>
                  </div>
                </div>

                <div className="mt-auto space-y-1">
                  <div className="flex justify-between text-2xs text-gray-500">
                    <span>XP Progress</span>
                    <span className="font-mono">{skill.xp} XP</span>
                  </div>
                  <ProgressBar value={progress} color="primary" size="sm" animated={false} />
                </div>
              </motion.div>
            )
          })}
      </div>
    </div>
  )
}
