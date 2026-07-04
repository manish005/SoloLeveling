import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core backgrounds
        bg: {
          primary: '#05070D',
          secondary: '#0D1117',
          card: '#0D1117',
          elevated: '#111827',
          hover: '#161B28',
        },
        // Brand colors
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          DEFAULT: '#3B82F6',
          glow: 'rgba(59, 130, 246, 0.4)',
        },
        accent: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          DEFAULT: '#8B5CF6',
          glow: 'rgba(139, 92, 246, 0.4)',
        },
        cyan: {
          DEFAULT: '#06B6D4',
          glow: 'rgba(6, 182, 212, 0.4)',
        },
        success: {
          DEFAULT: '#10B981',
          glow: 'rgba(16, 185, 129, 0.4)',
        },
        danger: {
          DEFAULT: '#EF4444',
          glow: 'rgba(239, 68, 68, 0.4)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          glow: 'rgba(245, 158, 11, 0.4)',
        },
        // Rank colors
        rank: {
          e: '#9CA3AF',
          d: '#6EE7B7',
          c: '#60A5FA',
          b: '#A78BFA',
          a: '#F59E0B',
          s: '#EF4444',
          ss: '#F97316',
          sss: '#EC4899',
          national: '#8B5CF6',
          monarch: '#FFD700',
        },
        // Border colors
        border: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          active: 'rgba(59, 130, 246, 0.5)',
          glow: 'rgba(139, 92, 246, 0.5)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      spacing: {
        sidebar: '260px',
        'sidebar-collapsed': '72px',
        header: '64px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(59, 130, 246, 0.3)',
        'glow-md': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.5)',
        'glow-xl': '0 0 80px rgba(59, 130, 246, 0.6)',
        'glow-accent': '0 0 20px rgba(139, 92, 246, 0.4)',
        'glow-accent-lg': '0 0 40px rgba(139, 92, 246, 0.5)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.4)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'hero-gradient': 'linear-gradient(135deg, #05070D 0%, #0D1117 50%, #05070D 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(13,17,23,0.8) 0%, rgba(17,24,39,0.6) 100%)',
        'primary-gradient': 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
        'accent-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
        'gold-gradient': 'linear-gradient(135deg, #F59E0B 0%, #FFD700 100%)',
        'xp-gradient': 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 50%, #06B6D4 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-glow-accent': 'pulseGlowAccent 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'xp-fill': 'xpFill 1.5s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease-in-out infinite',
        'particle-float': 'particleFloat 15s linear infinite',
        'level-up': 'levelUp 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'coin-fly': 'coinFly 0.8s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.8)' },
        },
        pulseGlowAccent: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        xpFill: {
          from: { width: '0%' },
          to: { width: 'var(--xp-percent)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        particleFloat: {
          '0%': { transform: 'translateY(100vh) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100px) rotate(720deg)', opacity: '0' },
        },
        levelUp: {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '60%': { transform: 'scale(1.2) rotate(10deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        coinFly: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-60px) scale(0.5)', opacity: '0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
}

export default config
