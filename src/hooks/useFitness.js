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
    const ww = getWeekWorkouts()
    // Return 0 immediately if nothing has been logged this week
    if (!ww.length && !metrics.length) return 0

    const resistance  = ww.filter(w => w.type === 'resistance').length
    const zone2Mins   = ww.filter(w => w.type === 'zone2').reduce((acc, w) => acc + (w.duration || 0), 0)
    const todayM      = metrics.find(m => m.date === formatDate())
    // Only count sleep if it was actually logged — no phantom 50 default
    const sleepScore  = todayM?.sleep ? Math.min(100, (todayM.sleep / 7.5) * 100) : 0
    const resScore    = Math.min(100, (resistance / 3) * 100)
    const zone2Score  = Math.min(100, (zone2Mins / 135) * 100)
    return Math.round(resScore * 0.35 + zone2Score * 0.35 + sleepScore * 0.3)
  }

  function getLatestWeight() {
    return metrics.find(m => m.weight)?.weight || null
  }

  return {
    workouts, metrics, foodLogs, loading,
    logWorkout, updateWorkout, deleteWorkout,
    logMetrics,
    logFood, updateFood, deleteFood,
    getWeekWorkouts, getWeekScore, getLatestWeight,
  }
}
