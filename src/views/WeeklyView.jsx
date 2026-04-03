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

const DEFAULT_GOALS = () => [
  { text: '', done: false },
  { text: '', done: false },
  { text: '', done: false },
]

// ─── Past-week edit modal ─────────────────────────────────────────────────────

function PastWeekModal({ weekStart, plan, onClose, onSave }) {
  const [goals,           setGoals]          = useState(plan?.goals?.length ? plan.goals : DEFAULT_GOALS())
  const [reflection,      setReflection]     = useState(plan?.reflection || {})
  const [sundayReviewDone,setSunday]         = useState(plan?.sundayReviewDone ?? plan?.sundayPlanDone ?? false)
  const [mondayPlanDone,  setMonday]         = useState(plan?.mondayPlanDone   ?? plan?.fridayReviewDone ?? false)
  const [deepWorkDays,    setDeepWorkDays]   = useState(plan?.deepWorkDays || {})
  const [saving,          setSaving]         = useState(false)

  const deepWorkVal = Object.values(deepWorkDays).reduce((s, v) => s + (parseFloat(v) || 0), 0)

  async function handleSave() {
    setSaving(true)
    await onSave(weekStart, {
      goals, reflection,
      sundayReviewDone,
      mondayPlanDone,
      deepWorkDays,
      deepWorkHours: deepWorkVal,
    })
    setSaving(false)
    onClose()
  }

  function setRef(key, val) { setReflection(r => ({ ...r, [key]: val })) }

  function addGoal() {
    if (goals.length < 5) setGoals(g => [...g, { text: '', done: false }])
  }
  function removeGoal(i) {
    if (goals.length > 3) setGoals(g => g.filter((_, idx) => idx !== i))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">✏️ Edit week — {getWeekLabel(weekStart)}</div>

        {/* Rituals */}
        <div className="form-group">
          <label>Weekly rituals</label>
          {[
            { label: '🌙 Sunday evening review', sub: 'Score last week · close it out mentally', val: sundayReviewDone, set: setSunday },
            { label: '☀️ Monday morning plan',   sub: 'Set this week\'s goals · block deep work', val: mondayPlanDone,   set: setMonday },
          ].map(({ label, sub, val, set }) => (
            <div key={label} onClick={() => set(!val)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 6, background: val ? 'rgba(34,197,94,0.1)' : 'var(--bg3)', border: `1px solid ${val ? 'var(--green)' : 'var(--border2)'}` }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${val ? 'var(--green)' : 'var(--border2)'}`, background: val ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {val && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Deep work per day */}
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

        {/* Goals */}
        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ margin: 0 }}>Goals this week <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(3 default, up to 5)</span></label>
            {goals.length < 5 && (
              <button onClick={addGoal} style={{ background: 'none', border: '1px dashed var(--border2)', borderRadius: 6, color: 'var(--text3)', fontSize: 12, padding: '2px 10px', cursor: 'pointer' }}>+ Add goal</button>
            )}
          </div>
          {goals.map((goal, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div className={`checkbox ${goal.done && goal.text ? 'checked' : ''}`} onClick={() => goal.text && setGoals(goals.map((g, idx) => idx === i ? { ...g, done: !g.done } : g))} style={{ cursor: goal.text ? 'pointer' : 'default', flexShrink: 0 }}>
                {goal.done && goal.text ? '✓' : ''}
              </div>
              <span style={{ color: 'var(--text3)', fontWeight: 700, fontSize: 14, width: 20, flexShrink: 0 }}>{i + 1}</span>
              <input value={goal.text} onChange={e => setGoals(goals.map((g, idx) => idx === i ? { ...g, text: e.target.value } : g))} placeholder={i < 3 ? `Goal ${i + 1}` : `Extra goal ${i + 1} (optional)`} style={{ flex: 1, textDecoration: goal.done ? 'line-through' : 'none', color: goal.done ? 'var(--text3)' : 'var(--text)' }} />
              {i >= 3 && (
                <button onClick={() => removeGoal(i)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }} title="Remove">×</button>
              )}
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
    const sunDone = plan.sundayReviewDone ?? plan.sundayPlanDone ?? false
    const monDone = plan.mondayPlanDone   ?? plan.fridayReviewDone ?? false
    const bonus = (sunDone ? 10 : 0) + (monDone ? 10 : 0)
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
    ;(goal.milestones || []).forEach(m => {
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
              <div key={i} onClick={() => { onSelect(m.text); onClose() }} style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', background: 'var(--bg3)', border: '1px solid var(--border2)', transition: 'border-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}>
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

  const [goals,            setGoals]            = useState(DEFAULT_GOALS())
  const [reflection,       setReflection]       = useState({})
  const [sundayReviewDone, setSundayReviewDone] = useState(false)
  const [mondayPlanDone,   setMondayPlanDone]   = useState(false)
  const [deepWorkDays,     setDeepWorkDays]     = useState({})
  const [showHistory,      setShowHistory]      = useState(false)
  const [saving,           setSaving]           = useState(false)
  const [saved,            setSaved]            = useState(false)
  const [milestonePicker,  setMilestonePicker]  = useState(null)

  const autoSaveTimer = useRef(null)

  // ── Sync local state when plan loads ──────────────────────────────────────
  useEffect(() => {
    if (!currentPlan) return
    setGoals(currentPlan.goals?.length ? currentPlan.goals : DEFAULT_GOALS())
    setReflection(currentPlan.reflection || {})
    // Support new field names with legacy fallback
    setSundayReviewDone(currentPlan.sundayReviewDone ?? currentPlan.sundayPlanDone ?? false)
    setMondayPlanDone(currentPlan.mondayPlanDone     ?? currentPlan.fridayReviewDone ?? false)
    if (currentPlan.deepWorkDays) {
      setDeepWorkDays(currentPlan.deepWorkDays)
    } else if (currentPlan.deepWorkHours != null && currentPlan.deepWorkHours > 0) {
      setDeepWorkDays({ mon: String(currentPlan.deepWorkHours) })
    }
  }, [currentPlan?.id])

  // ── Derived values ────────────────────────────────────────────────────────
  const deepWorkVal   = Object.values(deepWorkDays).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const deepWorkPct   = Math.min(100, Math.round((deepWorkVal / DEEP_WORK_TARGET) * 100))
  const deepWorkColor = deepWorkPct >= 100 ? 'var(--green)' : deepWorkPct >= 65 ? 'var(--amber)' : 'var(--red)'

  const completedGoals = goals.filter(g => g.done && g.text).length
  const totalGoals     = goals.filter(g => g.text).length
  const goalsPct       = totalGoals > 0 ? completedGoals / totalGoals : 0
  const ritualBonus    = (sundayReviewDone ? 10 : 0) + (mondayPlanDone ? 10 : 0)
  const executionPct   = Math.min(100, Math.round(goalsPct * 80 + ritualBonus))

  const todayDayKey = ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()]

  // ── Auto-save (debounced 800ms) ───────────────────────────────────────────
  function scheduleAutoSave(newGoals, newDeepWorkDays) {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      const dw = Object.values(newDeepWorkDays).reduce((s, v) => s + (parseFloat(v) || 0), 0)
      await savePlan({ goals: newGoals, reflection, sundayReviewDone, mondayPlanDone, deepWorkDays: newDeepWorkDays, deepWorkHours: dw })
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

  function addGoal() {
    if (goals.length >= 5) return
    const updated = [...goals, { text: '', done: false }]
    setGoals(updated)
    scheduleAutoSave(updated, deepWorkDays)
  }

  function removeGoal(i) {
    if (goals.length <= 3) return
    const updated = goals.filter((_, idx) => idx !== i)
    setGoals(updated)
    scheduleAutoSave(updated, deepWorkDays)
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
      sundayReviewDone: field === 'sunday' ? next : sundayReviewDone,
      mondayPlanDone:   field === 'monday' ? next : mondayPlanDone,
      deepWorkDays,
      deepWorkHours: deepWorkVal,
    })
  }

  // ── Explicit full save ────────────────────────────────────────────────────
  async function handleSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    setSaving(true)
    await savePlan({ goals, reflection, sundayReviewDone, mondayPlanDone, deepWorkDays, deepWorkHours: deepWorkVal })
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
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>The 12 Week Year — Brian Moran · Deep Work — Cal Newport</div>
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

          {/* Sunday evening */}
          <div
            onClick={() => toggleRitual('sunday', sundayReviewDone, setSundayReviewDone)}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '12px 14px', borderRadius: 10, marginBottom: 8, background: sundayReviewDone ? 'rgba(34,197,94,0.07)' : 'var(--bg3)', border: `1px solid ${sundayReviewDone ? 'rgba(34,197,94,0.35)' : 'var(--border2)'}`, transition: 'all 0.15s' }}
          >
            <div className={`checkbox ${sundayReviewDone ? 'checked' : ''}`} style={{ marginTop: 2, flexShrink: 0 }}>{sundayReviewDone ? '✓' : ''}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>🌙 Sunday evening — close the week</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
                Score last week's execution · reflect on what worked · write your weekly reflection · close it out mentally before the new week begins
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: sundayReviewDone ? 'var(--green)' : 'var(--text3)', fontWeight: 600 }}>
                {sundayReviewDone ? '✓ Done this week' : 'Not done yet — end of Sunday'}
              </div>
            </div>
          </div>

          {/* Monday morning */}
          <div
            onClick={() => toggleRitual('monday', mondayPlanDone, setMondayPlanDone)}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '12px 14px', borderRadius: 10, marginBottom: 20, background: mondayPlanDone ? 'rgba(34,197,94,0.07)' : 'var(--bg3)', border: `1px solid ${mondayPlanDone ? 'rgba(34,197,94,0.35)' : 'var(--border2)'}`, transition: 'all 0.15s' }}
          >
            <div className={`checkbox ${mondayPlanDone ? 'checked' : ''}`} style={{ marginTop: 2, flexShrink: 0 }}>{mondayPlanDone ? '✓' : ''}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>☀️ Monday morning — open the week</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
                Set this week's goals · block your deep work time · review your 12-week plan · align daily actions with your goals
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: mondayPlanDone ? 'var(--green)' : 'var(--text3)', fontWeight: 600 }}>
                {mondayPlanDone ? '✓ Done this week' : 'Not done yet — Monday morning'}
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* ── Daily deep work log ── */}
          <div>
            <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600, marginBottom: 10 }}>
              ⚡ Deep work hours <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>— log each day (auto-saves)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {DAY_KEYS.map(d => {
                const isToday = d === todayDayKey
                return (
                  <div key={d} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--accent2)' : 'var(--text3)', marginBottom: 4 }}>{DAY_LABELS[d]}</div>
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

        {/* Execution score card */}
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
              <span>Goals completed (80%)</span>
              <span style={{ color: 'var(--text2)', fontWeight: 600 }}>{Math.round(goalsPct * 80)}pts</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>🌙 Sunday review (+10)</span>
              <span style={{ color: sundayReviewDone ? 'var(--green)' : 'var(--text3)', fontWeight: 600 }}>{sundayReviewDone ? '+10' : '+0'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>☀️ Monday plan (+10)</span>
              <span style={{ color: mondayPlanDone ? 'var(--green)' : 'var(--text3)', fontWeight: 600 }}>{mondayPlanDone ? '+10' : '+0'}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4, marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
              <span>Ideal Joseph target</span>
              <span style={{ color: 'var(--amber)', fontWeight: 600 }}>95%</span>
            </div>
          </div>

          {/* 12WY context note */}
          <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text2)' }}>The 12 Week Year rhythm:</strong> Sunday closes the old week. Monday opens the new one. They're separate moments — review comes first, then planning with a clear head.
          </div>
        </div>
      </div>

      {/* ── Goals this week ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div className="card-title" style={{ margin: 0 }}>Goals this week</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Default 3 · auto-saves as you type · check off when done · 🎯 links to milestones</div>
          </div>
          {goals.length < 5 && (
            <button
              onClick={addGoal}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'none', border: '1px dashed var(--border2)', color: 'var(--text3)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent2)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)' }}
            >
              + Add goal <span style={{ fontSize: 10, opacity: 0.7 }}>({goals.length}/5)</span>
            </button>
          )}
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
              <span style={{ color: i < 3 ? 'var(--text3)' : 'var(--accent2)', fontWeight: 700, fontSize: 13, width: 20, flexShrink: 0 }}>{i + 1}</span>
              <input
                value={goal.text}
                onChange={e => handleGoalChange(i, e.target.value)}
                placeholder={i < 3 ? `Goal ${i + 1} — your ONE Thing` : `Extra goal ${i + 1} (optional)`}
                style={{
                  flex: 1,
                  textDecoration: goal.done ? 'line-through' : 'none',
                  color: goal.done ? 'var(--text3)' : 'var(--text)',
                  borderColor: i >= 3 ? 'rgba(124,106,255,0.3)' : undefined,
                }}
              />
              {goalsData?.goals?.length > 0 && (
                <button
                  className="btn btn-sm"
                  title="Link a milestone from Goals"
                  onClick={() => setMilestonePicker(i)}
                  style={{ flexShrink: 0, fontSize: 11, color: goal.milestoneLinked ? 'var(--accent2)' : 'var(--text3)', borderColor: goal.milestoneLinked ? 'var(--accent)' : undefined }}
                >🎯</button>
              )}
              {i >= 3 && (
                <button
                  onClick={() => removeGoal(i)}
                  title="Remove this goal"
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0, opacity: 0.6 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
                >×</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Weekly reflection ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Weekly reflection</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, marginTop: -8 }}>
          Fill this in on Sunday evening as part of your closing ritual — before planning next week
        </div>
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
