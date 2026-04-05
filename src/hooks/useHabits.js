import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatDate, getWeekStart } from '../lib/utils'

// Returns true if a habit is scheduled on the given dateStr
// scheduledDays is an array of day numbers [0=Sun..6=Sat], default all days if absent
export function isHabitScheduledOn(habit, dateStr) {
  const days = habit.scheduledDays
  if (!days || days.length === 0) return true
  const dow = new Date(dateStr + 'T12:00:00').getDay()
  return days.includes(dow)
}

export function useHabits() {
  const [habits,  setHabits]  = useState([])
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubHabits = onSnapshot(
      query(collection(db, 'lo_habits'), orderBy('createdAt', 'asc')),
      snap => {
        setHabits(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      }
    )
    const unsubLogs = onSnapshot(
      query(collection(db, 'lo_habit_logs'), orderBy('date', 'desc')),
      snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return () => { unsubHabits(); unsubLogs() }
  }, [])

  async function addHabit(habit) {
    await addDoc(collection(db, 'lo_habits'), {
      ...habit,
      scheduledDays: habit.scheduledDays ?? [0, 1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
      active: true,
    })
  }

  async function updateHabit(id, updates) {
    await updateDoc(doc(db, 'lo_habits', id), updates)
  }

  async function deleteHabit(id) {
    await deleteDoc(doc(db, 'lo_habits', id))
  }

  async function toggleHabitLog(habitId, date = formatDate()) {
    const existing = logs.find(l => l.habitId === habitId && l.date === date)
    if (existing) {
      await updateDoc(doc(db, 'lo_habit_logs', existing.id), { done: !existing.done })
    } else {
      await addDoc(collection(db, 'lo_habit_logs'), {
        habitId, date, done: true,
        createdAt: new Date().toISOString(),
      })
    }
  }

  // Score for today — only counts habits scheduled today
  function getTodayScore() {
    const today = formatDate()
    const activeHabits = habits.filter(h => h.active && !h.mastered)
    const scheduledToday = activeHabits.filter(h => isHabitScheduledOn(h, today))
    if (!scheduledToday.length) return 0
    const done = scheduledToday.filter(h =>
      logs.find(l => l.habitId === h.id && l.date === today && l.done)
    ).length
    return Math.round((done / scheduledToday.length) * 100)
  }

  // Week score — only counts days from Monday of the current week up to today
  function getWeekScore() {
    const activeHabits = habits.filter(h => h.active && !h.mastered)
    if (!activeHabits.length) return 0

    const weekStart = getWeekStart()
    const today = formatDate()
    let totalScore = 0
    let countedDays = 0

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart + 'T12:00:00')
      d.setDate(d.getDate() + i)
      const date = formatDate(d)
      if (date > today) break // don't count future days

      const scheduledThatDay = activeHabits.filter(h => isHabitScheduledOn(h, date))
      if (!scheduledThatDay.length) continue

      const done = scheduledThatDay.filter(h =>
        logs.find(l => l.habitId === h.id && l.date === date && l.done)
      ).length
      totalScore += (done / scheduledThatDay.length) * 100
      countedDays++
    }

    return countedDays > 0 ? Math.round(totalScore / countedDays) : 0
  }

  return {
    habits, logs, loading,
    addHabit, updateHabit, deleteHabit, toggleHabitLog,
    getTodayScore, getWeekScore,
  }
}
