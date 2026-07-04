import { Moon, Sun } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'

export const ThemeToggle = () => {
  const { themeMode, toggleThemeMode } = useUIStore()
  const isLight = themeMode === 'light'

  return (
    <button
      onClick={toggleThemeMode}
      className="btn-ghost p-2 relative"
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        <Sun
          size={18}
          className={`absolute inset-0 transition-all duration-300 ${
            isLight ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-75'
          } text-yellow-400`}
        />
        <Moon
          size={18}
          className={`absolute inset-0 transition-all duration-300 ${
            isLight ? 'opacity-0 -rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
          } text-blue-400`}
        />
      </div>
    </button>
  )
}
