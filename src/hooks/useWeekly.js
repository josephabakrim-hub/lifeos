import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { getWeekStart } from '../lib/utils'

export function useWeekly() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'lo_weekly_plans'), orderBy('weekStart', 'desc')),
      snap => {
        setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      }
    )
    return unsub
  }, [])

  function getCurrentPlan() {
    const weekStart = getWeekStart()
    return plans.find(p => p.weekStart === weekStart) || null
  }

  async function savePlan(planData) {
    const weekStart = getWeekStart()
    const existing = plans.find(p => p.weekStart === weekStart)
    if (existing) {
      await updateDoc(doc(db, 'lo_weekly_plans', existing.id), { ...planData, weekStart, updatedAt: new Date().toISOString() })
    } else {
      await addDoc(collection(db, 'lo_weekly_plans'), {
        ...planData,
        weekStart,
        createdAt: new Date().toISOString(),
      })
    }
  }

  async function updatePlan(id, updates) {
    await updateDoc(doc(db, 'lo_weekly_plans', id), { ...updates, updatedAt: new Date().toISOString() })
  }

  async function deletePlan(id) {
    await deleteDoc(doc(db, 'lo_weekly_plans', id))
  }

  // Save a plan for any arbitrary week (used when filling in past weeks from history)
  async function savePlanForWeek(weekStart, planData) {
    const existing = plans.find(p => p.weekStart === weekStart)
    if (existing) {
      await updateDoc(doc(db, 'lo_weekly_plans', existing.id), { ...planData, weekStart, updatedAt: new Date().toISOString() })
    } else {
      await addDoc(collection(db, 'lo_weekly_plans'), { ...planData, weekStart, createdAt: new Date().toISOString() })
    }
  }

  function getWeekScore() {
    const plan = getCurrentPlan()
    if (!plan) return 0
    const goals = plan.goals || []
    if (!goals.length) return 0
    const done = goals.filter(g => g.done).length
    const executionScore = Math.round((done / goals.length) * 100)
    const sundayDone = plan.sundayReviewDone ?? plan.sundayPlanDone ?? false
    const mondayDone = plan.mondayPlanDone   ?? plan.fridayReviewDone ?? false
    const reviewBonus = (sundayDone ? 10 : 0) + (mondayDone ? 10 : 0)
    return Math.min(100, Math.round(executionScore * 0.8 + reviewBonus))
  }

  return { plans, loading, getCurrentPlan, savePlan, savePlanForWeek, updatePlan, deletePlan, getWeekScore }
}
