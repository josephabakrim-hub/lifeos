// Ideal Joseph — the dream version of you
// Based on: Atomic Habits, 12 Week Year, Huberman Lab, Ultralearning, The ONE Thing + OKRs

export const IDEAL_NAME = 'Ideal Joseph'

export const IDEAL_WEEKLY_BENCHMARKS = {
  habits: {
    completionRate: 100,
    streakDays: 7,
    score: 100,
    description: 'Every habit hit, every day. No exceptions.',
    framework: 'Atomic Habits — James Clear',
  },
  weekly: {
    executionScore: 95,
    goalsHitRate: 3,
    reviewsDone: 2,
    deepWorkHours: 28,
    score: 95,
    description: 'Sunday plan done. Friday review done. Top 3 goals crushed.',
    framework: '12 Week Year — Brian Moran + Deep Work — Cal Newport',
  },
  fitness: {
    resistanceSessions: 3,
    zone2CardioMinutes: 135,
    sleepHours: 7.5,
    waterLitres: 2.5,
    morningRoutineDays: 7,
    score: 95,
    description: '3 lifts. 135 min Zone 2 cardio. 7.5h sleep nightly.',
    framework: 'Huberman Lab — Andrew Huberman',
  },
  mental: {
    morningCheckIns: 7,
    eveningReflections: 7,
    meditationDays: 7,
    avgMood: 4,
    avgStress: 2,
    avgClarity: 4.5,
    score: 90,
    description: 'Daily check-ins. 7/7 meditation. Avg mood 4+, stress ≤2, clarity 4.5+.',
    framework: 'CBT + ACT + Huberman Lab',
  },
  social: {
    reflectionDone: true,
    qualityRating: 4,
    categoriesCovered: 4,
    innerCircleWarm: true,
    score: 85,
    description: 'Weekly reflection done. 4/5 quality. All 4 categories contacted. Inner circle warm.',
    framework: "Dunbar's Number + Never Eat Alone + Give and Take",
  },
  learning: {
    readingHoursPerWeek: 7,
    notesLogged: 7,
    conceptsApplied: 1,
    booksPerMonth: 2,
    score: 90,
    description: '1 hr reading daily. Notes every session. 1 concept applied.',
    framework: 'Ultralearning — Scott Young + Naval Ravikant',
  },
  goals: {
    dailyOneThing: 7,
    milestonesOnTrack: 100,
    weeklyReviewDone: true,
    consistencyScore: 95,
    score: 95,
    description: 'Daily ONE Thing done. All milestones green. Weekly review complete.',
    framework: 'The ONE Thing — Gary Keller + OKRs',
  },
}

// Life Score weights — sum to 100
export const PILLAR_WEIGHTS = {
  habits:   18,
  weekly:   12,
  fitness:  17,
  mental:   18,
  social:   15,
  learning: 12,
  goals:    8,
}

export function calcIdealLifeScore() {
  const { habits, weekly, fitness, mental, social, learning, goals } = IDEAL_WEEKLY_BENCHMARKS
  const { habits: hw, weekly: ww, fitness: fw, mental: mw, social: sw, learning: lw, goals: gw } = PILLAR_WEIGHTS
  return Math.round(
    (habits.score * hw + weekly.score * ww + fitness.score * fw +
     mental.score * mw + social.score * sw + learning.score * lw + goals.score * gw) / 100
  )
}

export function calcLifeScore(scores) {
  const { habits = 0, weekly = 0, fitness = 0, mental = 0, social = 0, learning = 0, goals = 0 } = scores
  const { habits: hw, weekly: ww, fitness: fw, mental: mw, social: sw, learning: lw, goals: gw } = PILLAR_WEIGHTS
  return Math.round(
    (habits * hw + weekly * ww + fitness * fw +
     mental * mw + social * sw + learning * lw + goals * gw) / 100
  )
}

export function getGapStatus(actualScore, pillar) {
  const ideal = IDEAL_WEEKLY_BENCHMARKS[pillar]?.score || 100
  const gap = ideal - actualScore
  if (gap <= 5) return 'on-track'
  if (gap <= 20) return 'lagging'
  return 'behind'
}

export function getCatchUpPlan(pillar, actualScore) {
  const ideal = IDEAL_WEEKLY_BENCHMARKS[pillar]?.score || 100
  const gap = ideal - actualScore
  if (gap <= 5) return null

  const plans = {
    habits:   'Complete ALL habits for the next 3 days straight. Start with your easiest habit first — build momentum. Stack habits onto existing routines (after coffee, after waking).',
    weekly:   'Do a mini Sunday reset right now — even 15 minutes. Write your top 3 for tomorrow. Block one 2-hour deep work slot per day for the next 3 days.',
    fitness:  'Schedule your next 3 workouts right now as calendar events. Even a 20-min walk counts as Zone 2. Sleep is non-negotiable — set a bedtime alarm tonight.',
    mental:   'Log your morning intention right now — takes 2 minutes. Tonight, do the evening reflection. One check-in per day for 3 days builds the habit fast.',
    social:   'Pick one person right now and send them a message. Not tomorrow — now. Then do your weekly reflection. 5 minutes of genuine attention keeps a relationship warm.',
    learning: "Put your phone away and read for 25 minutes today (Pomodoro). Log one takeaway after. Tomorrow, do the same. That's your 3-day sprint.",
    goals:    'Identify your ONE Thing for today and do it before anything else. Review your milestones — pick the most overdue one and work on it for 45 minutes.',
  }
  return plans[pillar] || null
}
