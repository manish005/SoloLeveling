import { motion } from 'framer-motion'
import { Award, Lock } from 'lucide-react'

const BADGES = [
  { id: 'b1', name: 'Iron Will', description: 'Complete a 7-day streak.', icon: '🛡️', rarity: 'rare', unlocked: true },
  { id: 'b2', name: 'Monarch Shadow', description: 'Complete 100 total quests.', icon: '👥', rarity: 'epic', unlocked: false },
  { id: 'b3', name: 'Deep Scholar', description: 'Reach Level 10 in Knowledge.', icon: '📖', rarity: 'epic', unlocked: false },
  { id: 'b4', name: 'Alchemist', description: 'Perform 50 trading operations.', icon: '🧪', rarity: 'legendary', unlocked: false },
]

export const BadgesPage = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Hunter Emblems</h1>
        <p className="text-sm text-gray-500">Collectable insignia certifying outstanding accomplishments.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {BADGES.map(badge => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass p-5 flex flex-col items-center text-center relative border transition-all duration-300 ${
              badge.unlocked ? 'border-primary/20 opacity-100' : 'border-white/[0.04] opacity-40'
            }`}
          >
            {!badge.unlocked && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-bg-primary/20 backdrop-blur-[1px] z-10">
                <Lock size={18} className="text-gray-600" />
              </div>
            )}
            <div className="text-4xl mb-3">{badge.icon}</div>
            <h3 className="font-bold text-white text-sm mb-1">{badge.name}</h3>
            <p className="text-xs text-gray-500">{badge.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
