import { useState, useMemo, useEffect, useRef } from 'react'
import { getWeekLabel, getWeekStart, formatDate } from '../lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const REFLECTION_QUESTIONS = [
  { key: 'wentWell',       label: 'What went well this week?',             placeholder: 'Wins, progress, things that clicked...' },
  { key: 'wentWrong',      label: 'What went wrong?',                      placeholder: 'Failures, missed targets, blockers...' },
  { key: 'lackDiscipline', label: 'Where did I lack discipline?',          placeholder: 'Habits skipped, distractions, weak moments...' },
  { key: 'biggestWin',     label: 'Biggest win this week?',                placeholder: "The one thing you're most proud of..." },
  { key: 'mentalState',    label: 'How was my mental state this week?',    placeholder: 'Energy, focus, mood, anxiety, clarity...' },
  { key: 'socialConnect',  label: 'Did I connect with people or isolate?', placeholder: 'Who did you reach out to? How did social feel?' },
  { key: 'improve',        label: 'What will I improve next week?',        placeholder: 'One clear commitment for next week...' },
]

// Cal Newport: 4h deep work/day × 7 days = 28h, but realistically Mon–Fri = 20h minimum viable
const DEEP_WORK_TARGET     = 28   // weekly target hours (display)
const DEEP_WORK_DAILY_GOAL = 4    // h/day ideal (Newport standard)

const DAY_KEYS   = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }

const DEFAULT_GOALS = () => [
  { text: '', done: false },
  { text: '', done: false },
  { text: '', done: false },
]

// ─── 12 Week Year Quarter Engine ──────────────────────────────────────────────

function get12WYInfo(quarterStartStr) {
  if (!quarterStartStr) return null
  const start  = new Date(quarterStartStr + 'T00:00:00')
  const today  = new Date(); today.setHours(0,0,0,0)
  const diffMs = today - start
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays < 0 || diffDays > 84) return null   // 12 weeks = 84 days

  const currentWeekNum = Math.floor(diffDays / 7) + 1   // 1-indexed
  const daysIntoWeek   = diffDays % 7
  const daysLeft       = 84 - diffDays
  const weeksLeft      = Math.ceil(daysLeft / 7)
  const pct            = Math.round((diffDays / 84) * 100)
  const isEndgame      = currentWeekNum >= 10

  return { currentWeekNum, daysIntoWeek, daysLeft, weeksLeft, pct, isEndgame, quarterStart: quarterStartStr }
}

// ─── Mid-week urgency helpers ─────────────────────────────────────────────────

function getDayOfWeek() {
  // Returns 0=Mon … 6=Sun
  const d = new Date().getDay()
  return d === 0 ? 6 : d - 1
}

function getUrgencyState(completedGoals, totalGoals, deepWorkVal, dayOfWeek) {
  const daysPassed  = dayOfWeek          // 0 = Monday just started
  const daysLeft    = 6 - dayOfWeek     // days remaining including today
  const goalPct     = totalGoals > 0 ? completedGoals / totalGoals : 0
  const dwDailyPace = daysPassed > 0 ? deepWorkVal / daysPassed : deepWorkVal
  const projectedDW = dwDailyPace * 7

  // Urgency level: 'good' | 'caution' | 'danger'
  let level = 'good'
  const flags = []

  if (goalPct < 0.5 && dayOfWeek >= 3) { level = 'danger'; flags.push('goals_behind') }
  else if (goalPct < 0.3 && dayOfWeek >= 1) { if (level === 'good') level = 'caution'; flags.push('goals_slow') }

  if (projectedDW < DEEP_WORK_TARGET * 0.7 && daysPassed >= 2) {
    if (level !== 'danger') level = 'caution'
    flags.push('deep_work_pace_low')
  }
  if (deepWorkVal === 0 && dayOfWeek >= 2) { level = 'danger'; flags.push('no_deep_work') }

  return { level, flags, daysLeft, dwDailyPace, projectedDW: Math.round(projectedDW * 10) / 10 }
}

// ─── Past-week edit modal ─────────────────────────────────────────────────────

function PastWeekModal({ weekStart, plan, onClose, onSave }) {
  const [goals,            setGoals]          = useState(plan?.goals?.length ? plan.goals : DEFAULT_GOALS())
  const [reflection,       setReflection]     = useState(plan?.reflection || {})
  const [sundayReviewDone, setSunday]         = useState(plan?.sundayReviewDone ?? plan?.sundayPlanDone ?? false)
  const [mondayPlanDone,   setMonday]         = useState(plan?.mondayPlanDone   ?? plan?.fridayReviewDone ?? false)
  const [deepWorkDays,     setDeepWorkDays]   = useState(plan?.deepWorkDays || {})
  const [saving,           setSaving]         = useState(false)

  const deepWorkVal = Object.values(deepWorkDays).reduce((s, v) => s + (parseFloat(v) || 0), 0)

  async function handleSave() {
    setSaving(true)
    await onSave(weekStart, {
      goals, reflection, sundayReviewDone, mondayPlanDone, deepWorkDays,
      deepWorkHours: deepWorkVal,
    })
    setSaving(false)
    onClose()
  }

  function setRef(key, val) { setReflection(r => ({ ...r, [key]: val })) }
  function addGoal()    { if (goals.length < 5) setGoals(g => [...g, { text: '', done: false }]) }
  function removeGoal(i){ if (goals.length > 3) setGoals(g => g.filter((_, idx) => idx !== i)) }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">✏️ Edit week — {getWeekLabel(weekStart)}</div>

        <div className="form-group">
          <label>Weekly rituals</label>
          {[
            { label: '🌙 Sunday evening review', sub: 'Score last week · close it out mentally', val: sundayReviewDone, set: setSunday },
            { label: '☀️ Monday morning plan',   sub: "Set this week's goals · block deep work",  val: mondayPlanDone,   set: setMonday },
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
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text3)' }}>Total: <strong style={{ color: 'var(--text)' }}>{deepWorkVal.toFixed(1)}h</strong> / {DEEP_WORK_TARGET}h target</div>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ margin: 0 }}>Goals this week <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(3–5)</span></label>
            {goals.length < 5 && (
              <button onClick={addGoal} style={{ background: 'none', border: '1px dashed var(--border2)', borderRadius: 6, color: 'var(--text3)', fontSize: 12, padding: '2px 10px', cursor: 'pointer' }}>+ Add</button>
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
                <button onClick={() => removeGoal(i)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, padding: '0 2px' }}>×</button>
              )}
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
    const d   = new Date(dateStr)
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
  const editingPlan      = editWeek ? planByWeekStart[editWeek] : null

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
    const done      = goals.filter(g => g.done).length
    const exec      = Math.round((done / goals.length) * 100)
    const sunDone   = plan.sundayReviewDone ?? plan.sundayPlanDone ?? false
    const monDone   = plan.mondayPlanDone   ?? plan.fridayReviewDone ?? false
    const bonus     = (sunDone ? 10 : 0) + (monDone ? 10 : 0)
    const dwHours   = plan.deepWorkHours || 0
    const dwScore   = Math.min(100, Math.round((dwHours / DEEP_WORK_TARGET) * 100))
    return Math.min(100, Math.round(exec * 0.65 + bonus + dwScore * 0.15))
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
          const ws      = weekStartFor(dateStr)
          const plan    = planByWeekStart[ws]
          const score   = weekScore(plan)
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
          const plan    = planByWeekStart[ws]
          const score   = weekScore(plan)
          const isCurrentWeek = ws === currentWeekStart
          const isExpanded    = expandedWeek === ws
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
  const activeGoals = goals.filter(g => g.status === 'active').map(goal => ({
    ...goal,
    pendingMilestones: (goal.milestones || []).filter(m => !m.done),
  })).filter(g => g.pendingMilestones.length > 0)

  const totalMilestones = activeGoals.reduce((acc, g) => acc + g.pendingMilestones.length, 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">🎯 Link a milestone as your weekly goal</div>
        {totalMilestones === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '24px 0' }}>
            No pending milestones found.<br />Add milestones in your Goals section first.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 420, overflowY: 'auto' }}>
            {activeGoals.map(goal => (
              <div key={goal.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent2)', whiteSpace: 'nowrap', padding: '0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    🎯 {goal.title}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {goal.pendingMilestones.map((m, i) => {
                    const tasks    = m.tasks || []
                    const done     = tasks.filter(t => t.done).length
                    const tasksPct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : null
                    return (
                      <div
                        key={i}
                        onClick={() => { onSelect(m.text, goal.id, goal.title); onClose() }}
                        style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', background: 'var(--bg3)', border: '1px solid var(--border2)', transition: 'border-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                      >
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{m.text}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          {m.dueDate && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Due {m.dueDate}</span>}
                          {tasksPct !== null && (
                            <span style={{ fontSize: 11, color: tasksPct === 100 ? 'var(--green)' : 'var(--amber)', fontWeight: 600 }}>
                              {done}/{tasks.length} tasks done
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
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

// ─── 12WY Quarter Setup Modal ─────────────────────────────────────────────────

function QuarterSetupModal({ onSave, onClose }) {
  const [dateInput, setDateInput] = useState('')
  const [error,     setError]     = useState('')

  function handleSave() {
    if (!dateInput) { setError('Please pick a start date.'); return }
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) { setError('Invalid date.'); return }
    onSave(dateInput)
    onClose()
  }

  // Quick presets
  const today = new Date()
  const thisMonday = (() => {
    const d = new Date(today)
    const day = d.getDay()
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    return d.toISOString().split('T')[0]
  })()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">📆 Set your 12 Week Year quarter</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.6 }}>
          Pick the Monday your current 12-week sprint started. This unlocks the quarter progress bar and urgency tracking.
        </div>
        <div className="form-group">
          <label>Quarter start date (Monday)</label>
          <input type="date" value={dateInput} onChange={e => { setDateInput(e.target.value); setError('') }} style={{ fontSize: 14 }} />
          {error && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>{error}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className="btn btn-sm" onClick={() => setDateInput(thisMonday)}>This Monday</button>
          <button className="btn btn-sm" onClick={() => {
            const d = new Date(today); d.setDate(d.getDate() - 28)
            const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
            setDateInput(d.toISOString().split('T')[0])
          }}>4 weeks ago</button>
          <button className="btn btn-sm" onClick={() => {
            const d = new Date(today); d.setDate(d.getDate() - 56)
            const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
            setDateInput(d.toISOString().split('T')[0])
          }}>8 weeks ago</button>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Set quarter start</button>
        </div>
      </div>
    </div>
  )
}

// ─── 12WY Quarter Progress Bar ────────────────────────────────────────────────

function QuarterBar({ qInfo, onSetup }) {
  if (!qInfo) {
    return (
      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg3)', border: '1px dashed var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>📆 12 Week Year — Quarter not set</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Set your quarter start to unlock urgency tracking and week-in-sprint counter</div>
        </div>
        <button className="btn btn-sm" onClick={onSetup} style={{ fontWeight: 700 }}>Set quarter start →</button>
      </div>
    )
  }

  const { currentWeekNum, pct, weeksLeft, isEndgame } = qInfo
  const barColor = isEndgame
    ? 'linear-gradient(90deg, #ef4444, #f97316)'
    : pct >= 50
    ? 'linear-gradient(90deg, var(--accent), #c084fc)'
    : 'linear-gradient(90deg, #22c55e, var(--accent))'

  const urgencyMsg = isEndgame
    ? `⚠️ Final stretch — ${weeksLeft} week${weeksLeft !== 1 ? 's' : ''} left. No wasted days.`
    : weeksLeft <= 4
    ? `🔥 ${weeksLeft} weeks left — time to accelerate.`
    : `✅ On track — ${weeksLeft} weeks remaining in the sprint.`

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 12,
      background: isEndgame ? 'rgba(239,68,68,0.06)' : 'rgba(124,106,255,0.05)',
      border: `1px solid ${isEndgame ? 'rgba(239,68,68,0.25)' : 'rgba(124,106,255,0.2)'}`,
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28, fontWeight: 800,
            color: isEndgame ? '#ef4444' : 'var(--accent2)',
            lineHeight: 1,
          }}>
            W{currentWeekNum}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              Week {currentWeekNum} of 12 &nbsp;·&nbsp; 12 Week Year
            </div>
            <div style={{ fontSize: 12, color: isEndgame ? '#ef4444' : 'var(--text3)', marginTop: 1, fontWeight: isEndgame ? 700 : 400 }}>
              {urgencyMsg}
            </div>
          </div>
        </div>
        <button className="btn btn-sm" onClick={onSetup} style={{ fontSize: 11 }}>Reset quarter</button>
      </div>

      {/* Progress bar — 12 week segments */}
      <div style={{ position: 'relative', height: 20, background: 'var(--bg3)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {/* Segment ticks */}
        {[1,2,3,4,5,6,7,8,9,10,11].map(n => (
          <div key={n} style={{
            position: 'absolute', left: `${(n/12)*100}%`, top: 0, bottom: 0,
            width: 1, background: 'rgba(255,255,255,0.08)', zIndex: 2,
          }} />
        ))}
        {/* Fill */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct}%`,
          background: barColor,
          borderRadius: 10,
          transition: 'width 0.5s ease',
          zIndex: 1,
        }} />
        {/* Week labels */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', zIndex: 3 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 700,
              color: (i + 1) < currentWeekNum ? 'rgba(255,255,255,0.7)' : (i + 1) === currentWeekNum ? '#fff' : 'rgba(255,255,255,0.25)',
            }}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: 'var(--text3)' }}>
        <span>Sprint start</span>
        <span style={{ color: isEndgame ? '#ef4444' : 'var(--text3)', fontWeight: isEndgame ? 700 : 400 }}>Sprint end — Week 12</span>
      </div>
    </div>
  )
}

// ─── Mid-week urgency panel ───────────────────────────────────────────────────

function UrgencyPanel({ completedGoals, totalGoals, deepWorkVal, dayOfWeek }) {
  const urgency = useMemo(
    () => getUrgencyState(completedGoals, totalGoals, deepWorkVal, dayOfWeek),
    [completedGoals, totalGoals, deepWorkVal, dayOfWeek]
  )

  // Only show from Tuesday onwards — Monday is too early to be useful
  if (dayOfWeek < 1 || totalGoals === 0) return null

  const { level, flags, daysLeft, projectedDW } = urgency

  const colors = {
    good:    { bg: 'rgba(34,197,94,0.06)',   border: 'rgba(34,197,94,0.25)',   icon: '✅', label: 'On track' },
    caution: { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.3)',   icon: '⚠️', label: 'Caution' },
    danger:  { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.3)',    icon: '🚨', label: 'At risk' },
  }

  const c = colors[level]
  const dayName = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][dayOfWeek]

  const messages = {
    goals_behind:     `It's ${dayName} and ${totalGoals - completedGoals} goal${totalGoals - completedGoals !== 1 ? 's' : ''} still unfinished. Sunday is ${daysLeft} day${daysLeft !== 1 ? 's' : ''} away.`,
    goals_slow:       `You've completed ${completedGoals} of ${totalGoals} goals so far. Good start — keep the momentum.`,
    deep_work_pace_low: `At current pace, you'll hit ~${projectedDW}h deep work this week — below the ${DEEP_WORK_TARGET}h target. Block more time now.`,
    no_deep_work:     `No deep work logged yet this week. Block a session today — even 1 hour counts.`,
  }

  const primaryFlag = flags[0]

  return (
    <div style={{
      padding: '12px 16px', borderRadius: 10,
      background: c.bg, border: `1px solid ${c.border}`,
      marginBottom: 16,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
          {c.label} — {dayName} check-in
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
          {primaryFlag ? messages[primaryFlag] : `${completedGoals}/${totalGoals} goals done · ${deepWorkVal.toFixed(1)}h deep work · ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left.`}
        </div>
        {flags.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {flags.slice(1).map(f => (
              <span key={f} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text3)' }}>
                {f === 'deep_work_pace_low' ? '⚡ DW pace low' : f === 'no_deep_work' ? '⚡ No DW yet' : f}
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', color: level === 'danger' ? '#ef4444' : level === 'caution' ? '#f59e0b' : 'var(--green)', lineHeight: 1 }}>
          {daysLeft}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>days left</div>
      </div>
    </div>
  )
}

// ─── Deep work daily tracker ──────────────────────────────────────────────────

function DeepWorkTracker({ deepWorkDays, onChange, todayDayKey }) {
  const weeklyTotal = Object.values(deepWorkDays).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const weeklyPct   = Math.min(100, Math.round((weeklyTotal / DEEP_WORK_TARGET) * 100))
  const weeklyColor = weeklyPct >= 100 ? 'var(--green)' : weeklyPct >= 65 ? 'var(--amber)' : 'var(--red)'

  // Days elapsed this week (to compute pace)
  const dayIdx      = getDayOfWeek()  // 0=Mon
  const daysPassed  = dayIdx + 1
  const pacePerDay  = daysPassed > 0 ? weeklyTotal / daysPassed : 0
  const projected   = Math.round(pacePerDay * 7 * 10) / 10

  return (
    <div>
      {/* Newport framing */}
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, lineHeight: 1.6, padding: '8px 10px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
        <strong style={{ color: 'var(--text2)' }}>Cal Newport:</strong> Deep work = cognitively demanding tasks done in distraction-free blocks. Target <strong style={{ color: 'var(--text)' }}>{DEEP_WORK_DAILY_GOAL}h/day</strong> of zero-interruption focus. Log honestly — shallow work doesn't count.
      </div>

      {/* Daily cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 12 }}>
        {DAY_KEYS.map(d => {
          const val      = parseFloat(deepWorkDays[d] || 0)
          const isToday  = d === todayDayKey
          const isPast   = DAY_KEYS.indexOf(d) < DAY_KEYS.indexOf(todayDayKey)
          const pct      = Math.min(100, (val / DEEP_WORK_DAILY_GOAL) * 100)
          const cellColor = val === 0 && isPast ? 'var(--red)' : pct >= 100 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--text3)'

          return (
            <div key={d} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 11, fontWeight: isToday ? 700 : 400,
                color: isToday ? 'var(--accent2)' : 'var(--text3)',
                marginBottom: 4,
              }}>{DAY_LABELS[d]}</div>

              {/* Mini progress ring / bar behind input */}
              <div style={{ position: 'relative' }}>
                <input
                  type="number" min="0" max="16" step="0.5"
                  value={deepWorkDays[d] || ''}
                  onChange={e => onChange(d, e.target.value)}
                  placeholder="0"
                  style={{
                    padding: '7px 2px', textAlign: 'center', fontSize: 13, width: '100%',
                    borderColor: isToday ? 'var(--accent)' : val > 0 ? cellColor : undefined,
                    color: val > 0 ? cellColor : undefined,
                    fontWeight: val >= DEEP_WORK_DAILY_GOAL ? 800 : 400,
                    background: val >= DEEP_WORK_DAILY_GOAL ? 'rgba(34,197,94,0.06)' : val > 0 && isPast && val < DEEP_WORK_DAILY_GOAL * 0.5 ? 'rgba(239,68,68,0.04)' : undefined,
                  }}
                />
                {/* Target hit badge */}
                {val >= DEEP_WORK_DAILY_GOAL && (
                  <div style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 8, color: '#fff' }}>✓</span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 9, color: cellColor, marginTop: 3, fontWeight: 600 }}>
                {val > 0 ? `${pct >= 100 ? '✓' : `${Math.round(pct)}%`}` : isPast ? '—' : `/${DEEP_WORK_DAILY_GOAL}h`}
              </div>
            </div>
          )
        })}
      </div>

      {/* Weekly summary bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
          <span style={{ color: weeklyColor, fontWeight: 700 }}>{weeklyTotal.toFixed(1)}h logged</span>
          <span style={{ color: 'var(--text3)' }}>Target: {DEEP_WORK_TARGET}h &nbsp;·&nbsp; Projected: <span style={{ color: projected >= DEEP_WORK_TARGET ? 'var(--green)' : 'var(--amber)', fontWeight: 600 }}>{projected}h</span></span>
        </div>
        <div className="progress-bar" style={{ height: 10, borderRadius: 6 }}>
          <div className="progress-fill" style={{ width: `${weeklyPct}%`, background: weeklyColor, borderRadius: 6, transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: 'var(--text3)' }}>
          <span>{weeklyPct}% of target</span>
          <span style={{ color: weeklyPct >= 100 ? 'var(--green)' : 'var(--amber)', fontWeight: 600 }}>
            {weeklyPct >= 100 ? '✓ Target hit!' : `${(DEEP_WORK_TARGET - weeklyTotal).toFixed(1)}h to go`}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function WeeklyView({ plans, loading, getCurrentPlan, savePlan, savePlanForWeek, updatePlan, deletePlan, getWeekScore, goalsData }) {
  const currentPlan  = getCurrentPlan()
  const weekLabel    = getWeekLabel(getWeekStart())
  const weekScore    = getWeekScore()

  const [goals,            setGoals]            = useState(DEFAULT_GOALS())
  const [reflection,       setReflection]       = useState({})
  const [sundayReviewDone, setSundayReviewDone] = useState(false)
  const [mondayPlanDone,   setMondayPlanDone]   = useState(false)
  const [deepWorkDays,     setDeepWorkDays]     = useState({})
  const [showHistory,      setShowHistory]      = useState(false)
  const [saving,           setSaving]           = useState(false)
  const [saved,            setSaved]            = useState(false)
  const [milestonePicker,  setMilestonePicker]  = useState(null)
  const [quarterStart,     setQuarterStart]     = useState(() => localStorage.getItem('lo_12wy_quarterStart') || null)
  const [quarterSetupOpen, setQuarterSetupOpen] = useState(false)

  const autoSaveTimer = useRef(null)

  // ── Sync local state when plan loads ──────────────────────────────────────
  useEffect(() => {
    if (!currentPlan) return
    setGoals(currentPlan.goals?.length ? currentPlan.goals : DEFAULT_GOALS())
    setReflection(currentPlan.reflection || {})
    setSundayReviewDone(currentPlan.sundayReviewDone ?? currentPlan.sundayPlanDone ?? false)
    setMondayPlanDone(currentPlan.mondayPlanDone     ?? currentPlan.fridayReviewDone ?? false)
    if (currentPlan.deepWorkDays) {
      setDeepWorkDays(currentPlan.deepWorkDays)
    } else if (currentPlan.deepWorkHours != null && currentPlan.deepWorkHours > 0) {
      setDeepWorkDays({ mon: String(currentPlan.deepWorkHours) })
    }
  }, [currentPlan?.id])

  // ── Derived values ────────────────────────────────────────────────────────
  const deepWorkVal    = Object.values(deepWorkDays).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const deepWorkPct    = Math.min(100, Math.round((deepWorkVal / DEEP_WORK_TARGET) * 100))

  const completedGoals = goals.filter(g => g.done && g.text).length
  const totalGoals     = goals.filter(g => g.text).length
  const goalsPct       = totalGoals > 0 ? completedGoals / totalGoals : 0
  const ritualBonus    = (sundayReviewDone ? 10 : 0) + (mondayPlanDone ? 10 : 0)
  const dwScore        = Math.min(100, Math.round((deepWorkVal / DEEP_WORK_TARGET) * 100))
  // Updated score formula: goals 65% + rituals 20% + deep work 15%
  const executionPct   = Math.min(100, Math.round(goalsPct * 65 + ritualBonus + dwScore * 0.15))

  const todayDayKey    = ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()]
  const dayOfWeek      = getDayOfWeek()

  // 12WY quarter info
  const qInfo = useMemo(() => get12WYInfo(quarterStart), [quarterStart])

  // Live goal progress lookup from goalsData
  const goalProgressMap = useMemo(() => {
    const map = {}
    if (!goalsData?.goals) return map
    goalsData.goals.forEach(g => {
      map[g.id] = { progress: g.progress || 0, title: g.title }
      ;(g.milestones || []).forEach(m => {
        if (m.text) map[`m:${m.text}`] = { progress: m.done ? 100 : (() => {
          const tasks  = m.tasks || []
          if (!tasks.length) return 0
          return Math.round((tasks.filter(t => t.done).length / tasks.length) * 100)
        })(), goalTitle: g.title }
      })
    })
    return map
  }, [goalsData?.goals])

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

  function handleGoalChangeWithLink(i, text) {
    const updated = goals.map((g, idx) => idx === i ? { ...g, text, milestoneLinked: false, linkedGoalId: null } : g)
    setGoals(updated)
    scheduleAutoSave(updated, deepWorkDays)
  }

  function setReflectionField(key, value) {
    setReflection(prev => ({ ...prev, [key]: value }))
  }

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

  async function handleSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    setSaving(true)
    await savePlan({ goals, reflection, sundayReviewDone, mondayPlanDone, deepWorkDays, deepWorkHours: deepWorkVal })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function toggleGoalDone(index) {
    const updated = goals.map((g, i) => i === index ? { ...g, done: !g.done } : g)
    setGoals(updated)
    if (currentPlan) await updatePlan(currentPlan.id, { goals: updated })
  }

  function saveQuarterStart(dateStr) {
    setQuarterStart(dateStr)
    localStorage.setItem('lo_12wy_quarterStart', dateStr)
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

      {/* ── 12 Week Year quarter bar ── */}
      <QuarterBar qInfo={qInfo} onSetup={() => setQuarterSetupOpen(true)} />

      {/* ── Mid-week urgency panel ── */}
      <UrgencyPanel
        completedGoals={completedGoals}
        totalGoals={totalGoals}
        deepWorkVal={deepWorkVal}
        dayOfWeek={dayOfWeek}
      />

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

          {/* ── Deep work tracker ── */}
          <div>
            <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600, marginBottom: 10 }}>
              ⚡ Deep work — log by day
            </div>
            <DeepWorkTracker
              deepWorkDays={deepWorkDays}
              onChange={handleDeepWorkChange}
              todayDayKey={todayDayKey}
            />
          </div>
        </div>

        {/* ── Execution score card ── */}
        <div className="card">
          <div className="card-title">Execution score</div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 800, lineHeight: 1, color: executionPct >= 80 ? 'var(--green)' : executionPct >= 50 ? 'var(--amber)' : 'var(--text3)' }}>
              {executionPct}%
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>{completedGoals}/{totalGoals} goals · {deepWorkVal.toFixed(1)}h deep work</div>
          </div>
          <div className="progress-bar" style={{ height: 8, marginBottom: 8 }}>
            <div className="progress-fill" style={{ width: `${executionPct}%`, background: executionPct >= 80 ? 'var(--green)' : 'var(--amber)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text3)' }}>
            {/* Goals */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Goals completed (65%)</span>
              <span style={{ color: 'var(--text2)', fontWeight: 600 }}>{Math.round(goalsPct * 65)}pts</span>
            </div>
            {/* Deep work */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>⚡ Deep work — {deepWorkVal.toFixed(1)}h/{DEEP_WORK_TARGET}h (15%)</span>
              <span style={{ color: deepWorkPct >= 100 ? 'var(--green)' : deepWorkPct > 0 ? 'var(--amber)' : 'var(--text3)', fontWeight: 600 }}>{Math.round(dwScore * 0.15)}pts</span>
            </div>
            {/* Rituals */}
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
            <strong style={{ color: 'var(--text2)' }}>The 12 Week Year rhythm:</strong> Sunday closes the old week. Monday opens the new one. They're separate moments — review comes first, then planning with a clear head. Each week is a <em>mini-execution sprint</em> inside your 12-week goal.
          </div>

          {/* Deep work framing */}
          <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, background: 'rgba(124,106,255,0.05)', border: '1px solid rgba(124,106,255,0.15)', fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text2)' }}>Deep Work (Newport):</strong> Undistracted, cognitively demanding work is what moves the needle on your goals. It now counts for <strong style={{ color: 'var(--accent2)' }}>15% of your score</strong> — because logging it and doing it are two different things.
          </div>
        </div>
      </div>

      {/* ── Goals this week ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div className="card-title" style={{ margin: 0 }}>Goals this week</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
              3 goals minimum · 🎯 links to a milestone · live progress shown · check off when done
            </div>
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
          {goals.map((goal, i) => {
            // Look up live milestone progress if linked
            const liveData = goal.milestoneLinked && goal.text ? goalProgressMap[`m:${goal.text}`] : null
            const liveGoalData = goal.linkedGoalId ? goalProgressMap[goal.linkedGoalId] : null
            const liveProgress = liveData?.progress ?? (liveGoalData?.progress ?? null)

            return (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                    onChange={e => handleGoalChangeWithLink(i, e.target.value)}
                    placeholder={i < 3 ? `Goal ${i + 1} — make it specific and completable` : `Extra goal ${i + 1} (optional)`}
                    style={{
                      flex: 1,
                      textDecoration: goal.done ? 'line-through' : 'none',
                      color: goal.done ? 'var(--text3)' : 'var(--text)',
                      borderColor: i >= 3 ? 'rgba(124,106,255,0.3)' : goal.milestoneLinked ? 'var(--accent)' : undefined,
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

                {/* Live milestone progress strip */}
                {goal.milestoneLinked && goal.text && liveProgress !== null && (
                  <div style={{ marginLeft: 52, marginTop: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${liveProgress}%`,
                          background: liveProgress >= 100 ? 'var(--green)' : liveProgress >= 50 ? 'var(--accent)' : 'var(--amber)',
                          borderRadius: 3, transition: 'width 0.3s ease',
                        }} />
                      </div>
                      <span style={{ fontSize: 10, color: liveProgress >= 100 ? 'var(--green)' : 'var(--text3)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {liveProgress === 100 ? '✓ Milestone done' : `${liveProgress}% in Goals`}
                      </span>
                    </div>
                    {liveData?.goalTitle && (
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                        → {liveData.goalTitle}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Completion summary */}
        {totalGoals > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.round(goalsPct * 100)}%`,
                background: goalsPct >= 1 ? 'var(--green)' : goalsPct >= 0.5 ? 'var(--accent)' : 'var(--amber)',
                borderRadius: 4, transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
              {completedGoals}/{totalGoals} done
            </span>
            {completedGoals === totalGoals && totalGoals > 0 && (
              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>🎉 Week complete!</span>
            )}
          </div>
        )}
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
          onSelect={(text, goalId, goalTitle) => {
            const updated = goals.map((g, idx) => idx === milestonePicker
              ? { ...g, text, milestoneLinked: true, linkedGoalId: goalId || null }
              : g
            )
            setGoals(updated)
            scheduleAutoSave(updated, deepWorkDays)
            setMilestonePicker(null)
          }}
          onClose={() => setMilestonePicker(null)}
        />
      )}

      {/* ── Quarter setup modal ── */}
      {quarterSetupOpen && (
        <QuarterSetupModal
          onSave={saveQuarterStart}
          onClose={() => setQuarterSetupOpen(false)}
        />
      )}
    </div>
  )
}
