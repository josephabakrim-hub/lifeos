import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatDate } from '../lib/utils'

export function useGoals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'lo_goals'), orderBy('createdAt', 'desc')),
      snap => {
        setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      }
    )
    return unsub
  }, [])

  async function addGoal(goal) {
    await addDoc(collection(db, 'lo_goals'), {
      ...goal,
      progress: 0,
      milestones: goal.milestones || [],
      status: 'active',
      createdAt: new Date().toISOString(),
    })
  }

  async function updateGoal(id, updates) {
    await updateDoc(doc(db, 'lo_goals', id), { ...updates, updatedAt: new Date().toISOString() })
  }

  async function deleteGoal(id) {
    await deleteDoc(doc(db, 'lo_goals', id))
  }

  async function toggleMilestone(goalId, milestoneIndex) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const milestones = [...(goal.milestones || [])]
    milestones[milestoneIndex] = {
      ...milestones[milestoneIndex],
      done: !milestones[milestoneIndex].done,
      completedAt: !milestones[milestoneIndex].done ? formatDate() : null,
    }
    const progress = Math.round((milestones.filter(m => m.done).length / milestones.length) * 100)
    await updateDoc(doc(db, 'lo_goals', goalId), { milestones, progress, updatedAt: new Date().toISOString() })
  }

  async function logDailyOneThing(goalId, text) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const oneThing = [...(goal.oneThing || [])]
    oneThing.unshift({ date: formatDate(), text, createdAt: new Date().toISOString() })
    await updateDoc(doc(db, 'lo_goals', goalId), { oneThing })
  }

  function getWeekScore() {
    if (!goals.length) return 0
    const activeGoals = goals.filter(g => g.status === 'active')
    if (!activeGoals.length) return 0
    const avgProgress = activeGoals.reduce((acc, g) => acc + (g.progress || 0), 0) / activeGoals.length
    const onTrack = activeGoals.filter(g => (g.progress || 0) >= 50).length
    const onTrackRate = (onTrack / activeGoals.length) * 100
    return Math.round(avgProgress * 0.5 + onTrackRate * 0.5)
  }

  return { goals, loading, addGoal, updateGoal, deleteGoal, toggleMilestone, logDailyOneThing, getWeekScore }
}
