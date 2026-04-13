import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatDate } from '../lib/utils'

export function useSocial() {
  const [people,  setPeople]  = useState([])
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubP = onSnapshot(
      query(collection(db, 'lo_social_people'), orderBy('createdAt', 'asc')),
      snap => { setPeople(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) }
    )
    const unsubL = onSnapshot(
      query(collection(db, 'lo_social_logs'), orderBy('weekStart', 'desc')),
      snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return () => { unsubP(); unsubL() }
  }, [])

  // ── People CRUD ──────────────────────────────────────────────────────────────

  async function addPerson(data) {
    await addDoc(collection(db, 'lo_social_people'), {
      ...data,
      createdAt: new Date().toISOString(),
    })
  }

  async function updatePerson(id, data) {
    await updateDoc(doc(db, 'lo_social_people', id), { ...data, updatedAt: new Date().toISOString() })
  }

  async function deletePerson(id) {
    await deleteDoc(doc(db, 'lo_social_people', id))
  }

  async function archivePerson(id) {
    await updateDoc(doc(db, 'lo_social_people', id), {
      archived: true,
      updatedAt: new Date().toISOString(),
    })
  }

  async function unarchivePerson(id) {
    await updateDoc(doc(db, 'lo_social_people', id), {
      archived: false,
      updatedAt: new Date().toISOString(),
    })
  }

  async function deleteLog(id) {
    await deleteDoc(doc(db, 'lo_social_logs', id))
  }

  // Mark a person as contacted today
  async function markContacted(id) {
    await updateDoc(doc(db, 'lo_social_people', id), {
      lastContacted: formatDate(),
      updatedAt: new Date().toISOString(),
    })
  }

  // ── Weekly logs CRUD ─────────────────────────────────────────────────────────

  function getWeekStart() {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  }

  function getCurrentLog() {
    return logs.find(l => l.weekStart === getWeekStart()) || null
  }

  async function saveLog(data, weekStartOverride) {
    const ws = weekStartOverride || getWeekStart()
    const existing = logs.find(l => l.weekStart === ws)
    if (existing) {
      await updateDoc(doc(db, 'lo_social_logs', existing.id), { ...data, updatedAt: new Date().toISOString() })
    } else {
      await addDoc(collection(db, 'lo_social_logs'), { ...data, weekStart: ws, createdAt: new Date().toISOString() })
    }
  }

  // ── Scores & insights ────────────────────────────────────────────────────────

  function getWeekScore() {
    const current   = getCurrentLog()
    const weekStart = getWeekStart()
    const weekEnd   = formatDate()

    // ── Part 1: Live contact score (30 pts max) ──────────────────────────────
    // Derived from lastContacted on people — no reflection needed.
    // Anyone contacted within this week (Mon–today) counts immediately.
    const activePeople = people.filter(p => !p.archived)
    const contactedThisWeek = activePeople.filter(
      p => p.lastContacted && p.lastContacted >= weekStart && p.lastContacted <= weekEnd
    )
    // Also merge anyone in the log's contactedIds (manually selected in reflection)
    const logContactedIds = current?.contactedIds || []
    const allContactedIds = new Set([
      ...contactedThisWeek.map(p => p.id),
      ...logContactedIds,
    ])
    const totalContacted = allContactedIds.size
    const target         = Math.max(1, Math.min(activePeople.length, 4))
    const contactScore   = Math.min(30, Math.round((totalContacted / target) * 30))

    // Category diversity bonus (up to 10 pts) — also live
    const cats = new Set(
      [...allContactedIds].map(id => activePeople.find(p => p.id === id)?.category).filter(Boolean)
    )
    const catsBonus = cats.size >= 4 ? 10 : cats.size >= 2 ? 5 : 0

    // ── Part 2: Reflection score (60 pts max) — unlocks after saving ─────────
    // 20 pts for doing the reflection, 30 pts for quality rating, 10 pts for met new
    if (!current) {
      return Math.min(100, contactScore + catsBonus)
    }

    const reflectionDone = 20
    const qualityScore   = current.quality ? Math.round((current.quality / 5) * 30) : 0
    const newPersonBonus = current.metNew ? 10 : 0

    return Math.min(100, contactScore + catsBonus + reflectionDone + qualityScore + newPersonBonus)
  }

  function getInsights() {
    const sevenDaysAgo  = (() => { const d = new Date(); d.setDate(d.getDate() - 7);  return d.toISOString().split('T')[0] })()
    const thirtyDaysAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0] })()

    const neglected7  = people.filter(p => !p.archived && (!p.lastContacted || p.lastContacted < sevenDaysAgo))
    const neglected30 = people.filter(p => !p.archived && (!p.lastContacted || p.lastContacted < thirtyDaysAgo))

    // Most neglected category — works with both old label strings and new id strings
    const catLastContact = {}
    const allCatIds = [...new Set(people.filter(p => !p.archived).map(p => p.category).filter(Boolean))]
    allCatIds.forEach(cat => {
      const catPeople = people.filter(p => !p.archived && p.category === cat)
      if (!catPeople.length) return
      const mostRecent = catPeople.map(p => p.lastContacted || '1970-01-01').sort().pop()
      catLastContact[cat] = mostRecent
    })
    const mostNeglectedCat = Object.entries(catLastContact).sort((a, b) => a[1].localeCompare(b[1]))[0]?.[0] || null

    return { neglected7, neglected30, mostNeglectedCat }
  }

  return {
    people, logs, loading,
    addPerson, updatePerson, deletePerson, archivePerson, unarchivePerson, markContacted,
    getCurrentLog, saveLog, deleteLog,
    getWeekScore, getInsights,
    getWeekStart,
  }
}
