import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useUserStore } from '../store/userStore'
import { dbSubscribe, PATHS } from '../lib/database'
import type { UserProfile, UserStats, Skills, AppNotification } from '../types'

// Layouts
import { AppLayout } from '../layouts/AppLayout'
import { AuthLayout } from '../layouts/AuthLayout'

// Auth pages
import { LoginPage } from '../pages/Auth/LoginPage'
import { RegisterPage } from '../pages/Auth/RegisterPage'
import { ForgotPasswordPage } from '../pages/Auth/ForgotPasswordPage'
import { EmailVerificationPage } from '../pages/Auth/EmailVerificationPage'

// Onboarding
import { OnboardingPage } from '../pages/Onboarding/OnboardingPage'

// App pages
import { DashboardPage } from '../pages/Dashboard/DashboardPage'
import { ProfilePage } from '../pages/Profile/ProfilePage'
import { QuestsPage } from '../pages/Quests/QuestsPage'
import { WorkoutPage } from '../pages/Workout/WorkoutPage'
import { AchievementsPage } from '../pages/Achievements/AchievementsPage'
import { SkillsPage } from '../pages/Skills/SkillsPage'
import { CalendarPage } from '../pages/Calendar/CalendarPage'
import { AnalyticsPage } from '../pages/Analytics/AnalyticsPage'
import { InventoryPage } from '../pages/Inventory/InventoryPage'
import { LeaderboardPage } from '../pages/Leaderboard/LeaderboardPage'
import { AssistantPage } from '../pages/Assistant/AssistantPage'
import { NotesPage } from '../pages/Notes/NotesPage'
import { ShopPage } from '../pages/Shop/ShopPage'
import { SettingsPage } from '../pages/Settings/SettingsPage'
import { HabitPage } from '../pages/Habit/HabitPage'
import { LandingPage } from '../pages/Landing/LandingPage'
import { AdminPanel } from '../pages/Admin/AdminPanel'

/** Route guard: require auth */
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, initialized } = useAuthStore()
  if (!initialized) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Route guard: redirect if already authenticated */
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, initialized } = useAuthStore()
  if (!initialized) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

/** Simple full-screen loader */
const LoadingScreen = () => (
  <div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      <p className="text-sm text-gray-500 font-mono">Awakening...</p>
    </div>
  </div>
)

/** Root component that also subscribes to RTDB */
const AppRouter = () => {
  const { user, initAuth } = useAuthStore()
  const { setProfile, setStats, setSkills, setNotifications } = useUserStore()

  // Initialize Firebase auth listener
  useEffect(() => {
    const unsubscribe = initAuth()
    return unsubscribe
  }, [initAuth])

  // Subscribe to realtime user data when authenticated
  useEffect(() => {
    if (!user) {
      setProfile(null)
      setStats(null)
      setSkills(null)
      return
    }
    const uid = user.uid
    const unsubs = [
      dbSubscribe<UserProfile>(PATHS.profile(uid), setProfile),
      dbSubscribe<UserStats>(PATHS.stats(uid), setStats),
      dbSubscribe<Skills>(PATHS.skills(uid), setSkills),
      dbSubscribe<Record<string, AppNotification>>(
        PATHS.notifications(uid),
        (data) => {
          if (data) {
            const notifs = Object.entries(data)
              .map(([id, n]) => ({ ...n, id }))
              .sort((a, b) => b.createdAt - a.createdAt)
            setNotifications(notifs)
          }
        }
      ),
    ]
    return () => unsubs.forEach((fn) => fn())
  }, [user, setProfile, setStats, setSkills, setNotifications])

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Public auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
        </Route>

        {/* Onboarding (requires auth but no profile yet) */}
        <Route path="/onboarding" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />

        {/* Protected app routes */}
        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/badges" element={<Navigate to="/inventory" replace />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/analytics" element={<Navigate to="/profile" replace />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/habit" element={<HabitPage />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
