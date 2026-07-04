// ══════════════════════════════════════════════════════════════
// RANK SYSTEM
// ══════════════════════════════════════════════════════════════
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS' | 'National' | 'Monarch'

export const RANK_ORDER: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'National', 'Monarch']

export const RANK_MIN_LEVEL: Record<Rank, number> = {
  E: 1,
  D: 10,
  C: 20,
  B: 35,
  A: 50,
  S: 65,
  SS: 80,
  SSS: 90,
  National: 95,
  Monarch: 100,
}

export const RANK_COLORS: Record<Rank, string> = {
  E: '#9CA3AF',
  D: '#6EE7B7',
  C: '#60A5FA',
  B: '#A78BFA',
  A: '#F59E0B',
  S: '#EF4444',
  SS: '#F97316',
  SSS: '#EC4899',
  National: '#8B5CF6',
  Monarch: '#FFD700',
}

export const RANK_TITLES: Record<Rank, string> = {
  E: 'Awakened',
  D: 'Hunter',
  C: 'Veteran Hunter',
  B: 'Elite Hunter',
  A: 'Shadow Warrior',
  S: 'S-Rank Hunter',
  SS: 'Shadow Monarch',
  SSS: 'Transcendent',
  National: 'National Level Hunter',
  Monarch: 'The Monarch',
}

// ══════════════════════════════════════════════════════════════
// QUEST TYPES
// ══════════════════════════════════════════════════════════════
export type QuestType = 'daily' | 'weekly' | 'monthly' | 'custom'
export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'epic' | 'legendary'
export type QuestCategory =
  | 'health'
  | 'finance'
  | 'study'
  | 'coding'
  | 'trading'
  | 'business'
  | 'spiritual'
  | 'career'
  | 'fitness'
  | 'reading'
  | 'meditation'
  | 'custom'

export const DIFFICULTY_XP: Record<QuestDifficulty, number> = {
  easy: 25,
  medium: 75,
  hard: 150,
  epic: 300,
  legendary: 600,
}

export const DIFFICULTY_COINS: Record<QuestDifficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
  epic: 100,
  legendary: 250,
}

export const DIFFICULTY_COLORS: Record<QuestDifficulty, string> = {
  easy: '#10B981',
  medium: '#3B82F6',
  hard: '#8B5CF6',
  epic: '#F59E0B',
  legendary: '#EF4444',
}

export interface QuestChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface Quest {
  id: string
  title: string
  description: string
  category: QuestCategory
  type: QuestType
  difficulty: QuestDifficulty
  xpReward: number
  coinReward: number
  completed: boolean
  completedAt?: number
  dueDate?: number
  startDate?: number
  createdAt: number
  isCustom?: boolean
  target?: number
  progress?: number
  unit?: string
  streak?: number
  checklist?: QuestChecklistItem[]
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly'
  reminder?: boolean
  notes?: string
}

// ══════════════════════════════════════════════════════════════
// USER PROFILE
// ══════════════════════════════════════════════════════════════
export interface UserProfile {
  uid: string
  name: string
  firstName?: string
  lastName?: string
  username: string
  email: string
  age?: number
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say'
  country?: string
  avatar?: string
  coverPhoto?: string
  bio?: string
  profession?: string
  goals?: string[]
  dailyTarget?: number
  interests?: string[]
  preferredTheme?: 'dark' | 'darker' | 'blue' | 'purple'
  role?: 'user' | 'admin'
  createdAt: number
  updatedAt: number
  onboardingComplete: boolean
  emailVerified: boolean
}

// ══════════════════════════════════════════════════════════════
// USER STATS
// ══════════════════════════════════════════════════════════════
export interface UserStats {
  xp: number
  totalXpEarned: number
  level: number
  rank: Rank
  coins: number
  currentStreak: number
  longestStreak: number
  totalTasksCompleted: number
  totalQuestsCompleted: number
  lastActiveDate: string // YYYY-MM-DD
  weeklyXp: number
  monthlyXp: number
}

// ══════════════════════════════════════════════════════════════
// SKILLS
// ══════════════════════════════════════════════════════════════
export type SkillKey =
  | 'strength'
  | 'intelligence'
  | 'discipline'
  | 'focus'
  | 'charisma'
  | 'knowledge'
  | 'fitness'
  | 'trading'
  | 'coding'
  | 'communication'
  | 'business'
  | 'leadership'

export interface Skill {
  level: number
  xp: number
  totalXp: number
}

export type Skills = Record<SkillKey, Skill>

export const SKILL_CATEGORIES: Record<SkillKey, { label: string; icon: string; color: string }> = {
  strength: { label: 'Strength', icon: 'Dumbbell', color: '#EF4444' },
  intelligence: { label: 'Intelligence', icon: 'Brain', color: '#3B82F6' },
  discipline: { label: 'Discipline', icon: 'Shield', color: '#8B5CF6' },
  focus: { label: 'Focus', icon: 'Target', color: '#06B6D4' },
  charisma: { label: 'Charisma', icon: 'Star', color: '#F59E0B' },
  knowledge: { label: 'Knowledge', icon: 'BookOpen', color: '#10B981' },
  fitness: { label: 'Fitness', icon: 'Activity', color: '#F97316' },
  trading: { label: 'Trading', icon: 'TrendingUp', color: '#22C55E' },
  coding: { label: 'Coding', icon: 'Code2', color: '#60A5FA' },
  communication: { label: 'Communication', icon: 'MessageCircle', color: '#EC4899' },
  business: { label: 'Business', icon: 'Briefcase', color: '#A78BFA' },
  leadership: { label: 'Leadership', icon: 'Crown', color: '#FFD700' },
}

// ══════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ══════════════════════════════════════════════════════════════
export type AchievementCategory =
  | 'streak'
  | 'xp'
  | 'level'
  | 'tasks'
  | 'skill'
  | 'quest'
  | 'social'
  | 'special'

export interface AchievementDefinition {
  id: string
  title: string
  description: string
  icon: string
  category: AchievementCategory
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  xpReward: number
  coinReward: number
  condition: (stats: UserStats, skills?: Skills) => boolean
}

export interface UnlockedAchievement {
  unlockedAt: number
}

// ══════════════════════════════════════════════════════════════
// CALENDAR / ANALYTICS
// ══════════════════════════════════════════════════════════════
export interface CalendarDay {
  date: string // YYYY-MM-DD
  tasksCompleted: number
  xpEarned: number
  questsCompleted: number
  notes?: string
  streakDay: boolean
}

export interface AnalyticsHistory {
  date: string
  xp: number
  level: number
  tasks: number
  coins: number
  questsCompleted: number
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
export type NotificationType =
  | 'level_up'
  | 'quest_complete'
  | 'achievement'
  | 'daily_reminder'
  | 'xp_earned'
  | 'coins_earned'
  | 'streak'
  | 'system'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: number
  data?: Record<string, unknown>
}

// ══════════════════════════════════════════════════════════════
// INVENTORY
// ══════════════════════════════════════════════════════════════
export interface InventoryItem {
  id: string
  type: 'badge' | 'title' | 'theme' | 'effect' | 'booster' | 'reward_box'
  name: string
  description: string
  icon?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  acquiredAt: number
  used?: boolean
}

// ══════════════════════════════════════════════════════════════
// LEADERBOARD
// ══════════════════════════════════════════════════════════════
export interface LeaderboardEntry {
  uid: string
  name: string
  username: string
  avatar?: string
  level: number
  rank: Rank
  xp: number
  currentStreak: number
  updatedAt: number
}

// ══════════════════════════════════════════════════════════════
// WORKOUT / FITNESS
// ══════════════════════════════════════════════════════════════

export interface WorkoutProfile {
  height: number
  weight: number
  age: number
  gender: string
  fitnessGoal: string
  workoutLocation: string
  availableEquipment: string[]
  workoutFrequency: number
  workoutDuration: number
  workoutIntensity: string
  activityLevel: string
  bmi: number
  bmiCategory: string
  healthyWeightRange: string
  bmiRecommendation: string
  dailyCalories: number
  proteinTarget: number
  waterTarget: number
  createdAt: number
  updatedAt: number
  onboardingComplete: boolean
}

export interface WorkoutExercise {
  name: string
  sets: number
  reps: string
  restTime: string
  completed?: boolean
}

export interface WorkoutDay {
  day: number
  focus: string
  exercises: WorkoutExercise[]
}

export interface WorkoutPlan {
  id: string
  name: string
  description: string
  schedule: WorkoutDay[]
  createdAt: number
}

export interface WorkoutLog {
  id: string
  date: string
  exercises: { name: string; sets: number; reps: string; completed: boolean }[]
  duration: number
  caloriesBurned: number
  waterIntake: number
  meals: string[]
  mood: number
  energyLevel: number
  completed: boolean
  xpEarned: number
  coinsEarned: number
  createdAt: number
}

export type DietaryPreference = 'veg' | 'non-veg'

export interface DietPlan {
  day: string
  breakfast: string
  lunch: string
  dinner: string
  snacks: string[]
  calories: number
  protein: number
  carbs: number
  fats: number
  waterIntake: number
  dietaryPreference?: DietaryPreference
}

export interface WorkoutStats {
  totalWorkouts: number
  currentStreak: number
  longestStreak: number
  totalCaloriesBurned: number
  totalDuration: number
  lastWorkoutDate: string
  xpEarned: number
  coinsEarned: number
}

// ══════════════════════════════════════════════════════════════
// DAILY CHECKLIST
// ══════════════════════════════════════════════════════════════

export interface DailyChecklist {
  date: string
  water: boolean
  waterLiters: number
  workout: boolean
  breakfast: boolean
  lunch: boolean
  dinner: boolean
  snacks: boolean
  allMeals: boolean
  completed: boolean
  progress: number
  xpEarned: number
  coinsEarned: number
  updatedAt: number
}

export type ChallengeDuration = '30' | '60' | '90' | '365'

export interface Challenge {
  id: string
  title: string
  description: string
  duration: ChallengeDuration
  startDate: string
  targetWorkouts: number
  targetCalories: number
  completedWorkouts: number
  completedCalories: number
  active: boolean
  completed: boolean
  completedAt?: string
  createdAt: number
}

export const DAILY_REWARDS = {
  water: { xp: 10, coins: 5 },
  workout: { xp: 50, coins: 20 },
  breakfast: { xp: 10, coins: 5 },
  lunch: { xp: 10, coins: 5 },
  dinner: { xp: 10, coins: 5 },
  snacks: { xp: 5, coins: 3 },
  allComplete: { xp: 100, coins: 50 },
}

// ══════════════════════════════════════════════════════════════
// APP SETTINGS
// ══════════════════════════════════════════════════════════════
export interface AppSettings {
  theme: 'dark' | 'darker' | 'blue' | 'purple'
  notifications: {
    levelUp: boolean
    questComplete: boolean
    achievement: boolean
    dailyReminder: boolean
    reminderTime?: string
  }
  language: string
  soundEffects: boolean
  animations: boolean
}
