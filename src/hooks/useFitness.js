import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatDate, getWeekStart } from '../lib/utils'

export function useFitness() {
  const [workouts, setWorkouts] = useState([])
  const [metrics,  setMetrics]  = useState([])
  const [foodLogs, setFoodLogs] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const unsubW = onSnapshot(
      query(collection(db, 'lo_workouts'), orderBy('date', 'desc')),
      snap => { setWorkouts(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) }
    )
    const unsubM = onSnapshot(
      query(collection(db, 'lo_body_metrics'), orderBy('date', 'desc')),
      snap => setMetrics(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    const unsubF = onSnapshot(
      query(collection(db, 'lo_food_logs'), orderBy('date', 'desc')),
      snap => setFoodLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return () => { unsubW(); unsubM(); unsubF() }
  }, [])

  async function logWorkout(workout) {
    await addDoc(collection(db, 'lo_workouts'), {
      ...workout,
      date: workout.date || formatDate(),
      createdAt: new Date().toISOString(),
    })
  }

  async function updateWorkout(id, data) {
    await updateDoc(doc(db, 'lo_workouts', id), { ...data, updatedAt: new Date().toISOString() })
  }

  async function deleteWorkout(id) {
    await deleteDoc(doc(db, 'lo_workouts', id))
  }

  async function logMetrics(data) {
    const today    = formatDate()
    const existing = metrics.find(m => m.date === today)
    if (existing) {
      await updateDoc(doc(db, 'lo_body_metrics', existing.id), { ...data, updatedAt: new Date().toISOString() })
    } else {
      await addDoc(collection(db, 'lo_body_metrics'), { ...data, date: today, createdAt: new Date().toISOString() })
    }
  }

  async function logFood(entry) {
    await addDoc(collection(db, 'lo_food_logs'), {
      ...entry,
      date: entry.date || formatDate(),
      createdAt: new Date().toISOString(),
    })
  }

  async function updateFood(id, data) {
    await updateDoc(doc(db, 'lo_food_logs', id), { ...data, updatedAt: new Date().toISOString() })
  }

  async function deleteFood(id) {
    await deleteDoc(doc(db, 'lo_food_logs', id))
  }

  function getWeekWorkouts() {
    const weekStart = getWeekStart()
    return workouts.filter(w => w.date >= weekStart)
  }

  function getWeekScore() {
    const ww        = getWeekWorkouts()
    const weekStart = getWeekStart()

    // Return 0 if absolutely nothing logged this week
    const weekMetrics = metrics.filter(m => m.date >= weekStart)
    if (!ww.length && !weekMetrics.length) return 0

    // ── Fix 1: Resistance ────────────────────────────────────────────────────
    // Pure resistance training counts fully (target: 3/week)
    // Calisthenics (pull-ups, push-ups, dips, sit-ups) counts as 0.5 resistance each
    const resistanceFull  = ww.filter(w => w.type === 'resistance').length
    const calisthenicsHalf = ww.filter(w => ['pullups','pushups','dips','situps'].includes(w.type)).length * 0.5
    const resistance      = resistanceFull + calisthenicsHalf
    const resScore        = Math.min(100, (resistance / 3) * 100)

    // ── Fix 2: Zone 2 / Cardio ───────────────────────────────────────────────
    // Zone 2 cardio counts fully (target: 135 min/week)
    // HIIT counts as Zone 2 equivalent (Huberman: HIIT can substitute Zone 2)
    // Jogging counts as Zone 2 (it IS Zone 2 for most people)
    // Walk counts at 50% (lower intensity, still aerobic benefit)
    const zone2Mins = ww.reduce((acc, w) => {
      if (['zone2', 'hiit', 'jogging'].includes(w.type)) return acc + (w.duration || 0)
      if (w.type === 'walk')                              return acc + (w.duration || 0) * 0.5
      return acc
    }, 0)
    const zone2Score = Math.min(100, (zone2Mins / 135) * 100)

    // ── Fix 3: Sleep — weekly average, not just today ────────────────────────
    // Average all sleep entries logged this week, not just today's
    // If none logged yet, sleep doesn't zero the score — it's excluded
    const sleepEntries = weekMetrics.filter(m => m.sleep)
    const avgSleep     = sleepEntries.length
      ? sleepEntries.reduce((a, m) => a + m.sleep, 0) / sleepEntries.length
      : null
    const sleepScore   = avgSleep !== null ? Math.min(100, (avgSleep / 7.5) * 100) : 0

    // ── Weighted score ───────────────────────────────────────────────────────
    // If sleep hasn't been logged at all this week, redistribute its weight
    // so partial weeks aren't unfairly penalised
    if (avgSleep === null) {
      return Math.round(resScore * 0.5 + zone2Score * 0.5)
    }
    return Math.round(resScore * 0.35 + zone2Score * 0.35 + sleepScore * 0.3)
  }

  // ── Fix 4: Expose week breakdown for the gap report ─────────────────────────
  // Returns the raw components so IdealJosephView can give specific catch-up advice
  function getWeekScoreBreakdown() {
    const ww        = getWeekWorkouts()
    const weekStart = getWeekStart()
    const weekMetrics = metrics.filter(m => m.date >= weekStart)

    const resistanceFull   = ww.filter(w => w.type === 'resistance').length
    const calisthenicsHalf = ww.filter(w => ['pullups','pushups','dips','situps'].includes(w.type)).length * 0.5
    const resistance       = resistanceFull + calisthenicsHalf

    const zone2Mins = ww.reduce((acc, w) => {
      if (['zone2', 'hiit', 'jogging'].includes(w.type)) return acc + (w.duration || 0)
      if (w.type === 'walk')                              return acc + (w.duration || 0) * 0.5
      return acc
    }, 0)

    const sleepEntries = weekMetrics.filter(m => m.sleep)
    const avgSleep     = sleepEntries.length
      ? sleepEntries.reduce((a, m) => a + m.sleep, 0) / sleepEntries.length
      : null

    return {
      resistance,          // effective resistance sessions this week
      resistanceFull,      // pure resistance sessions
      calisthenicsHalf,    // calisthenics contribution
      zone2Mins,           // effective Zone 2 minutes
      avgSleep,            // average sleep hours logged this week (null if none)
      sleepDaysLogged: sleepEntries.length,
    }
  }

  function getLatestWeight() {
    return metrics.find(m => m.weight)?.weight || null
  }

  return {
    workouts, metrics, foodLogs, loading,
    logWorkout, updateWorkout, deleteWorkout,
    logMetrics,
    logFood, updateFood, deleteFood,
    getWeekWorkouts, getWeekScore, getWeekScoreBreakdown, getLatestWeight,
  }
}
