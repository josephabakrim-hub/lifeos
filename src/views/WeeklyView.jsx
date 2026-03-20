import { useState, useMemo, useEffect } from 'react'
import { getWeekLabel, getWeekStart } from '../lib/utils'

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

// ─── Past-week edit modal ─────────────────────────────────────────────────────

function PastWeekModal({ weekStart, plan, onClose, onSave }) {
  const [goals, setGoals]               = useState(plan?.goals || [{ text: '', done: false }, { text: '', done: false }, { text: '', done: false }])
  const [reflection, setReflection]     = useState(plan?.reflection || {})
  const [sundayPlanDone, setSunday]     = useState(plan?.sundayPlanDone || false)
  const [fridayReviewDone, setFriday]   = useState(plan?.fridayReviewDone || false)
  const [deepWorkHours, setDeepWork]    = useState(plan?.deepWorkHours?.toString() || '')
  const [saving, setSaving]             = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(weekStart, {
      goals, reflection,
      sundayPlanDone, fridayReviewDone,
      deepWorkHours: parseFloat(deepWorkHours) || 0,
    })
    setSaving(false)
    onClose()
  }

  function setRef(key, val) { setReflection(r => ({ ...r, [key]: val })) }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">✏️ Edit week — {getWeekLabel(weekStart)}</div>

        {/* Rituals */}
        <div className="form-group">
          <label>Weekly rituals</label>
          {[
            { label: '📋 Sunday planning session', val: sundayPlanDone, set: setSunday },
            { label: '🔍 Friday review session',   val: fridayReviewDone, set: setFriday },
          ].map(({ label, val, set }) => (
            <div key={label} onClick={() => set(!val)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 6, background: val ? 'rgba(34,197,94,0.1)' : 'var(--bg3)', border: `1px solid ${val ? 'var(--green)' : 'var(--border2)'}` }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${val ? 'var(--green)' : 'var(--border2)'}`, background: val ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {val && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
              </div>
              <span style={{ fontSize: 14 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Deep work */}
        <div className="form-group">
          <label>Deep work hours this week</label>
          <input type="number" value={deepWorkHours} onChange={e => setDeepWork(e.target.value)} placeholder="e.g. 20" min="0" max="60" />
        </div>

        {/* Goals */}
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

        {/* Reflection */}
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
  const [editWeek,     setEditWeek]     = useState(null) // weekStart string

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

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="card-title" style={{ margin: 0 }}>📅 Calendar</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-sm" onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 130, textAlign: 'center' }}>{monthName}</span>
          <button className="btn btn-sm" onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }}>›</button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', fontWeight: 600, padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 16 }}>
        {Array(blanks).fill(null).map((_, i) => <div key={`b${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day      = i + 1
          const dateStr  = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const ws       = weekStartFor(dateStr)
          const plan     = planByWeekStart[ws]
          const isToday  = dateStr === new Date().toISOString().split('T')[0]
          const isCurrent = ws === currentWeekStart
          const isActive  = expandedWeek === ws

          let dotColor = null
          if (plan) {
            const done  = (plan.goals || []).filter(g => g.done && g.text).length
            const total = (plan.goals || []).filter(g => g.text).length
            const pct   = total > 0 ? Math.round((done / total) * 100) : 0
            dotColor = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)'
          }

          return (
            <div
              key={day}
              onClick={() => setExpandedWeek(isActive ? null : ws)}
              style={{
                minHeight: 38, borderRadius: 6, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                background: isActive ? 'var(--accent-glow)' : isToday ? 'var(--bg4)' : isCurrent ? 'var(--bg4)' : 'var(--bg3)',
                border: `1px solid ${isActive ? 'var(--accent)' : isToday ? 'var(--border2)' : isCurrent ? 'var(--border2)' : 'transparent'}`,
              }}
            >
              <span style={{ fontSize: 12, color: isToday ? 'var(--text)' : 'var(--text2)', fontWeight: isToday ? 700 : 400 }}>{day}</span>
              {dotColor && <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, marginTop: 2 }} />}
              {!plan && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border2)', marginTop: 2 }} />}
            </div>
          )
        })}
      </div>

      {/* Week rows — every week in month, with or without a plan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {weeksInMonth.map(ws => {
          const plan    = planByWeekStart[ws]
          const isOpen  = expandedWeek === ws
          const isCurr  = ws === currentWeekStart
          const done    = (plan?.goals || []).filter(g => g.done && g.text).length
          const total   = (plan?.goals || []).filter(g => g.text).length
          const pct     = total > 0 ? Math.round((done / total) * 100) : 0
          const ref     = plan?.reflection || {}
          const hasRef  = typeof ref === 'object'
            ? REFLECTION_QUESTIONS.some(q => ref[q.key]?.trim())
            : typeof ref === 'string' && ref.trim()

          return (
            <div key={ws} style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${isOpen ? 'var(--border2)' : 'var(--border)'}` }}>
              {/* Summary row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', background: isOpen ? 'var(--bg4)' : 'var(--bg3)' }}
                onClick={() => setExpandedWeek(isOpen ? null : ws)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{getWeekLabel(ws)}</span>
                  {isCurr && <span className="badge badge-blue" style={{ fontSize: 10 }}>Current</span>}
                  {plan?.deepWorkHours > 0 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>⏱ {plan.deepWorkHours}h</span>}
                  {!plan && <span style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>no log</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {plan && (
                    <>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>{done}/{total} goals</span>
                      <span className={`badge ${pct >= 80 ? 'badge-green' : pct >= 50 ? 'badge-amber' : 'badge-red'}`}>{pct}%</span>
                      {plan.sundayPlanDone  && <span className="badge badge-blue">📋</span>}
                      {plan.fridayReviewDone && <span className="badge badge-purple">🔍</span>}
                    </>
                  )}
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ padding: '14px 16px', background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
                  {/* Edit / Delete / Add buttons */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <button className="btn btn-sm" onClick={() => setEditWeek(ws)}>
                      {plan ? '✏️ Edit this week' : '✏️ Log this week'}
                    </button>
                    {plan && (
                      <button className="btn btn-sm btn-danger" onClick={() => { deletePlan(plan.id); setExpandedWeek(null) }}>
                        ✕ Delete
                      </button>
                    )}
                  </div>

                  {/* Goals */}
                  {plan && total > 0 && (
                    <div style={{ marginBottom: hasRef ? 16 : 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Goals</div>
                      {(plan.goals || []).filter(g => g.text).map((g, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13 }}>
                          <span style={{ color: g.done ? 'var(--green)' : 'var(--text3)' }}>{g.done ? '✓' : '○'}</span>
                          <span style={{ textDecoration: g.done ? 'line-through' : 'none', color: g.done ? 'var(--text3)' : 'var(--text)' }}>{g.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reflection */}
                  {plan && hasRef && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Reflection</div>
                      {typeof ref === 'string' && ref.trim()
                        ? <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{ref}</p>
                        : REFLECTION_QUESTIONS.filter(q => ref[q.key]?.trim()).map(q => (
                            <div key={q.key} style={{ marginBottom: 10 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 3 }}>{q.label}</div>
                              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{ref[q.key]}</p>
                            </div>
                          ))
                      }
                    </div>
                  )}

                  {!plan && (
                    <div style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>
                      Nothing logged for this week yet. Click "Log this week" to add it.
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 11, color: 'var(--text3)' }}>
        {[['var(--green)','80%+ goals'],['var(--amber)','50–79%'],['var(--red)','Under 50%'],['var(--border2)','No log']].map(([c, l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />{l}
          </span>
        ))}
      </div>

      {/* Past-week edit modal */}
      {editWeek && (
        <PastWeekModal
          weekStart={editWeek}
          plan={editingPlan}
          onClose={() => setEditWeek(null)}
          onSave={savePlanForWeek}
        />
      )}
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function WeeklyView({ plans, loading, getCurrentPlan, savePlan, savePlanForWeek, updatePlan, deletePlan, getWeekScore }) {
  const currentPlan = getCurrentPlan()
  const weekLabel   = getWeekLabel(getWeekStart())
  const weekScore   = getWeekScore()

  const [goals,           setGoals]           = useState([{ text: '', done: false }, { text: '', done: false }, { text: '', done: false }])
  const [reflection,      setReflection]      = useState({})
  const [sundayPlanDone,  setSundayPlanDone]  = useState(false)
  const [fridayReviewDone,setFridayReviewDone]= useState(false)
  const [deepWorkHours,   setDeepWorkHours]   = useState('')
  const [showHistory,     setShowHistory]     = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [saved,           setSaved]           = useState(false)

  // ── FIX: sync local state whenever currentPlan loads or changes ──
  useEffect(() => {
    if (!currentPlan) return
    setGoals(currentPlan.goals?.length ? currentPlan.goals : [{ text: '', done: false }, { text: '', done: false }, { text: '', done: false }])
    setReflection(currentPlan.reflection || {})
    setSundayPlanDone(!!currentPlan.sundayPlanDone)
    setFridayReviewDone(!!currentPlan.fridayReviewDone)
    setDeepWorkHours(currentPlan.deepWorkHours != null ? String(currentPlan.deepWorkHours) : '')
  }, [currentPlan?.id]) // only re-sync when the plan doc itself changes, not on every render

  const deepWorkVal   = parseFloat(deepWorkHours) || 0
  const deepWorkPct   = Math.min(100, Math.round((deepWorkVal / DEEP_WORK_TARGET) * 100))
  const deepWorkColor = deepWorkPct >= 100 ? 'var(--green)' : deepWorkPct >= 65 ? 'var(--amber)' : 'var(--red)'

  const completedGoals = goals.filter(g => g.done && g.text).length
  const totalGoals     = goals.filter(g => g.text).length
  const goalsPct       = totalGoals > 0 ? (completedGoals / totalGoals) : 0
  const ritualBonus    = (sundayPlanDone ? 10 : 0) + (fridayReviewDone ? 10 : 0)
  const executionPct   = Math.min(100, Math.round(goalsPct * 80 + ritualBonus))

  function setReflectionField(key, value) {
    setReflection(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    await savePlan({ goals, reflection, sundayPlanDone, fridayReviewDone, deepWorkHours: deepWorkVal })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

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
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14 }}>
              <div className={`checkbox ${sundayPlanDone ? 'checked' : ''}`} onClick={() => setSundayPlanDone(!sundayPlanDone)}>
                {sundayPlanDone ? '✓' : ''}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>📋 Sunday planning session</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Set top 3 goals, block deep work, review last week</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14 }}>
              <div className={`checkbox ${fridayReviewDone ? 'checked' : ''}`} onClick={() => setFridayReviewDone(!fridayReviewDone)}>
                {fridayReviewDone ? '✓' : ''}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>🔍 Friday review session</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Score your week, log wins and lessons</div>
              </div>
            </label>
          </div>

          <div className="divider" />

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Deep work hours this week</label>
            <input type="number" value={deepWorkHours} onChange={e => setDeepWorkHours(e.target.value)} placeholder="e.g. 20" min="0" max="60" />
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: deepWorkColor, fontWeight: 600 }}>{deepWorkVal}h logged</span>
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
        <div className="card-title">Top 3 goals this week</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {goals.map((goal, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className={`checkbox ${goal.done && goal.text ? 'checked' : ''}`} onClick={() => goal.text && toggleGoalDone(i)} style={{ cursor: goal.text ? 'pointer' : 'default', flexShrink: 0 }}>
                {goal.done && goal.text ? '✓' : ''}
              </div>
              <span style={{ color: 'var(--text3)', fontWeight: 700, fontSize: 14, width: 20, flexShrink: 0 }}>{i + 1}</span>
              <input
                value={goal.text}
                onChange={e => setGoals(goals.map((g, idx) => idx === i ? { ...g, text: e.target.value } : g))}
                placeholder={`Goal ${i + 1} — your ONE Thing for this week`}
                style={{ textDecoration: goal.done ? 'line-through' : 'none', color: goal.done ? 'var(--text3)' : 'var(--text)' }}
              />
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
    </div>
  )
}
