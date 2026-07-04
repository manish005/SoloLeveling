import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '../../store/userStore'
import { RANK_COLORS, RANK_TITLES, SKILL_CATEGORIES } from '../../types'
import type { SkillKey } from '../../types'
import { Camera, Edit3, MapPin, Briefcase, Loader2, Save, X, User, BarChart3, Zap, Activity, Brain, Shield, Target, Star, BookOpen, Code2, MessageCircle, Crown, Dumbbell, TrendingUp } from 'lucide-react'
import { dbUpdate, PATHS } from '../../lib/database'
import { uploadToCloudinary } from '../../lib/cloudinary'
import { useAuthStore } from '../../store/authStore'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { skillXpProgress } from '../../services/xpService'
import toast from 'react-hot-toast'

type ProfileTab = 'profile' | 'analytics' | 'skills'

export const ProfilePage = () => {
  const { user } = useAuthStore()
  const { profile, stats, setProfile, skills } = useUserStore() as any
  const [tab, setTab] = useState<ProfileTab>('profile')
  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState(profile?.firstName || profile?.name?.split(' ')[0] || '')
  const [lastName, setLastName] = useState(profile?.lastName || profile?.name?.slice(1).join(' ') || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [profession, setProfession] = useState(profile?.profession || '')
  const [country, setCountry] = useState(profile?.country || '')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const rank = (stats?.rank ?? 'E') as any
  const rankColor = RANK_COLORS[rank as import('../../types').Rank]
  const title = RANK_TITLES[rank as import('../../types').Rank]

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      const result = await uploadToCloudinary(file)
      await dbUpdate(PATHS.profile(user.uid), { avatar: result.secure_url })
      setProfile({ ...profile, avatar: result.secure_url })
      toast.success('Profile photo updated!')
    } catch (err: any) {
      toast.error(err?.message ?? 'Upload failed')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingCover(true)
    try {
      const result = await uploadToCloudinary(file)
      await dbUpdate(PATHS.profile(user.uid), { coverPhoto: result.secure_url })
      setProfile({ ...profile, coverPhoto: result.secure_url })
      toast.success('Cover photo updated!')
    } catch (err: any) {
      toast.error(err?.message ?? 'Upload failed')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const fullName = `${firstName} ${lastName}`.trim()
      await dbUpdate(PATHS.profile(user.uid), { name: fullName, firstName, lastName, bio, profession, country })
      setProfile({ ...profile, name: fullName, firstName, lastName, bio, profession, country })
      setEditing(false)
      toast.success('Profile updated!')
    } catch {
      toast.error('Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-white/[0.06] pb-1">
        {(['profile', 'analytics', 'skills'] as const).map(t => (
          <button key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-semibold capitalize transition-all ${
              tab === t ? 'bg-primary/10 text-primary border border-b-transparent border-white/[0.06]' : 'text-gray-500 hover:text-white'
            }`}
          >
            {t === 'profile' ? <User size={16} /> : t === 'analytics' ? <BarChart3 size={16} /> : <Zap size={16} />}
            {t}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <>
          <div className="glass rounded-3xl overflow-hidden relative border border-white/[0.06]">
            <div
              className="h-44 relative"
              style={{
                background: profile?.coverPhoto
                  ? `url(${profile.coverPhoto}) center/cover no-repeat`
                  : 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2), rgba(6,182,212,0.2))',
              }}
            >
              <button
                onClick={() => coverRef.current?.click()}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white/80 hover:text-white backdrop-blur-sm transition-all border border-white/10"
                disabled={uploadingCover}
              >
                {uploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </div>

            <div className="px-6 pb-6 pt-16 relative">
              <div className="absolute -top-12 left-6">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-black relative overflow-hidden"
                  style={{
                    background: `${rankColor}20`,
                    border: `3px solid ${rankColor}`,
                    color: rankColor,
                    boxShadow: `0 0 30px ${rankColor}40`,
                  }}
                >
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (profile?.firstName?.[0] || profile?.name?.[0] || 'H').toUpperCase()
                  )}
                </div>
                <button
                  onClick={() => avatarRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center border-2 border-bg-primary"
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                </button>
                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              <div className="flex justify-between items-start flex-wrap gap-4 pt-2">
                <div>
                  {editing ? (
                    <div className="flex gap-3">
                      <input value={firstName} onChange={e => setFirstName(e.target.value)}
                        placeholder="First name" className="input-field !py-2 !px-3 text-base" />
                      <input value={lastName} onChange={e => setLastName(e.target.value)}
                        placeholder="Last name" className="input-field !py-2 !px-3 text-base" />
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-black text-white">
                        {profile?.firstName || profile?.name?.split(' ')[0] || 'Hunter'} {profile?.lastName || ''}
                      </h1>
                      <p className="text-sm text-gray-500">@{profile?.username}</p>
                    </>
                  )}
                </div>
                <button onClick={() => { setEditing(!editing); setTab('profile') }}
                  className="btn-secondary !py-2 !px-4 text-xs gap-1.5 flex items-center">
                  <Edit3 size={14} /> {editing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {editing ? (
                  <div className="space-y-3">
                    <textarea value={bio} onChange={e => setBio(e.target.value)}
                      placeholder="Tell us about yourself..." rows={3} className="input-field resize-none" />
                    <input value={profession} onChange={e => setProfession(e.target.value)}
                      placeholder="Profession..." className="input-field" />
                    <input value={country} onChange={e => setCountry(e.target.value)}
                      placeholder="Country..." className="input-field" />
                    <div className="flex gap-3">
                      <button onClick={handleSave} disabled={saving} className="btn-primary !py-2 text-xs gap-1.5">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save Changes
                      </button>
                      <button onClick={() => setEditing(false)} className="btn-secondary !py-2 text-xs gap-1.5">
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">{profile?.bio || 'No biography written.'}</p>
                    <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
                      {profile?.profession && (
                        <span className="flex items-center gap-1.5"><Briefcase size={14} /> {profile.profession}</span>
                      )}
                      {profile?.country && (
                        <span className="flex items-center gap-1.5"><MapPin size={14} /> {profile.country}</span>
                      )}
                      {profile?.age && (
                        <span className="flex items-center gap-1.5">🎂 {profile.age} years</span>
                      )}
                      {profile?.gender && (
                        <span className="flex items-center gap-1.5">⚤ {profile.gender}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-white/[0.06] pb-2">Status Attributes</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">System Rank</span>
                  <span className="font-bold" style={{ color: rankColor }}>{rank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Level</span>
                  <span className="font-bold text-white">{stats?.level ?? 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Title</span>
                  <span className="text-gray-300 font-semibold">{title}</span>
                </div>
              </div>
            </div>

            <div className="glass p-6 space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-white/[0.06] pb-2">Training Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed Quests</span>
                  <span className="font-bold text-white">{stats?.totalQuestsCompleted ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Streak</span>
                  <span className="font-bold text-orange-400">{stats?.currentStreak ?? 0} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Longest Streak</span>
                  <span className="font-bold text-success">{stats?.longestStreak ?? 0} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total XP</span>
                  <span className="font-bold text-yellow-400">{(stats?.totalXpEarned ?? 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="glass p-6 space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-white/[0.06] pb-2">Personal Info</h3>
              <div className="space-y-3 text-sm">
                {profile?.age && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Age</span>
                    <span className="font-bold text-white">{profile.age}</span>
                  </div>
                )}
                {profile?.gender && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gender</span>
                    <span className="font-bold text-white capitalize">{profile.gender}</span>
                  </div>
                )}
                {profile?.profession && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Profession</span>
                    <span className="font-bold text-white">{profile.profession}</span>
                  </div>
                )}
                {profile?.country && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Country</span>
                    <span className="font-bold text-white">{profile.country}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'analytics' && (
        <AnalyticsContent stats={stats} />
      )}

      {tab === 'skills' && (
        <SkillsContent skills={skills} />
      )}
    </div>
  )
}

/* ─── Analytics Section ─── */

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts'

const AnalyticsContent = ({ stats }: { stats: any }) => {
  const history = [
    { date: 'Mon', xp: 120, level: 1, tasks: 2, coins: 50, questsCompleted: 2 },
    { date: 'Tue', xp: 250, level: 1, tasks: 4, coins: 80, questsCompleted: 3 },
    { date: 'Wed', xp: 480, level: 2, tasks: 7, coins: 120, questsCompleted: 5 },
    { date: 'Thu', xp: 550, level: 2, tasks: 8, coins: 140, questsCompleted: 6 },
    { date: 'Fri', xp: 750, level: 3, tasks: 11, coins: 210, questsCompleted: 8 },
    { date: 'Sat', xp: 900, level: 3, tasks: 13, coins: 250, questsCompleted: 9 },
    { date: 'Sun', xp: 1100, level: 4, tasks: 16, coins: 300, questsCompleted: 11 },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* XP Line Graph */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-primary" size={18} />
          <h3 className="font-bold text-white">XP Progression</h3>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorXpP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                labelStyle={{ color: '#9CA3AF', fontSize: '12px' }} />
              <Area type="monotone" dataKey="xp" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorXpP)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Quests Completion Bar Graph */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-6 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-accent" size={18} />
          <h3 className="font-bold text-white">Quests Completed</h3>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                labelStyle={{ color: '#9CA3AF', fontSize: '12px' }} />
              <Bar dataKey="questsCompleted" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass p-6 lg:col-span-2 flex flex-wrap gap-8 justify-around">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Current Level</p>
          <p className="text-3xl font-black text-white">{stats?.level ?? 1}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total XP</p>
          <p className="text-3xl font-black text-yellow-400">{(stats?.totalXpEarned ?? 0).toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Quests Done</p>
          <p className="text-3xl font-black text-accent">{stats?.totalQuestsCompleted ?? 0}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Streak</p>
          <p className="text-3xl font-black text-orange-400">{stats?.currentStreak ?? 0}d</p>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Skills Section ─── */

const ICON_MAP: Record<string, any> = {
  Dumbbell: Dumbbell, Brain: Brain, Shield: Shield, Target: Target,
  Star: Star, BookOpen: BookOpen, Activity: Activity, TrendingUp: TrendingUp,
  Code2: Code2, MessageCircle: MessageCircle, Briefcase: Briefcase, Crown: Crown,
}

const SkillsContent = ({ skills }: { skills: any }) => {
  if (!skills) {
    return (
      <div className="glass p-12 text-center flex flex-col items-center">
        <Zap className="text-gray-600 mb-2" size={32} />
        <p className="text-gray-400 font-medium">Skills data not available</p>
        <p className="text-xs text-gray-600">Complete quests to unlock your skill tree.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Object.entries(skills).map(([key, skill]: [string, any]) => {
        const cat = SKILL_CATEGORIES[key as SkillKey]
        const Icon = ICON_MAP[cat?.icon] || Zap
        const progress = skillXpProgress(skill.xp) * 100

        return (
          <motion.div key={key} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass p-5 flex flex-col relative overflow-hidden group hover:border-primary/20 transition-all duration-300"
            style={{ borderColor: cat ? `${cat.color}20` : undefined }}
          >
            {cat && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle at center, ${cat.color}, transparent 70%)` }} />
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={cat ? { background: `${cat.color}20`, border: `1px solid ${cat.color}30` } : undefined}>
                <Icon size={20} style={cat ? { color: cat.color } : undefined} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white capitalize">{cat?.label || key}</h3>
                <p className="text-xs text-gray-500 font-mono">Level {skill.level}</p>
              </div>
            </div>
            <div className="mt-auto space-y-1">
              <div className="flex justify-between text-2xs text-gray-500">
                <span>XP Progress</span>
                <span className="font-mono">{skill.xp} XP</span>
              </div>
              <ProgressBar value={progress} color="primary" size="sm" animated={false} />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
