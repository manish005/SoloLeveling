import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, Trophy, BookOpen, AlertTriangle } from 'lucide-react'

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'quests' | 'achievements'>('users')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
          <Shield size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">System Admin Panel</h1>
          <p className="text-sm text-gray-500">Configure global parameters, manage quests, and audit users.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation */}
        <div className="glass p-4 space-y-1 h-fit">
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all ${
              activeTab === 'users' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-gray-500 hover:text-white'
            }`}
          >
            <Users size={16} /> User Registry
          </button>
          <button
            onClick={() => setActiveTab('quests')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all ${
              activeTab === 'quests' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-gray-500 hover:text-white'
            }`}
          >
            <BookOpen size={16} /> Global Quests
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all ${
              activeTab === 'achievements' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-gray-500 hover:text-white'
            }`}
          >
            <Trophy size={16} /> System Achievements
          </button>
        </div>

        {/* Panel Content */}
        <div className="lg:col-span-3 glass p-6 space-y-4">
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-base">User Registry</h3>
              <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex gap-3 text-yellow-500">
                <AlertTriangle size={20} className="shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">Warning Mode Active</p>
                  <p className="text-xs text-yellow-500/80 mt-1">Changes here modify live users in Realtime Database. Proceed with extreme caution.</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Currently syncs with /users path. Audit list empty.</p>
            </div>
          )}

          {activeTab === 'quests' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-base">Global Quests</h3>
              <p className="text-xs text-gray-500">Default templates populated by quest service config.</p>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-base">System Achievements</h3>
              <p className="text-xs text-gray-500">Read-only schema definition containing 30 static checkpoints.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
