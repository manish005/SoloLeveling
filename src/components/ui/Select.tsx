import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Option { value: string; label: string }

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  className?: string
  label?: string
}

export const Select = ({ value, onChange, options, className = '', label }: SelectProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
          bg-white/[0.04] dark:bg-white/[0.04] border border-white/[0.08] dark:border-white/[0.08]
          text-white dark:text-white hover:border-primary/30"
      >
        <span>{selected?.label ?? value}</span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 py-1 rounded-xl overflow-hidden
              bg-bg-elevated dark:bg-[#1a1f2e] border border-white/[0.08] dark:border-white/[0.08]
              shadow-xl shadow-black/40"
          >
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  opt.value === value
                    ? 'text-white bg-primary/15'
                    : 'text-gray-400 dark:text-gray-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
