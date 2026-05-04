import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatDate, getWeekStart } from '../lib/utils'

// Book extract scoring weight vs a real read session (0.8 = 80%)
export const BOOK_EXTRACT_WEIGHT = 0.8

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

  async function addBookExtract(extractData) {
    // extractData: { bookTitle, author, topic, cards: [{id, type, front, back}] }
    const today = formatDate()
    const cards = extractData.cards.map((card, idx) => ({
      ...card,
      nextReviewDate: addDays(today, INITIAL_INTERVAL + idx), // stagger initial reviews
      currentInterval: INITIAL_INTERVAL,
      reviewHistory: [],
      lastRecallRating: null,
    }))
    await addDoc(collection(db, 'lo_learnings'), {
      type: 'book_extract',
      title: `${extractData.bookTitle} — Book Extract`,
      bookTitle: extractData.bookTitle,
      author: extractData.author,
      topic: extractData.topic || 'Personal growth',
      cards,
      date: today,
      // No single nextReviewDate — cards have individual schedules
      nextReviewDate: null,
      currentInterval: null,
      reviewHistory: [],
      createdAt: new Date().toISOString(),
      extractWeight: BOOK_EXTRACT_WEIGHT,
    })
  }

  async function recordCardReview(extractId, cardId, recallRating) {
    const extract = learnings.find(l => l.id === extractId)
    if (!extract || !extract.cards) return
    const today = formatDate()
    const updatedCards = extract.cards.map(card => {
      if (card.id !== cardId) return card
      const currentInterval = card.currentInterval || INITIAL_INTERVAL
      const newInterval     = nextInterval(currentInterval, recallRating)
      return {
        ...card,
        nextReviewDate:   addDays(today, newInterval),
        currentInterval:  newInterval,
        lastReviewDate:   today,
        lastRecallRating: recallRating,
        reviewHistory: [...(card.reviewHistory || []), {
          date: today, recallRating, intervalDays: newInterval,
        }],
      }
    })
    await updateDoc(doc(db, 'lo_learnings', extractId), {
      cards: updatedCards,
      updatedAt: new Date().toISOString(),
    })
  }

  async function postponeCard(extractId, cardId, postponeDays = 0) {
    const extract = learnings.find(l => l.id === extractId)
    if (!extract || !extract.cards) return
    const today = formatDate()
    const updatedCards = extract.cards.map(card => {
      if (card.id !== cardId) return card
      return {
        ...card,
        nextReviewDate: postponeDays > 0 ? addDays(today, postponeDays) : null,
      }
    })
    await updateDoc(doc(db, 'lo_learnings', extractId), {
      cards: updatedCards,
      updatedAt: new Date().toISOString(),
    })
  }

  // Returns flat list of {extractId, extractTitle, bookTitle, author, topic, card} for due cards
  function getDueCards() {
    const today = formatDate()
    const due = []
    learnings.forEach(l => {
      if (l.type !== 'book_extract' || !l.cards) return
      l.cards.forEach(card => {
        if (card.nextReviewDate && card.nextReviewDate <= today) {
          due.push({ extractId: l.id, extractTitle: l.title, bookTitle: l.bookTitle, author: l.author, topic: l.topic, card })
        }
      })
    })
    return due
  }

  // Total due items: regular sessions + individual book extract cards
  function getDueForReview() {
    const today = formatDate()
    const regularDue = learnings.filter(l => l.type !== 'book_extract' && l.nextReviewDate && l.nextReviewDate <= today)
    const cardsDue   = getDueCards()
    // Return unified list — regular items have .card = undefined, card items have .card
    return [
      ...regularDue,
      ...cardsDue.map(d => ({ ...d, _isCard: true, id: `${d.extractId}::${d.card.id}` })),
    ]
  }


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

  // Regular items only (non-extract) due for session-level review
  function getDueRegular() {
    const today = formatDate()
    return learnings.filter(l => l.type !== 'book_extract' && l.nextReviewDate && l.nextReviewDate <= today)
  }

  function getWeekScore() {
    const weekStart = getWeekStart()
    const today     = formatDate()
    const weekItems = getWeekLearnings()

    // Regular session reviews this week
    const weekReviews = learnings.flatMap(l => {
      if (l.type === 'book_extract') return []
      return (l.reviewHistory || []).filter(r => r.date >= weekStart && r.date <= today)
    })

    // Book extract card reviews this week
    const weekCardReviews = learnings.flatMap(l => {
      if (l.type !== 'book_extract' || !l.cards) return []
      return l.cards.flatMap(card =>
        (card.reviewHistory || []).filter(r => r.date >= weekStart && r.date <= today)
      )
    })

    const allWeekReviews = [...weekReviews, ...weekCardReviews]

    // Regular sessions only for hours/notes scoring
    const regularItems = weekItems.filter(l => l.type !== 'book_extract')
    // Book extract entries added this week
    const extractItems = weekItems.filter(l => l.type === 'book_extract')

    if (!regularItems.length && !allWeekReviews.length && !extractItems.length) return 0

    const hoursLogged = regularItems.reduce((acc, l) => acc + (l.duration || 0), 0)

    // Extract hours only credit when you also did real learning sessions this week.
    // Without that gate, simply adding a book extract inflates the score artificially.
    const extractHours = regularItems.length > 0
      ? extractItems.length * 1.5 * BOOK_EXTRACT_WEIGHT
      : 0
    const totalHours = hoursLogged + extractHours

    const notesCount  = regularItems.filter(l => l.takeaways?.length > 0).length
    const applied     = regularItems.filter(l => l.applied).length

    const sessionReviewCount = weekReviews.length
    const cardReviewCount    = weekCardReviews.length
    const avgRecall = allWeekReviews.length > 0
      ? allWeekReviews.reduce((s, r) => s + r.recallRating, 0) / allWeekReviews.length
      : 0

    // Session reviews: target 3/week → up to 20 pts of the 30pt review weight
    const sessionReviewScore = sessionReviewCount === 0
      ? 0
      : Math.min(20, (sessionReviewCount / 3) * 20) * (avgRecall >= 3 ? 1 : 0.5)

    // Card reviews: target 10/week (full book) → up to 10 pts of the 30pt review weight
    // Capped so cards alone can never saturate the review component
    const cardReviewScore = cardReviewCount === 0
      ? 0
      : Math.min(10, (cardReviewCount / 10) * 10) * (avgRecall >= 3 ? 1 : 0.5)

    // Combined review score out of 100 (will be weighted at 0.30 below)
    const reviewScore = Math.min(100, (sessionReviewScore + cardReviewScore) / 0.30)

    const hoursScore   = Math.min(100, (totalHours / 7) * 100)
    const notesScore   = Math.min(100, (notesCount / 7) * 100)
    const appliedScore = applied > 0 ? 100 : 0

    return Math.round(
      hoursScore   * 0.35 +
      notesScore   * 0.20 +
      appliedScore * 0.15 +
      reviewScore  * 0.30
    )
  }

  // Accurate weekly review count — includes both session reviews and card reviews
  function getWeekReviewCount() {
    const weekStart = getWeekStart()
    const today     = formatDate()
    const sessionReviews = learnings.flatMap(l => {
      if (l.type === 'book_extract') return []
      return (l.reviewHistory || []).filter(r => r.date >= weekStart && r.date <= today)
    }).length
    const cardReviews = learnings.flatMap(l => {
      if (l.type !== 'book_extract' || !l.cards) return []
      return l.cards.flatMap(card =>
        (card.reviewHistory || []).filter(r => r.date >= weekStart && r.date <= today)
      )
    }).length
    return sessionReviews + cardReviews
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
    addBookExtract, recordCardReview, postponeCard,
    recordReview, cancelReview,
    getWeekLearnings, getDueForReview, getDueRegular, getDueCards,
    getWeekScore, getWeekReviewCount, getTopicBreakdown,
  }
}
