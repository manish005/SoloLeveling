import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

interface Props {
  value: number // 0-100
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'xp'
  className?: string
}

const COLOR_CLASSES = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  xp: '', // handled separately
}

const HEIGHT: Record<string, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

export const ProgressBar = ({
  value,
  showLabel = false,
  size = 'md',
  animated = true,
  color = 'primary',
  className,
}: Props) => {
  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-500">Progress</span>
          <span className="text-xs font-mono text-gray-400">{clampedValue.toFixed(0)}%</span>
        </div>
      )}
      <div
        className={cn('progress-track', HEIGHT[size])}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {animated ? (
          <motion.div
            className={cn(
              'h-full rounded-full',
              color === 'xp' ? 'xp-bar-fill' : `progress-fill ${COLOR_CLASSES[color]}`
            )}
            initial={{ width: 0 }}
            animate={{ width: `${clampedValue}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        ) : (
          <div
            className={cn(
              'h-full rounded-full',
              color === 'xp' ? 'xp-bar-fill' : `progress-fill ${COLOR_CLASSES[color]}`
            )}
            style={{ width: `${clampedValue}%` }}
          />
        )}
      </div>
    </div>
  )
}
