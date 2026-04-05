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
    const progress = calcProgressFromMilestones(milestones)
    await updateDoc(doc(db, 'lo_goals', goalId), { milestones, progress, updatedAt: new Date().toISOString() })
  }

  // ── Task operations ──────────────────────────────────────────────────────────

  // Add a task to a specific milestone
  async function addTask(goalId, milestoneIndex, task) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const milestones = [...(goal.milestones || [])]
    const tasks = [...(milestones[milestoneIndex].tasks || [])]
    tasks.push({
      id: Date.now().toString(),
      text: task.text,
      intention: task.intention || '', // "When X, I will Y" — implementation intention
      isNextAction: false,
      done: false,
      createdAt: new Date().toISOString(),
    })
    milestones[milestoneIndex] = { ...milestones[milestoneIndex], tasks }
    const progress = calcProgressFromMilestones(milestones)
    await updateDoc(doc(db, 'lo_goals', goalId), { milestones, progress, updatedAt: new Date().toISOString() })
  }

  // Toggle a task done/undone — also auto-checks milestone if all tasks done
  async function toggleTask(goalId, milestoneIndex, taskId) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const milestones = [...(goal.milestones || [])]
    const tasks = [...(milestones[milestoneIndex].tasks || [])].map(t =>
      t.id === taskId
        ? { ...t, done: !t.done, completedAt: !t.done ? formatDate() : null }
        : t
    )
    // Auto-complete milestone when all tasks are done
    const allDone = tasks.length > 0 && tasks.every(t => t.done)
    milestones[milestoneIndex] = {
      ...milestones[milestoneIndex],
      tasks,
      done: allDone || milestones[milestoneIndex].done,
      completedAt: allDone && !milestones[milestoneIndex].done ? formatDate() : milestones[milestoneIndex].completedAt,
    }
    const progress = calcProgressFromMilestones(milestones)
    await updateDoc(doc(db, 'lo_goals', goalId), { milestones, progress, updatedAt: new Date().toISOString() })
  }

  // Delete a task
  async function deleteTask(goalId, milestoneIndex, taskId) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const milestones = [...(goal.milestones || [])]
    const tasks = (milestones[milestoneIndex].tasks || []).filter(t => t.id !== taskId)
    milestones[milestoneIndex] = { ...milestones[milestoneIndex], tasks }
    const progress = calcProgressFromMilestones(milestones)
    await updateDoc(doc(db, 'lo_goals', goalId), { milestones, progress, updatedAt: new Date().toISOString() })
  }

  // Set ONE next action — clears all others for this goal first
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

  // ── Legacy ONE Thing ─────────────────────────────────────────────────────────

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
    const activeGoals = goals.filter(g => g.status === 'active')
    if (!activeGoals.length) return 0

    const avgProgress = activeGoals.reduce((acc, g) => acc + (g.progress || 0), 0) / activeGoals.length

    // Factor in task completion rate across all goals
    const allTasks = activeGoals.flatMap(g =>
      (g.milestones || []).flatMap(m => m.tasks || [])
    )
    const taskCompletionRate = allTasks.length > 0
      ? (allTasks.filter(t => t.done).length / allTasks.length) * 100
      : 0

    // Factor in whether any next actions are set (good planning signal)
    const hasNextActions = activeGoals.some(g =>
      (g.milestones || []).some(m => (m.tasks || []).some(t => t.isNextAction && !t.done))
    )
    const planningBonus = hasNextActions ? 5 : 0

    const onTrack = activeGoals.filter(g => (g.progress || 0) >= 50).length
    const onTrackRate = (onTrack / activeGoals.length) * 100

    // Blend: progress 40% + on-track 30% + task completion 25% + planning bonus 5%
    const base = allTasks.length > 0
      ? Math.round(avgProgress * 0.40 + onTrackRate * 0.30 + taskCompletionRate * 0.25 + planningBonus)
      : Math.round(avgProgress * 0.5 + onTrackRate * 0.5)

    return Math.min(100, base)
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  // Progress = blend of milestone completion + task completion
  function calcProgressFromMilestones(milestones) {
    if (!milestones.length) return 0
    const milestoneScore = milestones.filter(m => m.done).length / milestones.length

    const allTasks = milestones.flatMap(m => m.tasks || [])
    if (!allTasks.length) return Math.round(milestoneScore * 100)

    const taskScore = allTasks.filter(t => t.done).length / allTasks.length
    // Weight: milestones 60%, tasks 40%
    return Math.round((milestoneScore * 0.6 + taskScore * 0.4) * 100)
  }

  // Get all next actions across all goals — for Focus Mode
  function getNextActions() {
    return goals
      .filter(g => g.status === 'active')
      .flatMap(g =>
        (g.milestones || []).flatMap((m, mi) =>
          (m.tasks || [])
            .filter(t => t.isNextAction && !t.done)
            .map(t => ({
              ...t,
              goalId: g.id,
              goalTitle: g.title,
              goalCategory: g.category,
              milestoneIndex: mi,
              milestoneText: m.text,
            }))
        )
      )
  }

  return {
    goals, loading,
    addGoal, updateGoal, deleteGoal,
    toggleMilestone,
    addTask, toggleTask, deleteTask, setNextAction,
    logDailyOneThing,
    getWeekScore,
    getNextActions,
  }
}
