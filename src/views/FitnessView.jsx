import { useState, useMemo } from 'react'
import { formatDate, scoreColor, getWeekStart } from '../lib/utils'

// ─── Workout type config ──────────────────────────────────────────────────────

const HUBERMAN_TYPES = [
  { value: 'resistance', label: 'Resistance training', icon: '🏋️', color: '#3b82f6' },
  { value: 'zone2',      label: 'Zone 2 cardio',        icon: '🫀', color: '#3b82f6' },
  { value: 'hiit',       label: 'HIIT',                  icon: '⚡', color: '#3b82f6' },
]

const SECONDARY_TYPES = [
  { value: 'jogging',         label: 'Jogging',              icon: '🏃', color: '#f97316', calisthenics: false },
  { value: 'pullups',         label: 'Calisthenics: Pull-ups', icon: '🔝', color: '#f97316', calisthenics: true  },
  { value: 'pushups',         label: 'Calisthenics: Push-ups', icon: '💪', color: '#f97316', calisthenics: true  },
  { value: 'dips',            label: 'Calisthenics: Dips',    icon: '🤸', color: '#f97316', calisthenics: true  },
  { value: 'situps',          label: 'Calisthenics: Sit-ups', icon: '🧘', color: '#f97316', calisthenics: true  },
  { value: 'walk',            label: 'Walk',                  icon: '🚶', color: '#f97316', calisthenics: false },
  { value: 'sport',           label: 'Sport / activity',      icon: '⚽', color: '#f97316', calisthenics: false },
  { value: 'other',           label: 'Other',                 icon: '🏃', color: '#f97316', calisthenics: false },
]

const ALL_TYPES = [...HUBERMAN_TYPES, ...SECONDARY_TYPES]

function getTypeInfo(value) {
  return ALL_TYPES.find(t => t.value === value) || { label: value, icon: '🏃', color: '#f97316', calisthenics: false }
}

function isHuberman(type) { return HUBERMAN_TYPES.some(t => t.value === type) }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

function getWeekStartFor(dateStr) {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getLast12WeekStarts() {
  const starts = []
  for (let i = 0; i < 12; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i * 7)
    starts.push(getWeekStartFor(d.toISOString().split('T')[0]))
  }
  return [...new Set(starts)].sort((a, b) => b.localeCompare(a))
}

function getWeekLabel(weekStart) {
  const s = new Date(weekStart)
  const e = new Date(weekStart)
  e.setDate(e.getDate() + 6)
  const o = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString('en-US', o)} – ${e.toLocaleDateString('en-US', o)}`
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function WorkoutModal({ onClose, onSave, editWorkout }) {
  const [type,     setType]     = useState(editWorkout?.type     || 'resistance')
  const [duration, setDuration] = useState(editWorkout?.duration?.toString() || '')
  const [reps,     setReps]     = useState(editWorkout?.reps?.toString()     || '')
  const [notes,    setNotes]    = useState(editWorkout?.notes    || '')
  const [date,     setDate]     = useState(editWorkout?.date     || formatDate())

  const isCalisthenics = getTypeInfo(type).calisthenics

  function handleSave() {
    const data = {
      type,
      duration: parseInt(duration) || 0,
      notes,
      date,
      ...(isCalisthenics ? { reps: parseInt(reps) || 0 } : {}),
    }
    onSave(data)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{editWorkout ? 'Edit workout' : 'Log workout'}</div>

        {/* Primary */}
        <div className="form-group">
          <label style={{ fontWeight: 700, color: '#3b82f6', marginBottom: 6 }}>Primary — Huberman Protocols</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {HUBERMAN_TYPES.map(t => (
              <div key={t.value} onClick={() => setType(t.value)} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', background: type === t.value ? '#3b82f620' : 'var(--bg3)', border: `1px solid ${type === t.value ? '#3b82f6' : 'transparent'}` }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${type === t.value ? '#3b82f6' : 'var(--border2)'}`, background: type === t.value ? '#3b82f6' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {type === t.value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{t.icon}</span>
                <span style={{ fontSize: 14, fontWeight: type === t.value ? 600 : 400, color: type === t.value ? '#3b82f6' : 'var(--text)' }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary */}
        <div className="form-group">
          <label style={{ fontWeight: 700, color: '#f97316', marginBottom: 6 }}>Secondary — Personal Training</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SECONDARY_TYPES.map(t => (
              <div key={t.value} onClick={() => setType(t.value)} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', background: type === t.value ? '#f9731620' : 'var(--bg3)', border: `1px solid ${type === t.value ? '#f97316' : 'transparent'}` }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${type === t.value ? '#f97316' : 'var(--border2)'}`, background: type === t.value ? '#f97316' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {type === t.value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{t.icon}</span>
                <span style={{ fontSize: 14, fontWeight: type === t.value ? 600 : 400, color: type === t.value ? '#f97316' : 'var(--text)' }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Duration (mins)</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="45" min="1" />
          </div>
          {isCalisthenics && (
            <div className="form-group">
              <label>Reps</label>
              <input type="number" value={reps} onChange={e => setReps(e.target.value)} placeholder="e.g. 15" min="1" />
            </div>
          )}
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Notes (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Upper body push day" />
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{editWorkout ? 'Update' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

function MetricsModal({ onClose, onSave }) {
  const [weight, setWeight] = useState('')
  const [sleep,  setSleep]  = useState('')
  const [water,  setWater]  = useState('')
  const [energy, setEnergy] = useState('3')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Log today's metrics</div>
        <div className="form-row">
          <div className="form-group">
            <label>Weight (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70.5" step="0.1" />
          </div>
          <div className="form-group">
            <label>Sleep (hours)</label>
            <input type="number" value={sleep} onChange={e => setSleep(e.target.value)} placeholder="7.5" step="0.5" min="0" max="12" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Water (litres)</label>
            <input type="number" value={water} onChange={e => setWater(e.target.value)} placeholder="2.5" step="0.25" min="0" max="6" />
          </div>
          <div className="form-group">
            <label>Energy level (1–5)</label>
            <select value={energy} onChange={e => setEnergy(e.target.value)}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} — {['Very low','Low','Average','High','Peak'][n-1]}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            onSave({ weight: parseFloat(weight)||null, sleep: parseFloat(sleep)||null, water: parseFloat(water)||null, energy: parseInt(energy) })
            onClose()
          }}>Save metrics</button>
        </div>
      </div>
    </div>
  )
}

const MEALS     = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const PROTEINS  = [{ value: 'high', label: 'High', color: '#22c55e' }, { value: 'medium', label: 'Medium', color: '#f59e0b' }, { value: 'low', label: 'Low', color: '#ef4444' }]
const QUALITIES = [{ value: 'green', label: '🟢 Whole foods', color: '#22c55e' }, { value: 'amber', label: '🟡 Mixed', color: '#f59e0b' }, { value: 'red', label: '🔴 Processed', color: '#ef4444' }]

function FoodModal({ onClose, onSave, editEntry }) {
  const [meal,    setMeal]    = useState(editEntry?.meal    || 'Breakfast')
  const [skipped, setSkipped] = useState(editEntry?.skipped || false)
  const [reason,  setReason]  = useState(editEntry?.reason  || '')
  const [what,    setWhat]    = useState(editEntry?.what    || '')
  const [protein, setProtein] = useState(editEntry?.protein || 'medium')
  const [quality, setQuality] = useState(editEntry?.quality || 'green')
  const [felt,    setFelt]    = useState(editEntry?.felt    || '')
  const [date,    setDate]    = useState(editEntry?.date    || formatDate())

  function handleSave() {
    if (skipped) {
      onSave({ meal, skipped: true, reason: reason.trim(), date })
    } else {
      if (!what.trim()) return
      onSave({ meal, skipped: false, what: what.trim(), protein, quality, felt, date })
    }
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{editEntry ? 'Edit food entry' : 'Log meal'}</div>

        <div className="form-row">
          <div className="form-group">
            <label>Meal</label>
            <select value={meal} onChange={e => setMeal(e.target.value)}>
              {MEALS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        {/* Skipped toggle */}
        <div className="form-group">
          <div
            onClick={() => setSkipped(s => !s)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', background: skipped ? 'rgba(148,163,184,0.1)' : 'var(--bg3)', border: `1px solid ${skipped ? '#64748b' : 'var(--border2)'}` }}
          >
            <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${skipped ? '#64748b' : 'var(--border2)'}`, background: skipped ? '#64748b' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {skipped && <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span>}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: skipped ? '#94a3b8' : 'var(--text)' }}>⊘ I skipped this meal</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Intermittent fasting, not hungry, busy, etc.</div>
            </div>
          </div>
        </div>

        {skipped ? (
          <div className="form-group">
            <label>Reason (optional)</label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder='e.g. "intermittent fasting", "not hungry", "too busy"' autoFocus />
          </div>
        ) : (
          <>
            <div className="form-group">
              <label>What you ate</label>
              <input value={what} onChange={e => setWhat(e.target.value)} placeholder="e.g. Chicken, rice, broccoli" autoFocus />
            </div>

            <div className="form-group">
              <label>Protein estimate</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {PROTEINS.map(p => (
                  <button key={p.value} onClick={() => setProtein(p.value)} style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    border: `2px solid ${protein === p.value ? p.color : 'var(--border2)'}`,
                    background: protein === p.value ? p.color + '22' : 'var(--bg3)',
                    color: protein === p.value ? p.color : 'var(--text3)',
                  }}>{p.label}</button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Meal quality</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {QUALITIES.map(q => (
                  <button key={q.value} onClick={() => setQuality(q.value)} style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    border: `2px solid ${quality === q.value ? q.color : 'var(--border2)'}`,
                    background: quality === q.value ? q.color + '22' : 'var(--bg3)',
                    color: quality === q.value ? q.color : 'var(--text3)',
                  }}>{q.label}</button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>How did you feel after? (optional)</label>
              <input value={felt} onChange={e => setFelt(e.target.value)} placeholder='e.g. "energized", "bloated", "focused"' />
            </div>
          </>
        )}

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{editEntry ? 'Update' : skipped ? 'Log skipped meal' : 'Log meal'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── History sub-components ───────────────────────────────────────────────────

function CalendarView({ workouts, updateWorkout, deleteWorkout }) {
  const now   = new Date()
  const [year,      setYear]      = useState(now.getFullYear())
  const [month,     setMonth]     = useState(now.getMonth())
  const [dayPopup,  setDayPopup]  = useState(null)
  const [editWorkout, setEditWorkout] = useState(null) // workout object to edit

  const { firstDay, daysInMonth } = getMonthDays(year, month)
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const workoutsByDay = useMemo(() => {
    const map = {}
    workouts.forEach(w => {
      if (!map[w.date]) map[w.date] = []
      map[w.date].push(w)
    })
    return map
  }, [workouts])

  const blanks = firstDay === 0 ? 6 : firstDay - 1

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="card-title" style={{ margin: 0 }}>📅 Calendar</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-sm" onClick={() => { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1) }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 120, textAlign: 'center' }}>{monthName}</span>
          <button className="btn btn-sm" onClick={() => { if (month === 11) { setMonth(0); setYear(y => y+1) } else setMonth(m => m+1) }}>›</button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', fontWeight: 600, padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {Array(blanks).fill(null).map((_, i) => <div key={`b${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const dayWorkouts = workoutsByDay[dateStr] || []
          const isToday = dateStr === formatDate()
          const isActive = dayPopup === dateStr
          const hasHuberman  = dayWorkouts.some(w => isHuberman(w.type))
          const hasSecondary = dayWorkouts.some(w => !isHuberman(w.type))
          return (
            <div
              key={day}
              onClick={() => dayWorkouts.length && setDayPopup(isActive ? null : dateStr)}
              style={{
                minHeight: 38, borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: dayWorkouts.length ? 'pointer' : 'default',
                background: isActive ? 'var(--accent-glow)' : isToday ? 'var(--bg4)' : 'var(--bg3)',
                border: `1px solid ${isActive ? 'var(--accent)' : isToday ? 'var(--border2)' : 'transparent'}`,
              }}
            >
              <span style={{ fontSize: 12, color: isToday ? 'var(--text)' : 'var(--text2)', fontWeight: isToday ? 700 : 400 }}>{day}</span>
              {dayWorkouts.length > 0 && (
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  {hasHuberman  && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />}
                  {hasSecondary && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316' }} />}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Day popup — with edit + delete per workout */}
      {dayPopup && workoutsByDay[dayPopup] && (
        <div style={{ marginTop: 12, background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border2)', overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
            {dayPopup}
          </div>
          {workoutsByDay[dayPopup].map(w => {
            const t = getTypeInfo(w.type)
            return (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: t.color }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, display: 'flex', gap: 10 }}>
                    {w.duration > 0 && <span>⏱ {w.duration} min</span>}
                    {w.reps     > 0 && <span>✕ {w.reps} reps</span>}
                    {w.notes       && <span style={{ fontStyle: 'italic' }}>{w.notes}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-sm" title="Edit" onClick={() => setEditWorkout(w)}>✏️</button>
                  <button className="btn btn-sm btn-danger" title="Delete" onClick={() => {
                    deleteWorkout(w.id)
                    // If this was the last workout on that day, close popup
                    if ((workoutsByDay[dayPopup] || []).length <= 1) setDayPopup(null)
                  }}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} /> Huberman protocol</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316', display: 'inline-block' }} /> Personal training</span>
      </div>

      {/* Edit modal for history workouts */}
      {editWorkout && (
        <WorkoutModal
          editWorkout={editWorkout}
          onClose={() => setEditWorkout(null)}
          onSave={data => { updateWorkout(editWorkout.id, data); setEditWorkout(null) }}
        />
      )}
    </div>
  )
}

function WeekHistoryCards({ workouts }) {
  const weekStarts = getLast12WeekStarts()
  const currentWeekStart = getWeekStart()

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Last 12 weeks</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {weekStarts.filter(ws => ws !== currentWeekStart).map(ws => {
          const weekEnd = (() => { const d = new Date(ws); d.setDate(d.getDate()+6); return d.toISOString().split('T')[0] })()
          const ww = workouts.filter(w => w.date >= ws && w.date <= weekEnd)
          const resistance = ww.filter(w => w.type === 'resistance').length
          const zone2Mins  = ww.filter(w => w.type === 'zone2').reduce((a, w) => a + (w.duration||0), 0)
          const total      = ww.length
          const score = total === 0 ? 0 : Math.min(100, Math.round(
            Math.min(100, (resistance/3)*100) * 0.5 + Math.min(100, (zone2Mins/135)*100) * 0.5
          ))
          return (
            <div key={ws} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{getWeekLabel(ws)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>🏋️ {resistance}</span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>🫀 {zone2Mins}m</span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{total} workouts</span>
                <span className={`badge ${score >= 80 ? 'badge-green' : score >= 50 ? 'badge-amber' : 'badge-red'}`}>{score}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Food section ─────────────────────────────────────────────────────────────

function FoodSection({ foodLogs, logFood, updateFood, deleteFood, latestWeight }) {
  const [showModal,  setShowModal]  = useState(false)
  const [editEntry,  setEditEntry]  = useState(null)
  const today    = formatDate()
  const todayLogs = foodLogs.filter(f => f.date === today)
    .sort((a, b) => MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal))

  // Protein target: weight(kg) × 1.6g, approximate awareness via Low/Med/High
  const proteinTarget = latestWeight ? Math.round(latestWeight * 1.6) : null
  const proteinScore = todayLogs.filter(f => !f.skipped).reduce((sum, f) => {
    if (f.protein === 'high')   return sum + 40
    if (f.protein === 'medium') return sum + 25
    if (f.protein === 'low')    return sum + 10
    return sum
  }, 0)
  const proteinPct = proteinTarget ? Math.min(100, Math.round((proteinScore / proteinTarget) * 100)) : null
  const skippedCount = todayLogs.filter(f => f.skipped).length

  function handleSave(data) {
    if (editEntry) { updateFood(editEntry.id, data) } else { logFood(data) }
  }

  const qualityColors = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444' }
  const proteinColors = { high: '#22c55e', medium: '#f59e0b', low: '#ef4444' }

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div className="section-title" style={{ fontSize: 15 }}>🥗 Food</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Huberman/Attia + Mindful Eating — Michael Pollan</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditEntry(null); setShowModal(true) }}>+ Log meal</button>
      </div>

      {/* Protein tracker */}
      {proteinTarget && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="card-title" style={{ margin: 0 }}>Daily protein awareness</div>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>Target: ~{proteinTarget}g (based on {latestWeight}kg)</span>
          </div>
          <div className="progress-bar" style={{ height: 8, marginBottom: 6 }}>
            <div className="progress-fill" style={{ width: `${proteinPct}%`, background: proteinPct >= 100 ? 'var(--green)' : proteinPct >= 60 ? 'var(--amber)' : 'var(--red)', transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {['high','medium','low'].map(p => {
                const count = todayLogs.filter(f => !f.skipped && f.protein === p).length
                return <span key={p} style={{ color: proteinColors[p] }}>●{p[0].toUpperCase()} ×{count}</span>
              })}
              {skippedCount > 0 && <span style={{ color: 'var(--text3)' }}>⊘ Skipped ×{skippedCount}</span>}
            </div>
            <span style={{ color: proteinPct >= 100 ? 'var(--green)' : 'var(--amber)', fontWeight: 600 }}>
              {proteinPct >= 100 ? '✓ Target reached' : `~${proteinPct}% of target`}
            </span>
          </div>
        </div>
      )}

      {/* Today's food logs */}
      {todayLogs.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <div className="empty-state-icon">🥗</div>
          <h3>No meals logged today</h3>
          <p>Track what you eat to build nutritional awareness</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          {todayLogs.map(f => {
            if (f.skipped) {
              return (
                <div key={f.id} className="card" style={{ borderLeft: '3px solid #475569', padding: '12px 16px', opacity: 0.75 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18, color: '#64748b' }}>⊘</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{f.meal}</span>
                          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, background: 'rgba(100,116,139,0.15)', padding: '1px 7px', borderRadius: 10 }}>Skipped</span>
                        </div>
                        {f.reason && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, fontStyle: 'italic' }}>{f.reason}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-sm" title="Edit" onClick={() => { setEditEntry(f); setShowModal(true) }}>✏️</button>
                      <button className="btn btn-sm btn-danger" title="Delete" onClick={() => deleteFood(f.id)}>✕</button>
                    </div>
                  </div>
                </div>
              )
            }
            const qc = qualityColors[f.quality] || 'var(--text3)'
            const pc = proteinColors[f.protein] || 'var(--text3)'
            return (
              <div key={f.id} className="card" style={{ borderLeft: `3px solid ${qc}`, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{f.meal}</span>
                      <span style={{ fontSize: 11, color: qc, fontWeight: 600 }}>{QUALITIES.find(q => q.value === f.quality)?.label}</span>
                      <span style={{ fontSize: 11, color: pc, fontWeight: 600 }}>Protein: {f.protein}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: f.felt ? 4 : 0 }}>{f.what}</div>
                    {f.felt && <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Felt: {f.felt}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-sm" title="Edit" onClick={() => { setEditEntry(f); setShowModal(true) }}>✏️</button>
                    <button className="btn btn-sm btn-danger" title="Delete" onClick={() => deleteFood(f.id)}>✕</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <FoodModal
          editEntry={editEntry}
          onClose={() => { setShowModal(false); setEditEntry(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function FitnessView({ workouts, metrics, foodLogs, loading, logWorkout, updateWorkout, deleteWorkout, logMetrics, logFood, updateFood, deleteFood, getWeekWorkouts, getWeekScore, getLatestWeight }) {
  const [showWorkoutModal,  setShowWorkoutModal]  = useState(false)
  const [showMetricsModal,  setShowMetricsModal]  = useState(false)
  const [editWorkout,       setEditWorkout]       = useState(null)
  const [showHistory,       setShowHistory]       = useState(false)

  const weekWorkouts   = getWeekWorkouts()
  const weekScore      = getWeekScore()
  const resistanceCount = weekWorkouts.filter(w => w.type === 'resistance').length
  const zone2Mins      = weekWorkouts.filter(w => w.type === 'zone2').reduce((a, w) => a + (w.duration||0), 0)
  const todayMetrics   = metrics.find(m => m.date === formatDate())
  const latestWeight   = getLatestWeight()

  function handleSaveWorkout(data) {
    if (editWorkout) updateWorkout(editWorkout.id, data)
    else logWorkout(data)
  }

  if (loading) return <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div className="fade-in">

      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">💪 Fitness</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Based on Huberman Lab protocols</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setShowMetricsModal(true)}>📊 Log metrics</button>
          <button className="btn btn-primary" onClick={() => { setEditWorkout(null); setShowWorkoutModal(true) }}>+ Log workout</button>
        </div>
      </div>

      {/* Week stats */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: resistanceCount >= 3 ? 'var(--green)' : 'var(--amber)' }}>{resistanceCount}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Resistance</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Ideal: 3/week</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: zone2Mins >= 135 ? 'var(--green)' : 'var(--amber)' }}>{zone2Mins}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Zone 2 mins</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Ideal: 135/week</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: todayMetrics?.sleep >= 7.5 ? 'var(--green)' : todayMetrics?.sleep ? 'var(--amber)' : 'var(--text3)' }}>
            {todayMetrics?.sleep || '—'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Sleep hrs</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Ideal: 7.5–8</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: scoreColor(weekScore) }}>{weekScore}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Week score</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Ideal: 95</div>
        </div>
      </div>

      {/* Zone 2 progress */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Huberman Zone 2 target</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>
          <span>{zone2Mins} mins done</span><span>Target: 135 mins</span>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div className="progress-fill" style={{ width: `${Math.min(100, (zone2Mins/135)*100)}%`, background: zone2Mins >= 135 ? 'var(--green)' : 'var(--teal)' }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
          {zone2Mins >= 135 ? '✓ Weekly target met!' : `${135 - zone2Mins} mins remaining this week`}
        </div>
      </div>

      {/* Today metrics */}
      {todayMetrics && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Today's metrics</div>
          <div className="grid-4">
            {todayMetrics.weight && <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: 18 }}>{todayMetrics.weight} kg</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>Weight</div></div>}
            {todayMetrics.sleep  && <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: 18 }}>{todayMetrics.sleep} hrs</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>Sleep</div></div>}
            {todayMetrics.water  && <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: 18 }}>{todayMetrics.water} L</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>Water</div></div>}
            {todayMetrics.energy && <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: 18 }}>{todayMetrics.energy}/5</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>Energy</div></div>}
          </div>
        </div>
      )}

      {/* This week's workouts */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="section-title" style={{ fontSize: 15 }}>This week's workouts</div>
      </div>
      {weekWorkouts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💪</div>
          <h3>No workouts logged yet</h3>
          <p>Log your first workout to start tracking</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {weekWorkouts.map(w => {
            const t = getTypeInfo(w.type)
            return (
              <div key={w.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderLeft: `3px solid ${t.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 10, marginTop: 2 }}>
                      {w.duration > 0 && <span>{w.duration} min</span>}
                      {w.reps     > 0 && <span>{w.reps} reps</span>}
                      {w.notes       && <span style={{ fontStyle: 'italic' }}>{w.notes}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{w.date}</span>
                  <button className="btn btn-sm" title="Edit" onClick={() => { setEditWorkout(w); setShowWorkoutModal(true) }}>✏️</button>
                  <button className="btn btn-sm btn-danger" title="Delete" onClick={() => deleteWorkout(w.id)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Food section */}
      <FoodSection
        foodLogs={foodLogs}
        logFood={logFood}
        updateFood={updateFood}
        deleteFood={deleteFood}
        latestWeight={latestWeight}
      />

      {/* History toggle */}
      <div style={{ marginTop: 28 }}>
        <button
          className="btn"
          style={{ width: '100%', justifyContent: 'center', marginBottom: showHistory ? 16 : 0 }}
          onClick={() => setShowHistory(h => !h)}
        >
          {showHistory ? '▲ Hide history' : '▼ Show history (calendar + last 12 weeks)'}
        </button>

        {showHistory && (
          <>
            <CalendarView workouts={workouts} updateWorkout={updateWorkout} deleteWorkout={deleteWorkout} />
            <WeekHistoryCards workouts={workouts} />
          </>
        )}
      </div>

      {/* Modals */}
      {showWorkoutModal && (
        <WorkoutModal
          editWorkout={editWorkout}
          onClose={() => { setShowWorkoutModal(false); setEditWorkout(null) }}
          onSave={handleSaveWorkout}
        />
      )}
      {showMetricsModal && (
        <MetricsModal onClose={() => setShowMetricsModal(false)} onSave={logMetrics} />
      )}
    </div>
  )
}
