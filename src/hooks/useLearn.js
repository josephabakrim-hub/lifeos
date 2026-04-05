import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatDate, getWeekStart } from '../lib/utils'

// Spaced repetition intervals in days based on recall rating 1–5
// Lower recall → shorter interval (review sooner), higher → longer
function nextInterval(currentInterval, recallRating) {
  if (recallRating <= 1) return 1          // Blanked — review tomorrow
  if (recallRating === 2) return 3         // Weak — review in 3 days
  if (recallRating === 3) return Math.max(3, Math.round(currentInterval * 1.2))  // Okay
  if (recallRating === 4) return Math.round(currentInterval * 2)                  // Good
  return Math.round(currentInterval * 2.5) // Perfect — space it out
}

// Compute next review date string from today + interval days
function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Initial interval after first log: 3 days
const INITIAL_INTERVAL = 3

export function useLearn() {
  const [learnings, setLearnings] = useState([])
  const [loading, setLoading]     = useState(true)

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
    const today = item.date || formatDate()
    await addDoc(collection(db, 'lo_learnings'), {
      ...item,
      date: today,
      // Auto-schedule first review 3 days from now
      nextReviewDate: addDays(today, INITIAL_INTERVAL),
      currentInterval: INITIAL_INTERVAL,
      reviewHistory: [],
      createdAt: new Date().toISOString(),
    })
  }

  async function updateLearning(id, updates) {
    await updateDoc(doc(db, 'lo_learnings', id), updates)
  }

  async function deleteLearning(id) {
    await deleteDoc(doc(db, 'lo_learnings', id))
  }

  // Called when user does a spaced repetition review with a recall rating 1–5
  async function recordReview(id, recallRating) {
    const item = learnings.find(l => l.id === id)
    if (!item) return
    const today           = formatDate()
    const currentInterval = item.currentInterval || INITIAL_INTERVAL
    const newInterval     = nextInterval(currentInterval, recallRating)
    const newNextReview   = addDays(today, newInterval)

    const reviewEntry = {
      date: today,
      recallRating,
      intervalDays: newInterval,
    }

    await updateDoc(doc(db, 'lo_learnings', id), {
      nextReviewDate:   newNextReview,
      currentInterval:  newInterval,
      lastReviewDate:   today,
      lastRecallRating: recallRating,
      reviewHistory: [...(item.reviewHistory || []), reviewEntry],
      updatedAt: new Date().toISOString(),
    })
  }

  // Only sessions logged within the current Mon–Sun week, up to today
  function getWeekLearnings() {
    const weekStart = getWeekStart()
    const today = formatDate()
    return learnings.filter(l => l.date >= weekStart && l.date <= today)
  }

  // Items whose nextReviewDate is today or overdue
  function getDueForReview() {
    const today = formatDate()
    return learnings.filter(l => l.nextReviewDate && l.nextReviewDate <= today)
  }

  function getWeekScore() {
    const weekStart  = getWeekStart()
    const today      = formatDate()
    const weekItems  = getWeekLearnings()

    // Return 0 immediately if nothing logged or reviewed this week
    const weekReviews = learnings.flatMap(l =>
      (l.reviewHistory || []).filter(r => r.date >= weekStart && r.date <= today)
    )
    if (!weekItems.length && !weekReviews.length) return 0

    const hoursLogged = weekItems.reduce((acc, l) => acc + (l.duration || 0), 0)
    const notesCount  = weekItems.filter(l => l.takeaways?.length > 0).length
    const applied     = weekItems.filter(l => l.applied).length

    // Only count reviews that happened strictly within this week window
    const reviewsDoneThisWeek = weekReviews.length

    // Avg recall — only meaningful if reviews actually happened this week
    const avgRecall = weekReviews.length
      ? weekReviews.reduce((s, r) => s + r.recallRating, 0) / weekReviews.length
      : 0

    const hoursScore   = Math.min(100, (hoursLogged / 7) * 100)
    const notesScore   = Math.min(100, (notesCount / 7) * 100)
    const appliedScore = applied > 0 ? 100 : 0

    // reviewScore is 0 if no reviews done this week — avgRecall=0 kills it entirely
    const reviewScore = reviewsDoneThisWeek === 0
      ? 0
      : Math.min(100, (reviewsDoneThisWeek / 3) * 100) * (avgRecall >= 3 ? 1 : 0.5)

    // hours 35%, notes 20%, applied 15%, reviews 30%
    return Math.round(
      hoursScore   * 0.35 +
      notesScore   * 0.20 +
      appliedScore * 0.15 +
      reviewScore  * 0.30
    )
  }

  function getTopicBreakdown() {
    const topics = {}
    learnings.forEach(l => {
      const t = l.topic || 'other'
      topics[t] = (topics[t] || 0) + 1
    })
    return topics
  }

  return {
    learnings, loading,
    addLearning, updateLearning, deleteLearning,
    recordReview,
    getWeekLearnings, getDueForReview, getWeekScore, getTopicBreakdown,
  }
}
