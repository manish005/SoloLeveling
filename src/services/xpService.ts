import type { Rank, UserStats, Skills } from '../types'
import { RANK_ORDER, RANK_MIN_LEVEL } from '../types'
import type { AchievementDefinition } from '../types'

// ── XP Formula ─────────────────────────────────────────────────────────────────

/** XP required to reach the next level from current level */
export const xpForLevel = (level: number): number => {
  // Exponential curve: Level 1→2 = 100 XP, grows by ~15% each level
  return Math.floor(100 * Math.pow(1.15, level - 1))
}

/** Total XP required to reach a specific level from level 1 */
export const totalXpForLevel = (level: number): number => {
  let total = 0
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i)
  }
  return total
}

/** Calculate current level from total XP */
export const levelFromXp = (totalXp: number): number => {
  let level = 1
  let remaining = totalXp
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level)
    level++
    if (level >= 100) break
  }
  return level
}

/** XP progress within current level (0-1) */
export const xpProgress = (totalXp: number): number => {
  const level = levelFromXp(totalXp)
  const xpForThisLevel = totalXpForLevel(level)
  const xpForNext = xpForLevel(level)
  const progress = (totalXp - xpForThisLevel) / xpForNext
  return Math.min(1, Math.max(0, progress))
}

/** XP within current level */
export const xpInLevel = (totalXp: number): number => {
  const level = levelFromXp(totalXp)
  return totalXp - totalXpForLevel(level)
}

/** Determine rank from level */
export const rankFromLevel = (level: number): Rank => {
  let rank: Rank = 'E'
  for (const r of RANK_ORDER) {
    if (level >= RANK_MIN_LEVEL[r]) {
      rank = r
    }
  }
  return rank
}

// ── Skill XP ───────────────────────────────────────────────────────────────────

/** Skill XP to level — simpler curve for skills */
export const skillXpForLevel = (level: number): number => {
  return Math.floor(50 * Math.pow(1.2, level - 1))
}

/** Skill level from skill XP */
export const skillLevelFromXp = (xp: number): number => {
  let level = 1
  let remaining = xp
  while (remaining >= skillXpForLevel(level)) {
    remaining -= skillXpForLevel(level)
    level++
    if (level >= 50) break
  }
  return level
}

/** Skill XP progress within current skill level */
export const skillXpProgress = (xp: number): number => {
  const level = skillLevelFromXp(xp)
  let used = 0
  for (let i = 1; i < level; i++) used += skillXpForLevel(i)
  return (xp - used) / skillXpForLevel(level)
}

// ── Category → Skill Mapping ───────────────────────────────────────────────────

import type { QuestCategory, SkillKey } from '../types'

export const CATEGORY_SKILL_MAP: Partial<Record<QuestCategory, SkillKey[]>> = {
  health: ['strength', 'fitness'],
  fitness: ['strength', 'fitness', 'discipline'],
  study: ['intelligence', 'knowledge', 'focus'],
  reading: ['intelligence', 'knowledge'],
  coding: ['coding', 'intelligence', 'focus'],
  trading: ['trading', 'intelligence'],
  business: ['business', 'leadership', 'communication'],
  career: ['leadership', 'communication'],
  spiritual: ['discipline', 'focus'],
  meditation: ['discipline', 'focus', 'charisma'],
  finance: ['trading', 'business'],
  custom: ['discipline'],
}

// ── Achievements Definitions ───────────────────────────────────────────────────

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Streak achievements
  { id: 'streak_3', title: '3-Day Streak', description: 'Complete tasks 3 days in a row', icon: '🔥', category: 'streak', rarity: 'common', xpReward: 50, coinReward: 20, condition: (s) => s.currentStreak >= 3 },
  { id: 'streak_7', title: 'Week Warrior', description: '7-day streak — one full week!', icon: '⚡', category: 'streak', rarity: 'rare', xpReward: 150, coinReward: 50, condition: (s) => s.currentStreak >= 7 },
  { id: 'streak_14', title: 'Fortnight Force', description: '14-day streak', icon: '💥', category: 'streak', rarity: 'rare', xpReward: 300, coinReward: 100, condition: (s) => s.currentStreak >= 14 },
  { id: 'streak_30', title: 'Monthly Master', description: '30-day streak — legendary!', icon: '👑', category: 'streak', rarity: 'epic', xpReward: 750, coinReward: 250, condition: (s) => s.currentStreak >= 30 },
  { id: 'streak_100', title: 'Century Streak', description: '100 days without stopping', icon: '🏆', category: 'streak', rarity: 'legendary', xpReward: 2500, coinReward: 1000, condition: (s) => s.currentStreak >= 100 },
  // XP achievements
  { id: 'xp_100', title: 'First Steps', description: 'Earn your first 100 XP', icon: '⭐', category: 'xp', rarity: 'common', xpReward: 20, coinReward: 10, condition: (s) => s.totalXpEarned >= 100 },
  { id: 'xp_1000', title: 'XP Farmer', description: 'Accumulate 1,000 XP', icon: '🌟', category: 'xp', rarity: 'common', xpReward: 50, coinReward: 25, condition: (s) => s.totalXpEarned >= 1000 },
  { id: 'xp_5000', title: 'Power Surge', description: 'Accumulate 5,000 XP', icon: '💫', category: 'xp', rarity: 'rare', xpReward: 200, coinReward: 75, condition: (s) => s.totalXpEarned >= 5000 },
  { id: 'xp_10000', title: 'XP Legend', description: 'Accumulate 10,000 XP', icon: '✨', category: 'xp', rarity: 'epic', xpReward: 500, coinReward: 200, condition: (s) => s.totalXpEarned >= 10000 },
  { id: 'xp_50000', title: 'Transcendent', description: 'Accumulate 50,000 XP', icon: '🌈', category: 'xp', rarity: 'legendary', xpReward: 2000, coinReward: 750, condition: (s) => s.totalXpEarned >= 50000 },
  // Level achievements
  { id: 'level_5', title: 'Rising Hunter', description: 'Reach Level 5', icon: '📈', category: 'level', rarity: 'common', xpReward: 50, coinReward: 20, condition: (s) => s.level >= 5 },
  { id: 'level_10', title: 'Seasoned Hunter', description: 'Reach Level 10', icon: '🎯', category: 'level', rarity: 'common', xpReward: 100, coinReward: 40, condition: (s) => s.level >= 10 },
  { id: 'level_25', title: 'Veteran Hunter', description: 'Reach Level 25', icon: '🗡️', category: 'level', rarity: 'rare', xpReward: 300, coinReward: 100, condition: (s) => s.level >= 25 },
  { id: 'level_50', title: 'Elite Warrior', description: 'Reach Level 50', icon: '⚔️', category: 'level', rarity: 'epic', xpReward: 750, coinReward: 250, condition: (s) => s.level >= 50 },
  { id: 'level_100', title: 'Monarch Ascension', description: 'Reach the pinnacle — Level 100', icon: '👑', category: 'level', rarity: 'legendary', xpReward: 5000, coinReward: 2000, condition: (s) => s.level >= 100 },
  // Task achievements
  { id: 'tasks_1', title: 'First Quest', description: 'Complete your first quest', icon: '🎮', category: 'tasks', rarity: 'common', xpReward: 25, coinReward: 10, condition: (s) => s.totalTasksCompleted >= 1 },
  { id: 'tasks_10', title: 'Quest Novice', description: 'Complete 10 quests', icon: '📜', category: 'tasks', rarity: 'common', xpReward: 75, coinReward: 25, condition: (s) => s.totalTasksCompleted >= 10 },
  { id: 'tasks_50', title: 'Quest Veteran', description: 'Complete 50 quests', icon: '📋', category: 'tasks', rarity: 'rare', xpReward: 200, coinReward: 75, condition: (s) => s.totalTasksCompleted >= 50 },
  { id: 'tasks_100', title: 'Quest Master', description: 'Complete 100 quests', icon: '🏅', category: 'tasks', rarity: 'rare', xpReward: 400, coinReward: 150, condition: (s) => s.totalTasksCompleted >= 100 },
  { id: 'tasks_500', title: 'Quest Legend', description: 'Complete 500 quests', icon: '🥇', category: 'tasks', rarity: 'epic', xpReward: 1000, coinReward: 400, condition: (s) => s.totalTasksCompleted >= 500 },
  { id: 'tasks_1000', title: 'Thousand Quests', description: '1,000 quests — you are unstoppable', icon: '💎', category: 'tasks', rarity: 'legendary', xpReward: 3000, coinReward: 1000, condition: (s) => s.totalTasksCompleted >= 1000 },
  // Special achievements
  { id: 'early_bird', title: 'Early Bird', description: 'Complete a quest before 8 AM', icon: '🌅', category: 'special', rarity: 'rare', xpReward: 200, coinReward: 75, condition: () => false },
  { id: 'night_owl', title: 'Night Owl', description: 'Complete a quest after 11 PM', icon: '🦉', category: 'special', rarity: 'rare', xpReward: 200, coinReward: 75, condition: () => false },
  { id: 'rank_d', title: 'D-Rank Hunter', description: 'Reach D Rank', icon: '🔵', category: 'level', rarity: 'common', xpReward: 100, coinReward: 40, condition: (s) => s.rank !== 'E' },
  { id: 'rank_a', title: 'A-Rank Hunter', description: 'Reach A Rank — you are elite', icon: '🟡', category: 'level', rarity: 'epic', xpReward: 500, coinReward: 200, condition: (s) => ['A','S','SS','SSS','National','Monarch'].includes(s.rank) },
  { id: 'rank_s', title: 'S-Rank Hunter', description: 'Legendary S-Rank achieved', icon: '🔴', category: 'level', rarity: 'legendary', xpReward: 1000, coinReward: 500, condition: (s) => ['S','SS','SSS','National','Monarch'].includes(s.rank) },
  { id: 'rank_monarch', title: 'The Monarch', description: 'You have reached the absolute peak', icon: '👑', category: 'level', rarity: 'legendary', xpReward: 10000, coinReward: 5000, condition: (s) => s.rank === 'Monarch' },
  // Skill achievements
  { id: 'coder', title: 'Coding Master', description: 'Reach Coding skill Level 10', icon: '💻', category: 'skill', rarity: 'epic', xpReward: 500, coinReward: 200, condition: (_s, sk) => (sk?.coding?.level ?? 0) >= 10 },
  { id: 'trader', title: 'Trading Expert', description: 'Reach Trading skill Level 10', icon: '📊', category: 'skill', rarity: 'epic', xpReward: 500, coinReward: 200, condition: (_s, sk) => (sk?.trading?.level ?? 0) >= 10 },
  { id: 'monk', title: 'Meditation Monk', description: 'Reach Discipline skill Level 10', icon: '🧘', category: 'skill', rarity: 'epic', xpReward: 500, coinReward: 200, condition: (_s, sk) => (sk?.discipline?.level ?? 0) >= 10 },
  { id: 'reader', title: 'Book Reader', description: 'Reach Knowledge skill Level 10', icon: '📚', category: 'skill', rarity: 'rare', xpReward: 300, coinReward: 100, condition: (_s, sk) => (sk?.knowledge?.level ?? 0) >= 10 },
  { id: 'gym_warrior', title: 'Gym Warrior', description: 'Reach Strength + Fitness Level 8 each', icon: '💪', category: 'skill', rarity: 'epic', xpReward: 500, coinReward: 200, condition: (_s, sk) => (sk?.strength?.level ?? 0) >= 8 && (sk?.fitness?.level ?? 0) >= 8 },
]

// ── Check new achievements ─────────────────────────────────────────────────────

export const checkAchievements = (
  stats: UserStats,
  skills: Skills,
  unlockedIds: string[]
): AchievementDefinition[] => {
  return ACHIEVEMENTS.filter(
    (a) => !unlockedIds.includes(a.id) && a.condition(stats, skills)
  )
}
