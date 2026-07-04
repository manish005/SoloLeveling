import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useUserStore } from '../../store/userStore'
import { dbUpdate, PATHS } from '../../lib/database'
import { uploadToCloudinary } from '../../lib/cloudinary'
import toast from 'react-hot-toast'
import { Settings, Shield, User, RefreshCw, Palette, Camera, Loader2, LogOut } from 'lucide-react'
import { Select } from '../../components/ui/Select'
import { logout } from '../../lib/auth'
import { useNavigate } from 'react-router-dom'

export const SettingsPage = () => {
  const { user } = useAuthStore()
  const { profile, setProfile } = useUserStore() as any
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState(profile?.firstName || profile?.name?.split(' ')[0] || '')
  const [lastName, setLastName] = useState(profile?.lastName || profile?.name?.split(' ').slice(1).join(' ') || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [theme, setThemeState] = useState(profile?.preferredTheme || 'dark')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const result = await uploadToCloudinary(file)
      await dbUpdate(PATHS.profile(user.uid), { avatar: result.secure_url })
      setProfile({ ...profile, avatar: result.secure_url })
      toast.success('Profile photo updated!')
    } catch (err: any) {
      toast.error(err?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const fullName = `${firstName} ${lastName}`.trim()
      await dbUpdate(PATHS.profile(user.uid), { name: fullName, firstName, lastName, bio, preferredTheme: theme })
      setProfile({ ...profile, name: fullName, firstName, lastName, bio, preferredTheme: theme })
      toast.success('Settings saved!')
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">System Settings</h1>
        <p className="text-sm text-gray-500">Configure your profile settings and interface layout.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-4 space-y-1 h-fit">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm bg-primary/10 text-primary font-medium text-left">
            <User size={16} /> Profile Settings
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white font-medium text-left">
            <Palette size={16} /> Interface Customization
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white font-medium text-left">
            <Shield size={16} /> Privacy & Backup
          </button>
          <button onClick={async () => { await logout(); navigate('/login') }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-danger/70 hover:text-danger hover:bg-danger/10 font-medium text-left mt-4">
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        <div className="md:col-span-2 glass p-6 space-y-6">
          <h2 className="font-bold text-white text-base">Edit Profile</h2>

          <div className="flex items-center gap-4 pb-4 border-b border-white/[0.06]">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-xl font-bold text-primary overflow-hidden">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (firstName?.[0] || lastName?.[0] || 'H').toUpperCase()
                )}
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center"
                disabled={uploading}>
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{firstName} {lastName}</p>
              <p className="text-xs text-gray-500">Click camera icon to change photo</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">First Name</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Last Name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="input-field" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="input-field resize-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Theme Color Override</label>
              <Select value={theme} onChange={setThemeState} options={[
                { value: 'dark', label: 'Shadow Blue' },
                { value: 'purple', label: 'Monarch Purple' },
                { value: 'blue', label: 'Deep Ocean' },
                { value: 'darker', label: 'Abyss Dark' },
              ]} />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-white/[0.06]">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <RefreshCw className="animate-spin" size={16} /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
