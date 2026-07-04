import {
  ref,
  set,
  get,
  update,
  push,
  remove,
  onValue,
  off,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast,
  equalTo,
  type DataSnapshot,
} from 'firebase/database'
import { database } from './firebase'

// ── Generic Helpers ────────────────────────────────────────────────────────────

/** Read once */
export const dbGet = async <T>(path: string): Promise<T | null> => {
  const snap = await get(ref(database, path))
  return snap.exists() ? (snap.val() as T) : null
}

/** Write (overwrite) */
export const dbSet = async (path: string, data: unknown): Promise<void> => {
  await set(ref(database, path), data)
}

/** Merge update */
export const dbUpdate = async (path: string, data: Record<string, unknown>): Promise<void> => {
  await update(ref(database, path), data)
}

/** Push new item to list, returns new key */
export const dbPush = async (path: string, data: unknown): Promise<string> => {
  const newRef = await push(ref(database, path), data)
  return newRef.key!
}

/** Delete node */
export const dbRemove = async (path: string): Promise<void> => {
  await remove(ref(database, path))
}

/** Subscribe to realtime updates — returns unsubscribe fn */
export const dbSubscribe = <T>(
  path: string,
  callback: (data: T | null) => void
): (() => void) => {
  const r = ref(database, path)
  const listener = (snap: DataSnapshot) => {
    callback(snap.exists() ? (snap.val() as T) : null)
  }
  onValue(r, listener)
  return () => off(r, 'value', listener)
}

/** Get with orderByChild + limitToLast */
export const dbQueryLast = async <T>(
  path: string,
  childKey: string,
  limit: number
): Promise<T[]> => {
  const q = query(ref(database, path), orderByChild(childKey), limitToLast(limit))
  const snap = await get(q)
  const results: T[] = []
  snap.forEach((child) => {
    results.push(child.val() as T)
  })
  return results.reverse()
}

/** Get children where child equals value */
export const dbQueryEqual = async <T>(
  path: string,
  childKey: string,
  value: string | number | boolean
): Promise<T[]> => {
  const q = query(ref(database, path), orderByChild(childKey), equalTo(value))
  const snap = await get(q)
  const results: T[] = []
  snap.forEach((child) => {
    results.push({ id: child.key, ...child.val() } as T)
  })
  return results
}

export { serverTimestamp }

// ── User paths ─────────────────────────────────────────────────────────────────
export const PATHS = {
  user: (uid: string) => `users/${uid}`,
  profile: (uid: string) => `users/${uid}/profile`,
  stats: (uid: string) => `users/${uid}/stats`,
  skills: (uid: string) => `users/${uid}/skills`,
  quests: (uid: string, type: string) => `users/${uid}/quests/${type}`,
  quest: (uid: string, type: string, id: string) => `users/${uid}/quests/${type}/${id}`,
  achievements: (uid: string) => `users/${uid}/achievements`,
  calendar: (uid: string) => `users/${uid}/calendar`,
  calendarDay: (uid: string, dateKey: string) => `users/${uid}/calendar/${dateKey}`,
  inventory: (uid: string) => `users/${uid}/inventory`,
  notifications: (uid: string) => `users/${uid}/notifications`,
  settings: (uid: string) => `users/${uid}/settings`,
  analytics: (uid: string) => `users/${uid}/analytics`,
  history: (uid: string, dateKey: string) => `users/${uid}/analytics/history/${dateKey}`,
  leaderboard: () => `leaderboard`,
  leaderboardEntry: (uid: string) => `leaderboard/${uid}`,
  // Workout
  workoutProfile: (uid: string) => `users/${uid}/workout/profile`,
  workoutPlan: (uid: string) => `users/${uid}/workout/plan`,
  workoutPlans: (uid: string) => `users/${uid}/workout/plans`,
  workoutPlanItem: (uid: string, id: string) => `users/${uid}/workout/plans/${id}`,
  workoutLogs: (uid: string) => `users/${uid}/workout/logs`,
  workoutLog: (uid: string, id: string) => `users/${uid}/workout/logs/${id}`,
  dietPlans: (uid: string) => `users/${uid}/workout/diet`,
  dietPlanDay: (uid: string, day: string) => `users/${uid}/workout/diet/${day}`,
  workoutStats: (uid: string) => `users/${uid}/workout/stats`,
  // Daily Checklist
  dailyChecklist: (uid: string) => `users/${uid}/dailyChecklist`,
  dailyChecklistDay: (uid: string, dateKey: string) => `users/${uid}/dailyChecklist/${dateKey}`,
  // Challenges
  challenges: (uid: string) => `users/${uid}/challenges`,
  challenge: (uid: string, id: string) => `users/${uid}/challenges/${id}`,
}
