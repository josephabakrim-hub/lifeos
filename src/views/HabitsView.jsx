import { useState, useMemo, useEffect } from 'react'
import { formatDate, getLast30Days, getLast90Days } from '../lib/utils'
import { isHabitScheduledOn } from '../hooks/useHabits'

// ─── Constants ────────────────────────────────────────────────────────────────

const HABIT_ICONS  = ['🏃','💧','📖','🧘','🥗','😴','💪','✍️','🎯','🌅','🧠','❤️','🚶','🎵','🙏']
const HABIT_COLORS = ['#7c6aff','#14b8a6','#3b82f6','#f59e0b','#22c55e','#ec4899','#f97316','#a855f7']
const ACTIVE_HABIT_LIMIT = 6
const HEATMAP_RANGES = [{ label: '30d', days: 30 }, { label: '90d', days: 90 }, { label: '1yr', days: 365 }]

// 0=Sun,1=Mon...6=Sat
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const ALL_DAYS   = [0, 1, 2, 3, 4, 5, 6]
const WEEKDAYS   = [1, 2, 3, 4, 5]
const WEEKENDS   = [0, 6]
const ALT_A      = [1, 3, 5]   // Mon, Wed, Fri
const ALT_B      = [0, 2, 4, 6] // Sun, Tue, Thu, Sat

const LIFE_AREA_PRESETS = [
  {
    area: 'Trading', icon: '📈', color: '#14b8a6',
    habits: [
      { name: 'Review trades',    icon: '📊', description: 'Review all trades taken today',              color: '#14b8a6', scheduledDays: WEEKDAYS },
      { name: 'Follow plan',      icon: '📋', description: 'Stick to trading plan — no deviation',        color: '#14b8a6', scheduledDays: WEEKDAYS },
      { name: 'Journal emotions', icon: '✍️', description: 'Log emotional state before & after session', color: '#14b8a6', scheduledDays: WEEKDAYS },
      { name: 'No overtrading',   icon: '🛑', description: 'Respect daily loss limit and trade count',   color: '#14b8a6', scheduledDays: WEEKDAYS },
    ],
  },
  {
    area: 'Health', icon: '💪', color: '#f97316',
    habits: [
      { name: 'Workout',    icon: '🏋️', description: 'Resistance or Zone 2 session',         color: '#f97316', scheduledDays: ALL_DAYS },
      { name: 'Sleep 7h+', icon: '😴', description: 'Get at least 7 hours of quality sleep', color: '#f97316', scheduledDays: ALL_DAYS },
      { name: 'Water',      icon: '💧', description: '2.5L minimum throughout the day',       color: '#f97316', scheduledDays: ALL_DAYS },
      { name: 'Stretch',    icon: '🤸', description: 'Mobility or stretching session',        color: '#f97316', scheduledDays: ALL_DAYS },
    ],
  },
  {
    area: 'Focus', icon: '🎯', color: '#7c6aff',
    habits: [
      { name: 'Deep work session',  icon: '🎯', description: 'Minimum 90 min uninterrupted focus block',      color: '#7c6aff', scheduledDays: ALL_DAYS },
      { name: 'No social media',    icon: '📵', description: 'No mindless scrolling — intentional use only',  color: '#7c6aff', scheduledDays: ALL_DAYS },
      { name: 'Complete main task', icon: '✅', description: 'Finish the #1 priority task of the day',        color: '#7c6aff', scheduledDays: ALL_DAYS },
      { name: 'Plan tomorrow',      icon: '🗓️', description: "Set tomorrow's tasks and main goal tonight",    color: '#7c6aff', scheduledDays: ALL_DAYS },
    ],
  },
  {
    area: 'Learning', icon: '📚', color: '#f59e0b',
    habits: [
      { name: '20–30 min study', icon: '📖', description: 'Focused reading or course study session',       color: '#f59e0b', scheduledDays: ALL_DAYS },
      { name: 'Take notes',      icon: '📝', description: 'Capture key takeaways from what you learned',   color: '#f59e0b', scheduledDays: ALL_DAYS },
      { name: 'Apply learning',  icon: '🔬', description: 'Implement or test something you studied',       color: '#f59e0b', scheduledDays: ALL_DAYS },
    ],
  },
  {
    area: 'Mental', icon: '🧘', color: '#a855f7',
    habits: [
      { name: 'Meditation / breathing', icon: '🧘', description: 'Mindfulness, breathwork, or meditation',         color: '#a855f7', scheduledDays: ALL_DAYS },
      { name: 'Gratitude',              icon: '🙏', description: "Write 3 things you're grateful for",             color: '#a855f7', scheduledDays: ALL_DAYS },
      { name: 'Quiet time',             icon: '🌅', description: 'Screen-free quiet time for mental recovery',     color: '#a855f7', scheduledDays: ALL_DAYS },
      { name: 'Awareness of thoughts',  icon: '🧠', description: 'Check in with mental state — journal if needed', color: '#a855f7', scheduledDays: ALL_DAYS },
    ],
  },
  {
    area: 'Social', icon: '❤️', color: '#ec4899',
    habits: [
      { name: 'Message / call someone',  icon: '📱', description: 'Reach out to a friend or family member',       color: '#ec4899', scheduledDays: ALL_DAYS },
      { name: 'Meaningful conversation', icon: '💬', description: 'Have a real, deep conversation today',          color: '#ec4899', scheduledDays: ALL_DAYS },
      { name: 'Spend time with others',  icon: '👥', description: 'Quality in-person or intentional social time', color: '#ec4899', scheduledDays: ALL_DAYS },
    ],
  },
]

// ─── Schedule helpers ─────────────────────────────────────────────────────────

function scheduleLabel(days) {
  if (!days || days.length === 7) return 'Every day'
  if (days.length === 0) return 'No days'
  const s = [...days].sort()
  if (JSON.stringify(s) === JSON.stringify(WEEKDAYS))      return 'Weekdays only'
  if (JSON.stringify(s) === JSON.stringify([0, 6]))        return 'Weekends only'
  if (JSON.stringify(s) === JSON.stringify([...ALT_A].sort())) return 'Every other day (Mon/Wed/Fri)'
  if (JSON.stringify(s) === JSON.stringify([...ALT_B].sort())) return 'Every other day (Tue/Thu/Sat/Sun)'
  return s.map(d => DAY_LABELS[d]).join(', ')
}

// ─── Day selector ─────────────────────────────────────────────────────────────

function DaySelector({ value, onChange }) {
  function toggle(day) {
    if (value.includes(day)) {
      if (value.length === 1) return
      onChange(value.filter(d => d !== day))
    } else {
      onChange([...value, day].sort())
    }
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {[
          { label: 'Every day',          days: ALL_DAYS },
          { label: 'Weekdays',           days: WEEKDAYS },
          { label: 'Weekends',           days: WEEKENDS },
          { label: 'Every other day ①', days: ALT_A,  title: 'Mon, Wed, Fri' },
          { label: 'Every other day ②', days: ALT_B,  title: 'Tue, Thu, Sat/Sun' },
        ].map(p => {
          const active = JSON.stringify([...value].sort()) === JSON.stringify([...p.days].sort())
          return (
            <button key={p.label} type="button" title={p.title} onClick={() => onChange([...p.days])} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, background: active ? 'var(--accent-glow)' : 'transparent', color: active ? 'var(--accent)' : 'var(--text3)' }}>
              {p.label}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {DAY_LABELS.map((label, idx) => {
          const active = value.includes(idx)
          return (
            <button key={idx} type="button" onClick={() => toggle(idx)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, background: active ? 'var(--accent-glow)' : 'var(--bg3)', color: active ? 'var(--accent)' : 'var(--text3)' }}>
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Stage engine (schedule-aware) ───────────────────────────────────────────

function getHabitStage(logs, habitId, scheduledDays) {
  const doneDates = [...new Set(logs.filter(l => l.habitId === habitId && l.done).map(l => l.date))].sort()
  if (!doneDates.length) return { stage: 1, day: 0, label: 'Stage 1 — Initiation', stagePct: 0, mastered: false }

  const firstDate = new Date(doneDates[0])
  const daysSince = Math.round((new Date() - firstDate) / 86400000) + 1

  function scheduledIn(n) {
    let count = 0
    for (let i = 0; i < n; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      if (!scheduledDays || scheduledDays.length === 0 || scheduledDays.includes(d.getDay())) count++
    }
    return count
  }

  function rateOver(n) {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - n)
    const cutoffStr = formatDate(cutoff)
    const scheduled = scheduledIn(n)
    const done = doneDates.filter(d => d >= cutoffStr).length
    return scheduled > 0 ? done / scheduled : 0
  }

  const rate30 = rateOver(30)
  const rate90 = rateOver(90)
  const mastered = (daysSince >= 66 && rate90 >= 0.80) || (daysSince >= 90 && rate90 >= 0.75)

  if (mastered) return { stage: 4, day: doneDates.length, label: '✦ Mastered', stagePct: 100, mastered: true }
  if (daysSince >= 91 && rate90 >= 0.80) return { stage: 3, day: daysSince, label: 'Stage 3 — Stability', stagePct: Math.min(100, Math.round((daysSince / 180) * 100)), mastered: false }
  if (daysSince >= 31 && rate30 >= 0.80) return { stage: 2, day: daysSince, label: 'Stage 2 — Learning', stagePct: Math.min(100, Math.round(((daysSince - 30) / 60) * 100)), mastered: false }
  return { stage: 1, day: daysSince, label: 'Stage 1 — Initiation', stagePct: Math.min(100, Math.round((daysSince / 30) * 100)), mastered: false }
}

const STAGE_COLORS = { 1: '#ef4444', 2: '#f59e0b', 3: '#22c55e', 4: '#a855f7' }
const STAGE_ICONS  = { 1: '●', 2: '●', 3: '●', 4: '✦' }

// ─── Stat helpers (schedule-aware) ───────────────────────────────────────────

function getLastNDays(n) {
  const days = []
  for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(formatDate(d)) }
  return days
}

function getAllTimeDays(logs, habitId) { return logs.filter(l => l.habitId === habitId && l.done).length }

function getLongestStreak(logs, habitId, scheduledDays) {
  const doneDates = logs.filter(l => l.habitId === habitId && l.done).map(l => l.date).sort()
  if (!doneDates.length) return 0
  let longest = 1, current = 1
  for (let i = 1; i < doneDates.length; i++) {
    const prev = new Date(doneDates[i - 1] + 'T12:00:00')
    const curr = new Date(doneDates[i]     + 'T12:00:00')
    let scheduledBetween = 0
    const check = new Date(prev); check.setDate(check.getDate() + 1)
    while (check < curr) {
      if (!scheduledDays || scheduledDays.length === 0 || scheduledDays.includes(check.getDay())) scheduledBetween++
      check.setDate(check.getDate() + 1)
    }
    if (scheduledBetween === 0) { current++; if (current > longest) longest = current }
    else current = 1
  }
  return longest
}

function getCurrentStreak(logs, habitId, scheduledDays) {
  const doneDates = [...new Set(logs.filter(l => l.habitId === habitId && l.done).map(l => l.date))].sort().reverse()
  if (!doneDates.length) return 0
  let streak = 0
  const check = new Date()
  for (let i = 0; i < 365; i++) {
    const dateStr = formatDate(check)
    const dow = check.getDay()
    const isScheduled = !scheduledDays || scheduledDays.length === 0 || scheduledDays.includes(dow)
    if (isScheduled) {
      if (doneDates.includes(dateStr)) streak++
      else if (i > 0) break
    }
    check.setDate(check.getDate() - 1)
  }
  return streak
}

function getAllTimeRate(logs, habitId, scheduledDays) {
  const doneDates = [...new Set(logs.filter(l => l.habitId === habitId && l.done).map(l => l.date))]
  if (!doneDates.length) return 0
  const earliest = doneDates.sort()[0]
  let scheduledCount = 0
  const start = new Date(earliest + 'T12:00:00')
  const today = new Date()
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    if (!scheduledDays || scheduledDays.length === 0 || scheduledDays.includes(d.getDay())) scheduledCount++
  }
  return scheduledCount > 0 ? Math.round((doneDates.length / scheduledCount) * 100) : 0
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function HabitModal({ onClose, onSave, editHabit }) {
  const [name,          setName]          = useState(editHabit?.name        || '')
  const [icon,          setIcon]          = useState(editHabit?.icon        || '🎯')
  const [color,         setColor]         = useState(editHabit?.color       || '#7c6aff')
  const [description,   setDescription]   = useState(editHabit?.description || '')
  const [scheduledDays, setScheduledDays] = useState(editHabit?.scheduledDays ?? ALL_DAYS)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{editHabit ? 'Edit habit' : 'Add new habit'}</div>
        <div className="form-group">
          <label>Habit name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Follow trading plan" autoFocus />
        </div>
        <div className="form-group">
          <label>Description (optional)</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. No revenge trades, max 3 setups" />
        </div>
        <div className="form-group">
          <label>Scheduled days</label>
          <DaySelector value={scheduledDays} onChange={setScheduledDays} />
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
            Habit only counts on scheduled days — off days won't affect your score.
          </div>
        </div>
        <div className="form-group">
          <label>Icon</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {HABIT_ICONS.map(i => (
              <button key={i} onClick={() => setIcon(i)} style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${icon === i ? 'var(--accent)' : 'var(--border)'}`, background: icon === i ? 'var(--accent-glow)' : 'var(--bg3)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {HABIT_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: `3px solid ${color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer' }} />
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { if (!name.trim()) return; onSave({ name: name.trim(), icon, color, description, scheduledDays }); onClose() }}>Save habit</button>
        </div>
      </div>
    </div>
  )
}

function OverLimitWarning({ onContinue, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
        <div className="modal-title" style={{ textAlign: 'center' }}>You have 6 active habits</div>
        <p style={{ fontSize: 14, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6, margin: '0 0 20px' }}>
          Research shows <strong style={{ color: 'var(--text)' }}>6 is the optimal maximum</strong>. Adding more reduces success rate on all habits.
        </p>
        <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onContinue}>Continue anyway</button>
        </div>
      </div>
    </div>
  )
}

function MasteryModal({ habit, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
        <div className="modal-title" style={{ textAlign: 'center', fontSize: 22, color: '#a855f7' }}>Habit Mastered!</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{habit.icon} {habit.name}</div>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: '0 0 16px' }}>You've built this into your identity.<br /><strong style={{ color: 'var(--text)' }}>This is who you are now.</strong></p>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#a855f7', borderColor: '#a855f7' }} onClick={onClose}>✦ Accept mastery</button>
      </div>
    </div>
  )
}


// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ habit, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>🗑️</div>
        <div className="modal-title" style={{ textAlign: 'center' }}>Delete this habit?</div>
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 22 }}>{habit.icon}</span>{' '}
          <strong style={{ fontSize: 15 }}>{habit.name}</strong>
        </div>
        <p style={{ fontSize: 13, color: 'var(--red)', textAlign: 'center', lineHeight: 1.6, margin: '0 0 8px', fontWeight: 600 }}>
          ⚠️ This permanently deletes the habit and all its tracking history.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6, margin: '0 0 24px' }}>
          If you just want to pause it, use <strong style={{ color: 'var(--text2)' }}>📦 Archive</strong> instead — that keeps your history intact and lets you restore it later.
        </p>
        <div className="modal-footer" style={{ justifyContent: 'center', gap: 10 }}>
          <button className="btn" onClick={onCancel}>Cancel — keep it</button>
          <button className="btn btn-danger" onClick={onConfirm}>Yes, delete permanently</button>
        </div>
      </div>
    </div>
  )
}

// ─── Retro log modal ──────────────────────────────────────────────────────────

function RetroLogModal({ dateStr, habits, logs, toggleHabitLog, onClose }) {
  const today        = formatDate()
  const isFuture     = dateStr > today
  const activeHabits = habits.filter(h => h.active && !h.mastered && isHabitScheduledOn(h, dateStr))
  const friendlyDate = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  function isDone(habitId) { return !!logs.find(l => l.habitId === habitId && l.date === dateStr && l.done) }
  const doneCount = activeHabits.filter(h => isDone(h.id)).length
  const pct = activeHabits.length > 0 ? Math.round((doneCount / activeHabits.length) * 100) : 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div className="modal-title" style={{ margin: 0 }}>{dateStr === today ? '✅ Today' : '📅 ' + friendlyDate}</div>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>
        {isFuture ? (
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 12 }}>Can't log future dates.</p>
        ) : activeHabits.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 12 }}>No habits scheduled for this day.</p>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>
                <span>{doneCount}/{activeHabits.length} habits</span>
                <span style={{ fontWeight: 700, color: pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)' }}>{pct}%</span>
              </div>
              <div className="progress-bar" style={{ height: 6 }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activeHabits.map(habit => {
                const done = isDone(habit.id)
                return (
                  <div key={habit.id} onClick={() => toggleHabitLog(habit.id, dateStr)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: done ? `${habit.color}18` : 'var(--bg3)', border: `1px solid ${done ? habit.color : 'var(--border)'}` }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: `2px solid ${done ? habit.color : 'var(--border2)'}`, background: done ? habit.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 700 }}>{done ? '✓' : ''}</div>
                    <span style={{ fontSize: 18 }}>{habit.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: done ? 'var(--text3)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>{habit.name}</div>
                      {habit.description && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{habit.description}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
            {dateStr !== today && <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>📝 Retroactive — tap to toggle</div>}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Heatmap (schedule-aware) ─────────────────────────────────────────────────

function HabitHeatmap({ habit, logs, rangeDays }) {
  const days  = useMemo(() => getLastNDays(rangeDays), [rangeDays])
  const today = formatDate()

  if (rangeDays === 365) {
    const weeks = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
    return (
      <div style={{ marginTop: 8, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {week.map(date => {
              const scheduled = isHabitScheduledOn(habit, date)
              const done      = logs.find(l => l.habitId === habit.id && l.date === date && l.done)
              return (
                <div key={date} title={date + (scheduled ? '' : ' (off day)')} style={{ width: 9, height: 9, borderRadius: 2, background: !scheduled ? 'var(--bg3)' : done ? 'var(--accent)' : 'var(--bg4)', opacity: !scheduled ? 0.2 : date === today ? 1 : done ? 0.85 : 0.35, outline: date === today && scheduled ? '1px solid var(--accent)' : 'none' }} />
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="heatmap" style={{ marginTop: 8 }}>
      {days.map(date => {
        const scheduled = isHabitScheduledOn(habit, date)
        const done      = logs.find(l => l.habitId === habit.id && l.date === date && l.done)
        const isToday   = date === today
        if (!scheduled) return <div key={date} className="heatmap-cell" title={date + ' (off)'} style={{ opacity: 0.15, background: 'var(--bg3)' }} />
        return <div key={date} className={`heatmap-cell ${done ? 'done' : ''} ${isToday ? 'today' : ''}`} title={date} />
      })}
    </div>
  )
}

// ─── Habit card ───────────────────────────────────────────────────────────────

function HabitCard({ habit, logs, today, toggleHabitLog, onEdit, onArchive, onDelete, onMastered }) {
  const [rangeDays, setRangeDays] = useState(30)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isDone           = !!logs.find(l => l.habitId === habit.id && l.date === today && l.done)
  const isScheduledToday = isHabitScheduledOn(habit, today)
  const scheduledDays    = habit.scheduledDays ?? ALL_DAYS

  const streak  = getCurrentStreak(logs, habit.id, scheduledDays)
  const rate30  = useMemo(() => {
    let scheduled = 0, done = 0
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const dateStr = formatDate(d)
      if (isHabitScheduledOn(habit, dateStr)) {
        scheduled++
        if (logs.find(l => l.habitId === habit.id && l.date === dateStr && l.done)) done++
      }
    }
    return scheduled > 0 ? Math.round((done / scheduled) * 100) : 0
  }, [logs, habit])

  const stageInfo  = useMemo(() => getHabitStage(logs, habit.id, scheduledDays), [logs, habit.id, scheduledDays])
  const stageColor = STAGE_COLORS[stageInfo.stage]
  const stageGoal  = stageInfo.stage === 1 ? 30 : stageInfo.stage === 2 ? 90 : 180

  useEffect(() => {
    if (stageInfo.mastered && habit.active && !habit.mastered) onMastered(habit)
  }, [stageInfo.mastered])

  return (
    <>
      <div className="card" style={{ borderLeft: `3px solid ${habit.color || 'var(--accent)'}`, opacity: isScheduledToday ? 1 : 0.55 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className={`habit-toggle ${isDone ? 'done' : ''}`}
            style={{ borderColor: isDone ? habit.color : 'var(--border2)', background: isDone ? habit.color : 'transparent', cursor: isScheduledToday ? 'pointer' : 'not-allowed' }}
            onClick={() => isScheduledToday && toggleHabitLog(habit.id)}
            title={isScheduledToday ? undefined : `Not scheduled today — ${scheduleLabel(scheduledDays)}`}
          >
            {isDone ? '✓' : ''}
          </button>
          <span style={{ fontSize: 24 }}>{habit.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text3)' : 'var(--text)' }}>{habit.name}</div>
            {habit.description && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{habit.description}</div>}
            <div style={{ fontSize: 11, marginTop: 2 }}>
              <span style={{ color: 'var(--text3)' }}>📅 {scheduleLabel(scheduledDays)}</span>
              {!isScheduledToday && <span style={{ color: 'var(--amber)', fontWeight: 600, marginLeft: 6 }}>· Off today</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {streak > 0 && <span className="streak">🔥 {streak}d</span>}
            <span className="badge badge-blue">{rate30}% / 30d</span>
            <button className="btn btn-sm" onClick={onEdit}>✏️</button>
            <button className="btn btn-sm" onClick={onArchive}>📦</button>
            <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(true)}>✕</button>
          </div>
        </div>

        {/* Stage bar */}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: stageColor, fontWeight: 700, flexShrink: 0 }}>{STAGE_ICONS[stageInfo.stage]} {stageInfo.label}</span>
          <div style={{ flex: 1, height: 4, background: 'var(--bg4)', borderRadius: 2 }}>
            <div style={{ height: '100%', borderRadius: 2, background: stageColor, width: `${stageInfo.stagePct}%`, transition: 'width 0.6s ease' }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>Day {stageInfo.day}/{stageGoal}</span>
        </div>

        {/* Heatmap */}
        <div style={{ marginTop: 10, display: 'flex', gap: 4 }}>
          {HEATMAP_RANGES.map(r => (
            <button key={r.label} onClick={() => setRangeDays(r.days)} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${rangeDays === r.days ? 'var(--accent)' : 'var(--border)'}`, background: rangeDays === r.days ? 'var(--accent-glow)' : 'transparent', color: rangeDays === r.days ? 'var(--accent)' : 'var(--text3)' }}>{r.label}</button>
          ))}
        </div>
        <HabitHeatmap habit={habit} logs={logs} rangeDays={rangeDays} />
      </div>
      {confirmDelete && (
        <DeleteConfirmModal
          habit={habit}
          onConfirm={() => { setConfirmDelete(false); onDelete() }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  )
}

// ─── Stat row ─────────────────────────────────────────────────────────────────

function StatRow({ s, onEdit, onArchive, onUnarchive, onDelete }) {
  const { habit, stageInfo, allTimeRate, longestStreak, currentStreak, totalDays } = s
  const stageColor = STAGE_COLORS[stageInfo.stage]
  const isArchived = !habit.active && !habit.mastered
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <>
      <div className="card" style={{ marginBottom: 10, borderLeft: `3px solid ${habit.color || 'var(--accent)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>{habit.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{habit.name}</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text3)', flexWrap: 'wrap' }}>
              <span style={{ color: stageColor, fontWeight: 700 }}>{STAGE_ICONS[stageInfo.stage]} {stageInfo.label}</span>
              <span>🔥 Best: {longestStreak}d</span>
              <span>⚡ Now: {currentStreak}d</span>
              <span>📅 Total: {totalDays}</span>
              <span>📊 Rate: {allTimeRate}%</span>
              <span style={{ color: 'var(--accent)' }}>🗓 {scheduleLabel(habit.scheduledDays ?? ALL_DAYS)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sm" onClick={onEdit}>✏️</button>
            {isArchived
              ? <button className="btn btn-sm" style={{ color: 'var(--green)', borderColor: 'var(--green)' }} onClick={onUnarchive}>♻️</button>
              : <button className="btn btn-sm" style={{ color: 'var(--amber)', borderColor: 'var(--amber)' }} onClick={onArchive}>📦</button>
            }
            <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(true)}>✕</button>
          </div>
        </div>
      </div>
      {confirmDelete && (
        <DeleteConfirmModal
          habit={habit}
          onConfirm={() => { setConfirmDelete(false); onDelete() }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  )
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

function HabitsCalendar({ logs, habits, toggleHabitLog }) {
  const now = new Date()
  const [year, setYear]         = useState(now.getFullYear())
  const [month, setMonth]       = useState(now.getMonth())
  const [retroDate, setRetroDate] = useState(null)

  const today        = formatDate()
  const monthName    = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstDay     = new Date(year, month, 1).getDay()
  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const blanks       = firstDay === 0 ? 6 : firstDay - 1
  const activeHabits = habits.filter(h => h.active && !h.mastered)

  const byDay = useMemo(() => {
    const map = {}
    logs.filter(l => l.done).forEach(l => { if (!map[l.date]) map[l.date] = []; map[l.date].push(l.habitId) })
    return map
  }, [logs])

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div className="card-title" style={{ margin: 0 }}>📅 Calendar</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Tap any past day to log retroactively</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-sm" onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 600, minWidth: 130, textAlign: 'center' }}>{monthName}</span>
            <button className="btn btn-sm" onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }}>›</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', fontWeight: 600, padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {Array(blanks).fill(null).map((_, i) => <div key={`b${i}`} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day      = i + 1
            const dateStr  = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const doneIds  = byDay[dateStr] || []
            const isToday  = dateStr === today
            const isFuture = dateStr > today
            const isSelected = retroDate === dateStr
            const scheduledThisDay = activeHabits.filter(h => isHabitScheduledOn(h, dateStr))
            const pct = scheduledThisDay.length > 0
              ? Math.round((doneIds.filter(id => scheduledThisDay.find(h => h.id === id)).length / scheduledThisDay.length) * 100)
              : null
            const dotColor = pct === null ? null : pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : doneIds.length > 0 ? 'var(--red)' : null

            return (
              <div key={day} onClick={() => !isFuture && setRetroDate(isSelected ? null : dateStr)}
                style={{ minHeight: 38, borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: isFuture ? 'default' : 'pointer', background: isSelected || isToday ? 'var(--accent-glow)' : 'var(--bg3)', border: `1px solid ${isSelected || isToday ? 'var(--accent)' : 'transparent'}`, opacity: isFuture ? 0.3 : 1 }}
                onMouseEnter={e => { if (!isFuture) e.currentTarget.style.borderColor = 'var(--border2)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isSelected || isToday ? 'var(--accent)' : 'transparent' }}
              >
                <span style={{ fontSize: 12, color: isToday || isSelected ? 'var(--accent)' : 'var(--text2)', fontWeight: isToday || isSelected ? 700 : 400 }}>{day}</span>
                {dotColor && <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, marginTop: 2 }} />}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>
          {[['var(--green)', '80%+ done'], ['var(--amber)', '50–79%'], ['var(--red)', 'Under 50%']].map(([c, l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />{l}</span>
          ))}
        </div>
      </div>

      {retroDate && (
        <RetroLogModal dateStr={retroDate} habits={habits} logs={logs} toggleHabitLog={toggleHabitLog} onClose={() => setRetroDate(null)} />
      )}
    </>
  )
}

// ─── History tab ──────────────────────────────────────────────────────────────

function HistoryTab({ habits, logs, updateHabit, deleteHabit, onEditHabit, toggleHabitLog }) {
  const stats = useMemo(() =>
    habits.map(h => ({
      habit:         h,
      stageInfo:     getHabitStage(logs, h.id, h.scheduledDays ?? ALL_DAYS),
      allTimeRate:   getAllTimeRate(logs, h.id, h.scheduledDays ?? ALL_DAYS),
      longestStreak: getLongestStreak(logs, h.id, h.scheduledDays ?? ALL_DAYS),
      currentStreak: getCurrentStreak(logs, h.id, h.scheduledDays ?? ALL_DAYS),
      totalDays:     getAllTimeDays(logs, h.id),
    })).sort((a, b) => b.allTimeRate - a.allTimeRate),
  [habits, logs])

  const activeStats   = stats.filter(s => s.habit.active && !s.habit.mastered)
  const masteredStats = stats.filter(s => s.habit.mastered)
  const archivedStats = stats.filter(s => !s.habit.active && !s.habit.mastered)

  return (
    <div className="fade-in">
      <HabitsCalendar logs={logs} habits={habits} toggleHabitLog={toggleHabitLog} />

      {[['Active habits — all-time stats', activeStats, false],
        ['✦ Mastered Hall of Fame', masteredStats, true],
        ['📦 Archived habits', archivedStats, false]
      ].map(([title, items, isMastered]) => items.length > 0 && (
        <div key={title} style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: isMastered ? '#a855f7' : 'var(--text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
          {items.map(s => (
            <StatRow key={s.habit.id} s={s}
              onEdit={() => onEditHabit(s.habit)}
              onArchive={() => updateHabit(s.habit.id, { active: false })}
              onUnarchive={() => updateHabit(s.habit.id, { active: true, mastered: false })}
              onDelete={() => deleteHabit(s.habit.id)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Preset panel ─────────────────────────────────────────────────────────────

function PresetPanel({ habits, addHabit, onClose }) {
  const activeCount   = habits.filter(h => h.active).length
  const existingNames = habits.map(h => h.name.toLowerCase())
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">Quick-add from presets</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Active habits: {activeCount}/{ACTIVE_HABIT_LIMIT}</div>
        {LIFE_AREA_PRESETS.map(area => (
          <div key={area.area} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 16 }}>{area.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: area.color }}>{area.area}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {area.habits.map(h => {
                const added = existingNames.includes(h.name.toLowerCase())
                return (
                  <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--bg3)', opacity: added ? 0.5 : 1 }}>
                    <span style={{ fontSize: 18 }}>{h.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{h.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{h.description}</div>
                      <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>📅 {scheduleLabel(h.scheduledDays)}</div>
                    </div>
                    <button className="btn btn-sm" style={added ? { color: 'var(--green)', borderColor: 'var(--green)' } : {}} disabled={added} onClick={() => !added && addHabit(h)}>
                      {added ? '✓ Added' : '+ Add'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <div className="modal-footer"><button className="btn btn-primary" onClick={onClose}>Done</button></div>
      </div>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function HabitsView({ habits, logs, loading, addHabit, updateHabit, deleteHabit, toggleHabitLog, getTodayScore }) {
  const [innerTab,      setInnerTab]      = useState('today')
  const [showModal,     setShowModal]     = useState(false)
  const [showPresets,   setShowPresets]   = useState(false)
  const [showWarning,   setShowWarning]   = useState(false)
  const [pendingAdd,    setPendingAdd]    = useState(null)
  const [editHabit,     setEditHabit]     = useState(null)
  const [masteredHabit, setMasteredHabit] = useState(null)

  const today        = formatDate()
  const todayScore   = getTodayScore()
  const activeHabits = habits.filter(h => h.active && !h.mastered)
  const todayHabits  = activeHabits.filter(h => isHabitScheduledOn(h, today))
  const offHabits    = activeHabits.filter(h => !isHabitScheduledOn(h, today))
  const doneTodayCount = todayHabits.filter(h => logs.find(l => l.habitId === h.id && l.date === today && l.done)).length

  function handleAddClick() {
    setEditHabit(null)
    if (activeHabits.length >= ACTIVE_HABIT_LIMIT) { setPendingAdd(() => () => setShowModal(true)); setShowWarning(true) }
    else setShowModal(true)
  }

  function handleMastered(habit) {
    updateHabit(habit.id, { active: false, mastered: true, masteredAt: formatDate() })
    setMasteredHabit(habit)
  }

  if (loading) return <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>Loading habits...</div>

  return (
    <div className="fade-in">
      <div className="section-header">
        <div>
          <div className="section-title">🧠 Habits</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Based on Atomic Habits — James Clear</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setShowPresets(true)}>⚡ Presets</button>
          <button className="btn btn-primary" onClick={handleAddClick}>+ Add habit</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {[{ id: 'today', label: '✅ Today' }, { id: 'history', label: '📊 History' }].map(t => (
          <button key={t.id} onClick={() => setInnerTab(t.id)} style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', color: innerTab === t.id ? 'var(--accent)' : 'var(--text3)', borderBottom: innerTab === t.id ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1 }}>{t.label}</button>
        ))}
      </div>

      {innerTab === 'today' && (
        <>
          <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Today's score</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, lineHeight: 1, color: todayScore >= 80 ? 'var(--green)' : todayScore >= 50 ? 'var(--amber)' : 'var(--red)' }}>
                {todayScore}<span style={{ fontSize: 20 }}>%</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
                {doneTodayCount}/{todayHabits.length} due today
                {offHabits.length > 0 && <span style={{ color: 'var(--text3)', marginLeft: 6 }}>· {offHabits.length} off today</span>}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="progress-bar" style={{ height: 10 }}>
                <div className="progress-fill" style={{ width: `${todayScore}%`, background: todayScore >= 80 ? 'var(--green)' : todayScore >= 50 ? 'var(--amber)' : 'var(--red)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--text3)' }}>
                <span>0%</span>
                <span style={{ color: 'var(--amber)', fontWeight: 600 }}>Ideal Joseph: 100%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {todayHabits.length === 0 && offHabits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧠</div>
              <h3>No active habits</h3>
              <p>Add your first habit to start building discipline</p>
            </div>
          ) : (
            <>
              {todayHabits.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {todayHabits.map(habit => (
                    <HabitCard key={habit.id} habit={habit} logs={logs} today={today}
                      toggleHabitLog={toggleHabitLog}
                      onEdit={() => { setEditHabit(habit); setShowModal(true) }}
                      onArchive={() => updateHabit(habit.id, { active: false })}
                      onDelete={() => deleteHabit(habit.id)}
                      onMastered={handleMastered}
                    />
                  ))}
                </div>
              )}
              {offHabits.length > 0 && (
                <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>
                    😴 Not scheduled today: {offHabits.map(h => `${h.icon} ${h.name}`).join(' · ')}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {innerTab === 'history' && (
        <HistoryTab habits={habits} logs={logs} updateHabit={updateHabit} deleteHabit={deleteHabit}
          onEditHabit={habit => { setEditHabit(habit); setShowModal(true) }}
          toggleHabitLog={toggleHabitLog}
        />
      )}

      {masteredHabit && <MasteryModal habit={masteredHabit} onClose={() => setMasteredHabit(null)} />}
      {showWarning && <OverLimitWarning onContinue={() => { setShowWarning(false); if (pendingAdd) { pendingAdd(); setPendingAdd(null) } }} onCancel={() => { setShowWarning(false); setPendingAdd(null) }} />}
      {showModal && <HabitModal editHabit={editHabit} onClose={() => setShowModal(false)} onSave={data => editHabit ? updateHabit(editHabit.id, data) : addHabit(data)} />}
      {showPresets && <PresetPanel habits={habits} addHabit={addHabit} onClose={() => setShowPresets(false)} />}
    </div>
  )
}
