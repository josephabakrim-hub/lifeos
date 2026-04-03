import { useState, useMemo, useEffect, useRef } from 'react'
import { getWeekLabel, getWeekStart, formatDate } from '../lib/utils'

const REFLECTION_QUESTIONS = [
  { key: 'wentWell',       label: 'What went well this week?',             placeholder: 'Wins, progress, things that clicked...' },
  { key: 'wentWrong',      label: 'What went wrong?',                      placeholder: 'Failures, missed targets, blockers...' },
  { key: 'lackDiscipline', label: 'Where did I lack discipline?',          placeholder: 'Habits skipped, distractions, weak moments...' },
  { key: 'biggestWin',     label: 'Biggest win this week?',                placeholder: "The one thing you're most proud of..." },
  { key: 'mentalState',    label: 'How was my mental state this week?',    placeholder: 'Energy, focus, mood, anxiety, clarity...' },
  { key: 'socialConnect',  label: 'Did I connect with people or isolate?', placeholder: 'Who did you reach out to? How did social feel?' },
  { key: 'improve',        label: 'What will I improve next week?',        placeholder: 'One clear commitment for next week...' },
]

const DEEP_WORK_TARGET = 28

const DAY_KEYS   = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }

// ─── Past-week edit modal ─────────────────────────────────────────────────────

function PastWeekModal({ weekStart, plan, onClose, onSave }) {
  const [goals,          setGoals]          = useState(plan?.goals || [{ text: '', done: false }, { text: '', done: false }, { text: '', done: false }])
  const [reflection,     setReflection]     = useState(plan?.reflection || {})
  const [sundayPlanDone, setSunday]         = useState(plan?.sundayPlanDone || false)
  const [fridayReview,   setFriday]         = useState(plan?.fridayReviewDone || false)
  const [deepWorkDays,   setDeepWorkDays]   = useState(plan?.deepWorkDays || {})
  const [saving,         setSaving]         = useState(false)

  const deepWorkVal = Object.values(deepWorkDays).reduce((s, v) => s + (parseFloat(v) || 0), 0)

  async function handleSave() {
    setSaving(true)
    await onSave(weekStart, {
      goals, reflection,
      sundayPlanDone: sundayPlanDone,
      fridayReviewDone: fridayReview,
      deepWorkDays,
      deepWorkHours: deepWorkVal,
    })
    setSaving(false)
    onClose()
  }

  function setRef(key, val) { setReflection(r => ({ ...r, [key]: val })) }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">✏️ Edit week — {getWeekLabel(weekStart)}</div>

        <div className="form-group">
          <label>Weekly rituals</label>
          {[
            { label: '📋 Sunday planning session', val: sundayPlanDone, set: setSunday },
            { label: '🔍 Friday review session',   val: fridayReview,   set: setFriday },
          ].map(({ label, val, set }) => (
            <div key={label} onClick={() => set(!val)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 6, background: val ? 'rgba(34,197,94,0.1)' : 'var(--bg3)', border: `1px solid ${val ? 'var(--green)' : 'var(--border2)'}` }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${val ? 'var(--green)' : 'var(--border2)'}`, background: val ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {val && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
              </div>
              <span style={{ fontSize: 14 }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="form-group">
          <label>Deep work hours per day</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {DAY_KEYS.map(d => (
              <div key={d} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{DAY_LABELS[d]}</div>
                <input type="number" min="0" max="16" step="0.5" value={deepWorkDays[d] || ''} onChange={e => setDeepWorkDays(prev => ({ ...prev, [d]: e.target.value }))} style={{ padding: '6px 4px', textAlign: 'center', fontSize: 13 }} placeholder="0" />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text3)' }}>Total: <strong style={{ color: 'var(--text)' }}>{deepWorkVal.toFixed(1)}h</strong></div>
        </div>

        <div className="form-group">
          <label>Top 3 goals</label>
          {goals.map((goal, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div className={`checkbox ${goal.done && goal.text ? 'checked' : ''}`} onClick={() => goal.text && setGoals(goals.map((g, idx) => idx === i ? { ...g, done: !g.done } : g))} style={{ cursor: goal.text ? 'pointer' : 'default', flexShrink: 0 }}>
                {goal.done && goal.text ? '✓' : ''}
              </div>
              <span style={{ color: 'var(--text3)', fontWeight: 700, fontSize: 14, width: 20, flexShrink: 0 }}>{i + 1}</span>
              <input value={goal.text} onChange={e => setGoals(goals.map((g, idx) => idx === i ? { ...g, text: e.target.value } : g))} placeholder={`Goal ${i + 1}`} style={{ textDecoration: goal.done ? 'line-through' : 'none', color: goal.done ? 'var(--text3)' : 'var(--text)' }} />
            </div>
          ))}
        </div>

        <div className="form-group">
          <label>Weekly reflection</label>
          {REFLECTION_QUESTIONS.map((q, i) => (
            <div key={q.key} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>
                <span style={{ color: 'var(--accent)', marginRight: 6 }}>{i + 1}.</span>{q.label}
              </div>
              <textarea value={reflection[q.key] || ''} onChange={e => setRef(q.key, e.target.value)} placeholder={q.placeholder} rows={2} style={{ resize: 'vertical', fontSize: 13 }} />
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── History calendar ─────────────────────────────────────────────────────────

function WeeklyCalendar({ plans, allPlans, savePlanForWeek, deletePlan }) {
  const now = new Date()
  const [year,         setYear]         = useState(now.getFullYear())
  const [month,        setMonth]        = useState(now.getMonth())
  const [expandedWeek, setExpandedWeek] = useState(null)
  const [editWeek,     setEditWeek]     = useState(null)

  const monthName   = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay    = new Date(year, month, 1).getDay()
  const blanks      = firstDay === 0 ? 6 : firstDay - 1

  const planByWeekStart = useMemo(() => {
    const map = {}
    allPlans.forEach(p => { map[p.weekStart] = p })
    return map
  }, [allPlans])

  function weekStartFor(dateStr) {
    const d = new Date(dateStr)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  }

  const weeksInMonth = useMemo(() => {
    const seen = new Set()
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      seen.add(weekStartFor(dateStr))
    }
    return [...seen].sort()
  }, [year, month, daysInMonth])

  const currentWeekStart = getWeekStart()
  const editingPlan = editWeek ? planByWeekStart[editWeek] : null

  const days = []
  for (let b = 0; b < blanks; b++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  function scoreColor(s) {
    if (s >= 80) return 'var(--green)'
    if (s >= 50) return 'var(--amber)'
    return 'var(--red)'
  }

  function weekScore(plan) {
    if (!plan) return 0
    const goals = plan.goals || []
    if (!goals.length) return 0
    const done = goals.filter(g => g.done).length
    const exec = Math.round((done / goals.length) * 100)
    const bonus = (plan.sundayPlanDone ? 10 : 0) + (plan.fridayReviewDone ? 10 : 0)
    return Math.min(100, Math.round(exec * 0.8 + bonus))
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="card-title" style={{ margin: 0 }}>📅 Calendar</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-sm" onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 130, textAlign: 'center' }}>{monthName}</span>
          <button className="btn btn-sm" onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }}>›</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', fontWeight: 600, padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 16 }}>
        {days.map((day, i) => {
          if (!day) return <div key={`b${i}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const ws = weekStartFor(dateStr)
          const plan = planByWeekStart[ws]
          const score = weekScore(plan)
          const isCurrentWeek = ws === currentWeekStart
          const isToday = dateStr === formatDate()
          return (
            <div key={day} onClick={() => plan && setExpandedWeek(expandedWeek === ws ? null : ws)} style={{ textAlign: 'center', padding: '6px 2px', borderRadius: 6, fontSize: 12, background: isToday ? 'rgba(124,106,255,0.15)' : isCurrentWeek ? 'var(--bg3)' : 'transparent', border: isToday ? '1px solid var(--accent)' : '1px solid transparent', cursor: plan ? 'pointer' : 'default', color: isToday ? 'var(--accent2)' : 'var(--text2)', fontWeight: isToday ? 700 : 400 }}>
              {day}
              {plan && <div style={{ width: 6, height: 6, borderRadius: '50%', background: scoreColor(score), margin: '2px auto 0' }} />}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {weeksInMonth.map(ws => {
          const plan = planByWeekStart[ws]
          const score = weekScore(plan)
          const isCurrentWeek = ws === currentWeekStart
          const isExpanded = expandedWeek === ws
          return (
            <div key={ws}>
              <div onClick={() => plan && setExpandedWeek(isExpanded ? null : ws)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: isCurrentWeek ? 'rgba(124,106,255,0.08)' : 'var(--bg3)', border: `1px solid ${isCurrentWeek ? 'rgba(124,106,255,0.25)' : 'var(--border)'}`, cursor: plan ? 'pointer' : 'default' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {getWeekLabel(ws)}
                  {isCurrentWeek && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--accent2)', fontWeight: 700 }}>← this week</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {plan ? (
                    <>
                      <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(score) }}>{score}</span>
                      <button className="btn btn-sm" onClick={e => { e.stopPropagation(); setEditWeek(ws) }}>✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); deletePlan(plan.id) }}>✕</button>
                    </>
                  ) : (
                    <button className="btn btn-sm" onClick={e => { e.stopPropagation(); setEditWeek(ws) }}>+ Fill in</button>
                  )}
                </div>
              </div>
              {isExpanded && plan && (
                <div style={{ padding: '12px 14px', background: 'var(--bg2)', borderRadius: '0 0 8px 8px', border: '1px solid var(--border)', borderTop: 'none' }}>
                  {(plan.goals || []).filter(g => g.text).map((g, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: g.done ? 'var(--green)' : 'var(--text3)' }}>{g.done ? '✓' : '○'}</span>
                      <span style={{ textDecoration: g.done ? 'line-through' : 'none', color: g.done ? 'var(--text3)' : 'var(--text)' }}>{g.text}</span>
                    </div>
                  ))}
                  {plan.deepWorkHours > 0 && (
                    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text3)' }}>⚡ {plan.deepWorkHours}h deep work</div>
                  )}
                  {plan.reflection?.wentWell && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text2)' }}>
                      <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓ Went well: </span>{plan.reflection.wentWell}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editWeek && (
        <PastWeekModal weekStart={editWeek} plan={editingPlan} onClose={() => setEditWeek(null)} onSave={savePlanForWeek} />
      )}
    </div>
  )
}

// ─── Milestone picker modal ───────────────────────────────────────────────────

function MilestonePickerModal({ goals, onSelect, onClose }) {
  const milestones = []
  goals.filter(g => g.status === 'active').forEach(goal => {
    ;(goal.milestones || []).forEach((m, idx) => {
      if (!m.done) milestones.push({ goalTitle: goal.title, text: m.text })
    })
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">🎯 Link a milestone as your weekly goal</div>
        {milestones.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '24px 0' }}>
            No pending milestones found.<br />Add milestones in your Goals section first.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {milestones.map((m, i) => (
              <div
                key={i}
                onClick={() => { onSelect(m.text); onClose() }}
                style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', background: 'var(--bg3)', border: '1px solid var(--border2)', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}
              >
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>🎯 {m.goalTitle}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{m.text}</div>
              </div>
            ))}
          </div>
        )}
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function WeeklyView({ plans, loading, getCurrentPlan, savePlan, savePlanForWeek, updatePlan, deletePlan, getWeekScore, goalsData }) {
  const currentPlan = getCurrentPlan()
  const weekLabel   = getWeekLabel(getWeekStart())
  const weekScore   = getWeekScore()

  const [goals,           setGoals]           = useState([{ text: '', done: false }, { text: '', done: false }, { text: '', done: false }])
  const [reflection,      setReflection]      = useState({})
  const [sundayPlanDone,  setSundayPlanDone]  = useState(false)
  const [fridayReviewDone,setFridayReviewDone]= useState(false)
  const [deepWorkDays,    setDeepWorkDays]    = useState({})
  const [showHistory,     setShowHistory]     = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [saved,           setSaved]           = useState(false)
  const [milestonePicker, setMilestonePicker] = useState(null) // goal slot index

  const autoSaveTimer = useRef(null)

  // ── Sync local state when plan loads ──────────────────────────────────────
  useEffect(() => {
    if (!currentPlan) return
    setGoals(currentPlan.goals?.length
      ? currentPlan.goals
      : [{ text: '', done: false }, { text: '', done: false }, { text: '', done: false }])
    setReflection(currentPlan.reflection || {})
    setSundayPlanDone(!!currentPlan.sundayPlanDone)
    setFridayReviewDone(!!currentPlan.fridayReviewDone)
    if (currentPlan.deepWorkDays) {
      setDeepWorkDays(currentPlan.deepWorkDays)
    } else if (currentPlan.deepWorkHours != null && currentPlan.deepWorkHours > 0) {
      // Migrate old single-number: put it in Monday so nothing is lost
      setDeepWorkDays({ mon: String(currentPlan.deepWorkHours) })
    }
  }, [currentPlan?.id])

  // ── Derived values ────────────────────────────────────────────────────────
  const deepWorkVal   = Object.values(deepWorkDays).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const deepWorkPct   = Math.min(100, Math.round((deepWorkVal / DEEP_WORK_TARGET) * 100))
  const deepWorkColor = deepWorkPct >= 100 ? 'var(--green)' : deepWorkPct >= 65 ? 'var(--amber)' : 'var(--red)'

  const completedGoals = goals.filter(g => g.done && g.text).length
  const totalGoals     = goals.filter(g => g.text).length
  const goalsPct       = totalGoals > 0 ? (completedGoals / totalGoals) : 0
  const ritualBonus    = (sundayPlanDone ? 10 : 0) + (fridayReviewDone ? 10 : 0)
  const executionPct   = Math.min(100, Math.round(goalsPct * 80 + ritualBonus))

  // Today's day key for highlighting
  const todayDayKey = ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()]

  // ── Auto-save (debounced 800ms) for goals + deep work ────────────────────
  function scheduleAutoSave(newGoals, newDeepWorkDays) {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      const dw = Object.values(newDeepWorkDays).reduce((s, v) => s + (parseFloat(v) || 0), 0)
      await savePlan({
        goals: newGoals,
        reflection,
        sundayPlanDone,
        fridayReviewDone,
        deepWorkDays: newDeepWorkDays,
        deepWorkHours: dw,
      })
    }, 800)
  }

  function handleGoalChange(i, text) {
    const updated = goals.map((g, idx) => idx === i ? { ...g, text } : g)
    setGoals(updated)
    scheduleAutoSave(updated, deepWorkDays)
  }

  function handleDeepWorkChange(dayKey, val) {
    const updated = { ...deepWorkDays, [dayKey]: val }
    setDeepWorkDays(updated)
    scheduleAutoSave(goals, updated)
  }

  function setReflectionField(key, value) {
    setReflection(prev => ({ ...prev, [key]: value }))
  }

  // ── Ritual toggle — saves immediately ────────────────────────────────────
  async function toggleRitual(field, current, setter) {
    const next = !current
    setter(next)
    await savePlan({
      goals, reflection,
      sundayPlanDone:   field === 'sunday' ? next : sundayPlanDone,
      fridayReviewDone: field === 'friday' ? next : fridayReviewDone,
      deepWorkDays,
      deepWorkHours: deepWorkVal,
    })
  }

  // ── Explicit full save ────────────────────────────────────────────────────
  async function handleSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    setSaving(true)
    await savePlan({ goals, reflection, sundayPlanDone, fridayReviewDone, deepWorkDays, deepWorkHours: deepWorkVal })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // ── Goal done toggle — saves immediately ─────────────────────────────────
  async function toggleGoalDone(index) {
    const updated = goals.map((g, i) => i === index ? { ...g, done: !g.done } : g)
    setGoals(updated)
    if (currentPlan) await updatePlan(currentPlan.id, { goals: updated })
  }

  if (loading) return <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div className="fade-in">

      {/* ── Header ── */}
      <div className="section-header">
        <div>
          <div className="section-title">📅 Weekly Planning</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Based on The 12 Week Year + Deep Work</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{weekLabel}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: weekScore >= 80 ? 'var(--green)' : weekScore >= 50 ? 'var(--amber)' : 'var(--red)' }}>
            {weekScore}<span style={{ fontSize: 13 }}>/100</span>
          </div>
        </div>
      </div>

      {/* ── Rituals + Execution score ── */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Weekly rituals</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {[
              { label: '📋 Sunday planning session', sub: 'Set top 3 goals, block deep work, review last week', field: 'sunday', val: sundayPlanDone, setter: setSundayPlanDone },
              { label: '🔍 Friday review session',   sub: 'Score your week, log wins and lessons',             field: 'friday', val: fridayReviewDone, setter: setFridayReviewDone },
            ].map(({ label, sub, field, val, setter }) => (
              <div key={field} onClick={() => toggleRitual(field, val, setter)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14 }}>
                <div className={`checkbox ${val ? 'checked' : ''}`}>{val ? '✓' : ''}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="divider" />

          {/* ── Daily deep work log ── */}
          <div>
            <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600, marginBottom: 10 }}>
              ⚡ Deep work hours <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>— add each day (auto-saves)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {DAY_KEYS.map(d => {
                const isToday = d === todayDayKey
                return (
                  <div key={d} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--accent2)' : 'var(--text3)', marginBottom: 4 }}>
                      {DAY_LABELS[d]}
                    </div>
                    <input
                      type="number" min="0" max="16" step="0.5"
                      value={deepWorkDays[d] || ''}
                      onChange={e => handleDeepWorkChange(d, e.target.value)}
                      placeholder="0"
                      style={{ padding: '6px 2px', textAlign: 'center', fontSize: 13, borderColor: isToday ? 'var(--accent)' : undefined }}
                    />
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: deepWorkColor, fontWeight: 600 }}>{deepWorkVal.toFixed(1)}h logged</span>
                <span style={{ color: 'var(--text3)' }}>Target: {DEEP_WORK_TARGET}h</span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-fill" style={{ width: `${deepWorkPct}%`, background: deepWorkColor, transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: 'var(--text3)' }}>
                <span>{deepWorkPct}% of target</span>
                <span style={{ color: deepWorkPct >= 100 ? 'var(--green)' : 'var(--amber)', fontWeight: 600 }}>
                  {deepWorkPct >= 100 ? '✓ Target hit!' : `${(DEEP_WORK_TARGET - deepWorkVal).toFixed(1)}h to go`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Execution score</div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 800, lineHeight: 1, color: executionPct >= 80 ? 'var(--green)' : executionPct >= 50 ? 'var(--amber)' : 'var(--text3)' }}>
              {executionPct}%
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>{completedGoals}/{totalGoals} goals completed</div>
          </div>
          <div className="progress-bar" style={{ height: 8, marginBottom: 8 }}>
            <div className="progress-fill" style={{ width: `${executionPct}%`, background: executionPct >= 80 ? 'var(--green)' : 'var(--amber)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Goals (80%)</span>
              <span style={{ color: 'var(--text2)', fontWeight: 600 }}>{Math.round(goalsPct * 80)}pts</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Sunday ritual (+10%)</span>
              <span style={{ color: sundayPlanDone ? 'var(--green)' : 'var(--text3)', fontWeight: 600 }}>{sundayPlanDone ? '+10' : '+0'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Friday ritual (+10%)</span>
              <span style={{ color: fridayReviewDone ? 'var(--green)' : 'var(--text3)', fontWeight: 600 }}>{fridayReviewDone ? '+10' : '+0'}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4, marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
              <span>Ideal Joseph</span>
              <span style={{ color: 'var(--amber)', fontWeight: 600 }}>95%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top 3 goals ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="card-title" style={{ margin: 0 }}>Top 3 goals this week</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Auto-saves · check off on Friday · 🎯 links to milestones</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {goals.map((goal, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                className={`checkbox ${goal.done && goal.text ? 'checked' : ''}`}
                onClick={() => goal.text && toggleGoalDone(i)}
                style={{ cursor: goal.text ? 'pointer' : 'default', flexShrink: 0 }}
              >
                {goal.done && goal.text ? '✓' : ''}
              </div>
              <span style={{ color: 'var(--text3)', fontWeight: 700, fontSize: 14, width: 20, flexShrink: 0 }}>{i + 1}</span>
              <input
                value={goal.text}
                onChange={e => handleGoalChange(i, e.target.value)}
                placeholder={`Goal ${i + 1} — your ONE Thing for this week`}
                style={{ flex: 1, textDecoration: goal.done ? 'line-through' : 'none', color: goal.done ? 'var(--text3)' : 'var(--text)' }}
              />
              {goalsData?.goals?.length > 0 && (
                <button
                  className="btn btn-sm"
                  title="Link a milestone from Goals"
                  onClick={() => setMilestonePicker(i)}
                  style={{ flexShrink: 0, fontSize: 11, color: goal.milestoneLinked ? 'var(--accent2)' : 'var(--text3)', borderColor: goal.milestoneLinked ? 'var(--accent)' : undefined }}
                >
                  🎯
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 7 reflection questions ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Weekly reflection</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {REFLECTION_QUESTIONS.map((q, i) => (
            <div key={q.key}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
                <span style={{ color: 'var(--accent)', marginRight: 6, fontWeight: 700 }}>{i + 1}.</span>{q.label}
              </div>
              <textarea value={reflection[q.key] || ''} onChange={e => setReflectionField(q.key, e.target.value)} placeholder={q.placeholder} rows={2} style={{ resize: 'vertical', fontSize: 13 }} />
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ marginBottom: 32 }}>
        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save this week'}
      </button>

      {/* ── History ── */}
      <div>
        <button className="btn" style={{ width: '100%', justifyContent: 'center', marginBottom: showHistory ? 16 : 0 }} onClick={() => setShowHistory(h => !h)}>
          {showHistory ? '▲ Hide history' : '▼ Show history (calendar)'}
        </button>
        {showHistory && (
          <WeeklyCalendar
            plans={plans.filter(p => p.weekStart !== getWeekStart())}
            allPlans={plans}
            savePlanForWeek={savePlanForWeek}
            deletePlan={deletePlan}
          />
        )}
      </div>

      {/* ── Milestone picker ── */}
      {milestonePicker !== null && goalsData && (
        <MilestonePickerModal
          goals={goalsData.goals || []}
          onSelect={text => {
            const updated = goals.map((g, idx) => idx === milestonePicker ? { ...g, text, milestoneLinked: true } : g)
            setGoals(updated)
            scheduleAutoSave(updated, deepWorkDays)
            setMilestonePicker(null)
          }}
          onClose={() => setMilestonePicker(null)}
        />
      )}
    </div>
  )
}
