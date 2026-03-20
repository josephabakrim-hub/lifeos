import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatDate } from '../lib/utils'

export function useHabits() {
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
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
        habitId,
        date,
        done: true,
        createdAt: new Date().toISOString(),
      })
    }
  }

  function getTodayScore() {
    if (!habits.length) return 0
    const today = formatDate()
    const activeHabits = habits.filter(h => h.active)
    if (!activeHabits.length) return 0
    const done = activeHabits.filter(h =>
      logs.find(l => l.habitId === h.id && l.date === today && l.done)
    ).length
    return Math.round((done / activeHabits.length) * 100)
  }

  function getWeekScore() {
    if (!habits.length) return 0
    const activeHabits = habits.filter(h => h.active)
    if (!activeHabits.length) return 0
    let total = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const date = formatDate(d)
      const done = activeHabits.filter(h =>
        logs.find(l => l.habitId === h.id && l.date === date && l.done)
      ).length
      total += (done / activeHabits.length) * 100
    }
    return Math.round(total / 7)
  }

  return { habits, logs, loading, addHabit, updateHabit, deleteHabit, toggleHabitLog, getTodayScore, getWeekScore }
}
