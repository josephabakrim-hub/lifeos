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

  // ── Goal CRUD ────────────────────────────────────────────────────────────────

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

  // ── Milestones ───────────────────────────────────────────────────────────────

  async function toggleMilestone(goalId, milestoneIndex) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const milestones = [...(goal.milestones || [])]
    milestones[milestoneIndex] = {
      ...milestones[milestoneIndex],
      done: !milestones[milestoneIndex].done,
      completedAt: !milestones[milestoneIndex].done ? formatDate() : null,
    }
    const progress = calcProgress(milestones)
    await updateDoc(doc(db, 'lo_goals', goalId), { milestones, progress, updatedAt: new Date().toISOString() })
  }

  // ── Tasks ────────────────────────────────────────────────────────────────────

  async function addTask(goalId, milestoneIndex, task) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const milestones = [...(goal.milestones || [])]
    const tasks = [...(milestones[milestoneIndex].tasks || [])]
    tasks.push({
      id: Date.now().toString(),
      text:          task.text,
      intention:     task.intention     || '',   // "When X, I will Y" — implementation intention
      envCue:        task.envCue        || '',   // where will you see the reminder?
      twoMinVersion: task.twoMinVersion || '',   // 2-minute starter to beat resistance
      isNextAction:  false,
      done:          false,
      createdAt:     new Date().toISOString(),
    })
    milestones[milestoneIndex] = { ...milestones[milestoneIndex], tasks }
    const progress = calcProgress(milestones)
    await updateDoc(doc(db, 'lo_goals', goalId), { milestones, progress, updatedAt: new Date().toISOString() })
  }

  async function toggleTask(goalId, milestoneIndex, taskId) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const milestones = [...(goal.milestones || [])]
    const tasks = [...(milestones[milestoneIndex].tasks || [])].map(t =>
      t.id === taskId
        ? { ...t, done: !t.done, completedAt: !t.done ? formatDate() : null }
        : t
    )
    // Auto-complete milestone when all tasks done
    const allDone = tasks.length > 0 && tasks.every(t => t.done)
    milestones[milestoneIndex] = {
      ...milestones[milestoneIndex],
      tasks,
      done: allDone || milestones[milestoneIndex].done,
      completedAt: allDone && !milestones[milestoneIndex].done ? formatDate() : milestones[milestoneIndex].completedAt,
    }
    const progress = calcProgress(milestones)
    await updateDoc(doc(db, 'lo_goals', goalId), { milestones, progress, updatedAt: new Date().toISOString() })
  }

  async function deleteTask(goalId, milestoneIndex, taskId) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const milestones = [...(goal.milestones || [])]
    const tasks = (milestones[milestoneIndex].tasks || []).filter(t => t.id !== taskId)
    milestones[milestoneIndex] = { ...milestones[milestoneIndex], tasks }
    const progress = calcProgress(milestones)
    await updateDoc(doc(db, 'lo_goals', goalId), { milestones, progress, updatedAt: new Date().toISOString() })
  }

  // Set ⚡ next action — only one per goal at a time
  async function setNextAction(goalId, milestoneIndex, taskId) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const milestones = (goal.milestones || []).map((m, mi) => ({
      ...m,
      tasks: (m.tasks || []).map(t => ({
        ...t,
        isNextAction: mi === milestoneIndex && t.id === taskId ? !t.isNextAction : false,
      }))
    }))
    await updateDoc(doc(db, 'lo_goals', goalId), { milestones, updatedAt: new Date().toISOString() })
  }

  // ── ONE Thing (legacy, kept) ─────────────────────────────────────────────────

  async function logDailyOneThing(goalId, text) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const oneThing = [...(goal.oneThing || [])]
    oneThing.unshift({ date: formatDate(), text, createdAt: new Date().toISOString() })
    await updateDoc(doc(db, 'lo_goals', goalId), { oneThing })
  }

  // ── Scoring ──────────────────────────────────────────────────────────────────

  function getWeekScore() {
    if (!goals.length) return 0
    const active = goals.filter(g => g.status === 'active')
    if (!active.length) return 0

    const avgProgress = active.reduce((acc, g) => acc + (g.progress || 0), 0) / active.length

    const allTasks = active.flatMap(g => (g.milestones || []).flatMap(m => m.tasks || []))
    const taskCompletionRate = allTasks.length > 0
      ? (allTasks.filter(t => t.done).length / allTasks.length) * 100
      : 0

    // Planning quality signals
    const hasNextActions = active.some(g => (g.milestones || []).some(m => (m.tasks || []).some(t => t.isNextAction && !t.done)))
    const wOOPCount = active.filter(g => g.woop?.wish).length
    const planningBonus = (hasNextActions ? 4 : 0) + Math.min(6, wOOPCount * 2)

    const onTrack = active.filter(g => (g.progress || 0) >= 50).length
    const onTrackRate = (onTrack / active.length) * 100

    const base = allTasks.length > 0
      ? avgProgress * 0.38 + onTrackRate * 0.28 + taskCompletionRate * 0.24 + planningBonus
      : avgProgress * 0.5 + onTrackRate * 0.5

    return Math.min(100, Math.round(base))
  }

  // ── Derived helpers ──────────────────────────────────────────────────────────

  // Progress = milestone completion (60%) + task completion (40%)
  function calcProgress(milestones) {
    if (!milestones.length) return 0
    const mScore = milestones.filter(m => m.done).length / milestones.length
    const allTasks = milestones.flatMap(m => m.tasks || [])
    if (!allTasks.length) return Math.round(mScore * 100)
    const tScore = allTasks.filter(t => t.done).length / allTasks.length
    return Math.round((mScore * 0.6 + tScore * 0.4) * 100)
  }

  // Get all ⚡ next actions across all active goals — for Focus Mode
  function getNextActions() {
    return goals
      .filter(g => g.status === 'active')
      .flatMap(g =>
        (g.milestones || []).flatMap((m, mi) =>
          (m.tasks || [])
            .filter(t => t.isNextAction && !t.done)
            .map(t => ({
              ...t,
              goalId:        g.id,
              goalTitle:     g.title,
              goalCategory:  g.category,
              milestoneIndex: mi,
              milestoneText:  m.text,
            }))
        )
      )
  }

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleMilestone,
    addTask,
    toggleTask,
    deleteTask,
    setNextAction,
    logDailyOneThing,
    getWeekScore,
    getNextActions,
  }
}
