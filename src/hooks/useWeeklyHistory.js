import { useMemo } from 'react'
import { calcLifeScore } from '../lib/idealJoseph'
import { getWeekStart } from '../lib/utils'

/**
 * Derives weekly Life Score history from all pillar hooks.
 * Looks back up to 12 weeks and computes the score for each week
 * using the same scoring functions already in each hook.
 */
export function useWeeklyHistory({ habitsData, weeklyData, fitnessData, mentalData, socialData, learnData, goalsData }) {

  const history = useMemo(() => {
    const weeks = []

    for (let i = 0; i < 12; i++) {
      // Build a date that falls in week i weeks ago
      const ref = new Date()
      ref.setDate(ref.getDate() - i * 7)
      const weekStart = getWeekStartFor(ref)
      const weekEnd   = getWeekEndFor(ref)

      // ── Habits score for that week ─────────────────────────────────
      const activeHabits = habitsData.habits.filter(h => h.active)
      let habitsScore = 0
      if (activeHabits.length > 0) {
        let total = 0
        for (let d = 0; d < 7; d++) {
          const dayRef = new Date(weekStart + 'T12:00:00')
          dayRef.setDate(dayRef.getDate() + d)
          const dateStr = dayRef.toISOString().split('T')[0]
          const done = activeHabits.filter(h =>
            habitsData.logs.find(l => l.habitId === h.id && l.date === dateStr && l.done)
          ).length
          total += (done / activeHabits.length) * 100
        }
        habitsScore = Math.round(total / 7)
      }

      // ── Weekly plan score for that week ───────────────────────────
      const plan = weeklyData.plans.find(p => p.weekStart === weekStart)
      let weeklyScore = 0
      if (plan) {
        const goals = plan.goals || []
        if (goals.length > 0) {
          const done = goals.filter(g => g.done).length
          const execScore = Math.round((done / goals.length) * 100)
          const reviewBonus = (plan.sundayPlanDone ? 10 : 0) + (plan.fridayReviewDone ? 10 : 0)
          weeklyScore = Math.min(100, Math.round(execScore * 0.8 + reviewBonus))
        }
      }

      // ── Fitness score for that week ───────────────────────────────
      const weekWorkouts = fitnessData.workouts.filter(w => w.date >= weekStart && w.date <= weekEnd)
      let fitnessScore = 0
      if (weekWorkouts.length > 0 || fitnessData.metrics.some(m => m.date >= weekStart && m.date <= weekEnd)) {
        const resistance = weekWorkouts.filter(w => w.type === 'resistance').length
        const zone2Mins  = weekWorkouts.filter(w => w.type === 'zone2').reduce((acc, w) => acc + (w.duration || 0), 0)
        const weekMetric = fitnessData.metrics.find(m => m.date >= weekStart && m.date <= weekEnd && m.sleep)
        const sleepScore  = weekMetric?.sleep ? Math.min(100, (weekMetric.sleep / 7.5) * 100) : 0
        const resScore    = Math.min(100, (resistance / 3) * 100)
        const zone2Score  = Math.min(100, (zone2Mins / 135) * 100)
        fitnessScore = Math.round(resScore * 0.35 + zone2Score * 0.35 + sleepScore * 0.3)
      }

      // ── Mental score for that week ────────────────────────────────
      const weekMentalLogs = mentalData.logs.filter(l => l.date >= weekStart && l.date <= weekEnd)
      let mentalScore = 0
      if (weekMentalLogs.length > 0) {
        const morningDone    = weekMentalLogs.filter(l => l.morning).length
        const eveningDone    = weekMentalLogs.filter(l => l.evening).length
        const meditationDays = weekMentalLogs.filter(l => l.evening?.practices?.meditation).length
        const moodsArr       = weekMentalLogs.filter(l => l.morning?.mood)
        const stressArr      = weekMentalLogs.filter(l => l.evening?.stress)
        const clarityArr     = weekMentalLogs.filter(l => l.evening?.clarity)
        const avgMood    = moodsArr.length   ? moodsArr.reduce((s, l) => s + l.morning.mood, 0) / moodsArr.length     : 3
        const avgStress  = stressArr.length  ? stressArr.reduce((s, l) => s + l.evening.stress, 0) / stressArr.length : 3
        const avgClarity = clarityArr.length ? clarityArr.reduce((s, l) => s + l.evening.clarity, 0) / clarityArr.length : 3
        mentalScore = Math.round(
          ((morningDone / 7) * 100) * 0.20 +
          ((eveningDone / 7) * 100) * 0.20 +
          ((meditationDays / 7) * 100) * 0.15 +
          ((avgMood / 5) * 100) * 0.20 +
          ((1 - ((avgStress - 1) / 4)) * 100) * 0.10 +
          ((avgClarity / 5) * 100) * 0.15
        )
      }

      // ── Social score for that week ────────────────────────────────
      const socialLog = socialData.logs.find(l => l.weekStart === weekStart)
      let socialScore = 0
      if (socialLog) {
        const qualityScore  = socialLog.quality ? Math.round((socialLog.quality / 5) * 30) : 0
        const contacted     = (socialLog.contactedIds || []).length
        const target        = Math.max(1, Math.min(socialData.people.length, 4))
        const contactScore  = Math.min(30, Math.round((contacted / target) * 30))
        const newBonus      = socialLog.metNew ? 10 : 0
        const cats = new Set((socialLog.contactedIds || []).map(id => socialData.people.find(p => p.id === id)?.category).filter(Boolean))
        const catsBonus     = cats.size >= 4 ? 10 : cats.size >= 2 ? 5 : 0
        socialScore = Math.min(100, 20 + qualityScore + contactScore + newBonus + catsBonus)
      }

      // ── Learning score for that week ──────────────────────────────
      const weekLearnings = learnData.learnings.filter(l => l.date >= weekStart && l.date <= weekEnd)
      let learningScore = 0
      if (weekLearnings.length > 0) {
        const hoursLogged = weekLearnings.reduce((acc, l) => acc + (l.duration || 0), 0)
        const notesCount  = weekLearnings.filter(l => l.takeaways?.length > 0).length
        const applied     = weekLearnings.filter(l => l.applied).length
        learningScore = Math.round(
          Math.min(100, (hoursLogged / 7) * 100) * 0.5 +
          Math.min(100, (notesCount / 7) * 100) * 0.3 +
          (applied > 0 ? 100 : 0) * 0.2
        )
      }

      // ── Goals score (uses current progress — best approximation) ──
      const goalsScore = i === 0 ? goalsData.getWeekScore() : (() => {
        const activeGoals = goalsData.goals.filter(g => g.status === 'active')
        if (!activeGoals.length) return 0
        const avgProgress = activeGoals.reduce((acc, g) => acc + (g.progress || 0), 0) / activeGoals.length
        const onTrack = activeGoals.filter(g => (g.progress || 0) >= 50).length
        return Math.round(avgProgress * 0.5 + ((onTrack / activeGoals.length) * 100) * 0.5)
      })()

      const scores = {
        habits: habitsScore, weekly: weeklyScore, fitness: fitnessScore,
        mental: mentalScore, social: socialScore, learning: learningScore, goals: goalsScore,
      }

      const lifeScore = calcLifeScore(scores)

      // Only include weeks where at least one pillar has data
      const hasData = Object.values(scores).some(s => s > 0)
      if (hasData) {
        weeks.push({ week: weekStart, score: lifeScore, scores })
      }
    }

    return weeks.reverse() // oldest first for chart display
  }, [
    habitsData.habits, habitsData.logs,
    weeklyData.plans,
    fitnessData.workouts, fitnessData.metrics,
    mentalData.logs,
    socialData.logs, socialData.people,
    learnData.learnings,
    goalsData.goals,
  ])

  return history
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWeekStartFor(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getWeekEndFor(date) {
  const start = new Date(getWeekStartFor(date))
  start.setDate(start.getDate() + 6)
  return start.toISOString().split('T')[0]
}
