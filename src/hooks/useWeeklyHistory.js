import { useMemo } from 'react'
import { calcLifeScore } from '../lib/idealJoseph'
import { getWeekStart } from '../lib/utils'
import { isHabitScheduledOn } from './useHabits'

/**
 * Derives weekly Life Score history from all pillar hooks.
 * Each pillar's scoring logic mirrors its live getWeekScore() exactly.
 */
export function useWeeklyHistory({ habitsData, weeklyData, fitnessData, mentalData, socialData, learnData, goalsData }) {

  const history = useMemo(() => {
    const weeks = []

    for (let i = 0; i < 12; i++) {
      const ref = new Date()
      ref.setDate(ref.getDate() - i * 7)
      const weekStart = getWeekStartFor(ref)
      const weekEnd   = getWeekEndFor(ref)

      // ── Habits — mirrors useHabits.getWeekScore exactly ─────────────────────
      // Uses isHabitScheduledOn per day, skips mastered habits, only counts
      // habits actually scheduled on each day (not total habits every day)
      const activeHabits = habitsData.habits.filter(h => h.active && !h.mastered)
      let habitsScore = 0
      if (activeHabits.length > 0) {
        let totalScore = 0
        let countedDays = 0
        for (let d = 0; d < 7; d++) {
          const dayRef = new Date(weekStart + 'T12:00:00')
          dayRef.setDate(dayRef.getDate() + d)
          const dateStr = dayRef.toISOString().split('T')[0]
          if (dateStr > weekEnd) break

          const scheduledThatDay = activeHabits.filter(h => isHabitScheduledOn(h, dateStr))
          if (!scheduledThatDay.length) continue

          const done = scheduledThatDay.filter(h =>
            habitsData.logs.find(l => l.habitId === h.id && l.date === dateStr && l.done)
          ).length
          totalScore += (done / scheduledThatDay.length) * 100
          countedDays++
        }
        habitsScore = countedDays > 0 ? Math.round(totalScore / countedDays) : 0
      }

      // ── Weekly plan — mirrors useWeekly.getWeekScore exactly ─────────────────
      const plan = weeklyData.plans.find(p => p.weekStart === weekStart)
      let weeklyScore = 0
      if (plan) {
        const goals = plan.goals || []
        if (goals.length > 0) {
          const done = goals.filter(g => g.done).length
          const sundayDone = plan.sundayReviewDone ?? plan.sundayPlanDone ?? false
          const mondayDone = plan.mondayPlanDone   ?? plan.fridayReviewDone ?? false
          const reviewBonus = (sundayDone ? 10 : 0) + (mondayDone ? 10 : 0)
          const dwHours2 = plan.deepWorkHours || 0
          const dwScore2 = Math.min(100, Math.round((dwHours2 / 28) * 100))
          weeklyScore = Math.min(100, Math.round((done / goals.length) * 65 + reviewBonus + dwScore2 * 0.15))
        }
      }

      // ── Fitness — mirrors useFitness.getWeekScore exactly ────────────────────
      // Counts hiit/jogging/walk for zone2, calisthenics as 0.5 resistance,
      // and averages ALL sleep entries that week (not just one metric record)
      const weekWorkouts = fitnessData.workouts.filter(w => w.date >= weekStart && w.date <= weekEnd)
      const weekMetrics  = fitnessData.metrics.filter(m => m.date >= weekStart && m.date <= weekEnd)
      let fitnessScore = 0
      if (weekWorkouts.length > 0 || weekMetrics.length > 0) {
        const resistanceFull   = weekWorkouts.filter(w => w.type === 'resistance').length
        const calisthenicsHalf = weekWorkouts.filter(w => ['pullups','pushups','dips','situps'].includes(w.type)).length * 0.5
        const resistance       = resistanceFull + calisthenicsHalf
        const resScore         = Math.min(100, (resistance / 3) * 100)

        const zone2Mins = weekWorkouts.reduce((acc, w) => {
          if (['zone2', 'hiit', 'jogging'].includes(w.type)) return acc + (w.duration || 0)
          if (w.type === 'walk')                              return acc + (w.duration || 0) * 0.5
          return acc
        }, 0)
        const zone2Score = Math.min(100, (zone2Mins / 135) * 100)

        const sleepEntries = weekMetrics.filter(m => m.sleep)
        const avgSleep     = sleepEntries.length
          ? sleepEntries.reduce((a, m) => a + m.sleep, 0) / sleepEntries.length
          : null
        const sleepScore   = avgSleep !== null ? Math.min(100, (avgSleep / 7.5) * 100) : 0

        fitnessScore = avgSleep === null
          ? Math.round(resScore * 0.5 + zone2Score * 0.5)
          : Math.round(resScore * 0.35 + zone2Score * 0.35 + sleepScore * 0.3)
      }

      // ── Mental — mirrors useMental.getWeekScore exactly ──────────────────────
      // No fallback defaults (old code defaulted missing data to 3, inflating scores)
      const weekMentalLogs = mentalData.logs.filter(l => l.date >= weekStart && l.date <= weekEnd)
      let mentalScore = 0
      if (weekMentalLogs.length > 0) {
        const morningDone    = weekMentalLogs.filter(l => l.morning).length
        const eveningDone    = weekMentalLogs.filter(l => l.evening).length
        const meditationDays = weekMentalLogs.filter(l => l.evening?.practices?.meditation).length

        const moodLogs    = weekMentalLogs.filter(l => l.morning?.mood)
        const stressLogs  = weekMentalLogs.filter(l => l.evening?.stress)
        const clarityLogs = weekMentalLogs.filter(l => l.evening?.clarity)

        const avgMood    = moodLogs.length    ? moodLogs.reduce((s, l) => s + l.morning.mood, 0) / moodLogs.length       : 0
        const avgStress  = stressLogs.length  ? stressLogs.reduce((s, l) => s + l.evening.stress, 0) / stressLogs.length : 0
        const avgClarity = clarityLogs.length ? clarityLogs.reduce((s, l) => s + l.evening.clarity, 0) / clarityLogs.length : 0

        mentalScore = Math.round(
          ((morningDone / 7) * 100) * 0.20 +
          ((eveningDone / 7) * 100) * 0.20 +
          ((meditationDays / 7) * 100) * 0.15 +
          (avgMood    ? (avgMood / 5) * 100                    : 0) * 0.20 +
          (avgStress  ? (1 - ((avgStress - 1) / 4)) * 100      : 0) * 0.10 +
          (avgClarity ? (avgClarity / 5) * 100                 : 0) * 0.15
        )
      }

      // ── Social — mirrors useSocial.getWeekScore exactly ──────────────────────
      // Merges lastContacted on people records with contactedIds in the log
      const socialLog    = socialData.logs.find(l => l.weekStart === weekStart)
      const activePeople = socialData.people.filter(p => !p.archived)

      const contactedThisWeek = activePeople.filter(
        p => p.lastContacted && p.lastContacted >= weekStart && p.lastContacted <= weekEnd
      )
      const logContactedIds = socialLog?.contactedIds || []
      const allContactedIds = new Set([
        ...contactedThisWeek.map(p => p.id),
        ...logContactedIds,
      ])
      const totalContacted = allContactedIds.size
      const target         = Math.max(1, Math.min(activePeople.length, 4))
      const contactScore   = Math.min(30, Math.round((totalContacted / target) * 30))

      const cats = new Set(
        [...allContactedIds].map(id => activePeople.find(p => p.id === id)?.category).filter(Boolean)
      )
      const catsBonus = cats.size >= 4 ? 10 : cats.size >= 2 ? 5 : 0

      const socialScore = !socialLog
        ? Math.min(100, contactScore + catsBonus)
        : Math.min(100,
            contactScore + catsBonus + 20 +
            (socialLog.quality ? Math.round((socialLog.quality / 5) * 30) : 0) +
            (socialLog.metNew ? 10 : 0)
          )

      // ── Learning — mirrors useLearn.getWeekScore exactly ─────────────────────
      // Adds the missing reviewScore component (30% weight) and correct weights
      const weekLearnings = learnData.learnings.filter(l => l.date >= weekStart && l.date <= weekEnd)
      const weekReviews   = learnData.learnings.flatMap(l =>
        (l.reviewHistory || []).filter(r => r.date >= weekStart && r.date <= weekEnd)
      )
      let learningScore = 0
      if (weekLearnings.length > 0 || weekReviews.length > 0) {
        const hoursLogged = weekLearnings.reduce((acc, l) => acc + (l.duration || 0), 0)
        const notesCount  = weekLearnings.filter(l => l.takeaways?.length > 0).length
        const applied     = weekLearnings.filter(l => l.applied).length

        const reviewsDone = weekReviews.length
        const avgRecall   = reviewsDone > 0
          ? weekReviews.reduce((s, r) => s + r.recallRating, 0) / reviewsDone
          : 0

        const hoursScore   = Math.min(100, (hoursLogged / 7) * 100)
        const notesScore   = Math.min(100, (notesCount / 7) * 100)
        const appliedScore = applied > 0 ? 100 : 0
        const reviewScore  = reviewsDone === 0
          ? 0
          : Math.min(100, (reviewsDone / 3) * 100) * (avgRecall >= 3 ? 1 : 0.5)

        learningScore = Math.round(
          hoursScore   * 0.35 +
          notesScore   * 0.20 +
          appliedScore * 0.15 +
          reviewScore  * 0.30
        )
      }

      // ── Goals — uses current goal progress as best approximation for past weeks
      const goalsScore = i === 0 ? goalsData.getWeekScore() : (() => {
        const activeGoals = goalsData.goals.filter(g => g.status === 'active')
        if (!activeGoals.length) return 0
        const avgProgress = activeGoals.reduce((acc, g) => acc + (g.progress || 0), 0) / activeGoals.length
        const allTasks    = activeGoals.flatMap(g => (g.milestones || []).flatMap(m => m.tasks || []))
        const taskCompletion = allTasks.length > 0
          ? (allTasks.filter(t => t.done).length / allTasks.length) * 100
          : 0
        const onTrack     = activeGoals.filter(g => (g.progress || 0) >= 50).length
        const onTrackRate = (onTrack / activeGoals.length) * 100
        return Math.min(100, Math.round(
          allTasks.length > 0
            ? avgProgress * 0.38 + onTrackRate * 0.28 + taskCompletion * 0.24
            : avgProgress * 0.5  + onTrackRate * 0.5
        ))
      })()

      const scores = {
        habits: habitsScore, weekly: weeklyScore, fitness: fitnessScore,
        mental: mentalScore, social: socialScore, learning: learningScore, goals: goalsScore,
      }

      const lifeScore = calcLifeScore(scores)
      const hasData   = Object.values(scores).some(s => s > 0)
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
