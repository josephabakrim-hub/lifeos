import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatDate, getWeekStart } from '../lib/utils'

// Spaced repetition intervals in days based on recall rating 1–5
function nextInterval(currentInterval, recallRating) {
  if (recallRating <= 1) return 1
  if (recallRating === 2) return 3
  if (recallRating === 3) return Math.max(3, Math.round(currentInterval * 1.2))
  if (recallRating === 4) return Math.round(currentInterval * 2)
  return Math.round(currentInterval * 2.5)
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

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

  async function recordReview(id, recallRating) {
    const item = learnings.find(l => l.id === id)
    if (!item) return
    const today           = formatDate()
    const currentInterval = item.currentInterval || INITIAL_INTERVAL
    const newInterval     = nextInterval(currentInterval, recallRating)
    const newNextReview   = addDays(today, newInterval)

    await updateDoc(doc(db, 'lo_learnings', id), {
      nextReviewDate:   newNextReview,
      currentInterval:  newInterval,
      lastReviewDate:   today,
      lastRecallRating: recallRating,
      reviewHistory: [...(item.reviewHistory || []), {
        date: today,
        recallRating,
        intervalDays: newInterval,
      }],
      updatedAt: new Date().toISOString(),
    })
  }

  // Cancel or postpone a scheduled recall.
  // postponeDays = 0 → removes the review schedule entirely
  // postponeDays = 7 → pushes it 7 days from today
  async function cancelReview(id, postponeDays = 0) {
    const item = learnings.find(l => l.id === id)
    if (!item) return
    const today = formatDate()
    await updateDoc(doc(db, 'lo_learnings', id), {
      nextReviewDate: postponeDays > 0 ? addDays(today, postponeDays) : null,
      updatedAt: new Date().toISOString(),
    })
  }

  // Only sessions logged Mon–today of the current week
  function getWeekLearnings() {
    const weekStart = getWeekStart()
    const today = formatDate()
    return learnings.filter(l => l.date >= weekStart && l.date <= today)
  }

  // Items whose nextReviewDate is today or overdue (past dates only)
  function getDueForReview() {
    const today = formatDate()
    return learnings.filter(l => l.nextReviewDate && l.nextReviewDate <= today)
  }

  function getWeekScore() {
    const weekStart = getWeekStart()
    const today     = formatDate()
    const weekItems = getWeekLearnings()

    // Source of truth: reviewHistory entries with dates in this week only.
    // lastReviewDate is a document-level field that persists from previous weeks — never use it for scoring.
    // Future nextReviewDate entries are scheduled but not yet done — they must not contribute to the score.
    const weekReviews = learnings.flatMap(l =>
      (l.reviewHistory || []).filter(r => r.date >= weekStart && r.date <= today)
    )

    if (!weekItems.length && !weekReviews.length) return 0

    const hoursLogged = weekItems.reduce((acc, l) => acc + (l.duration || 0), 0)
    const notesCount  = weekItems.filter(l => l.takeaways?.length > 0).length
    const applied     = weekItems.filter(l => l.applied).length

    const reviewsDoneThisWeek = weekReviews.length
    const avgRecall = reviewsDoneThisWeek > 0
      ? weekReviews.reduce((s, r) => s + r.recallRating, 0) / reviewsDoneThisWeek
      : 0

    const hoursScore   = Math.min(100, (hoursLogged / 7) * 100)
    const notesScore   = Math.min(100, (notesCount / 7) * 100)
    const appliedScore = applied > 0 ? 100 : 0

    // Explicitly 0 if nothing reviewed this week — future scheduled reviews don't count
    const reviewScore = reviewsDoneThisWeek === 0
      ? 0
      : Math.min(100, (reviewsDoneThisWeek / 3) * 100) * (avgRecall >= 3 ? 1 : 0.5)

    return Math.round(
      hoursScore   * 0.35 +
      notesScore   * 0.20 +
      appliedScore * 0.15 +
      reviewScore  * 0.30
    )
  }

  // Accurate weekly review count for display — uses reviewHistory, not lastReviewDate
  function getWeekReviewCount() {
    const weekStart = getWeekStart()
    const today     = formatDate()
    return learnings.flatMap(l =>
      (l.reviewHistory || []).filter(r => r.date >= weekStart && r.date <= today)
    ).length
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
    recordReview, cancelReview,
    getWeekLearnings, getDueForReview, getWeekScore, getWeekReviewCount, getTopicBreakdown,
  }
}
