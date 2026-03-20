import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatDate } from '../lib/utils'

const JOURNEY_DOC = 'lo_settings/journey'

export function useJourney() {
  const [startDate, setStartDate] = useState(null)  // null = not started yet
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    getDoc(doc(db, 'lo_settings', 'journey')).then(snap => {
      if (snap.exists()) setStartDate(snap.data().startDate || null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function beginJourney() {
    const today = formatDate()
    await setDoc(doc(db, 'lo_settings', 'journey'), {
      startDate: today,
      startedAt: new Date().toISOString(),
    })
    setStartDate(today)
  }

  async function resetJourney() {
    await setDoc(doc(db, 'lo_settings', 'journey'), {
      startDate: null,
      resetAt: new Date().toISOString(),
    })
    setStartDate(null)
  }

  // Number of days since journey started (0 = day 1)
  function dayNumber() {
    if (!startDate) return null
    const start = new Date(startDate)
    const today = new Date()
    return Math.floor((today - start) / 86400000) + 1
  }

  // Has the journey started and is today on or after the start date?
  const journeyStarted = !!startDate

  return { startDate, loading, journeyStarted, beginJourney, resetJourney, dayNumber }
}
