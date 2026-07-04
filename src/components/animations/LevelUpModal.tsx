import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useUserStore } from '../../store/userStore'
import { rankFromLevel } from '../../services/xpService'
import { RANK_COLORS, RANK_TITLES } from '../../types'
import { Crown, Zap, Star } from 'lucide-react'
import Confetti from './Confetti'

export const LevelUpModal = () => {
  const { levelUpPending, pendingLevel, clearLevelUp } = useUserStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const rank = rankFromLevel(pendingLevel)
  const rankColor = RANK_COLORS[rank]
  const rankTitle = RANK_TITLES[rank]

  useEffect(() => {
    if (levelUpPending) {
      timerRef.current = setTimeout(() => clearLevelUp(), 5000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [levelUpPending, clearLevelUp])

  return (
    <AnimatePresence>
      {levelUpPending && (
        <>
          <Confetti />
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={clearLevelUp}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-[100] px-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div
              className="relative glass rounded-3xl p-10 text-center max-w-sm w-full overflow-hidden"
              style={{
                borderColor: `${rankColor}40`,
                boxShadow: `0 0 60px ${rankColor}40, 0 0 120px ${rankColor}20`,
              }}
            >
              {/* Background glow */}
              <div
                className="absolute inset-0 rounded-3xl opacity-10"
                style={{ background: `radial-gradient(circle at center, ${rankColor}, transparent)` }}
              />

              {/* Floating stars */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${10 + (i % 3) * 30}%`,
                  }}
                  animate={{
                    y: [-10, -20, -10],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.2,
                    repeat: Infinity,
                  }}
                >
                  <Star className="w-3 h-3" style={{ color: rankColor }} />
                </motion.div>
              ))}

              {/* Crown icon */}
              <motion.div
                className="flex items-center justify-center w-24 h-24 rounded-full mx-auto mb-6 relative"
                style={{ background: `${rankColor}20`, border: `2px solid ${rankColor}40` }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="w-12 h-12" style={{ color: rankColor }} />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: `2px solid ${rankColor}` }}
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              {/* Level up text */}
              <motion.p
                className="text-xs font-bold uppercase tracking-[0.3em] mb-2"
                style={{ color: rankColor }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ⚡ Level Up!
              </motion.p>

              <motion.h2
                className="text-6xl font-black mb-2"
                style={{ color: rankColor, textShadow: `0 0 30px ${rankColor}` }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {pendingLevel}
              </motion.h2>

              <p className="text-xl font-bold text-white mb-1">{rankTitle}</p>
              <p className="text-sm text-gray-400 mb-2">Rank: <span style={{ color: rankColor }} className="font-bold">{rank}</span></p>

              <div className="flex items-center justify-center gap-2 mt-4">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm text-gray-300">You are getting stronger!</span>
                <Zap className="w-4 h-4 text-primary" />
              </div>

              <button
                onClick={clearLevelUp}
                className="btn-primary mt-6 w-full"
                style={{ background: `linear-gradient(135deg, ${rankColor}cc, ${rankColor})` }}
              >
                Continue
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
