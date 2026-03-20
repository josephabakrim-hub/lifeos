import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, deleteField, doc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatDate } from '../lib/utils'

export function useMental() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'lo_mental_logs'), orderBy('date', 'desc')),
      snap => {
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      }
    )
    return unsub
  }, [])

  async function saveMorning(data) {
    const today = formatDate()
    const existing = logs.find(l => l.date === today)
    if (existing) {
      await updateDoc(doc(db, 'lo_mental_logs', existing.id), {
        morning: data,
        updatedAt: new Date().toISOString(),
      })
    } else {
      await addDoc(collection(db, 'lo_mental_logs'), {
        date: today,
        morning: data,
        createdAt: new Date().toISOString(),
      })
    }
  }

  async function saveEvening(data) {
    const today = formatDate()
    const existing = logs.find(l => l.date === today)
    if (existing) {
      await updateDoc(doc(db, 'lo_mental_logs', existing.id), {
        evening: data,
        updatedAt: new Date().toISOString(),
      })
    } else {
      await addDoc(collection(db, 'lo_mental_logs'), {
        date: today,
        evening: data,
        createdAt: new Date().toISOString(),
      })
    }
  }

  async function deleteLog(id, field) {
    if (field === 'morning' || field === 'evening') {
      await updateDoc(doc(db, 'lo_mental_logs', id), {
        [field]: deleteField(),
        updatedAt: new Date().toISOString(),
      })
    } else {
      await deleteDoc(doc(db, 'lo_mental_logs', id))
    }
  }

  function getTodayLog() {
    return logs.find(l => l.date === formatDate()) || null
  }

  function getWeekScore() {
    const today = new Date()
    const weekLogs = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = formatDate(d)
      const log = logs.find(l => l.date === dateStr)
      if (log) weekLogs.push(log)
    }
    if (!weekLogs.length) return 0

    const morningDone   = weekLogs.filter(l => l.morning).length
    const eveningDone   = weekLogs.filter(l => l.evening).length
    const meditationDays = weekLogs.filter(l => l.evening?.practices?.meditation).length
    const avgMood       = weekLogs.filter(l => l.morning?.mood).reduce((s, l) => s + l.morning.mood, 0) / Math.max(1, weekLogs.filter(l => l.morning?.mood).length)
    const avgStress     = weekLogs.filter(l => l.evening?.stress).reduce((s, l) => s + l.evening.stress, 0) / Math.max(1, weekLogs.filter(l => l.evening?.stress).length)
    const avgClarity    = weekLogs.filter(l => l.evening?.clarity).reduce((s, l) => s + l.evening.clarity, 0) / Math.max(1, weekLogs.filter(l => l.evening?.clarity).length)

    const morningScore    = (morningDone / 7) * 100
    const eveningScore    = (eveningDone / 7) * 100
    const meditationScore = (meditationDays / 7) * 100
    const moodScore       = ((avgMood || 3) / 5) * 100
    const stressScore     = avgStress ? (1 - ((avgStress - 1) / 4)) * 100 : 60  // lower stress = higher score
    const clarityScore    = ((avgClarity || 3) / 5) * 100

    return Math.round(
      morningScore * 0.20 +
      eveningScore * 0.20 +
      meditationScore * 0.15 +
      moodScore * 0.20 +
      stressScore * 0.10 +
      clarityScore * 0.15
    )
  }

  function getWeekStats() {
    const today = new Date()
    const weekLogs = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = formatDate(d)
      const log = logs.find(l => l.date === dateStr)
      weekLogs.push({ date: dateStr, log: log || null })
    }

    const withMorning = weekLogs.filter(w => w.log?.morning)
    const withEvening = weekLogs.filter(w => w.log?.evening)

    const avgMood    = withMorning.length ? Math.round((withMorning.reduce((s, w) => s + (w.log.morning.mood || 0), 0) / withMorning.length) * 10) / 10 : null
    const avgStress  = withEvening.length ? Math.round((withEvening.reduce((s, w) => s + (w.log.evening.stress || 0), 0) / withEvening.length) * 10) / 10 : null
    const avgClarity = withEvening.length ? Math.round((withEvening.reduce((s, w) => s + (w.log.evening.clarity || 0), 0) / withEvening.length) * 10) / 10 : null
    const meditationDays = weekLogs.filter(w => w.log?.evening?.practices?.meditation).length

    // Most common trigger
    const triggerCounts = {}
    weekLogs.forEach(w => {
      ;(w.log?.evening?.triggers || []).forEach(t => {
        if (t.trigger) triggerCounts[t.trigger] = (triggerCounts[t.trigger] || 0) + 1
      })
    })
    const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    return {
      morningDone: withMorning.length,
      eveningDone: withEvening.length,
      avgMood, avgStress, avgClarity,
      meditationDays,
      topTrigger,
      weekScore: getWeekScore(),
    }
  }

  function getLast30DaysData() {
    const result = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = formatDate(d)
      const log = logs.find(l => l.date === dateStr)
      result.push({
        date: dateStr,
        day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        morningMood: log?.morning?.mood || null,
        eveningMood: log?.evening?.mood || null,
        stress:      log?.evening?.stress || null,
        clarity:     log?.evening?.clarity || null,
      })
    }
    return result
  }

  return {
    logs, loading,
    saveMorning, saveEvening, deleteLog,
    getTodayLog, getWeekScore, getWeekStats, getLast30DaysData,
  }
}
