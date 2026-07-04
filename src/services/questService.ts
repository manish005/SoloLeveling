import { dbGet, dbSet, dbUpdate, dbPush, PATHS } from '../lib/database'
import type { Quest, QuestType, UserStats, Skills } from '../types'
import { CATEGORY_SKILL_MAP, levelFromXp, rankFromLevel, skillLevelFromXp } from './xpService'
import { format } from 'date-fns'

/** Fetch all quests of a type for a user */
export const getQuests = async (uid: string, type: QuestType): Promise<Quest[]> => {
  const data = await dbGet<Record<string, Quest>>(PATHS.quests(uid, type))
  if (!data) return []
  return Object.entries(data).map(([id, q]) => ({ ...q, id }))
}

/** Add a new quest */
export const addQuest = async (
  uid: string,
  quest: Omit<Quest, 'id' | 'createdAt' | 'completed'>
): Promise<string> => {
  const newQuest: Omit<Quest, 'id'> = {
    ...quest,
    completed: false,
    createdAt: Date.now(),
  }
  return dbPush(PATHS.quests(uid, quest.type), newQuest)
}

/** Mark a quest as complete and apply rewards */
export const completeQuest = async (
  uid: string,
  quest: Quest
): Promise<{ newStats: UserStats; leveledUp: boolean; newLevel: number }> => {
  const statsPath = PATHS.stats(uid)
  const currentStats = await dbGet<UserStats>(statsPath)
  if (!currentStats) throw new Error('User stats not found')

  const oldLevel = currentStats.level
  const newXp = currentStats.xp + quest.xpReward
  const newTotalXp = currentStats.totalXpEarned + quest.xpReward
  const newCoins = currentStats.coins + quest.coinReward
  const newLevel = levelFromXp(newTotalXp)
  const newRank = rankFromLevel(newLevel)
  const today = format(new Date(), 'yyyy-MM-dd')

  // Update streak
  let newStreak = currentStats.currentStreak
  let newLongest = currentStats.longestStreak
  if (currentStats.lastActiveDate !== today) {
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
    newStreak = currentStats.lastActiveDate === yesterday ? newStreak + 1 : 1
    newLongest = Math.max(newLongest, newStreak)
  }

  const newStats: UserStats = {
    ...currentStats,
    xp: newXp,
    totalXpEarned: newTotalXp,
    level: newLevel,
    rank: newRank,
    coins: newCoins,
    currentStreak: newStreak,
    longestStreak: newLongest,
    totalTasksCompleted: currentStats.totalTasksCompleted + 1,
    totalQuestsCompleted: currentStats.totalQuestsCompleted + 1,
    lastActiveDate: today,
  }

  // Apply skill XP
  const skillKeys = CATEGORY_SKILL_MAP[quest.category] ?? []
  const skillXpPerSkill = Math.floor(quest.xpReward / Math.max(skillKeys.length, 1) / 2)

  const skillUpdates: Record<string, unknown> = {}
  if (skillKeys.length > 0) {
    const currentSkills = await dbGet<Skills>(PATHS.skills(uid))
    for (const key of skillKeys) {
      const current = currentSkills?.[key] ?? { level: 1, xp: 0, totalXp: 0 }
      const newSkillXp = current.totalXp + skillXpPerSkill
      skillUpdates[`${key}/totalXp`] = newSkillXp
      skillUpdates[`${key}/xp`] = newSkillXp
      skillUpdates[`${key}/level`] = skillLevelFromXp(newSkillXp)
    }
    await dbUpdate(PATHS.skills(uid), skillUpdates)
  }

  // Save stats and mark quest complete
  await Promise.all([
    dbSet(statsPath, newStats),
    dbUpdate(PATHS.quest(uid, quest.type, quest.id), {
      completed: true,
      completedAt: Date.now(),
    }),
  ])

  // Update calendar
  const calPath = PATHS.calendarDay(uid, today)
  const calDay = await dbGet<{ tasksCompleted: number; xpEarned: number; questsCompleted: number }>(calPath)
  await dbSet(calPath, {
    date: today,
    tasksCompleted: (calDay?.tasksCompleted ?? 0) + 1,
    xpEarned: (calDay?.xpEarned ?? 0) + quest.xpReward,
    questsCompleted: (calDay?.questsCompleted ?? 0) + 1,
    streakDay: true,
  })

  // Update analytics history
  await dbSet(PATHS.history(uid, today), {
    date: today,
    xp: newTotalXp,
    level: newLevel,
    tasks: newStats.totalTasksCompleted,
    coins: newCoins,
    questsCompleted: newStats.totalQuestsCompleted,
  })

  // Update leaderboard
  await dbSet(PATHS.leaderboardEntry(uid), {
    uid,
    level: newLevel,
    rank: newRank,
    xp: newTotalXp,
    currentStreak: newStreak,
    updatedAt: Date.now(),
  })

  return { newStats, leveledUp: newLevel > oldLevel, newLevel }
}

/** Delete a quest */
export const deleteQuest = async (uid: string, type: QuestType, id: string): Promise<void> => {
  await dbSet(PATHS.quest(uid, type, id), null)
}

/** Generate default daily quests for new users */
export const generateDefaultDailyQuests = async (uid: string): Promise<void> => {
  const defaults: Omit<Quest, 'id' | 'createdAt' | 'completed'>[] = [
    { title: 'Morning Workout', description: 'Complete 30 minutes of exercise', category: 'fitness', type: 'daily', difficulty: 'medium', xpReward: 75, coinReward: 25 },
    { title: 'Read 20 Pages', description: 'Read at least 20 pages of any book', category: 'reading', type: 'daily', difficulty: 'easy', xpReward: 25, coinReward: 10 },
    { title: 'Coding Practice', description: 'Practice coding for 1 hour', category: 'coding', type: 'daily', difficulty: 'medium', xpReward: 75, coinReward: 25 },
    { title: 'Meditation', description: 'Meditate for 10 minutes', category: 'meditation', type: 'daily', difficulty: 'easy', xpReward: 25, coinReward: 10 },
    { title: 'Drink 8 Glasses of Water', description: 'Stay hydrated throughout the day', category: 'health', type: 'daily', difficulty: 'easy', xpReward: 25, coinReward: 10 },
  ]
  for (const quest of defaults) {
    await addQuest(uid, quest)
  }
}
