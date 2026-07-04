import { useState } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '../../store/userStore'
import { Coins, ShoppingBag, Shield, Palette, Sparkles, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import { dbSet, PATHS } from '../../lib/database'
import { useAuthStore } from '../../store/authStore'

interface ShopItem {
  id: string
  name: string
  description: string
  cost: number
  type: 'badge' | 'title' | 'theme' | 'effect'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

const ITEMS: ShopItem[] = [
  { id: 't1', name: 'Monarch Title', description: 'Equips the title "Shadow Monarch" in your profile.', cost: 500, type: 'title', rarity: 'epic' },
  { id: 'th1', name: 'Abyss Dark Theme', description: 'Unlocks a premium deeper dark blue visual theme.', cost: 800, type: 'theme', rarity: 'legendary' },
  { id: 'b1', name: 'Elite Hunter Badge', description: 'Adds a shining emblem badge to your card.', cost: 300, type: 'badge', rarity: 'rare' },
  { id: 'e1', name: 'Purple Particle Effect', description: 'Unlocks purple glowing floating background particles.', cost: 1000, type: 'effect', rarity: 'legendary' },
]

export const ShopPage = () => {
  const { user } = useAuthStore()
  const { stats, setStats } = useUserStore() as any

  const handleBuy = async (item: ShopItem) => {
    if (!user || !stats) return
    if (stats.coins < item.cost) {
      toast.error('Insufficient coins')
      return
    }

    try {
      const newCoins = stats.coins - item.cost
      // Save stats
      await dbSet(PATHS.stats(user.uid), { ...stats, coins: newCoins })
      // Add to inventory
      await dbSet(`${PATHS.inventory(user.uid)}/${item.id}`, {
        id: item.id,
        type: item.type,
        name: item.name,
        description: item.description,
        rarity: item.rarity,
        acquiredAt: Date.now(),
        used: false,
      })

      // Locally update store
      setStats({ ...stats, coins: newCoins })
      toast.success(`Purchased ${item.name}! Check inventory to equip.`)
    } catch {
      toast.error('Purchase failed')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">System Shop</h1>
          <p className="text-sm text-gray-500">Spend your hard-earned coins on cosmetics, titles, and boosts.</p>
        </div>
        {stats && (
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 shrink-0 font-mono font-bold text-yellow-400">
            <Coins size={16} /> {stats.coins.toLocaleString()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ITEMS.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-5 flex flex-col justify-between relative border border-white/[0.04] hover:border-primary/20 transition-all duration-300"
          >
            <div>
              <div className="flex justify-between items-start gap-2 mb-3">
                <span className="text-2xs font-bold text-gray-500 uppercase tracking-wider">{item.type}</span>
                <span className={`text-2xs font-bold px-2 py-0.5 rounded capitalize ${
                  item.rarity === 'legendary' ? 'text-yellow-400 bg-yellow-400/10' :
                  item.rarity === 'epic' ? 'text-purple-400 bg-purple-400/10' : 'text-blue-400 bg-blue-400/10'
                }`}>
                  {item.rarity}
                </span>
              </div>
              <h3 className="font-bold text-white text-sm mb-1">{item.name}</h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">{item.description}</p>
            </div>

            <button
              onClick={() => handleBuy(item)}
              className="btn-primary w-full py-2 flex items-center justify-center gap-2 font-mono text-xs"
            >
              <Coins size={14} /> Buy for {item.cost}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
