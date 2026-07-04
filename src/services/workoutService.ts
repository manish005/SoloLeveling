import { dbGet, dbSet, dbUpdate, dbPush, dbRemove, PATHS } from '../lib/database'
import type { WorkoutProfile, WorkoutPlan, WorkoutLog, DietPlan, WorkoutStats, WorkoutDay, WorkoutExercise, DailyChecklist, DietaryPreference } from '../types'
import { format } from 'date-fns'

// ── Workout Profile ──────────────────────────────────────────────────────────

export const getWorkoutProfile = async (uid: string): Promise<WorkoutProfile | null> => {
  return dbGet<WorkoutProfile>(PATHS.workoutProfile(uid))
}

export const saveWorkoutProfile = async (uid: string, profile: WorkoutProfile): Promise<void> => {
  await dbSet(PATHS.workoutProfile(uid), { ...profile, updatedAt: Date.now() })
}

export const calculateBMI = (heightCm: number, weightKg: number) => {
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  let category: string
  let recommendation: string

  if (bmi < 18.5) {
    category = 'Underweight'
    recommendation = 'Consider a nutrient-rich diet to increase healthy body mass.'
  } else if (bmi < 25) {
    category = 'Normal'
    recommendation = 'Great shape! Maintain with a balanced diet and regular exercise.'
  } else if (bmi < 30) {
    category = 'Overweight'
    recommendation = 'Focus on a calorie-controlled diet and increased physical activity.'
  } else if (bmi < 35) {
    category = 'Obese Class I'
    recommendation = 'Consult a healthcare provider. Moderate exercise and diet changes recommended.'
  } else if (bmi < 40) {
    category = 'Obese Class II'
    recommendation = 'Medical guidance is strongly advised. Start with low-impact activities.'
  } else {
    category = 'Obese Class III'
    recommendation = 'Please consult a healthcare professional for a personalized plan.'
  }

  // Healthy weight range
  const minHealthy = 18.5 * heightM * heightM
  const maxHealthy = 24.9 * heightM * heightM

  return {
    bmi: Math.round(bmi * 10) / 10,
    category,
    recommendation,
    healthyWeightRange: `${Math.round(minHealthy)} - ${Math.round(maxHealthy)} kg`,
  }
}

export const getDailyCalories = (
  weight: number, height: number, age: number,
  gender: string, activityLevel: string, goal: string
): number => {
  // Mifflin-St Jeor Equation
  const bmr = gender === 'female'
    ? (10 * weight) + (6.25 * height) - (5 * age) - 161
    : (10 * weight) + (6.25 * height) - (5 * age) + 5

  const activityMultipliers: Record<string, number> = {
    'Sedentary': 1.2,
    'Lightly Active': 1.375,
    'Moderately Active': 1.55,
    'Very Active': 1.725,
  }
  const tdee = bmr * (activityMultipliers[activityLevel] ?? 1.2)

  const goalAdjustments: Record<string, number> = {
    'Weight Loss': 0.8,
    'Fat Loss': 0.85,
    'Muscle Gain': 1.1,
    'Strength': 1.05,
    'Endurance': 1.0,
    'General Fitness': 1.0,
  }

  return Math.round(tdee * (goalAdjustments[goal] ?? 1.0))
}

export const getProteinTarget = (weight: number, goal: string): number => {
  const multipliers: Record<string, number> = {
    'Weight Loss': 1.8,
    'Fat Loss': 2.0,
    'Muscle Gain': 2.2,
    'Strength': 2.0,
    'Endurance': 1.4,
    'General Fitness': 1.6,
  }
  return Math.round(weight * (multipliers[goal] ?? 1.6))
}

export const getWaterTarget = (weight: number): number => {
  return Math.round(weight * 0.033)
}

// ── Workout Plan Generation ──────────────────────────────────────────────────

export const generateWorkoutPlan = (
  profile: WorkoutProfile
): { name: string; description: string; schedule: WorkoutDay[] } => {
  const { workoutLocation, workoutFrequency, availableEquipment, fitnessGoal, workoutIntensity } = profile
  const isGym = workoutLocation === 'Gym'
  const hasDumbbells = availableEquipment.includes('Dumbbells')
  const hasBands = availableEquipment.includes('Resistance Bands')
  const hasBarbell = availableEquipment.includes('Barbell')
  const hasMachines = availableEquipment.includes('Machines')
  const hasNone = availableEquipment.includes('None')

  const getRestTime = () => workoutIntensity === 'Beginner' ? '60s' : workoutIntensity === 'Intermediate' ? '45s' : '30s'

  const generatePushDay = (): WorkoutExercise[] => [
    { name: isGym ? 'Barbell Bench Press' : hasDumbbells ? 'Dumbbell Bench Press' : 'Push-ups', sets: 3, reps: isGym ? '8-12' : '12-15', restTime: getRestTime() },
    { name: isGym ? 'Incline Dumbbell Press' : 'Incline Push-ups', sets: 3, reps: '10-12', restTime: getRestTime() },
    { name: isGym ? 'Seated Dumbbell Shoulder Press' : hasDumbbells ? 'Standing Dumbbell Press' : 'Pike Push-ups', sets: 3, reps: '10-12', restTime: getRestTime() },
    { name: isGym ? 'Lateral Raises' : hasDumbbells ? 'Dumbbell Lateral Raises' : 'Lateral Raises with Bands', sets: 3, reps: '12-15', restTime: getRestTime() },
    { name: isGym ? 'Tricep Pushdowns' : hasDumbbells ? 'Overhead Tricep Extension' : 'Diamond Push-ups', sets: 3, reps: '12-15', restTime: getRestTime() },
  ]

  const generatePullDay = (): WorkoutExercise[] => [
    { name: isGym ? 'Deadlifts' : hasDumbbells ? 'Dumbbell Rows' : 'Bent-over Rows with Bands', sets: 3, reps: '8-10', restTime: getRestTime() },
    { name: isGym ? 'Lat Pulldowns' : hasBands ? 'Band Pull-aparts' : 'Doorway Rows', sets: 3, reps: '10-12', restTime: getRestTime() },
    { name: isGym ? 'Seated Cable Rows' : hasDumbbells ? 'Dumbbell Rows' : 'Bodyweight Rows', sets: 3, reps: '10-12', restTime: getRestTime() },
    { name: isGym ? 'Barbell Curls' : hasDumbbells ? 'Dumbbell Curls' : 'Band Curls', sets: 3, reps: '12-15', restTime: getRestTime() },
    { name: isGym ? 'Face Pulls' : 'Rear Delt Flyes', sets: 3, reps: '15', restTime: getRestTime() },
  ]

  const generateLegDay = (): WorkoutExercise[] => [
    { name: isGym ? 'Barbell Squats' : hasDumbbells ? 'Goblet Squats' : 'Bodyweight Squats', sets: 3, reps: isGym ? '8-10' : '12-15', restTime: getRestTime() },
    { name: isGym ? 'Romanian Deadlifts' : hasDumbbells ? 'Dumbbell RDLs' : 'Glute Bridges', sets: 3, reps: '10-12', restTime: getRestTime() },
    { name: isGym ? 'Leg Press' : 'Walking Lunges', sets: 3, reps: '12-15', restTime: getRestTime() },
    { name: isGym ? 'Leg Extensions' : 'Step-ups', sets: 3, reps: '12-15', restTime: getRestTime() },
    { name: isGym ? 'Calf Raises' : 'Standing Calf Raises', sets: 3, reps: '15-20', restTime: getRestTime() },
  ]

  const generateFullBody = (): WorkoutExercise[] => [
    { name: isGym ? 'Squats' : 'Bodyweight Squats', sets: 3, reps: '10-12', restTime: getRestTime() },
    { name: isGym ? 'Bench Press' : 'Push-ups', sets: 3, reps: '10-12', restTime: getRestTime() },
    { name: isGym ? 'Bent-over Rows' : hasDumbbells ? 'Dumbbell Rows' : 'Band Rows', sets: 3, reps: '10-12', restTime: getRestTime() },
    { name: isGym ? 'Overhead Press' : hasDumbbells ? 'Dumbbell Press' : 'Pike Push-ups', sets: 3, reps: '10-12', restTime: getRestTime() },
    { name: 'Planks', sets: 3, reps: '30-45s', restTime: getRestTime() },
  ]

  const generateHIIT = (): WorkoutExercise[] => [
    { name: 'Jumping Jacks', sets: 3, reps: '45s', restTime: '15s' },
    { name: 'Burpees', sets: 3, reps: '30s', restTime: '15s' },
    { name: 'High Knees', sets: 3, reps: '45s', restTime: '15s' },
    { name: 'Mountain Climbers', sets: 3, reps: '45s', restTime: '15s' },
    { name: 'Jump Squats', sets: 3, reps: '30s', restTime: '15s' },
  ]

  const generateBodyweight = (): WorkoutExercise[] => [
    { name: 'Push-ups', sets: 3, reps: '10-15', restTime: getRestTime() },
    { name: 'Bodyweight Squats', sets: 3, reps: '15-20', restTime: getRestTime() },
    { name: 'Lunges', sets: 3, reps: '12 each', restTime: getRestTime() },
    { name: 'Planks', sets: 3, reps: '30-60s', restTime: getRestTime() },
    { name: 'Glute Bridges', sets: 3, reps: '15', restTime: getRestTime() },
  ]

  const generateCardio = (): WorkoutExercise[] => [
    { name: 'Brisk Walking / Jogging', sets: 1, reps: '10 min', restTime: '0s' },
    { name: 'Jump Rope', sets: 3, reps: '2 min', restTime: '30s' },
    { name: 'High Knees', sets: 3, reps: '1 min', restTime: '30s' },
    { name: 'Burpees', sets: 3, reps: '30s', restTime: '30s' },
    { name: 'Cool Down Stretching', sets: 1, reps: '5 min', restTime: '0s' },
  ]

  let schedule: WorkoutDay[] = []
  const days = workoutFrequency

  if (isGym && days >= 5) {
    // Push / Pull / Legs / Upper / Lower
    schedule = [
      { day: 1, focus: 'Push Day', exercises: generatePushDay() },
      { day: 2, focus: 'Pull Day', exercises: generatePullDay() },
      { day: 3, focus: 'Leg Day', exercises: generateLegDay() },
      { day: 4, focus: 'Upper Body', exercises: [...generatePushDay().slice(0, 3), ...generatePullDay().slice(0, 2)] },
      { day: 5, focus: 'Lower Body', exercises: generateLegDay() },
    ]
  } else if (isGym && days >= 4) {
    // Upper / Lower split
    schedule = [
      { day: 1, focus: 'Upper Body', exercises: [...generatePushDay().slice(0, 3), ...generatePullDay().slice(0, 3)] },
      { day: 2, focus: 'Lower Body', exercises: generateLegDay() },
      { day: 3, focus: 'Upper Body', exercises: [...generatePushDay().slice(0, 2), ...generatePullDay().slice(0, 4)] },
      { day: 4, focus: 'Lower Body + Core', exercises: [...generateLegDay(), { name: 'Planks', sets: 3, reps: '45s', restTime: getRestTime() }] },
    ]
  } else if (days >= 3) {
    // Full body split
    schedule = [
      { day: 1, focus: 'Full Body A', exercises: generateFullBody() },
      { day: 2, focus: 'Full Body B', exercises: [...generateFullBody(), { name: 'Lunges', sets: 3, reps: '12 each', restTime: getRestTime() }] },
      { day: 3, focus: 'Full Body C', exercises: [...generateFullBody().slice(0, 3), ...generateHIIT().slice(0, 2)] },
    ]
  } else if (hasNone && !isGym) {
    const homePlans = [
      { focus: 'Bodyweight Circuit', exercises: generateBodyweight() },
      { focus: 'HIIT Cardio', exercises: generateHIIT() },
      { focus: 'Cardio & Core', exercises: generateCardio() },
    ]
    schedule = homePlans.slice(0, days).map((p, i) => ({ day: i + 1, ...p }))
  } else {
    schedule = [
      { day: 1, focus: 'Strength', exercises: generateFullBody() },
      { day: 2, focus: 'Cardio', exercises: generateCardio() },
      { day: 3, focus: 'HIIT', exercises: generateHIIT() },
    ].slice(0, days)
  }

  let name = ''
  let description = ''
  if (fitnessGoal === 'Muscle Gain') {
    name = isGym ? 'Muscle Building Program' : 'Home Hypertrophy Plan'
    description = 'Progressive overload focused on muscle growth with adequate protein intake.'
  } else if (fitnessGoal === 'Strength') {
    name = 'Strength Progression Program'
    description = 'Low reps, heavy weight focus for maximal strength gains.'
  } else if (fitnessGoal === 'Weight Loss' || fitnessGoal === 'Fat Loss') {
    name = isGym ? 'Fat Loss Accelerator' : 'Home Fat Burner'
    description = 'High calorie burn with metabolic conditioning and circuit training.'
  } else if (fitnessGoal === 'Endurance') {
    name = 'Endurance Builder'
    description = 'Higher volume, lower rest periods to build cardiovascular endurance.'
  } else {
    name = isGym ? 'Balanced Fitness Plan' : 'Home Fitness Plan'
    description = 'A well-rounded program for overall health and fitness.'
  }

  return { name, description, schedule }
}

// ── Meal Plan Generation (Indian Diet - Calorie Deficit) ────────────────────

export const generateDietPlan = (
  calories: number, proteinTarget: number, goal: string,
  dietaryPreference: DietaryPreference = 'non-veg'
): DietPlan[] => {
  const deficitCalories = (goal === 'Weight Loss' || goal === 'Fat Loss')
    ? Math.round(calories * 0.85)
    : calories

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const vegMeals = [
    {
      breakfast: `2 Idli + 1 bowl sambar + coconut chutney (${Math.round(deficitCalories * 0.25)} cal)`,
      lunch: `1 bowl dal + 2 chapati + 1 bowl sabzi + salad (${Math.round(deficitCalories * 0.35)} cal)`,
      dinner: `Grilled paneer tikka + 1 bowl brown rice + raita (${Math.round(deficitCalories * 0.3)} cal)`,
      snacks: [`1 glass buttermilk (${Math.round(deficitCalories * 0.05)} cal)`, `1 apple (${Math.round(deficitCalories * 0.05)} cal)`],
    },
    {
      breakfast: `2 moong dal chilla + mint chutney (${Math.round(deficitCalories * 0.25)} cal)`,
      lunch: `1 bowl rajma + 2 chapati + 1 bowl rice + cucumber raita (${Math.round(deficitCalories * 0.35)} cal)`,
      dinner: `Paneer butter masala (low oil) + 2 roti + salad (${Math.round(deficitCalories * 0.3)} cal)`,
      snacks: [`1 bowl sprouts chaat (${Math.round(deficitCalories * 0.05)} cal)`, `1 cup green tea (${Math.round(deficitCalories * 0.05)} cal)`],
    },
    {
      breakfast: `2 besan chilla + 1 bowl curd (${Math.round(deficitCalories * 0.25)} cal)`,
      lunch: `1 bowl chole + 2 roti + 1 bowl salad (${Math.round(deficitCalories * 0.35)} cal)`,
      dinner: `Veg biryani + 1 bowl raita + cucumber salad (${Math.round(deficitCalories * 0.3)} cal)`,
      snacks: [`1 bowl roasted makhana (${Math.round(deficitCalories * 0.05)} cal)`, `1 banana (${Math.round(deficitCalories * 0.05)} cal)`],
    },
    {
      breakfast: `1 bowl poha with peanuts + lemon (${Math.round(deficitCalories * 0.25)} cal)`,
      lunch: `1 bowl dal tadka + 2 chapati + bhindi sabzi (${Math.round(deficitCalories * 0.35)} cal)`,
      dinner: `Soybean curry + 1 bowl quinoa + salad (${Math.round(deficitCalories * 0.3)} cal)`,
      snacks: [`1 bowl mixed fruit (${Math.round(deficitCalories * 0.05)} cal)`, `1 glass chaach (${Math.round(deficitCalories * 0.05)} cal)`],
    },
    {
      breakfast: `1 bowl upma with veggies + 1 glass milk (${Math.round(deficitCalories * 0.25)} cal)`,
      lunch: `1 bowl sambar + 1 bowl rice + 1 bowl drumstick sabzi (${Math.round(deficitCalories * 0.35)} cal)`,
      dinner: `Mushroom curry + 2 roti + cucumber salad (${Math.round(deficitCalories * 0.3)} cal)`,
      snacks: [`Handful almonds + walnuts (${Math.round(deficitCalories * 0.05)} cal)`, `1 bowl papaya (${Math.round(deficitCalories * 0.05)} cal)`],
    },
    {
      breakfast: `2 dosa (less oil) + 1 bowl sambar + chutney (${Math.round(deficitCalories * 0.25)} cal)`,
      lunch: `1 bowl palak paneer + 2 chapati + 1 bowl salad (${Math.round(deficitCalories * 0.35)} cal)`,
      dinner: `Stuffed paratha (paneer/alu) + 1 bowl curd + salad (${Math.round(deficitCalories * 0.3)} cal)`,
      snacks: [`1 bowl roasted chana (${Math.round(deficitCalories * 0.05)} cal)`, `1 orange (${Math.round(deficitCalories * 0.05)} cal)`],
    },
    {
      breakfast: `1 bowl vegetable + 2 whole wheat toast + 1 glass milk (${Math.round(deficitCalories * 0.25)} cal)`,
      lunch: `1 bowl dal palak + 2 chapati + 1 bowl lauki sabzi (${Math.round(deficitCalories * 0.35)} cal)`,
      dinner: `Paneer tikka + 1 bowl mixed veg soup + salad (${Math.round(deficitCalories * 0.3)} cal)`,
      snacks: [`1 glass whey protein shake (${Math.round(deficitCalories * 0.05)} cal)`, `Seasonal fruit (${Math.round(deficitCalories * 0.05)} cal)`],
    },
  ]

  const nonVegMeals = [
    {
      breakfast: `2 eggs + 2 whole wheat toast + 1 glass milk (${Math.round(deficitCalories * 0.25)} cal)`,
      lunch: `1 bowl dal + 2 chapati + 1 bowl sabzi + salad (${Math.round(deficitCalories * 0.35)} cal)`,
      dinner: `Grilled chicken breast (150g) + 1 bowl brown rice + steamed veg (${Math.round(deficitCalories * 0.3)} cal)`,
      snacks: [`1 glass whey protein shake (${Math.round(deficitCalories * 0.05)} cal)`, `1 apple (${Math.round(deficitCalories * 0.05)} cal)`],
    },
    {
      breakfast: `2 moong dal chilla + mint chutney (${Math.round(deficitCalories * 0.25)} cal)`,
      lunch: `1 bowl rajma + 2 chapati + 1 bowl rice + cucumber raita (${Math.round(deficitCalories * 0.35)} cal)`,
      dinner: `Tandoori chicken (150g) + 1 bowl salad + mint chutney (${Math.round(deficitCalories * 0.3)} cal)`,
      snacks: [`1 bowl sprouts chaat (${Math.round(deficitCalories * 0.05)} cal)`, `1 cup green tea (${Math.round(deficitCalories * 0.05)} cal)`],
    },
    {
      breakfast: `2 besan chilla + 1 bowl curd (${Math.round(deficitCalories * 0.25)} cal)`,
      lunch: `1 bowl chole + 2 roti + 1 bowl salad (${Math.round(deficitCalories * 0.35)} cal)`,
      dinner: `Fish curry (150g) + 1 bowl brown rice + stir-fried veg (${Math.round(deficitCalories * 0.3)} cal)`,
      snacks: [`1 bowl roasted makhana (${Math.round(deficitCalories * 0.05)} cal)`, `1 banana (${Math.round(deficitCalories * 0.05)} cal)`],
    },
    {
      breakfast: `1 bowl poha with peanuts + lemon (${Math.round(deficitCalories * 0.25)} cal)`,
      lunch: `1 bowl dal tadka + 2 chapati + bhindi sabzi (${Math.round(deficitCalories * 0.35)} cal)`,
      dinner: `Egg curry (3 eggs) + 1 bowl quinoa + salad (${Math.round(deficitCalories * 0.3)} cal)`,
      snacks: [`1 bowl mixed fruit (${Math.round(deficitCalories * 0.05)} cal)`, `1 glass chaach (${Math.round(deficitCalories * 0.05)} cal)`],
    },
    {
      breakfast: `1 bowl upma with veggies + 2 boiled eggs (${Math.round(deficitCalories * 0.25)} cal)`,
      lunch: `1 bowl sambar + 1 bowl rice + 1 bowl drumstick sabzi (${Math.round(deficitCalories * 0.35)} cal)`,
      dinner: `Chicken curry (150g) + 2 roti + cucumber salad (${Math.round(deficitCalories * 0.3)} cal)`,
      snacks: [`Handful almonds + walnuts (${Math.round(deficitCalories * 0.05)} cal)`, `1 bowl papaya (${Math.round(deficitCalories * 0.05)} cal)`],
    },
    {
      breakfast: `2 dosa (less oil) + 1 bowl sambar + chutney (${Math.round(deficitCalories * 0.25)} cal)`,
      lunch: `1 bowl palak paneer + 2 chapati + 1 bowl salad (${Math.round(deficitCalories * 0.35)} cal)`,
      dinner: `Grilled fish + 1 bowl vegetable khichdi + raita (${Math.round(deficitCalories * 0.3)} cal)`,
      snacks: [`1 bowl roasted chana (${Math.round(deficitCalories * 0.05)} cal)`, `1 orange (${Math.round(deficitCalories * 0.05)} cal)`],
    },
    {
      breakfast: `1 bowl vegetable + 2 whole wheat toast + 1 boiled egg (${Math.round(deficitCalories * 0.25)} cal)`,
      lunch: `1 bowl dal palak + 2 chapati + 1 bowl lauki sabzi (${Math.round(deficitCalories * 0.35)} cal)`,
      dinner: `Chicken tikka + 1 bowl mixed veg soup + salad (${Math.round(deficitCalories * 0.3)} cal)`,
      snacks: [`1 glass whey protein shake (${Math.round(deficitCalories * 0.05)} cal)`, `Seasonal fruit (${Math.round(deficitCalories * 0.05)} cal)`],
    },
  ]

  const meals = dietaryPreference === 'veg' ? vegMeals : nonVegMeals
  const proteinPct = Math.round((proteinTarget * 4 / deficitCalories) * 100)
  const carbsPct = goal === 'Muscle Gain' ? 45 : goal === 'Weight Loss' || goal === 'Fat Loss' ? 35 : 40
  const fatPct = 100 - proteinPct - carbsPct

  return days.map((dayName, i) => ({
    day: dayName,
    ...meals[i % 7],
    calories: deficitCalories,
    protein: proteinTarget,
    carbs: Math.round(deficitCalories * (carbsPct / 100) / 4),
    fats: Math.round(deficitCalories * (fatPct / 100) / 9),
    waterIntake: 3.0,
    dietaryPreference,
  }))
}

// ── Workout Logging ─────────────────────────────────────────────────────────

export const saveWorkoutLog = async (uid: string, log: Omit<WorkoutLog, 'id' | 'createdAt'>): Promise<string> => {
  return dbPush(PATHS.workoutLogs(uid), { ...log, createdAt: Date.now() })
}

export const updateWorkoutLog = async (uid: string, logId: string, log: Partial<WorkoutLog>): Promise<void> => {
  await dbUpdate(PATHS.workoutLog(uid, logId), log)
}

export const deleteWorkoutLog = async (uid: string, logId: string): Promise<void> => {
  await dbRemove(PATHS.workoutLog(uid, logId))
}

export const getWorkoutLogs = async (uid: string): Promise<WorkoutLog[]> => {
  const data = await dbGet<Record<string, WorkoutLog>>(PATHS.workoutLogs(uid))
  if (!data) return []
  return Object.entries(data).map(([id, l]) => ({ ...l, id })).sort((a, b) => b.createdAt - a.createdAt)
}

export const getWorkoutLogsByDate = async (uid: string, date: string): Promise<WorkoutLog[]> => {
  const all = await getWorkoutLogs(uid)
  return all.filter(l => l.date === date)
}

export const getDietPlans = async (uid: string): Promise<DietPlan[]> => {
  const data = await dbGet<Record<string, DietPlan>>(PATHS.dietPlans(uid))
  if (!data) return []
  return Object.entries(data).map(([k, d]) => ({ ...d, id: k }))
}

export const saveDietPlans = async (uid: string, plans: DietPlan[]): Promise<void> => {
  const data: Record<string, DietPlan> = {}
  plans.forEach(p => { data[p.day] = p })
  await dbSet(PATHS.dietPlans(uid), data)
}

export const getWorkoutStats = async (uid: string): Promise<WorkoutStats | null> => {
  return dbGet<WorkoutStats>(PATHS.workoutStats(uid))
}

export const saveWorkoutStats = async (uid: string, stats: WorkoutStats): Promise<void> => {
  await dbSet(PATHS.workoutStats(uid), stats)
}

export const getWorkoutPlans = async (uid: string): Promise<WorkoutPlan[]> => {
  const data = await dbGet<Record<string, WorkoutPlan>>(PATHS.workoutPlans(uid))
  if (!data) return []
  return Object.entries(data).map(([id, p]) => ({ ...p, id }))
}

export const saveWorkoutPlan = async (uid: string, plan: Omit<WorkoutPlan, 'id' | 'createdAt'>): Promise<string> => {
  return dbPush(PATHS.workoutPlans(uid), { ...plan, createdAt: Date.now() })
}

// ── Daily Checklist ─────────────────────────────────────────────────────────

import type { DAILY_REWARDS } from '../types'

export const getDailyChecklist = async (uid: string, dateKey: string): Promise<DailyChecklist | null> => {
  return dbGet<DailyChecklist>(PATHS.dailyChecklistDay(uid, dateKey))
}

export const saveDailyChecklist = async (uid: string, checklist: DailyChecklist): Promise<void> => {
  await dbSet(PATHS.dailyChecklistDay(uid, checklist.date), checklist)
}

export const updateDailyChecklistItem = async (
  uid: string,
  dateKey: string,
  updates: Partial<DailyChecklist>
): Promise<DailyChecklist> => {
  const existing = await getDailyChecklist(uid, dateKey)
  const current: DailyChecklist = existing ?? {
    date: dateKey,
    water: false,
    waterLiters: 0,
    workout: false,
    breakfast: false,
    lunch: false,
    dinner: false,
    snacks: false,
    allMeals: false,
    completed: false,
    progress: 0,
    xpEarned: 0,
    coinsEarned: 0,
    updatedAt: Date.now(),
  }

  const updated = { ...current, ...updates, updatedAt: Date.now() }

  // Recalculate allMeals
  updated.allMeals = !!(updated.breakfast && updated.lunch && updated.dinner)
  // Recalculate progress
  const totalItems = 5 // water, workout, breakfast, lunch, dinner
  let doneCount = 0
  if (updated.water) doneCount++
  if (updated.workout) doneCount++
  if (updated.breakfast) doneCount++
  if (updated.lunch) doneCount++
  if (updated.dinner) doneCount++
  updated.progress = Math.round((doneCount / totalItems) * 100)
  updated.completed = doneCount === totalItems

  await saveDailyChecklist(uid, updated)
  return updated
}
