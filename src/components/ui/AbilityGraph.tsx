import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { Skills, SkillKey } from '../../types'
import { SKILL_CATEGORIES } from '../../types'

interface Props {
  skills: Skills | null
  size?: number
}

const KEYS = Object.keys(SKILL_CATEGORIES) as SkillKey[]
const ANGLES = KEYS.map((_, i) => (Math.PI * 2 * i) / KEYS.length - Math.PI / 2)

export const AbilityGraph = ({ skills, size = 280 }: Props) => {
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 24

  const levels = useMemo(() => {
    if (!skills) return KEYS.map(() => 0)
    const maxLv = Math.max(...KEYS.map(k => skills[k]?.level ?? 0), 1)
    return KEYS.map(k => ((skills[k]?.level ?? 0) / maxLv) * radius)
  }, [skills, radius])

  const gridLevels = [0.25, 0.5, 0.75, 1]

  const point = (angle: number, r: number) => ({
    x: cx + Math.cos(angle) * r,
    y: cy + Math.sin(angle) * r,
  })

  const polygonPoints = (rMultiplier: number) =>
    ANGLES.map(a => point(a, radius * rMultiplier)).map(p => `${p.x},${p.y}`).join(' ')

  const skillPoints = levels.map((r, i) => point(ANGLES[i], r))
  const skillPolygon = skillPoints.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0">
        <defs>
          <radialGradient id="ability-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.12)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </radialGradient>
          <linearGradient id="ability-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.15} />
          </linearGradient>
          <filter id="ability-glow-filter">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="ability-neon">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <circle cx={cx} cy={cy} r={radius} fill="url(#ability-glow)" />

        {gridLevels.map(l => (
          <polygon
            key={l}
            points={polygonPoints(l)}
            fill="none"
            stroke="rgba(59,130,246,0.08)"
            strokeWidth="1"
            strokeDasharray={l === 1 ? 'none' : '3,3'}
          />
        ))}

        {ANGLES.map((a, i) => (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={cx + Math.cos(a) * radius}
            y2={cy + Math.sin(a) * radius}
            stroke="rgba(59,130,246,0.06)"
            strokeWidth="1"
          />
        ))}

        <motion.polygon
          points={skillPolygon}
          fill="url(#ability-fill)"
          stroke="url(#ability-fill)"
          strokeWidth="2"
          filter="url(#ability-glow-filter)"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {skillPoints.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x} cy={p.y}
            r={4}
            fill={SKILL_CATEGORIES[KEYS[i]].color}
            filter="url(#ability-neon)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.05 }}
          />
        ))}
      </svg>

      {ANGLES.map((a, i) => {
        const labelRadius = radius + 18
        const lx = cx + Math.cos(a) * labelRadius
        const ly = cy + Math.sin(a) * labelRadius
        const lv = skills?.[KEYS[i]]?.level ?? 0
        return (
          <motion.div
            key={i}
            className="absolute flex flex-col items-center pointer-events-none"
            style={{
              left: lx - 30,
              top: ly - 14,
              width: 60,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 + i * 0.05 }}
          >
            <span className="text-[9px] font-semibold leading-tight text-center"
              style={{ color: SKILL_CATEGORIES[KEYS[i]].color }}>
              {KEYS[i]}
            </span>
            <span className="text-[10px] font-black font-mono leading-tight text-white">
              {lv}
            </span>
          </motion.div>
        )
      })}

      <motion.div
        className="absolute flex flex-col items-center pointer-events-none"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
      >
        <span className="text-xs font-black gradient-text">ABILITY</span>
        <span className="text-[10px] font-mono text-gray-500">
          Lv.{skills ? Math.max(...KEYS.map(k => skills[k]?.level ?? 0)) : 0}
        </span>
      </motion.div>
    </div>
  )
}
