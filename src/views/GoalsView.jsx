import { useState } from 'react'
import { formatDate, scoreColor } from '../lib/utils'

const CATEGORIES = ['Trading', 'Business', 'Health', 'Focus', 'Learning', 'Mental', 'Social', 'Finance', 'Creativity', 'Travel', 'Other']

const CATEGORY_COLORS = {
  Trading:    '#14b8a6',
  Business:   '#0ea5e9',
  Health:     '#f97316',
  Focus:      '#7c6aff',
  Learning:   '#f59e0b',
  Mental:     '#a855f7',
  Social:     '#ec4899',
  Finance:    '#22c55e',
  Creativity: '#f43f5e',
  Travel:     '#06b6d4',
  Other:      '#9898b0',
}

const CATEGORY_ICONS = {
  Trading:    '📈',
  Business:   '💼',
  Health:     '💪',
  Focus:      '🧠',
  Learning:   '📚',
  Mental:     '🧘',
  Social:     '❤️',
  Finance:    '💰',
  Creativity: '🎨',
  Travel:     '✈️',
  Other:      '🎯',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCountdown(targetDate) {
  if (!targetDate) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(targetDate); target.setHours(0,0,0,0)
  return Math.round((target - today) / 86400000)
}

function isTodayMonday() { return new Date().getDay() === 1 }

function calcStreak(oneThing = []) {
  if (!oneThing.length) return 0
  const today = new Date(); today.setHours(0,0,0,0)
  const dates = new Set(oneThing.map(o => o.date))
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    if (dates.has(d.toISOString().slice(0,10))) streak++
    else break
  }
  return streak
}

function calcLastActivity(goal) {
  // Returns ISO date string of most recent task completion or milestone toggle
  const events = []
  ;(goal.milestones || []).forEach(m => {
    if (m.completedAt) events.push(m.completedAt)
    ;(m.tasks || []).forEach(t => { if (t.completedAt) events.push(t.completedAt) })
  })
  if (!events.length) return null
  return events.sort().reverse()[0].slice(0, 10)
}

function daysSince(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(dateStr); d.setHours(0,0,0,0)
  return Math.round((today - d) / 86400000)
}

function deadlineLabel(days) {
  if (days === null) return null
  if (days < 0)  return { text: `${Math.abs(days)}d overdue`, color: '#ef4444', pulse: true }
  if (days === 0) return { text: 'Due TODAY', color: '#ef4444', pulse: true }
  if (days <= 3)  return { text: `${days}d left`, color: '#ef4444', pulse: true }
  if (days <= 7)  return { text: `${days}d left`, color: '#f59e0b', pulse: false }
  if (days <= 14) return { text: `${days}d left`, color: '#f59e0b', pulse: false }
  if (days <= 30) return { text: `${days}d left`, color: '#22c55e', pulse: false }
  return { text: `${days}d left`, color: '#3b82f6', pulse: false }
}

// ─── 12WY sprint badge helper ────────────────────────────────────────────────

function get12WYQuarterLabel() {
  // Reads localStorage (same key as WeeklyView)
  const qs = localStorage.getItem('lo_12wy_quarterStart')
  if (!qs) return null
  const start = new Date(qs + 'T00:00:00')
  const end   = new Date(start); end.setDate(end.getDate() + 83)
  const today = new Date(); today.setHours(0,0,0,0)
  const diffDays  = Math.floor((today - start) / 86400000)
  if (diffDays < 0 || diffDays > 84) return null
  const weekNum = Math.floor(diffDays / 7) + 1
  return { weekNum, endStr: end.toISOString().split('T')[0] }
}

function sprintBadge(targetDate) {
  const info = get12WYQuarterLabel()
  if (!info || !targetDate) return null
  const fits = targetDate <= info.endStr
  return {
    text: fits ? `Q2 W${info.weekNum}` : 'Beyond Q2',
    color: fits ? '#7c6aff' : '#9898b0',
    bg:    fits ? 'rgba(124,106,255,0.1)' : 'rgba(152,152,176,0.08)',
    fits,
  }
}

// ─── Focus Mode (top bar) ─────────────────────────────────────────────────────

function FocusBar({ nextActions, onToggleTask, onDismiss }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(124,106,255,0.08), rgba(192,132,252,0.05))',
      border: '1px solid rgba(124,106,255,0.25)',
      borderRadius: 14,
      padding: '18px 22px',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#9f91ff',
            boxShadow: '0 0 8px rgba(159,145,255,0.8)',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#9f91ff', letterSpacing: 1, textTransform: 'uppercase' }}>
            ⚡ Focus Mode
          </span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>— {today}</span>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>

      {nextActions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text3)', fontSize: 13 }}>
          No next actions set — expand a goal, open a milestone, add a task and flag it ⚡
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {nextActions.map((task, idx) => {
            const color = CATEGORY_COLORS[task.goalCategory] || '#7c6aff'
            return (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 14px', borderRadius: 10,
                background: task.done ? 'rgba(255,255,255,0.02)' : 'var(--bg2)',
                border: `1px solid ${task.done ? 'var(--border)' : color + '40'}`,
                opacity: task.done ? 0.5 : 1,
                transition: 'all 0.2s',
                animationDelay: `${idx * 0.05}s`,
              }}>
                <button
                  onClick={() => onToggleTask(task.goalId, task.milestoneIndex, task.id)}
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    border: `2px solid ${task.done ? '#22c55e' : color}`,
                    background: task.done ? '#22c55e' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#fff', transition: 'all 0.15s',
                  }}
                >{task.done ? '✓' : ''}</button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>
                    <span style={{ color }}>{task.goalCategory}</span>
                    <span style={{ margin: '0 5px', opacity: 0.4 }}>›</span>
                    <span>{task.goalTitle}</span>
                    <span style={{ margin: '0 5px', opacity: 0.4 }}>›</span>
                    <span>{task.milestoneText}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: task.done ? 'var(--text3)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none' }}>
                    {task.text}
                  </div>
                  {task.intention && (
                    <div style={{ fontSize: 11, color: '#7c6aff', marginTop: 3, fontStyle: 'italic' }}>
                      📍 {task.intention}
                    </div>
                  )}
                </div>

                <span style={{ fontSize: 10, fontWeight: 700, color, padding: '3px 8px', borderRadius: 20, background: color + '15', flexShrink: 0 }}>
                  NEXT
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text3)', padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
        💡 <strong style={{ color: '#f59e0b' }}>GTD:</strong> Do next actions by energy level, not urgency. Start the one you can begin <em>right now</em> and finish it before switching.
      </div>
    </div>
  )
}

// ─── WOOP Modal ───────────────────────────────────────────────────────────────

function WOOPModal({ goal, onClose, onSave }) {
  const existing = goal.woop || {}
  const [wish,     setWish]     = useState(existing.wish     || '')
  const [outcome,  setOutcome]  = useState(existing.outcome  || '')
  const [obstacle, setObstacle] = useState(existing.obstacle || '')
  const [plan,     setPlan]     = useState(existing.plan     || '')

  const steps = [
    { key: 'wish',     label: 'W — Wish',     icon: '🌟', color: '#9f91ff', placeholder: 'What is your most important goal or milestone right now?',          value: wish,     set: setWish },
    { key: 'outcome',  label: 'O — Outcome',  icon: '🏆', color: '#22c55e', placeholder: 'What does success feel like? Imagine the best outcome vividly.',    value: outcome,  set: setOutcome },
    { key: 'obstacle', label: 'O — Obstacle', icon: '🧱', color: '#f59e0b', placeholder: 'What inner obstacle usually stops you? (e.g. "I lose motivation after a bad day")', value: obstacle, set: setObstacle },
    { key: 'plan',     label: 'P — Plan',     icon: '⚡', color: '#ef4444', placeholder: 'If [obstacle], then I will [exact counter-action]. Be specific.', value: plan,     set: setPlan },
  ]

  const [activeStep, setActiveStep] = useState(0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, width: '100%' }}>
        <div style={{ marginBottom: 20 }}>
          <div className="modal-title" style={{ marginBottom: 4 }}>🔮 WOOP — Anti-Quit System</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
            For <strong style={{ color: 'var(--text2)' }}>{goal.title}</strong><br />
            20+ years of RCT research (Gabriele Oettingen). Mental contrasting + implementation intentions = you stop quitting.
          </div>
        </div>

        {/* Step tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {steps.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setActiveStep(i)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeStep === i ? s.color + '20' : 'var(--bg3)',
                border: `1px solid ${activeStep === i ? s.color + '60' : 'var(--border)'}`,
                color: activeStep === i ? s.color : 'var(--text3)',
                fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 2 }}>{s.icon}</div>
              {s.key.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Active step */}
        {steps.map((s, i) => i === activeStep && (
          <div key={s.key}>
            <div style={{ fontSize: 15, fontWeight: 700, color: s.color, marginBottom: 8 }}>{s.label}</div>
            <textarea
              value={s.value}
              onChange={e => s.set(e.target.value)}
              placeholder={s.placeholder}
              rows={4}
              autoFocus
              style={{ resize: 'vertical', fontSize: 14, lineHeight: 1.6 }}
            />

            {/* Contextual tips */}
            {s.key === 'obstacle' && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#f59e0b', padding: '8px 10px', borderRadius: 6, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', lineHeight: 1.5 }}>
                💡 Think about <em>internal</em> obstacles — emotions, thoughts, patterns — not external ones. "I feel overwhelmed" not "no time."
              </div>
            )}
            {s.key === 'plan' && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#9f91ff', padding: '8px 10px', borderRadius: 6, background: 'rgba(124,106,255,0.07)', border: '1px solid rgba(124,106,255,0.2)', lineHeight: 1.5 }}>
                💡 Format: <strong>"If [obstacle from step 3 happens], then I will [specific action]."</strong><br />
                Research shows this if-then format increases follow-through by 2–3×.
              </div>
            )}
          </div>
        ))}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <button className="btn btn-sm" onClick={() => setActiveStep(p => Math.max(0, p - 1))} disabled={activeStep === 0}>← Back</button>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Step {activeStep + 1} of 4</span>
          {activeStep < 3
            ? <button className="btn btn-sm btn-primary" onClick={() => setActiveStep(p => p + 1)}>Next →</button>
            : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={() => {
                  onSave(goal.id, { wish, outcome, obstacle, plan, updatedAt: formatDate() })
                  onClose()
                }}>
                  Save WOOP 🔒
                </button>
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}

// ─── Add Task inline form ─────────────────────────────────────────────────────

function AddTaskForm({ onAdd, onCancel }) {
  const [text,           setText]           = useState('')
  const [intention,      setIntention]      = useState('')
  const [envCue,         setEnvCue]         = useState('')
  const [twoMinVersion,  setTwoMinVersion]  = useState('')
  const [showExtras,     setShowExtras]     = useState(false)

  const handleAdd = () => {
    if (!text.trim()) return
    onAdd({ text: text.trim(), intention: intention.trim(), envCue: envCue.trim(), twoMinVersion: twoMinVersion.trim() })
    setText(''); setIntention(''); setEnvCue(''); setTwoMinVersion('')
  }

  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10,
      background: 'rgba(124,106,255,0.05)',
      border: '1px dashed rgba(124,106,255,0.35)',
      marginBottom: 6,
    }}>
      <input
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onCancel() }}
        placeholder="Concrete task — be specific enough to start immediately"
        style={{ fontSize: 13, marginBottom: 8 }}
      />

      {!showExtras ? (
        <button
          onClick={() => setShowExtras(true)}
          style={{ fontSize: 11, color: '#7c6aff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          + Implementation intention, environment cue, 2-min starter
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label style={{ fontSize: 11, color: '#9f91ff', marginBottom: 3 }}>
              ⚡ Implementation intention — "When/where, I will..."
            </label>
            <input
              value={intention}
              onChange={e => setIntention(e.target.value)}
              placeholder='e.g. "Every Monday 9am at my desk, I will do this for 90 minutes"'
              style={{ fontSize: 12 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#f59e0b', marginBottom: 3 }}>
              📍 Environment cue — where/how will you see this reminder?
            </label>
            <input
              value={envCue}
              onChange={e => setEnvCue(e.target.value)}
              placeholder='e.g. "Sticky note on monitor" or "Phone lock screen"'
              style={{ fontSize: 12 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#22c55e', marginBottom: 3 }}>
              🟢 2-minute starter — if resistance hits, I'll just...
            </label>
            <input
              value={twoMinVersion}
              onChange={e => setTwoMinVersion(e.target.value)}
              placeholder='e.g. "Just open my journal and write one line"'
              style={{ fontSize: 12 }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button className="btn btn-sm btn-primary" onClick={handleAdd}>Add task</button>
        <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, onToggle, onDelete, onSetNextAction, onEdit }) {
  const [expanded,      setExpanded]      = useState(false)
  const [editing,       setEditing]       = useState(false)
  const [editText,      setEditText]      = useState(task.text)
  const [editIntention, setEditIntention] = useState(task.intention || '')
  const [editEnvCue,    setEditEnvCue]    = useState(task.envCue || '')
  const [editTwoMin,    setEditTwoMin]    = useState(task.twoMinVersion || '')
  const [showEditExtras,setShowEditExtras]= useState(!!(task.intention || task.envCue || task.twoMinVersion))

  const hasExtras = task.intention || task.envCue || task.twoMinVersion

  function handleSaveEdit() {
    if (!editText.trim()) return
    onEdit({
      text:          editText.trim(),
      intention:     editIntention.trim(),
      envCue:        editEnvCue.trim(),
      twoMinVersion: editTwoMin.trim(),
    })
    setEditing(false)
  }

  function handleCancelEdit() {
    setEditText(task.text)
    setEditIntention(task.intention || '')
    setEditEnvCue(task.envCue || '')
    setEditTwoMin(task.twoMinVersion || '')
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{
        borderRadius: 8, marginBottom: 5, overflow: 'hidden',
        background: 'rgba(124,106,255,0.06)',
        border: '1px solid rgba(124,106,255,0.4)',
        padding: '10px 12px',
      }}>
        <input
          autoFocus
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit() }}
          style={{ fontSize: 13, marginBottom: 8, width: '100%' }}
        />

        {!showEditExtras ? (
          <button
            onClick={() => setShowEditExtras(true)}
            style={{ fontSize: 11, color: '#7c6aff', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8 }}
          >+ Edit intention, env cue, 2-min starter</button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#9f91ff', display: 'block', marginBottom: 3 }}>⚡ Implementation intention</label>
              <input value={editIntention} onChange={e => setEditIntention(e.target.value)} placeholder='e.g. "Every Monday 9am at my desk..."' style={{ fontSize: 12 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#f59e0b', display: 'block', marginBottom: 3 }}>📍 Environment cue</label>
              <input value={editEnvCue} onChange={e => setEditEnvCue(e.target.value)} placeholder='e.g. "Sticky note on monitor"' style={{ fontSize: 12 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#22c55e', display: 'block', marginBottom: 3 }}>🟢 2-minute starter</label>
              <input value={editTwoMin} onChange={e => setEditTwoMin(e.target.value)} placeholder='e.g. "Just open my journal and write one line"' style={{ fontSize: 12 }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm btn-primary" onClick={handleSaveEdit}>Save</button>
          <button className="btn btn-sm" onClick={handleCancelEdit}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      borderRadius: 8,
      background: task.isNextAction ? 'rgba(124,106,255,0.07)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${task.isNextAction ? 'rgba(124,106,255,0.3)' : 'var(--border)'}`,
      marginBottom: 5,
      overflow: 'hidden',
      opacity: task.done ? 0.5 : 1,
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
        {/* Done toggle */}
        <button
          onClick={onToggle}
          style={{
            width: 20, height: 20, borderRadius: 5, flexShrink: 0,
            border: `2px solid ${task.done ? '#22c55e' : 'var(--border2)'}`,
            background: task.done ? '#22c55e' : 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: '#fff', transition: 'all 0.15s',
          }}
        >{task.done ? '✓' : ''}</button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: task.isNextAction ? 600 : 400,
            color: task.done ? 'var(--text3)' : 'var(--text)',
            textDecoration: task.done ? 'line-through' : 'none',
          }}>
            {task.isNextAction && !task.done && (
              <span style={{ color: '#9f91ff', fontSize: 11, fontWeight: 700, marginRight: 5, letterSpacing: 0.5 }}>⚡ NEXT</span>
            )}
            {task.text}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {hasExtras && (
            <button
              onClick={() => setExpanded(p => !p)}
              style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)' }}
            >{expanded ? '▲' : '▼'}</button>
          )}
          {/* Edit button */}
          <button
            onClick={() => setEditing(true)}
            title="Edit task"
            style={{ padding: '2px 6px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)' }}
          >✏️</button>
          <button
            onClick={onSetNextAction}
            title={task.isNextAction ? 'Remove next action' : 'Mark as next action'}
            style={{
              padding: '2px 7px', borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${task.isNextAction ? 'rgba(124,106,255,0.5)' : 'var(--border)'}`,
              background: task.isNextAction ? 'rgba(124,106,255,0.15)' : 'transparent',
              color: task.isNextAction ? '#9f91ff' : 'var(--text3)',
            }}
          >⚡</button>
          <button
            onClick={onDelete}
            style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)' }}
          >✕</button>
        </div>
      </div>

      {/* Expandable extras */}
      {expanded && hasExtras && (
        <div style={{ padding: '0 10px 10px 38px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {task.intention && (
            <div style={{ fontSize: 11, color: '#9f91ff', fontStyle: 'italic' }}>⚡ {task.intention}</div>
          )}
          {task.envCue && (
            <div style={{ fontSize: 11, color: '#f59e0b' }}>📍 Cue: {task.envCue}</div>
          )}
          {task.twoMinVersion && (
            <div style={{ fontSize: 11, color: '#22c55e' }}>🟢 2-min: {task.twoMinVersion}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Milestone row with task layer ───────────────────────────────────────────

function MilestoneBlock({ milestone, milestoneIndex, goalId, onToggleMilestone, onAddTask, onToggleTask, onDeleteTask, onSetNextAction, onEditTask }) {
  const [showAddTask, setShowAddTask] = useState(false)
  const [tasksOpen,   setTasksOpen]   = useState(true)
  const tasks     = milestone.tasks || []
  const doneTasks = tasks.filter(t => t.done).length
  const mDays     = milestone.dueDate ? getCountdown(milestone.dueDate) : null
  const dl        = milestone.done ? null : deadlineLabel(mDays)

  return (
    <div style={{ marginBottom: 2 }}>
      {/* Milestone header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 12px 9px 0',
        borderBottom: `1px solid var(--border)`,
      }}>
        <div
          className={`checkbox ${milestone.done ? 'checked' : ''}`}
          onClick={() => onToggleMilestone(goalId, milestoneIndex)}
          style={{ flexShrink: 0, cursor: 'pointer' }}
        >{milestone.done ? '✓' : ''}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: milestone.done ? 'var(--text3)' : 'var(--text)',
            textDecoration: milestone.done ? 'line-through' : 'none',
          }}>
            {milestone.text}
          </span>
          {tasks.length > 0 && (
            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text3)' }}>
              {doneTasks}/{tasks.length} tasks
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {dl && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: dl.color,
              padding: '2px 7px', borderRadius: 10,
              background: dl.color + '15',
              animation: dl.pulse ? 'pulse 2s infinite' : 'none',
            }}>{dl.text}</span>
          )}
          {tasks.length > 0 && !milestone.done && (
            <button
              onClick={() => setTasksOpen(p => !p)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 11 }}
            >{tasksOpen ? '▲' : '▼ tasks'}</button>
          )}
        </div>
      </div>

      {/* Tasks */}
      {!milestone.done && tasksOpen && (
        <div style={{ paddingLeft: 32, paddingTop: 6, paddingBottom: 4 }}>
          {tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => onToggleTask(goalId, milestoneIndex, task.id)}
              onDelete={() => onDeleteTask(goalId, milestoneIndex, task.id)}
              onSetNextAction={() => onSetNextAction(goalId, milestoneIndex, task.id)}
              onEdit={(updates) => onEditTask(goalId, milestoneIndex, task.id, updates)}
            />
          ))}

          {showAddTask ? (
            <AddTaskForm
              onAdd={t => { onAddTask(goalId, milestoneIndex, t); setShowAddTask(false) }}
              onCancel={() => setShowAddTask(false)}
            />
          ) : (
            <button
              onClick={() => setShowAddTask(true)}
              style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add task
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── WOOP display (compact, inside expanded goal) ─────────────────────────────

function WOOPDisplay({ woop, onEdit }) {
  const [collapsed, setCollapsed] = useState(false)

  if (!woop?.wish) return (
    <div style={{
      padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
      background: 'rgba(159,145,255,0.05)', border: '1px dashed rgba(159,145,255,0.3)',
      display: 'flex', alignItems: 'center', gap: 10,
    }} onClick={onEdit}>
      <span style={{ fontSize: 20 }}>🔮</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#9f91ff' }}>Run WOOP on this goal</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
          Anti-quit system · Wish → Outcome → Obstacle → Plan · Takes 2 min
        </div>
      </div>
      <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9f91ff' }}>→</span>
    </div>
  )

  const items = [
    { label: 'Wish',     icon: '🌟', color: '#9f91ff', value: woop.wish },
    { label: 'Outcome',  icon: '🏆', color: '#22c55e', value: woop.outcome },
    { label: 'Obstacle', icon: '🧱', color: '#f59e0b', value: woop.obstacle },
    { label: 'Plan',     icon: '⚡', color: '#ef4444', value: woop.plan },
  ]

  return (
    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(159,145,255,0.05)', border: '1px solid rgba(159,145,255,0.2)' }}>
      {/* Header — click anywhere to collapse/expand */}
      <div
        onClick={() => setCollapsed(p => !p)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: collapsed ? 0 : 10, cursor: 'pointer', userSelect: 'none' }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: '#9f91ff', textTransform: 'uppercase', letterSpacing: 0.5 }}>🔮 WOOP</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn btn-sm"
            style={{ fontSize: 11 }}
            onClick={e => { e.stopPropagation(); onEdit() }}
          >Edit</button>
          <span style={{ fontSize: 11, color: 'var(--text3)', transition: 'transform 0.2s', display: 'inline-block', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>▼</span>
        </div>
      </div>

      {!collapsed && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {items.map(item => item.value && (
              <div key={item.label} style={{ padding: '8px 10px', borderRadius: 8, background: item.color + '10', border: `1px solid ${item.color}25` }}>
                <div style={{ fontSize: 10, color: item.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                  {item.icon} {item.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{item.value}</div>
              </div>
            ))}
          </div>
          {woop.updatedAt && (
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 8 }}>Last updated {woop.updatedAt}</div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Goal card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal, isExpanded, onToggleExpand,
  updateGoal, deleteGoal, toggleMilestone,
  addTask, toggleTask, deleteTask, setNextAction, editTask,
  logDailyOneThing, onWOOP, onEdit,
}) {
  const category       = CATEGORIES.includes(goal.category) ? goal.category : 'Other'
  const progress       = goal.progress || 0
  const milestones     = goal.milestones || []
  const doneMilestones = milestones.filter(m => m.done).length
  const color          = CATEGORY_COLORS[category] || '#7c6aff'
  const icon           = CATEGORY_ICONS[category]  || '🎯'
  const daysLeft       = getCountdown(goal.targetDate)
  const isOverdue      = daysLeft !== null && daysLeft < 0
  const streak         = calcStreak(goal.oneThing)
  const todayOneThing  = goal.oneThing?.find(o => o.date === formatDate())
  const thisWeekCommit = goal.weeklyCommitments?.find(w => w.week === formatDate())
  const dl             = deadlineLabel(daysLeft)
  const allTasks       = milestones.flatMap(m => m.tasks || [])
  const doneTasks      = allTasks.filter(t => t.done).length
  const nextActionCount = milestones.flatMap(m => (m.tasks || []).filter(t => t.isNextAction && !t.done)).length
  const hasWOOP        = !!goal.woop?.wish
  const [showOneThingLog, setShowOneThingLog] = useState(false)

  const lastActivity   = calcLastActivity(goal)
  const stagnationDays = lastActivity ? daysSince(lastActivity) : (goal.createdAt ? daysSince(goal.createdAt.slice(0,10)) : null)

  // Determine status label
  const statusLabel = (isOverdue && progress < 100) ? { text: 'Overdue', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
    : progress >= 75 ? { text: 'On track', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' }
    : progress >= 40 ? { text: 'In progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }
    : { text: 'Just started', color: '#9898b0', bg: 'rgba(152,152,176,0.1)' }

  return (
    <div style={{
      background: 'var(--bg2)',
      border: `1px solid ${isExpanded ? color + '40' : 'var(--border)'}`,
      borderRadius: 14,
      overflow: 'hidden',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: isExpanded ? `0 0 0 1px ${color}20, 0 8px 32px rgba(0,0,0,0.3)` : 'none',
    }}>

      {/* Color accent strip */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}40)` }} />

      {/* Card header — always visible */}
      <div
        style={{ padding: '16px 20px', cursor: 'pointer' }}
        onClick={onToggleExpand}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

          {/* Category icon + progress ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width={52} height={52} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={26} cy={26} r={20} fill="none" stroke="var(--bg4)" strokeWidth={4} />
              <circle
                cx={26} cy={26} r={20}
                fill="none" stroke={isOverdue ? '#ef4444' : color}
                strokeWidth={4}
                strokeDasharray={`${(progress / 100) * 125.6} 125.6`}
                strokeLinecap="round"
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>{icon}</div>
          </div>

          {/* Main info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color, padding: '2px 8px', borderRadius: 20, background: color + '15' }}>
                {category}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: statusLabel.color, padding: '2px 8px', borderRadius: 20, background: statusLabel.bg }}>
                {statusLabel.text}
              </span>
              {dl && (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: dl.color,
                  padding: '2px 8px', borderRadius: 20, background: dl.color + '15',
                  animation: dl.pulse ? 'pulse 2s infinite' : 'none',
                }}>{dl.text}</span>
              )}
              {nextActionCount > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#9f91ff', padding: '2px 8px', borderRadius: 20, background: 'rgba(159,145,255,0.12)', border: '1px solid rgba(159,145,255,0.25)' }}>
                  ⚡ {nextActionCount} next
                </span>
              )}
              {hasWOOP && (
                <span style={{ fontSize: 10, color: '#9f91ff', padding: '2px 8px', borderRadius: 20, background: 'rgba(159,145,255,0.08)' }}>🔮 WOOP</span>
              )}
              {(() => {
                const badge = sprintBadge(goal.targetDate)
                if (!badge) return null
                return (
                  <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, padding: '2px 8px', borderRadius: 20, background: badge.bg }}>
                    📆 {badge.text}
                  </span>
                )
              })()}
              {stagnationDays !== null && stagnationDays >= 7 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', animation: 'pulse 2s infinite' }}>
                  ⚠️ {stagnationDays}d no activity
                </span>
              )}
              {(() => {
                // Next pending milestone with a dueDate
                const nextM = (goal.milestones || [])
                  .filter(m => !m.done && m.dueDate)
                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
                if (!nextM) return null
                const days = getCountdown(nextM.dueDate)
                if (days === null) return null
                // Only show if overdue OR within 5 days
                if (days > 5) return null
                const isOverdue = days < 0
                const isToday   = days === 0
                const color  = isOverdue || isToday ? '#ef4444' : days <= 2 ? '#f97316' : '#f59e0b'
                const bg     = isOverdue || isToday ? 'rgba(239,68,68,0.1)' : days <= 2 ? 'rgba(249,115,22,0.1)' : 'rgba(245,158,11,0.1)'
                const label  = isOverdue ? `🚨 ${Math.abs(days)}d overdue` : isToday ? '🚨 due today' : `🚨 ${days}d left`
                return (
                  <span style={{ fontSize: 10, fontWeight: 800, color, padding: '2px 8px', borderRadius: 20, background: bg }}>
                    {label}
                  </span>
                )
              })()}
            </div>

            {/* Title */}
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
              {goal.title}
            </div>

            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${progress}%`,
                  background: isOverdue ? '#ef4444' : `linear-gradient(90deg, ${color}, ${color}cc)`,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: isOverdue ? '#ef4444' : color, width: 34, textAlign: 'right' }}>
                {progress}%
              </span>
            </div>

            {/* Mini stats row */}
            <div style={{ display: 'flex', gap: 12, marginTop: 7, flexWrap: 'wrap' }}>
              {milestones.length > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>📌 {doneMilestones}/{milestones.length}</span>
              )}
              {allTasks.length > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>✅ {doneTasks}/{allTasks.length}</span>
              )}
              {streak > 0 && (
                <span style={{ fontSize: 11, color: streak >= 7 ? '#f97316' : '#f59e0b' }}>🔥 {streak}d</span>
              )}
              {todayOneThing && (
                <span style={{ fontSize: 11, color: '#22c55e' }}>✓ ONE Thing</span>
              )}
              {thisWeekCommit && (
                <span style={{ fontSize: 11, color: '#7c6aff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                  📅 {thisWeekCommit.text}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button
              className="btn btn-sm"
              style={{ background: todayOneThing ? 'var(--green-bg)' : 'var(--bg3)', borderColor: todayOneThing ? 'var(--green)' : 'var(--border2)', color: todayOneThing ? 'var(--green)' : 'var(--text)', fontSize: 11, whiteSpace: 'nowrap' }}
              onClick={() => logDailyOneThing && window._oneThingGoal && window._oneThingGoal(goal)}
            >
              {todayOneThing ? '✓ Done' : '🎯 ONE Thing'}
            </button>
            <button
              className="btn btn-sm"
              style={{ fontSize: 11, background: 'rgba(159,145,255,0.08)', borderColor: 'rgba(159,145,255,0.3)', color: '#9f91ff' }}
              onClick={() => onWOOP(goal)}
            >
              🔮 WOOP
            </button>
          </div>
        </div>
      </div>

      {/* Expanded body */}
      {isExpanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>

          {/* Why */}
          {goal.why && (
            <div style={{ marginTop: 14, marginBottom: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 13, color: '#f59e0b', lineHeight: 1.6 }}>
              💡 <strong>Why I want this:</strong> {goal.why}
            </div>
          )}

          {/* Weekly bridge */}
          <div style={{ marginBottom: 12, marginTop: 4, padding: '10px 14px', borderRadius: 10, background: thisWeekCommit ? 'rgba(124,106,255,0.07)' : 'rgba(245,158,11,0.05)', border: `1px solid ${thisWeekCommit ? 'rgba(124,106,255,0.25)' : 'rgba(245,158,11,0.2)'}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{thisWeekCommit ? '📅' : '⚡'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {thisWeekCommit ? (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7c6aff', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 }}>In Weekly this week</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{thisWeekCommit.text}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 }}>Not in your Weekly plan yet</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>Go to Weekly → link a milestone from this goal to make it real this week.</div>
                </>
              )}
            </div>
          </div>

          {/* Deadline timeline */}
          {goal.targetDate && (() => {
            const days = getCountdown(goal.targetDate)
            const isOv = days < 0 && progress < 100
            const start = new Date(goal.createdAt || Date.now())
            const end = new Date(goal.targetDate)
            const total = Math.max(1, Math.round((end - start) / 86400000))
            const elapsed = Math.max(0, total - Math.max(0, days))
            const elPct = Math.min(100, Math.round((elapsed / total) * 100))
            const uc = isOv ? '#ef4444' : days <= 7 ? '#f59e0b' : '#22c55e'
            const targetFmt = new Date(goal.targetDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            return (
              <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 10, background: 'var(--bg3)', border: `1px solid ${isOv ? 'rgba(239,68,68,0.3)' : 'var(--border)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>⏱ {targetFmt}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: uc }}>{isOv ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due TODAY' : `${days}d remaining`}</span>
                </div>
                <div style={{ position: 'relative', height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${elPct}%`, background: uc + '50', borderRadius: 3 }} />
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min(elPct, progress)}%`, background: uc, borderRadius: 3 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text3)' }}>
                  <span>Start</span>
                  <span style={{ color: uc, fontWeight: 600 }}>{elPct}% time used · {progress}% done</span>
                  <span>Deadline</span>
                </div>
                {!isOv && days <= 14 && progress < 50 && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#f59e0b' }}>
                    ⚡ <strong>Parkinson's Law:</strong> {days}d left, {100 - progress}% to go — attack it now.
                  </div>
                )}
              </div>
            )
          })()}

          {/* WOOP */}
          <div style={{ marginBottom: 16 }}>
            <WOOPDisplay woop={goal.woop} onEdit={() => onWOOP(goal)} />
          </div>

          {/* Milestones + Tasks */}
          {milestones.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Milestones & Tasks
                </span>
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>
                  {doneMilestones}/{milestones.length} milestones · {doneTasks}/{allTasks.length} tasks
                </span>
              </div>
              {milestones.map((m, i) => (
                <MilestoneBlock
                  key={i}
                  milestone={m}
                  milestoneIndex={i}
                  goalId={goal.id}
                  onToggleMilestone={toggleMilestone}
                  onAddTask={addTask}
                  onToggleTask={toggleTask}
                  onDeleteTask={deleteTask}
                  onSetNextAction={setNextAction}
                  onEditTask={editTask}
                />
              ))}
            </div>
          )}

          {/* ONE Thing log — toggleable */}
          {goal.oneThing?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <button
                onClick={() => setShowOneThingLog(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px 0', marginBottom: showOneThingLog ? 8 : 0,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  🎯 ONE Thing Log <span style={{ fontWeight: 400, opacity: 0.6 }}>({goal.oneThing.length})</span>
                </span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{showOneThingLog ? '▲ hide' : '▼ show'}</span>
              </button>
              {showOneThingLog && goal.oneThing.map((o, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                  <span style={{ color: 'var(--text3)', flexShrink: 0 }}>{o.date}</span>
                  <span style={{ color: 'var(--text2)' }}>{o.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Manual progress + actions footer */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>Manual progress:</span>
            <input
              type="range" min="0" max="100" value={progress}
              onChange={e => updateGoal(goal.id, { progress: parseInt(e.target.value) })}
              style={{ flex: 1, minWidth: 80 }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(progress), width: 34 }}>{progress}%</span>

            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e', fontSize: 11 }}
                onClick={() => {
                  if (window.confirm(`Mark "${goal.title}" as completed? You can restore it later from the Completed Goals section.`)) {
                    updateGoal(goal.id, { status: 'completed', completedAt: new Date().toISOString() })
                  }
                }}
              >✓ Complete</button>
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(99,102,241,0.07)', borderColor: 'rgba(99,102,241,0.3)', color: '#818cf8', fontSize: 11 }}
                title="Park this goal for later — activate it when the time is right"
                onClick={() => {
                  if (window.confirm(`Archive "${goal.title}"? It will move to Parked Goals. You can activate it any time.`)) {
                    updateGoal(goal.id, { status: 'archived', archivedAt: new Date().toISOString() })
                  }
                }}
              >📦 Archive</button>
              <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => onEdit(goal)}>✏️ Edit</button>
              <button
                className="btn btn-sm btn-danger"
                style={{ fontSize: 11 }}
                onClick={() => {
                  if (window.confirm(`Permanently delete "${goal.title}"? This cannot be undone.`)) {
                    deleteGoal(goal.id)
                  }
                }}
              >✕ Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Goal Modal ───────────────────────────────────────────────────────────────

function GoalModal({ onClose, onSave, editGoal }) {
  const [title,      setTitle]      = useState(editGoal?.title      || '')
  const [description,setDescription]= useState(editGoal?.description|| '')
  const [why,        setWhy]        = useState(editGoal?.why        || '')
  const [category,   setCategory]   = useState(editGoal?.category   || 'Trading')
  const [targetDate, setTargetDate] = useState(editGoal?.targetDate || '')
  const [milestones, setMilestones] = useState(
    editGoal?.milestones?.map(m => ({ text: m.text, dueDate: m.dueDate || '' })) || [{ text: '', dueDate: '' }]
  )
  const addMs    = () => setMilestones(p => [...p, { text: '', dueDate: '' }])
  const removeMs = i  => setMilestones(p => p.filter((_,idx) => idx !== i))
  const updateMs = (i,f,v) => setMilestones(p => p.map((m,idx) => idx===i ? {...m,[f]:v} : m))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div className="modal-title">{editGoal ? '✏️ Edit goal' : '🎯 New goal'}</div>

        <div className="form-group">
          <label>Goal title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Become a consistently profitable trader" autoFocus />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What does success look like?" style={{ resize: 'vertical' }} />
        </div>

        <div className="form-group">
          <label>💡 Why I want this — your anchor</label>
          <input value={why} onChange={e => setWhy(e.target.value)} placeholder="e.g. Freedom to work from anywhere and provide for my family" />
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>You'll see this every time you open the goal. Make it visceral.</div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Deadline *</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>⏱ Parkinson's Law — set a real date</div>
          </div>
        </div>

        <div className="form-group">
          <label>Milestones — checkpoints on the way</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {milestones.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={m.text} onChange={e => updateMs(i,'text',e.target.value)} placeholder={`Milestone ${i+1}`} style={{ flex: 1 }} />
                <input type="date" value={m.dueDate} onChange={e => updateMs(i,'dueDate',e.target.value)} style={{ width: 140, fontSize: 12 }} title="Optional due date" />
                {milestones.length > 1 && (
                  <button className="btn btn-sm btn-danger" onClick={() => removeMs(i)} style={{ padding: '4px 8px' }}>✕</button>
                )}
              </div>
            ))}
          </div>
          <button className="btn btn-sm" onClick={addMs} style={{ marginTop: 8 }}>+ Add milestone</button>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            After saving: expand a milestone → add concrete tasks → add implementation intentions → flag ⚡ next action.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            if (!title.trim()) return
            const msList = milestones.filter(m => m.text.trim()).map(m => ({
              text: m.text.trim(), dueDate: m.dueDate || '', done: false, tasks: [],
              completedAt: null,
            }))
            onSave({ title: title.trim(), description, why, category, targetDate, milestones: msList })
            onClose()
          }}>Save goal</button>
        </div>
      </div>
    </div>
  )
}

// ─── Weekly commit modal ──────────────────────────────────────────────────────

function WeeklyCommitModal({ goals, onClose, onSave }) {
  const [commitments, setCommitments] = useState(Object.fromEntries(goals.map(g => [g.id, ''])))
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-title">📅 Monday Commitment — {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.6 }}>
          It's Monday. For each goal: what's the ONE thing you'll move forward this week?
        </p>
        {goals.map(g => (
          <div key={g.id} className="form-group">
            <label style={{ color: CATEGORY_COLORS[g.category] || 'var(--accent)' }}>{CATEGORY_ICONS[g.category]} {g.title}</label>
            <input value={commitments[g.id] || ''} onChange={e => setCommitments(p => ({ ...p, [g.id]: e.target.value }))} placeholder="This week I will..." />
          </div>
        ))}
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Skip</button>
          <button className="btn btn-primary" onClick={() => { onSave(commitments); onClose() }}>Lock it in 🔒</button>
        </div>
      </div>
    </div>
  )
}

// ─── ONE Thing modal ──────────────────────────────────────────────────────────

function OneThingModal({ goal, onClose, onSave }) {
  const [text, setText] = useState('')
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">🎯 Today's ONE Thing</div>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.6 }}>
          For <strong style={{ color: 'var(--text)' }}>{goal.title}</strong> — what single action today makes everything else easier or unnecessary?
        </p>
        <div className="form-group">
          <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="The ONE thing I will do today is..." autoFocus style={{ resize: 'vertical' }} />
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { if (text.trim()) { onSave(goal.id, text.trim()); onClose() } }}>Log it</button>
        </div>
      </div>
    </div>
  )
}

// ─── Reusable collapsed goal shelf (used for Completed + Archived) ───────────

function GoalShelf({ title, icon, accentColor, accentBg, goals, primaryAction, primaryLabel, secondaryAction, secondaryLabel, dateKey, datePrefix, showProgress }) {
  const [isOpen, setIsOpen] = useState(false)
  if (!goals.length) return null

  return (
    <div style={{ marginTop: 20 }}>
      <button
        onClick={() => setIsOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '12px 16px', borderRadius: 10,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          cursor: 'pointer', color: 'var(--text2)', transition: 'all 0.15s',
        }}
      >
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: 12, padding: '1px 8px', borderRadius: 20, background: accentBg, color: accentColor, fontWeight: 700, border: `1px solid ${accentColor}40` }}>
          {goals.length}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)', transition: 'transform 0.2s', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>

      {isOpen && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {goals.map(goal => {
            const color = CATEGORY_COLORS[goal.category] || '#22c55e'
            const icon_ = CATEGORY_ICONS[goal.category]  || '🎯'
            const dateVal = goal[dateKey]
            return (
              <div key={goal.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 10,
                background: 'var(--bg2)', border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 18, opacity: 0.6 }}>{icon_}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', opacity: 0.8 }}>
                    {goal.title}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color, padding: '1px 7px', borderRadius: 20, background: color + '15' }}>{goal.category}</span>
                    {dateVal && (
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {datePrefix} {new Date(dateVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                    {showProgress && goal.progress !== undefined && (
                      <span style={{ fontSize: 11, color: accentColor, fontWeight: 600 }}>{goal.progress}% done</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn btn-sm"
                    style={{ fontSize: 11, color: accentColor, borderColor: accentColor + '50', background: accentBg }}
                    onClick={() => primaryAction(goal.id)}
                  >{primaryLabel}</button>
                  {secondaryAction && (
                    <button className="btn btn-sm btn-danger" style={{ fontSize: 11 }} onClick={() => secondaryAction(goal.id, goal.title)}>✕</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main GoalsView ───────────────────────────────────────────────────────────

export default function GoalsView({
  goals, loading,
  addGoal, updateGoal, deleteGoal,
  toggleMilestone,
  addTask, toggleTask, deleteTask, setNextAction, editTask,
  logDailyOneThing,
  getWeekScore,
  getNextActions,
}) {
  const [showGoalModal,     setShowGoalModal]     = useState(false)
  const [showOneThingModal, setShowOneThingModal] = useState(false)
  const [showWeeklyModal,   setShowWeeklyModal]   = useState(false)
  const [showWOOPModal,     setShowWOOPModal]     = useState(false)
  const [editGoal,          setEditGoal]          = useState(null)
  const [wOOPGoal,          setWOOPGoal]          = useState(null)
  const [oneThingGoal,      setOneThingGoal]      = useState(null)
  const [expandedGoal,      setExpandedGoal]      = useState(null)
  const [showFocusMode,     setShowFocusMode]     = useState(false)
  const [categoryFilter,    setCategoryFilter]    = useState('All')

  const weekScore    = getWeekScore()
  const activeGoals  = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')
  const archivedGoals  = goals.filter(g => g.status === 'archived')
  const nextActions  = getNextActions ? getNextActions() : []

  // Wire up ONE Thing modal via the card (avoids prop drilling)
  window._oneThingGoal = (goal) => { setOneThingGoal(goal); setShowOneThingModal(true) }

  const sortedGoals = [...activeGoals]
    .filter(g => categoryFilter === 'All' || normalizeCategory(g.category) === categoryFilter)
    .sort((a, b) => {
      const dA = getCountdown(a.targetDate)
      const dB = getCountdown(b.targetDate)
      if (dA === null && dB === null) return 0
      if (dA === null) return 1
      if (dB === null) return -1
      return dA - dB
    })

  const handleWeeklyCommit = (commitments) => {
    Object.entries(commitments).forEach(([goalId, text]) => {
      if (text.trim()) {
        const goal = goals.find(g => g.id === goalId)
        if (goal) updateGoal(goalId, { weeklyCommitments: [...(goal.weeklyCommitments || []), { week: formatDate(), text: text.trim() }] })
      }
    })
  }

  const handleSaveWOOP = (goalId, woop) => {
    updateGoal(goalId, { woop })
  }

  const normalizeCategory = (cat) => CATEGORIES.includes(cat) ? cat : 'Other'
  const usedCategories = ['All', ...Array.from(new Set(activeGoals.map(g => normalizeCategory(g.category))))]

  if (loading) return <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div className="fade-in">
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div className="section-title" style={{ margin: 0 }}>🎯 Goals</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
              color: scoreColor(weekScore), lineHeight: 1,
            }}>{weekScore}</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            Goal → Milestone → Task → ⚡ Next Action · WOOP anti-quit system · Implementation intentions
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Focus mode toggle */}
          <button
            onClick={() => setShowFocusMode(p => !p)}
            style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${showFocusMode ? 'rgba(159,145,255,0.5)' : 'var(--border2)'}`,
              background: showFocusMode ? 'rgba(159,145,255,0.12)' : 'var(--bg3)',
              color: showFocusMode ? '#9f91ff' : 'var(--text)',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            ⚡ Focus Mode
            {nextActions.length > 0 && (
              <span style={{ background: '#7c6aff', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 800, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                {nextActions.length}
              </span>
            )}
          </button>

          {activeGoals.length > 0 && (
            <button
              onClick={() => setShowWeeklyModal(true)}
              style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(124,106,255,0.4)', background: 'rgba(124,106,255,0.1)', color: '#7c6aff' }}
            >📅 Weekly commit</button>
          )}

          <button
            className="btn btn-primary"
            onClick={() => { setEditGoal(null); setShowGoalModal(true) }}
          >+ New goal</button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {activeGoals.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          {[
            { label: 'Active goals',  value: activeGoals.length,                            color: '#9f91ff', sub: 'goals tracked' },
            { label: 'Next actions',  value: nextActions.length,                            color: '#9f91ff', sub: 'ready to act' },
            { label: 'Avg progress',  value: Math.round(activeGoals.reduce((a,g) => a+(g.progress||0),0)/activeGoals.length)+'%', color: scoreColor(Math.round(activeGoals.reduce((a,g)=>a+(g.progress||0),0)/activeGoals.length)), sub: 'across all goals' },
            { label: 'WOOP complete', value: activeGoals.filter(g=>g.woop?.wish).length+'/'+activeGoals.length, color: '#a855f7', sub: 'anti-quit plans' },
            { label: 'Total tasks',   value: (() => { const all=activeGoals.flatMap(g=>(g.milestones||[]).flatMap(m=>m.tasks||[])); return `${all.filter(t=>t.done).length}/${all.length}` })(), color: '#22c55e', sub: 'tasks done' },
            { label: 'Parked',         value: archivedGoals.length,                          color: '#818cf8', sub: 'activate when ready' },
          ].map(s => (
            <div key={s.label} style={{ padding: '16px 14px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--border)', flex: 1, minWidth: 100, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, opacity: 0.6 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Focus Mode panel ── */}
      {showFocusMode && (
        <FocusBar
          nextActions={nextActions}
          onToggleTask={toggleTask}
          onDismiss={() => setShowFocusMode(false)}
        />
      )}

      {/* ── Banners ── */}
      {(() => {
        const today = new Date()
        const dayOfWeek = today.getDay()
        const isMonday = dayOfWeek === 1
        const todayStr = today.toISOString().split('T')[0]
        const noneCommitted = activeGoals.length > 0 && activeGoals.every(g => !g.weeklyCommitments?.find(w => w.week === todayStr || w.week >= todayStr.slice(0,8) + '01'))
        if (!isMonday && !noneCommitted) return null
        return (
          <div style={{ padding: '12px 16px', marginBottom: 14, borderRadius: 10, background: 'rgba(124,106,255,0.07)', border: '1px solid rgba(124,106,255,0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#7c6aff' }}>
                {isMonday ? "📅 It's Monday — time to commit" : "📅 No weekly commitments set yet"}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>What will you move forward on each goal this week?</div>
            </div>
            <button className="btn btn-sm" style={{ background: '#7c6aff', color: '#fff', borderColor: '#7c6aff' }} onClick={() => setShowWeeklyModal(true)}>Set commitments →</button>
          </div>
        )
      })()}

      {/* Overdue banner */}
      {(() => {
        const overdue  = activeGoals.filter(g => { const d = getCountdown(g.targetDate); return d !== null && d < 0 && (g.progress || 0) < 100 })
        const critical = activeGoals.filter(g => { const d = getCountdown(g.targetDate); return d !== null && d >= 0 && d <= 3 && (g.progress || 0) < 100 })
        if (!overdue.length && !critical.length) return null
        return (
          <div style={{ padding: '12px 16px', marginBottom: 14, borderRadius: 10, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>⚠️ Deadline alert</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
              {overdue.length > 0 && <div>🔴 <strong>{overdue.map(g=>g.title).join(', ')}</strong> — overdue. Recommit or reset.</div>}
              {critical.length > 0 && <div>🟠 <strong>{critical.map(g=>g.title).join(', ')}</strong> — {getCountdown(critical[0]?.targetDate) === 0 ? 'due TODAY' : `${getCountdown(critical[0]?.targetDate)}d left`}. Drop everything else.</div>}
            </div>
          </div>
        )
      })()}

      {/* ── Category filter ── */}
      {usedCategories.length > 2 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {usedCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${categoryFilter === cat ? (CATEGORY_COLORS[cat] || 'var(--accent)') + '60' : 'var(--border)'}`,
                background: categoryFilter === cat ? (CATEGORY_COLORS[cat] || 'var(--accent)') + '15' : 'transparent',
                color: categoryFilter === cat ? (CATEGORY_COLORS[cat] || 'var(--accent)') : 'var(--text3)',
                transition: 'all 0.15s',
              }}
            >
              {cat !== 'All' && CATEGORY_ICONS[cat] + ' '}{cat}
            </button>
          ))}
        </div>
      )}

      {/* ── Goals list ── */}
      {sortedGoals.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 60 }}>
          <div className="empty-state-icon">🎯</div>
          <h3>No active goals</h3>
          <p style={{ marginBottom: 20 }}>Set your first goal — include a real deadline, a why, and milestones.</p>
          <button className="btn btn-primary" onClick={() => { setEditGoal(null); setShowGoalModal(true) }}>+ Create your first goal</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sortedGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              isExpanded={expandedGoal === goal.id}
              onToggleExpand={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
              updateGoal={updateGoal}
              deleteGoal={deleteGoal}
              toggleMilestone={toggleMilestone}
              addTask={addTask}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              setNextAction={setNextAction}
              editTask={editTask}
              logDailyOneThing={logDailyOneThing}
              onWOOP={(goal) => { setWOOPGoal(goal); setShowWOOPModal(true) }}
              onEdit={(goal) => { setEditGoal(goal); setShowGoalModal(true) }}
            />
          ))}
        </div>
      )}

      {/* ── Archived (parked) goals ── */}
      <GoalShelf
        title="Parked Goals"
        icon="📦"
        accentColor="#818cf8"
        accentBg="rgba(129,140,248,0.08)"
        goals={archivedGoals}
        primaryAction={(id) => updateGoal(id, { status: 'active', archivedAt: null })}
        primaryLabel="▶ Activate"
        secondaryAction={(id, title) => { if (window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) deleteGoal(id) }}
        dateKey="archivedAt"
        datePrefix="Parked"
        showProgress={true}
      />

      {/* ── Completed goals ── */}
      <GoalShelf
        title="Completed Goals"
        icon="🏆"
        accentColor="#22c55e"
        accentBg="rgba(34,197,94,0.08)"
        goals={completedGoals}
        primaryAction={(id) => updateGoal(id, { status: 'active', completedAt: null })}
        primaryLabel="↩ Restore"
        secondaryAction={(id, title) => { if (window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) deleteGoal(id) }}
        dateKey="completedAt"
        datePrefix="✓"
        showProgress={true}
      />

      {/* ── Modals ── */}
      {showGoalModal && (
        <GoalModal
          editGoal={editGoal}
          onClose={() => { setShowGoalModal(false); setEditGoal(null) }}
          onSave={data => editGoal ? updateGoal(editGoal.id, data) : addGoal(data)}
        />
      )}
      {showOneThingModal && oneThingGoal && (
        <OneThingModal
          goal={oneThingGoal}
          onClose={() => { setShowOneThingModal(false); setOneThingGoal(null) }}
          onSave={logDailyOneThing}
        />
      )}
      {showWeeklyModal && (
        <WeeklyCommitModal
          goals={activeGoals}
          onClose={() => setShowWeeklyModal(false)}
          onSave={handleWeeklyCommit}
        />
      )}
      {showWOOPModal && wOOPGoal && (
        <WOOPModal
          goal={wOOPGoal}
          onClose={() => { setShowWOOPModal(false); setWOOPGoal(null) }}
          onSave={handleSaveWOOP}
        />
      )}
    </div>
  )
}
