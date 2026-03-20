import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatDate, getWeekStart } from '../lib/utils'

export function useLearn() {
  const [learnings, setLearnings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'lo_learnings'), orderBy('date', 'desc')),
      snap => {
        setLearnings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      }
    )
    return unsub
  }, [])

  async function addLearning(item) {
    await addDoc(collection(db, 'lo_learnings'), {
      ...item,
      date: item.date || formatDate(),
      createdAt: new Date().toISOString(),
    })
  }

  async function updateLearning(id, updates) {
    await updateDoc(doc(db, 'lo_learnings', id), updates)
  }

  async function deleteLearning(id) {
    await deleteDoc(doc(db, 'lo_learnings', id))
  }

  function getWeekLearnings() {
    const weekStart = getWeekStart()
    return learnings.filter(l => l.date >= weekStart)
  }

  function getWeekScore() {
    const weekItems = getWeekLearnings()
    const hoursLogged = weekItems.reduce((acc, l) => acc + (l.duration || 0), 0)
    const notesCount = weekItems.filter(l => l.takeaways?.length > 0).length
    const applied = weekItems.filter(l => l.applied).length
    const hoursScore = Math.min(100, (hoursLogged / 7) * 100)
    const notesScore = Math.min(100, (notesCount / 7) * 100)
    const appliedScore = applied > 0 ? 100 : 0
    return Math.round(hoursScore * 0.5 + notesScore * 0.3 + appliedScore * 0.2)
  }

  function getTopicBreakdown() {
    const topics = {}
    learnings.forEach(l => {
      const t = l.topic || 'other'
      topics[t] = (topics[t] || 0) + 1
    })
    return topics
  }

  return { learnings, loading, addLearning, updateLearning, deleteLearning, getWeekLearnings, getWeekScore, getTopicBreakdown }
}
