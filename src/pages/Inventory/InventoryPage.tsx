import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { dbGet, PATHS } from '../../lib/database'
import type { InventoryItem } from '../../types'
import { Archive, Award, Shield, Palette, Sparkles, AlertCircle, Lock, Medal } from 'lucide-react'

const BADGES = [
  { id: 'b1', name: 'Iron Will', description: 'Complete a 7-day streak.', icon: '🛡️', rarity: 'rare' as const, unlocked: false },
  { id: 'b2', name: 'Monarch Shadow', description: 'Complete 100 total quests.', icon: '👥', rarity: 'epic' as const, unlocked: false },
  { id: 'b3', name: 'Deep Scholar', description: 'Reach Level 10 in Knowledge.', icon: '📖', rarity: 'epic' as const, unlocked: false },
  { id: 'b4', name: 'Alchemist', description: 'Perform 50 trading operations.', icon: '🧪', rarity: 'legendary' as const, unlocked: false },
]

type Tab = 'inventory' | 'badges'

export const InventoryPage = () => {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('inventory')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [activeFilter, setActiveFilter] = useState<'all' | 'badge' | 'title' | 'theme' | 'effect'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    dbGet<Record<string, InventoryItem>>(PATHS.inventory(user.uid)).then((data) => {
      if (data) {
        setItems(Object.entries(data).map(([id, item]) => ({ ...item, id })))
      } else {
        setItems([
          { id: '1', type: 'badge', name: 'Iron Will', description: 'Awarded for completing a 7-day streak.', rarity: 'rare', acquiredAt: Date.now() },
          { id: '2', type: 'title', name: 'Awakened Hunter', description: 'Your default starting title.', rarity: 'common', acquiredAt: Date.now(), used: true },
          { id: '3', type: 'theme', name: 'Abyss Theme', description: 'A completely dark visual skin.', rarity: 'epic', acquiredAt: Date.now() },
          { id: '4', type: 'effect', name: 'Gold Particle Glow', description: 'Adds ambient golden particles to your dashboard.', rarity: 'legendary', acquiredAt: Date.now() },
        ])
      }
      setLoading(false)
    })
  }, [user])

  const filteredItems = items.filter(item => activeFilter === 'all' ? true : item.type === activeFilter)

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
      case 'epic': return 'text-purple-400 border-purple-400/30 bg-purple-400/10'
      case 'rare': return 'text-blue-400 border-blue-400/30 bg-blue-400/10'
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/5'
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'badge': return <Award className="text-primary" size={24} />
      case 'title': return <Shield className="text-accent" size={24} />
      case 'theme': return <Palette className="text-cyan" size={24} />
      default: return <Sparkles className="text-warning" size={24} />
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Inventory & Badges</h1>
          <p className="text-sm text-gray-500">Manage your items, titles, and emblems.</p>
        </div>
        <Archive className="text-primary hidden sm:block" size={28} />
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-white/[0.06] pb-1">
        {(['inventory', 'badges'] as const).map(t => (
          <button key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-semibold capitalize transition-all ${
              tab === t ? 'bg-primary/10 text-primary border border-b-transparent border-white/[0.06]' : 'text-gray-500 hover:text-white'
            }`}
          >
            {t === 'inventory' ? <Archive size={16} /> : <Medal size={16} />}
            {t}
          </button>
        ))}
      </div>

      {tab === 'inventory' ? (
        <>
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'badge', 'title', 'theme', 'effect'] as const).map(f => (
              <button key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  activeFilter === f ? 'bg-primary/10 text-primary border border-primary/20' : 'text-gray-500 hover:text-white border border-transparent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-44 rounded-2xl" />)}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="glass p-12 text-center flex flex-col items-center">
              <AlertCircle className="text-gray-600 mb-2" size={32} />
              <p className="text-gray-400 font-medium">No items found</p>
              <p className="text-xs text-gray-600">Buy boosts and themes from the store.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map(item => (
                <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="glass p-5 flex flex-col relative border overflow-hidden hover:border-white/10 transition-all duration-300"
                >
                  <span className={`absolute top-3 right-3 text-2xs font-bold px-2 py-0.5 rounded border capitalize ${getRarityColor(item.rarity)}`}>
                    {item.rarity}
                  </span>
                  <div className="mb-4">{getIcon(item.type)}</div>
                  <h3 className="font-bold text-white text-sm mb-1">{item.name}</h3>
                  <p className="text-xs text-gray-500 mb-6 leading-relaxed">{item.description}</p>
                  {item.used ? (
                    <button className="btn-secondary !py-1.5 text-xs text-success bg-success/5 border-success/20 cursor-default mt-auto">
                      Equipped
                    </button>
                  ) : (
                    <button className="btn-primary !py-1.5 text-xs mt-auto">Equip</button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {BADGES.map(badge => (
            <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
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
      )}
    </div>
  )
}
