import { useState, useMemo, useEffect } from 'react'
import { formatDate, getLast30Days, getLast90Days, getStreak, getCompletionRate } from '../lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const HABIT_ICONS = ['🏃','💧','📖','🧘','🥗','😴','💪','✍️','🎯','🌅','🧠','❤️','🚶','🎵','🙏']
const HABIT_COLORS = ['#7c6aff','#14b8a6','#3b82f6','#f59e0b','#22c55e','#ec4899','#f97316','#a855f7']
const ACTIVE_HABIT_LIMIT = 6

const HEATMAP_RANGES = [
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1yr', days: 365 },
]

const LIFE_AREA_PRESETS = [
  {
    area: 'Trading', icon: '📈', color: '#14b8a6',
    habits: [
      { name: 'Review trades',       icon: '📊', description: 'Review all trades taken today',                 color: '#14b8a6' },
      { name: 'Follow plan',         icon: '📋', description: 'Stick to trading plan — no deviation',           color: '#14b8a6' },
      { name: 'Journal emotions',    icon: '✍️', description: 'Log emotional state before & after session',    color: '#14b8a6' },
      { name: 'No overtrading',      icon: '🛑', description: 'Respect daily loss limit and trade count',      color: '#14b8a6' },
    ],
  },
  {
    area: 'Health', icon: '💪', color: '#f97316',
    habits: [
      { name: 'Workout',    icon: '🏋️', description: 'Resistance or Zone 2 session',            color: '#f97316' },
      { name: 'Sleep 7h+', icon: '😴', description: 'Get at least 7 hours of quality sleep',    color: '#f97316' },
      { name: 'Water',      icon: '💧', description: '2.5L minimum throughout the day',          color: '#f97316' },
      { name: 'Stretch',    icon: '🤸', description: 'Mobility or stretching session',           color: '#f97316' },
    ],
  },
  {
    area: 'Focus', icon: '🎯', color: '#7c6aff',
    habits: [
      { name: 'Deep work session',  icon: '🎯', description: 'Minimum 90 min uninterrupted focus block',        color: '#7c6aff' },
      { name: 'No social media',    icon: '📵', description: 'No mindless scrolling — intentional use only',    color: '#7c6aff' },
      { name: 'Complete main task', icon: '✅', description: 'Finish the #1 priority task of the day',          color: '#7c6aff' },
      { name: 'Plan tomorrow',      icon: '🗓️', description: "Set tomorrow's tasks and main goal tonight",      color: '#7c6aff' },
    ],
  },
  {
    area: 'Learning', icon: '📚', color: '#f59e0b',
    habits: [
      { name: '20–30 min study', icon: '📖', description: 'Focused reading or course study session',         color: '#f59e0b' },
      { name: 'Take notes',      icon: '📝', description: 'Capture key takeaways from what you learned',     color: '#f59e0b' },
      { name: 'Apply learning',  icon: '🔬', description: 'Implement or test something you studied',         color: '#f59e0b' },
    ],
  },
  {
    area: 'Mental', icon: '🧘', color: '#a855f7',
    habits: [
      { name: 'Meditation / breathing', icon: '🧘', description: 'Mindfulness, breathwork, or meditation',           color: '#a855f7' },
      { name: 'Gratitude',              icon: '🙏', description: "Write 3 things you're grateful for",               color: '#a855f7' },
      { name: 'Quiet time',             icon: '🌅', description: 'Screen-free quiet time for mental recovery',       color: '#a855f7' },
      { name: 'Awareness of thoughts',  icon: '🧠', description: 'Check in with mental state — journal if needed',   color: '#a855f7' },
    ],
  },
  {
    area: 'Social', icon: '❤️', color: '#ec4899',
    habits: [
      { name: 'Message / call someone',  icon: '📱', description: 'Reach out to a friend or family member',         color: '#ec4899' },
      { name: 'Meaningful conversation', icon: '💬', description: 'Have a real, deep conversation today',            color: '#ec4899' },
      { name: 'Spend time with others',  icon: '👥', description: 'Quality in-person or intentional social time',   color: '#ec4899' },
    ],
  },
]

// ─── Stage engine ─────────────────────────────────────────────────────────────

function getHabitStage(logs, habitId) {
  const doneDates = [...new Set(
    logs.filter(l => l.habitId === habitId && l.done).map(l => l.date)
  )].sort()

  const totalDays = doneDates.length

  if (totalDays === 0) return { stage: 1, day: 0, label: 'Stage 1 — Initiation', stagePct: 0, mastered: false }

  const firstDate  = new Date(doneDates[0])
  const daysSince  = Math.round((new Date() - firstDate) / 86400000) + 1

  function rateOver(n) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - n)
    const cutoffStr = formatDate(cutoff)
    const possible = Math.min(n, daysSince)
    const done = doneDates.filter(d => d >= cutoffStr).length
    return possible > 0 ? (done / possible) : 0
  }

  function longestGapLast90() {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90)
    const cutoffStr = formatDate(cutoff)
    const recent = doneDates.filter(d => d >= cutoffStr)
    if (recent.length < 2) return 999
    let maxGap = 0
    for (let i = 1; i < recent.length; i++) {
      const gap = (new Date(recent[i]) - new Date(recent[i-1])) / 86400000
      if (gap > maxGap) maxGap = gap
    }
    return maxGap
  }

  const rate30 = rateOver(30)
  const rate90 = rateOver(90)
  const maxGap = longestGapLast90()

  const mastered =
    (daysSince >= 66 && rate90 >= 0.80) ||
    (daysSince >= 90 && rate90 >= 0.75 && maxGap <= 2)

  if (mastered) return { stage: 4, day: totalDays, label: '✦ Mastered', stagePct: 100, mastered: true }

  if (daysSince >= 91 && rate90 >= 0.80) {
    return { stage: 3, day: daysSince, label: 'Stage 3 — Stability', stagePct: Math.min(100, Math.round((daysSince / 180) * 100)), mastered: false }
  }

  if (daysSince >= 31 && rate30 >= 0.80) {
    const pct = Math.min(100, Math.round(((daysSince - 30) / 60) * 100))
    return { stage: 2, day: daysSince, label: 'Stage 2 — Learning', stagePct: pct, mastered: false }
  }

  const pct = Math.min(100, Math.round((daysSince / 30) * 100))
  return { stage: 1, day: daysSince, label: 'Stage 1 — Initiation', stagePct: pct, mastered: false }
}

const STAGE_COLORS = { 1: '#ef4444', 2: '#f59e0b', 3: '#22c55e', 4: '#a855f7' }
const STAGE_ICONS  = { 1: '●', 2: '●', 3: '●', 4: '✦' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLastNDays(n) {
  if (n === 30) return getLast30Days()
  if (n === 90) return getLast90Days()
  const days = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    days.push(formatDate(d))
  }
  return days
}

function getAllTimeDays(logs, habitId)  { return logs.filter(l => l.habitId === habitId && l.done).length }

function getLongestStreak(logs, habitId) {
  const doneDates = logs.filter(l => l.habitId === habitId && l.done).map(l => l.date).sort()
  if (!doneDates.length) return 0
  let longest = 1, current = 1
  for (let i = 1; i < doneDates.length; i++) {
    const diff = (new Date(doneDates[i]) - new Date(doneDates[i-1])) / 86400000
    if (diff === 1) { current++; if (current > longest) longest = current }
    else if (diff > 1) current = 1
  }
  return longest
}

function getAllTimeRate(logs, habitId) {
  const doneDates = [...new Set(logs.filter(l => l.habitId === habitId && l.done).map(l => l.date))]
  if (!doneDates.length) return 0
  const earliest = doneDates.sort()[0]
  const daysSince = Math.max(1, Math.round((new Date() - new Date(earliest)) / 86400000) + 1)
  return Math.round((doneDates.length / daysSince) * 100)
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function HabitModal({ onClose, onSave, editHabit }) {
  const [name, setName]               = useState(editHabit?.name || '')
  const [icon, setIcon]               = useState(editHabit?.icon || '🎯')
  const [color, setColor]             = useState(editHabit?.color || '#7c6aff')
  const [description, setDescription] = useState(editHabit?.description || '')

  function handleSave() {
    if (!name.trim()) return
    onSave({ name: name.trim(), icon, color, description })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{editHabit ? 'Edit habit' : 'Add new habit'}</div>
        <div className="form-group">
          <label>Habit name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Morning workout" autoFocus />
        </div>
        <div className="form-group">
          <label>Description (optional)</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. 20 min minimum" />
        </div>
        <div className="form-group">
          <label>Icon</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {HABIT_ICONS.map(i => (
              <button key={i} onClick={() => setIcon(i)} style={{
                width: 36, height: 36, borderRadius: 8,
                border: `2px solid ${icon === i ? 'var(--accent)' : 'var(--border)'}`,
                background: icon === i ? 'var(--accent-glow)' : 'var(--bg3)',
                cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{i}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {HABIT_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: 28, height: 28, borderRadius: '50%', background: c,
                border: `3px solid ${color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer',
              }} />
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save habit</button>
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
          Research shows <strong style={{ color: 'var(--text)' }}>6 is the optimal maximum</strong> for habit
          adherence. Adding more reduces your success rate on all habits. Are you sure you want to add more?
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
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: '0 0 16px' }}>
          You've built this into your identity.<br />
          <strong style={{ color: 'var(--text)' }}>This is who you are now.</strong>
        </p>
        <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, margin: '0 0 20px' }}>
          James Clear calls this the identity level — you're not <em>doing</em> the habit, you <em>ARE</em> the habit.
          It's been moved to your Mastered Hall of Fame and a slot has opened for your next habit to build.
        </p>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#a855f7', borderColor: '#a855f7' }} onClick={onClose}>
          ✦ Accept mastery
        </button>
      </div>
    </div>
  )
}

// ─── Retroactive Day Log Modal ────────────────────────────────────────────────

function RetroLogModal({ dateStr, habits, logs, toggleHabitLog, onClose }) {
  const activeHabits = habits.filter(h => h.active && !h.mastered)
  const today = formatDate()
  const isFuture = dateStr > today

  const friendlyDate = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

  function isDone(habitId) {
    return !!logs.find(l => l.habitId === habitId && l.date === dateStr && l.done)
  }

  const doneCount = activeHabits.filter(h => isDone(h.id)).length
  const pct = activeHabits.length > 0 ? Math.round((doneCount / activeHabits.length) * 100) : 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div className="modal-title" style={{ margin: 0 }}>
            {dateStr === today ? '✅ Today' : '📅 ' + friendlyDate}
          </div>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>

        {isFuture ? (
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 12 }}>
            Can't log habits for future dates.
          </p>
        ) : (
          <>
            {/* Score bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>
                <span>{doneCount}/{activeHabits.length} habits</span>
                <span style={{ fontWeight: 700, color: pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)' }}>{pct}%</span>
              </div>
              <div className="progress-bar" style={{ height: 6 }}>
                <div className="progress-fill" style={{
                  width: `${pct}%`,
                  background: pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)'
                }} />
              </div>
            </div>

            {activeHabits.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text3)' }}>No active habits to log.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activeHabits.map(habit => {
                  const done = isDone(habit.id)
                  return (
                    <div
                      key={habit.id}
                      onClick={() => toggleHabitLog(habit.id, dateStr)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        background: done ? `${habit.color}18` : 'var(--bg3)',
                        border: `1px solid ${done ? habit.color : 'var(--border)'}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        border: `2px solid ${done ? habit.color : 'var(--border2)'}`,
                        background: done ? habit.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, color: '#fff', fontWeight: 700,
                      }}>
                        {done ? '✓' : ''}
                      </div>
                      <span style={{ fontSize: 18 }}>{habit.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: 600, fontSize: 14,
                          color: done ? 'var(--text3)' : 'var(--text)',
                          textDecoration: done ? 'line-through' : 'none',
                        }}>{habit.name}</div>
                        {habit.description && (
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{habit.description}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5 }}>
              {dateStr !== today && '📝 Retroactive log — tap any habit to toggle it for this day'}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

function HabitHeatmap({ habitId, logs, rangeDays }) {
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
              const done = logs.find(l => l.habitId === habitId && l.date === date && l.done)
              return (
                <div key={date} title={date} style={{
                  width: 9, height: 9, borderRadius: 2,
                  background: done ? 'var(--accent)' : 'var(--bg4)',
                  opacity: date === today ? 1 : done ? 0.85 : 0.35,
                  outline: date === today ? '1px solid var(--accent)' : 'none',
                }} />
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
        const done    = logs.find(l => l.habitId === habitId && l.date === date && l.done)
        const isToday = date === today
        return <div key={date} className={`heatmap-cell ${done ? 'done' : ''} ${isToday ? 'today' : ''}`} title={date} />
      })}
    </div>
  )
}

// ─── Habit card with stage indicator ─────────────────────────────────────────

function HabitCard({ habit, logs, today, toggleHabitLog, onEdit, onArchive, onDelete, onMastered }) {
  const [rangeDays, setRangeDays] = useState(30)

  const isDone = !!logs.find(l => l.habitId === habit.id && l.date === today && l.done)
  const streak = getStreak(logs, habit.id)
  const rate30 = getCompletionRate(logs, habit.id, 30)
  const stageInfo = useMemo(() => getHabitStage(logs, habit.id), [logs, habit.id])

  useEffect(() => {
    if (stageInfo.mastered && habit.active && !habit.mastered) {
      onMastered(habit)
    }
  }, [stageInfo.mastered])

  const stageColor = STAGE_COLORS[stageInfo.stage]
  const stageGoal  = stageInfo.stage === 1 ? 30 : stageInfo.stage === 2 ? 90 : 180

  return (
    <div className="card" style={{ borderLeft: `3px solid ${habit.color || 'var(--accent)'}` }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className={`habit-toggle ${isDone ? 'done' : ''}`}
          style={{ borderColor: isDone ? habit.color : 'var(--border2)', background: isDone ? habit.color : 'transparent' }}
          onClick={() => toggleHabitLog(habit.id)}
        >
          {isDone ? '✓' : ''}
        </button>
        <span style={{ fontSize: 24 }}>{habit.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text3)' : 'var(--text)' }}>
            {habit.name}
          </div>
          {habit.description && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{habit.description}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {streak > 0 && <span className="streak">🔥 {streak}d</span>}
          <span className="badge badge-blue">{rate30}% / 30d</span>
          <button className="btn btn-sm" title="Edit" onClick={onEdit}>✏️</button>
          <button className="btn btn-sm" title="Archive" onClick={onArchive}>📦</button>
          <button className="btn btn-sm btn-danger" title="Delete" onClick={onDelete}>✕</button>
        </div>
      </div>

      {/* Stage bar */}
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: stageColor, fontWeight: 700, flexShrink: 0 }}>
          {STAGE_ICONS[stageInfo.stage]} {stageInfo.label}
        </span>
        <div style={{ flex: 1, height: 4, background: 'var(--bg4)', borderRadius: 2 }}>
          <div style={{ height: '100%', borderRadius: 2, background: stageColor, width: `${stageInfo.stagePct}%`, transition: 'width 0.6s ease' }} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>Day {stageInfo.day}/{stageGoal}</span>
      </div>

      {/* Heatmap range */}
      <div style={{ marginTop: 10, display: 'flex', gap: 4 }}>
        {HEATMAP_RANGES.map(r => (
          <button key={r.label} onClick={() => setRangeDays(r.days)} style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${rangeDays === r.days ? 'var(--accent)' : 'var(--border)'}`,
            background: rangeDays === r.days ? 'var(--accent-glow)' : 'transparent',
            color: rangeDays === r.days ? 'var(--accent)' : 'var(--text3)',
          }}>{r.label}</button>
        ))}
      </div>
      <HabitHeatmap habitId={habit.id} logs={logs} rangeDays={rangeDays} />
    </div>
  )
}

// ─── Stat row (history tab) ───────────────────────────────────────────────────

function StatRow({ s, onEdit, onArchive, onUnarchive, onDelete }) {
  const { habit, stageInfo, allTimeRate, longestStreak, currentStreak, totalDays } = s
  const stageColor = STAGE_COLORS[stageInfo.stage]
  const isArchived = !habit.active && !habit.mastered

  return (
    <div className="card" style={{ marginBottom: 10, borderLeft: `3px solid ${habit.color || 'var(--accent)'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 22 }}>{habit.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{habit.name}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text3)', flexWrap: 'wrap' }}>
            <span style={{ color: stageColor, fontWeight: 700 }}>{STAGE_ICONS[stageInfo.stage]} {stageInfo.label}</span>
            <span>🔥 Best streak: {longestStreak}d</span>
            <span>⚡ Current: {currentStreak}d</span>
            <span>📅 Total: {totalDays} days</span>
            <span>📊 All-time: {allTimeRate}%</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm" onClick={onEdit}>✏️</button>
          {isArchived
            ? <button className="btn btn-sm" style={{ color: 'var(--green)', borderColor: 'var(--green)' }} onClick={onUnarchive}>♻️</button>
            : <button className="btn btn-sm" style={{ color: 'var(--amber)', borderColor: 'var(--amber)' }} onClick={onArchive}>📦</button>
          }
          <button className="btn btn-sm btn-danger" onClick={onDelete}>✕</button>
        </div>
      </div>
    </div>
  )
}

// ─── Calendar with retroactive logging ───────────────────────────────────────

function HabitsCalendar({ logs, habits, toggleHabitLog }) {
  const now = new Date()
  const [year,       setYear]       = useState(now.getFullYear())
  const [month,      setMonth]      = useState(now.getMonth())
  const [retroDate,  setRetroDate]  = useState(null) // date string for retro modal

  const today      = formatDate()
  const monthName  = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstDay   = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const blanks     = firstDay === 0 ? 6 : firstDay - 1

  const activeHabits = habits.filter(h => h.active && !h.mastered)

  // Map dateStr -> done habit ids
  const byDay = useMemo(() => {
    const map = {}
    logs.filter(l => l.done).forEach(l => {
      if (!map[l.date]) map[l.date] = []
      map[l.date].push(l.habitId)
    })
    return map
  }, [logs])

  function handleDayClick(dateStr) {
    if (dateStr > today) return // no future logging
    setRetroDate(dateStr)
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div className="card-title" style={{ margin: 0 }}>📅 Calendar</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              Tap any past day to log or edit habits retroactively
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-sm" onClick={() => { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1) }}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 600, minWidth: 130, textAlign: 'center' }}>{monthName}</span>
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
            const day     = i + 1
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const doneIds = byDay[dateStr] || []
            const isToday = dateStr === today
            const isFuture = dateStr > today
            const isSelected = retroDate === dateStr

            const pct = activeHabits.length > 0
              ? Math.round((doneIds.length / activeHabits.length) * 100)
              : 0
            const dotColor = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : doneIds.length > 0 ? 'var(--red)' : null

            return (
              <div
                key={day}
                onClick={() => !isFuture && handleDayClick(dateStr)}
                style={{
                  minHeight: 38, borderRadius: 6, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: isFuture ? 'default' : 'pointer',
                  background: isSelected
                    ? 'var(--accent-glow)'
                    : isToday
                    ? 'var(--accent-glow)'
                    : 'var(--bg3)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : isToday ? 'var(--accent)' : 'transparent'}`,
                  opacity: isFuture ? 0.3 : 1,
                  transition: 'background 0.1s, border-color 0.1s',
                }}
                onMouseEnter={e => { if (!isFuture) e.currentTarget.style.borderColor = 'var(--border2)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isSelected || isToday ? 'var(--accent)' : 'transparent' }}
              >
                <span style={{ fontSize: 12, color: isToday || isSelected ? 'var(--accent)' : 'var(--text2)', fontWeight: isToday || isSelected ? 700 : 400 }}>{day}</span>
                {dotColor && <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, marginTop: 2 }} />}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>
          {[['var(--green)','80%+ done'],['var(--amber)','50–79%'],['var(--red)','Under 50%']].map(([c,l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />{l}
            </span>
          ))}
        </div>
      </div>

      {/* Retroactive log modal */}
      {retroDate && (
        <RetroLogModal
          dateStr={retroDate}
          habits={habits}
          logs={logs}
          toggleHabitLog={toggleHabitLog}
          onClose={() => setRetroDate(null)}
        />
      )}
    </>
  )
}

// ─── History tab ──────────────────────────────────────────────────────────────

function HistoryTab({ habits, logs, updateHabit, deleteHabit, onEditHabit, toggleHabitLog }) {
  const stats = useMemo(() =>
    habits.map(h => ({
      habit:         h,
      stageInfo:     getHabitStage(logs, h.id),
      allTimeRate:   getAllTimeRate(logs, h.id),
      longestStreak: getLongestStreak(logs, h.id),
      currentStreak: getStreak(logs, h.id),
      totalDays:     getAllTimeDays(logs, h.id),
    })).sort((a, b) => b.allTimeRate - a.allTimeRate),
  [habits, logs])

  const activeStats   = stats.filter(s => s.habit.active && !s.habit.mastered)
  const masteredStats = stats.filter(s => s.habit.mastered)
  const archivedStats = stats.filter(s => !s.habit.active && !s.habit.mastered)

  function section(title, items, renderActions) {
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
        {items.length === 0
          ? <div style={{ color: 'var(--text3)', fontSize: 13 }}>None yet.</div>
          : items.map(s => renderActions(s))
        }
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Calendar now has retroactive logging built in */}
      <HabitsCalendar logs={logs} habits={habits} toggleHabitLog={toggleHabitLog} />

      {section('Active habits — all-time stats', activeStats, s => (
        <StatRow key={s.habit.id} s={s}
          onEdit={() => onEditHabit(s.habit)}
          onArchive={() => updateHabit(s.habit.id, { active: false })}
          onDelete={() => deleteHabit(s.habit.id)}
        />
      ))}

      {masteredStats.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#a855f7', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            ✦ Mastered Hall of Fame
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
            These habits are now part of your identity. Slots freed up for new growth.
          </div>
          {masteredStats.map(s => (
            <StatRow key={s.habit.id} s={s}
              onEdit={() => onEditHabit(s.habit)}
              onUnarchive={() => updateHabit(s.habit.id, { active: true, mastered: false })}
              onDelete={() => deleteHabit(s.habit.id)}
            />
          ))}
        </div>
      )}

      {section('📦 Archived habits', archivedStats, s => (
        <StatRow key={s.habit.id} s={s}
          onEdit={() => onEditHabit(s.habit)}
          onUnarchive={() => updateHabit(s.habit.id, { active: true })}
          onDelete={() => deleteHabit(s.habit.id)}
        />
      ))}
    </div>
  )
}

// ─── Preset panel ─────────────────────────────────────────────────────────────

function PresetPanel({ habits, addHabit, onClose }) {
  const activeCount   = habits.filter(h => h.active).length
  const existingNames = habits.map(h => h.name.toLowerCase())
  function alreadyAdded(name) { return existingNames.includes(name.toLowerCase()) }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">Quick-add from presets</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
          Active habits: {activeCount}/{ACTIVE_HABIT_LIMIT} — keep it focused
        </div>
        {LIFE_AREA_PRESETS.map(area => (
          <div key={area.area} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 16 }}>{area.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: area.color }}>{area.area}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {area.habits.map(h => {
                const added = alreadyAdded(h.name)
                return (
                  <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--bg3)', opacity: added ? 0.5 : 1 }}>
                    <span style={{ fontSize: 18 }}>{h.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{h.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{h.description}</div>
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
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
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

  const today          = formatDate()
  const todayScore     = getTodayScore()
  const activeHabits   = habits.filter(h => h.active && !h.mastered)
  const doneTodayCount = activeHabits.filter(h =>
    logs.find(l => l.habitId === h.id && l.date === today && l.done)
  ).length

  function handleAddClick() {
    setEditHabit(null)
    if (activeHabits.length >= ACTIVE_HABIT_LIMIT) {
      setPendingAdd(() => () => setShowModal(true))
      setShowWarning(true)
    } else {
      setShowModal(true)
    }
  }

  function handleWarningContinue() {
    setShowWarning(false)
    if (pendingAdd) { pendingAdd(); setPendingAdd(null) }
  }

  function handleMastered(habit) {
    updateHabit(habit.id, { active: false, mastered: true, masteredAt: formatDate() })
    setMasteredHabit(habit)
  }

  if (loading) return <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>Loading habits...</div>

  return (
    <div className="fade-in">
      {/* Header */}
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

      {/* Inner tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {[{ id: 'today', label: '✅ Today' }, { id: 'history', label: '📊 History' }].map(t => (
          <button key={t.id} onClick={() => setInnerTab(t.id)} style={{
            padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: 'none', border: 'none',
            color: innerTab === t.id ? 'var(--accent)' : 'var(--text3)',
            borderBottom: innerTab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* TODAY */}
      {innerTab === 'today' && (
        <>
          <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Today's score</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, lineHeight: 1, color: todayScore >= 80 ? 'var(--green)' : todayScore >= 50 ? 'var(--amber)' : 'var(--red)' }}>
                {todayScore}<span style={{ fontSize: 20 }}>%</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{doneTodayCount}/{activeHabits.length} habits complete</div>
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

          {activeHabits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧠</div>
              <h3>No active habits</h3>
              <p>Add your first habit to start building discipline</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeHabits.map(habit => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  logs={logs}
                  today={today}
                  toggleHabitLog={toggleHabitLog}
                  onEdit={() => { setEditHabit(habit); setShowModal(true) }}
                  onArchive={() => updateHabit(habit.id, { active: false })}
                  onDelete={() => deleteHabit(habit.id)}
                  onMastered={handleMastered}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* HISTORY */}
      {innerTab === 'history' && (
        <HistoryTab
          habits={habits}
          logs={logs}
          updateHabit={updateHabit}
          deleteHabit={deleteHabit}
          onEditHabit={habit => { setEditHabit(habit); setShowModal(true) }}
          toggleHabitLog={toggleHabitLog}
        />
      )}

      {/* Modals */}
      {masteredHabit && (
        <MasteryModal habit={masteredHabit} onClose={() => setMasteredHabit(null)} />
      )}
      {showWarning && (
        <OverLimitWarning
          onContinue={handleWarningContinue}
          onCancel={() => { setShowWarning(false); setPendingAdd(null) }}
        />
      )}
      {showModal && (
        <HabitModal
          editHabit={editHabit}
          onClose={() => setShowModal(false)}
          onSave={data => editHabit ? updateHabit(editHabit.id, data) : addHabit(data)}
        />
      )}
      {showPresets && (
        <PresetPanel habits={habits} addHabit={addHabit} onClose={() => setShowPresets(false)} />
      )}
    </div>
  )
}
