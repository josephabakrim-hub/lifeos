import { useState } from 'react'
import { formatDate, scoreColor } from '../lib/utils'

const CATEGORIES = ['Trading', 'Health', 'Focus', 'Learning', 'Mental', 'Social', 'Other']

const CATEGORY_COLORS = {
  Trading: '#14b8a6', Health: '#f97316', Focus: '#7c6aff',
  Learning: '#f59e0b', Mental: '#a855f7', Social: '#ec4899',
  Other: '#9898b0'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCountdown(targetDate) {
  if (!targetDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  const diffMs = target - today
  const diffDays = Math.round(diffMs / 86400000)
  return diffDays
}

function isTodayMonday() {
  return new Date().getDay() === 1
}

function calcStreak(oneThing = []) {
  if (!oneThing.length) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dates = new Set(oneThing.map(o => o.date))
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (dates.has(key)) streak++
    else break
  }
  return streak
}

// ─── Countdown badge ──────────────────────────────────────────────────────────

function CountdownBadge({ targetDate }) {
  const days = getCountdown(targetDate)
  if (days === null) return null
  const isOverdue  = days < 0
  const isCritical = days >= 0 && days <= 3
  const isUrgent   = days > 3  && days <= 7
  const isWarning  = days > 7  && days <= 14
  const isHealthy  = days > 14 && days <= 30
  const config = isOverdue  ? { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.5)',   color: '#ef4444', icon: '💀', label: `${Math.abs(days)}d overdue`, pulse: true  } :
                 isCritical ? { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.4)',   color: '#ef4444', icon: '🔴', label: days === 0 ? 'Due TODAY' : `${days}d left`, pulse: true  } :
                 isUrgent   ? { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.4)',  color: '#f59e0b', icon: '🟠', label: `${days}d left`, pulse: false } :
                 isWarning  ? { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.3)',  color: '#f59e0b', icon: '🟡', label: `${days}d left`, pulse: false } :
                 isHealthy  ? { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.3)',   color: '#22c55e', icon: '🟢', label: `${days}d left`, pulse: false } :
                              { bg: 'rgba(59,130,246,0.08)',   border: 'rgba(59,130,246,0.25)', color: '#3b82f6', icon: '📅', label: `${days}d left`, pulse: false }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: config.bg, border: `1px solid ${config.border}`, animation: config.pulse ? 'pulse 2s infinite' : 'none' }}>
      <span style={{ fontSize: 12 }}>{config.icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: config.color }}>{config.label}</span>
    </div>
  )
}

// ─── Countdown bar ────────────────────────────────────────────────────────────

function CountdownBar({ targetDate, createdAt, progress }) {
  const days = getCountdown(targetDate)
  if (days === null) return null
  const isOverdue = days < 0
  const start = createdAt ? new Date(createdAt) : new Date()
  const end   = new Date(targetDate)
  const totalDays = Math.max(1, Math.round((end - start) / 86400000))
  const elapsed   = Math.max(0, totalDays - Math.max(0, days))
  const elapsedPct = Math.min(100, Math.round((elapsed / totalDays) * 100))
  const urgencyColor = isOverdue ? '#ef4444' : days <= 3 ? '#ef4444' : days <= 7 ? '#f59e0b' : days <= 14 ? '#f59e0b' : '#22c55e'
  const targetDateFormatted = new Date(targetDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--bg3)', border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>⏱ Deadline — {targetDateFormatted}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: urgencyColor }}>
          {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due TODAY — finish it' : `${days}d remaining`}
        </span>
      </div>
      <div style={{ position: 'relative', height: 8, background: 'var(--bg4)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${elapsedPct}%`, background: isOverdue ? '#ef4444' : `${urgencyColor}60`, borderRadius: 4, transition: 'width 0.4s ease' }} />
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min(elapsedPct, progress || 0)}%`, background: urgencyColor, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>Started</span>
        <span style={{ fontSize: 10, color: urgencyColor, fontWeight: 600 }}>{elapsedPct}% of time used · {progress || 0}% done</span>
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>Deadline</span>
      </div>
      {!isOverdue && days > 0 && days <= 14 && (progress || 0) < 50 && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#f59e0b', lineHeight: 1.5 }}>
          ⚡ <strong>Parkinson's Law:</strong> You have {days} days left and {100 - (progress || 0)}% to go. Don't let the deadline expand the work — attack it now.
        </div>
      )}
      {isOverdue && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#ef4444', lineHeight: 1.5 }}>
          🔴 <strong>Deadline passed.</strong> Reset your target date or mark this done. A missed deadline is data — learn from it and recommit.
        </div>
      )}
    </div>
  )
}

// ─── Streak badge ─────────────────────────────────────────────────────────────

function StreakBadge({ streak }) {
  if (!streak) return null
  const color = streak >= 7 ? '#f97316' : streak >= 3 ? '#f59e0b' : '#9898b0'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}50` }}>
      <span style={{ fontSize: 13 }}>🔥</span>
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{streak}d streak</span>
    </div>
  )
}

// ─── Focus Mode panel ─────────────────────────────────────────────────────────
// Shows all ⚡ Next Actions across every goal in one clean list

function FocusMode({ nextActions, goals, onToggleTask, onClose }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (nextActions.length === 0) {
    return (
      <div style={{ padding: '24px', borderRadius: 12, background: 'rgba(124,106,255,0.06)', border: '1px solid rgba(124,106,255,0.2)', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#9f91ff' }}>⚡ Focus Mode — {today}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Your next actions across all goals</div>
          </div>
          <button className="btn btn-sm" onClick={onClose}>✕ Close</button>
        </div>
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 4 }}>No next actions set yet</div>
          <div style={{ fontSize: 12 }}>
            Expand a goal → open a milestone → add a task → mark it ⚡ as your next action.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 24px', borderRadius: 12, background: 'rgba(124,106,255,0.06)', border: '1px solid rgba(124,106,255,0.25)', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#9f91ff' }}>⚡ Focus Mode — {today}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            {nextActions.length} next action{nextActions.length !== 1 ? 's' : ''} — these are the only things that matter right now
          </div>
        </div>
        <button className="btn btn-sm" onClick={onClose}>✕ Close</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {nextActions.map(task => {
          const color = CATEGORY_COLORS[task.goalCategory] || 'var(--accent)'
          return (
            <div
              key={task.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 14px', borderRadius: 10,
                background: task.done ? 'var(--bg3)' : 'var(--bg2)',
                border: `1px solid ${task.done ? 'var(--border)' : color + '50'}`,
                opacity: task.done ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {/* Complete button */}
              <button
                onClick={() => onToggleTask(task.goalId, task.milestoneIndex, task.id)}
                style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  border: `2px solid ${task.done ? '#22c55e' : color}`,
                  background: task.done ? '#22c55e' : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: '#fff', transition: 'all 0.15s',
                }}
              >
                {task.done ? '✓' : ''}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Breadcrumb */}
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>
                  <span style={{ color }}>{task.goalCategory}</span>
                  <span style={{ margin: '0 4px' }}>›</span>
                  <span>{task.goalTitle}</span>
                  <span style={{ margin: '0 4px' }}>›</span>
                  <span>{task.milestoneText}</span>
                </div>

                {/* Task text */}
                <div style={{
                  fontSize: 14, fontWeight: 600,
                  textDecoration: task.done ? 'line-through' : 'none',
                  color: task.done ? 'var(--text3)' : 'var(--text)',
                }}>
                  {task.text}
                </div>

                {/* Implementation intention */}
                {task.intention && (
                  <div style={{ fontSize: 12, color: '#7c6aff', marginTop: 4, fontStyle: 'italic' }}>
                    📍 {task.intention}
                  </div>
                )}
              </div>

              <span style={{ fontSize: 11, fontWeight: 700, color, padding: '2px 8px', borderRadius: 20, background: color + '18', flexShrink: 0 }}>
                ⚡ Next
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: '#f59e0b', lineHeight: 1.6 }}>
        💡 <strong>GTD rule:</strong> Do your next actions in order of energy, not urgency. Pick the one you can start <em>right now</em> and do nothing else until it's done.
      </div>
    </div>
  )
}

// ─── Task row (inside a milestone) ───────────────────────────────────────────

function TaskRow({ task, onToggle, onDelete, onSetNextAction }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '8px 10px', borderRadius: 8,
      background: task.isNextAction ? 'rgba(124,106,255,0.07)' : 'var(--bg3)',
      border: `1px solid ${task.isNextAction ? 'rgba(124,106,255,0.3)' : 'var(--border)'}`,
      marginBottom: 6,
      opacity: task.done ? 0.55 : 1,
      transition: 'all 0.15s',
    }}>
      {/* Done toggle */}
      <button
        onClick={onToggle}
        style={{
          width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
          border: `2px solid ${task.done ? '#22c55e' : 'var(--border2)'}`,
          background: task.done ? '#22c55e' : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: '#fff', transition: 'all 0.15s',
        }}
      >
        {task.done ? '✓' : ''}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: task.isNextAction ? 600 : 400,
          textDecoration: task.done ? 'line-through' : 'none',
          color: task.done ? 'var(--text3)' : 'var(--text)',
        }}>
          {task.isNextAction && !task.done && <span style={{ color: '#9f91ff', marginRight: 4 }}>⚡</span>}
          {task.text}
        </div>
        {task.intention && (
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontStyle: 'italic' }}>
            📍 {task.intention}
          </div>
        )}
        {task.done && task.completedAt && (
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Done {task.completedAt}</div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button
          onClick={onSetNextAction}
          title={task.isNextAction ? 'Remove next action flag' : 'Mark as next action'}
          style={{
            padding: '3px 7px', borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${task.isNextAction ? 'rgba(124,106,255,0.5)' : 'var(--border2)'}`,
            background: task.isNextAction ? 'rgba(124,106,255,0.15)' : 'transparent',
            color: task.isNextAction ? '#9f91ff' : 'var(--text3)',
            transition: 'all 0.15s',
          }}
        >
          ⚡
        </button>
        <button
          onClick={onDelete}
          style={{ padding: '3px 7px', borderRadius: 5, fontSize: 11, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)' }}
        >✕</button>
      </div>
    </div>
  )
}

// ─── Add task form (inline, under a milestone) ────────────────────────────────

function AddTaskForm({ onAdd, onCancel }) {
  const [text, setText] = useState('')
  const [intention, setIntention] = useState('')
  const [showIntention, setShowIntention] = useState(false)

  return (
    <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(124,106,255,0.06)', border: '1px dashed rgba(124,106,255,0.3)', marginBottom: 6 }}>
      <input
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && text.trim()) { onAdd({ text: text.trim(), intention: intention.trim() }); setText(''); setIntention('') }
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="Concrete task — e.g. 'Read chapter 3 of trading journal'"
        style={{ fontSize: 13, marginBottom: 6 }}
      />

      {!showIntention ? (
        <button
          onClick={() => setShowIntention(true)}
          style={{ fontSize: 11, color: '#7c6aff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          + Add implementation intention (when / where)
        </button>
      ) : (
        <input
          value={intention}
          onChange={e => setIntention(e.target.value)}
          placeholder='e.g. "Every Monday at 9am at my desk"'
          style={{ fontSize: 12, color: '#9f91ff', marginBottom: 6 }}
        />
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => { if (text.trim()) { onAdd({ text: text.trim(), intention: intention.trim() }); setText(''); setIntention('') }}}
        >+ Add task</button>
        <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8, lineHeight: 1.5 }}>
        💡 <strong>Implementation intention</strong> — research shows "When X, I will Y" triples follow-through.
      </div>
    </div>
  )
}

// ─── Milestone section (with tasks) ──────────────────────────────────────────

function MilestoneSection({ milestone, milestoneIndex, goalId, onToggleMilestone, onAddTask, onToggleTask, onDeleteTask, onSetNextAction }) {
  const [showAddTask, setShowAddTask] = useState(false)
  const tasks = milestone.tasks || []
  const doneTasks = tasks.filter(t => t.done).length
  const mDays = milestone.dueDate ? getCountdown(milestone.dueDate) : null
  const mOverdue = mDays !== null && mDays < 0
  const mUrgent  = mDays !== null && mDays >= 0 && mDays <= 3

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Milestone header row */}
      <div
        className="checkbox-row"
        onClick={() => onToggleMilestone(goalId, milestoneIndex)}
        style={{ alignItems: 'flex-start', paddingBottom: tasks.length > 0 ? 6 : 10 }}
      >
        <div className={`checkbox ${milestone.done ? 'checked' : ''}`} style={{ marginTop: 2 }}>{milestone.done ? '✓' : ''}</div>
        <div style={{ flex: 1 }}>
          <span style={{
            fontSize: 14, fontWeight: 600,
            textDecoration: milestone.done ? 'line-through' : 'none',
            color: milestone.done ? 'var(--text3)' : 'var(--text)',
          }}>
            {milestone.text}
          </span>
          {tasks.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 8 }}>
              {doneTasks}/{tasks.length} tasks
            </span>
          )}
        </div>
        {milestone.dueDate && !milestone.done && (
          <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 8, color: mOverdue ? '#ef4444' : mUrgent ? '#f59e0b' : 'var(--text3)', whiteSpace: 'nowrap' }}>
            {mOverdue ? `💀 ${Math.abs(mDays)}d overdue` : mDays === 0 ? '🔴 Due today' : mUrgent ? `🟠 ${mDays}d` : `📅 ${new Date(milestone.dueDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          </span>
        )}
        {milestone.done && milestone.completedAt && (
          <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>{milestone.completedAt}</span>
        )}
      </div>

      {/* Tasks under this milestone */}
      {!milestone.done && (
        <div style={{ marginLeft: 30, marginTop: 4 }}>
          {tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => onToggleTask(goalId, milestoneIndex, task.id)}
              onDelete={() => onDeleteTask(goalId, milestoneIndex, task.id)}
              onSetNextAction={() => onSetNextAction(goalId, milestoneIndex, task.id)}
            />
          ))}

          {showAddTask ? (
            <AddTaskForm
              onAdd={t => { onAddTask(goalId, milestoneIndex, t); setShowAddTask(false) }}
              onCancel={() => setShowAddTask(false)}
            />
          ) : (
            <button
              onClick={e => { e.stopPropagation(); setShowAddTask(true) }}
              style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span style={{ fontSize: 14 }}>+</span> Add task
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function GoalModal({ onClose, onSave, editGoal }) {
  const [title,       setTitle]       = useState(editGoal?.title || '')
  const [description, setDescription] = useState(editGoal?.description || '')
  const [why,         setWhy]         = useState(editGoal?.why || '')
  const [category,    setCategory]    = useState(editGoal?.category || 'Trading')
  const [targetDate,  setTargetDate]  = useState(editGoal?.targetDate || '')
  const [milestones,  setMilestones]  = useState(
    editGoal?.milestones?.map(m => ({ text: m.text, dueDate: m.dueDate || '' })) || [{ text: '', dueDate: '' }]
  )

  const addMilestone = () => setMilestones(prev => [...prev, { text: '', dueDate: '' }])
  const removeMilestone = i => setMilestones(prev => prev.filter((_, idx) => idx !== i))
  const updateMilestone = (i, field, val) => setMilestones(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, width: '100%' }}>
        <div className="modal-title">{editGoal ? 'Edit goal' : 'Add new goal'}</div>

        <div className="form-group">
          <label>Goal title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Become consistently profitable trader" autoFocus />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What does success look like?" style={{ resize: 'vertical' }} />
        </div>

        <div className="form-group">
          <label>💡 Why I want this</label>
          <input value={why} onChange={e => setWhy(e.target.value)} placeholder="e.g. Freedom to trade from anywhere and provide for my family" />
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Your anchor. You'll see this every time you open the goal.</div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Target date (deadline) *</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>⏱ Parkinson's Law — set a real deadline</div>
          </div>
        </div>

        <div className="form-group">
          <label>Milestones</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {milestones.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={m.text} onChange={e => updateMilestone(i, 'text', e.target.value)} placeholder={`Milestone ${i + 1}`} style={{ flex: 1 }} />
                <input type="date" value={m.dueDate} onChange={e => updateMilestone(i, 'dueDate', e.target.value)} title="Optional milestone deadline" style={{ width: 140, fontSize: 12 }} />
                {milestones.length > 1 && (
                  <button className="btn btn-sm btn-danger" onClick={() => removeMilestone(i)} style={{ padding: '4px 8px' }}>✕</button>
                )}
              </div>
            ))}
          </div>
          <button className="btn btn-sm" onClick={addMilestone} style={{ marginTop: 8 }}>+ Add milestone</button>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            After saving, expand a milestone to add concrete tasks with implementation intentions.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            if (!title.trim()) return
            const milestoneList = milestones.filter(m => m.text.trim()).map(m => ({ text: m.text.trim(), dueDate: m.dueDate || '', done: false, tasks: [] }))
            onSave({ title: title.trim(), description, why, category, targetDate, milestones: milestoneList })
            onClose()
          }}>Save goal</button>
        </div>
      </div>
    </div>
  )
}

function OneThingModal({ goal, onClose, onSave }) {
  const [text, setText] = useState('')
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">🎯 Today's ONE Thing</div>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
          For <strong>{goal.title}</strong> — what's the one action today that makes everything else easier or unnecessary?
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

function CompleteModal({ goal, onClose, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
        <div className="modal-title" style={{ marginBottom: 8 }}>Mark as Complete?</div>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.6 }}>
          You're about to mark <strong>"{goal.title}"</strong> as done.<br />This will archive it in your completed goals. Well done.
        </p>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button className="btn" onClick={onClose}>Not yet</button>
          <button className="btn btn-primary" style={{ background: '#22c55e', borderColor: '#22c55e' }} onClick={onConfirm}>✓ Complete it!</button>
        </div>
      </div>
    </div>
  )
}

function WeeklyCommitModal({ goals, onClose, onSave }) {
  const [commitments, setCommitments] = useState(Object.fromEntries(goals.map(g => [g.id, ''])))
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, width: '100%' }}>
        <div className="modal-title">📅 Weekly Commitment — {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>It's Monday. What will you move forward on each goal this week?</p>
        {goals.map(g => (
          <div key={g.id} className="form-group">
            <label style={{ color: CATEGORY_COLORS[g.category] || 'var(--accent)' }}>{g.title}</label>
            <input value={commitments[g.id] || ''} onChange={e => setCommitments(prev => ({ ...prev, [g.id]: e.target.value }))} placeholder="This week I will..." />
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

// ─── Main view ────────────────────────────────────────────────────────────────

export default function GoalsView({ goals, loading, addGoal, updateGoal, deleteGoal, toggleMilestone, addTask, toggleTask, deleteTask, setNextAction, logDailyOneThing, getWeekScore, getNextActions }) {
  const [showGoalModal,     setShowGoalModal]     = useState(false)
  const [showOneThingModal, setShowOneThingModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showWeeklyModal,   setShowWeeklyModal]   = useState(false)
  const [showFocusMode,     setShowFocusMode]     = useState(false)
  const [editGoal,          setEditGoal]          = useState(null)
  const [selectedGoal,      setSelectedGoal]      = useState(null)
  const [expandedGoal,      setExpandedGoal]      = useState(null)

  const weekScore   = getWeekScore()
  const activeGoals = goals.filter(g => g.status === 'active')
  const nextActions = getNextActions ? getNextActions() : []

  const sortedGoals = [...activeGoals].sort((a, b) => {
    const dA = getCountdown(a.targetDate)
    const dB = getCountdown(b.targetDate)
    if (dA === null && dB === null) return 0
    if (dA === null) return 1
    if (dB === null) return -1
    return dA - dB
  })

  const handleComplete = (goal) => {
    updateGoal(goal.id, { status: 'completed', completedAt: new Date().toISOString() })
    setShowCompleteModal(false)
    setSelectedGoal(null)
  }

  const handleWeeklyCommit = (commitments) => {
    Object.entries(commitments).forEach(([goalId, text]) => {
      if (text.trim()) {
        const goal = goals.find(g => g.id === goalId)
        if (goal) {
          const existing = goal.weeklyCommitments || []
          updateGoal(goalId, { weeklyCommitments: [...existing, { week: formatDate(), text: text.trim() }] })
        }
      }
    })
  }

  if (loading) return <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div className="fade-in">
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes celebrate { 0% { transform: scale(1); } 50% { transform: scale(1.04); } 100% { transform: scale(1); } }
      `}</style>

      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">🎯 Goals</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Goal → Milestone → Task → Next Action</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Week score</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: scoreColor(weekScore) }}>{weekScore}</div>
          </div>

          {/* Focus Mode toggle */}
          <button
            className="btn btn-sm"
            style={{
              background: showFocusMode ? 'rgba(124,106,255,0.15)' : 'var(--bg3)',
              borderColor: showFocusMode ? 'rgba(124,106,255,0.4)' : 'var(--border2)',
              color: showFocusMode ? '#9f91ff' : 'var(--text)',
              fontWeight: 700,
              position: 'relative',
            }}
            onClick={() => setShowFocusMode(p => !p)}
          >
            ⚡ Focus Mode
            {nextActions.length > 0 && (
              <span style={{ marginLeft: 6, background: '#7c6aff', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 800, padding: '1px 6px' }}>
                {nextActions.length}
              </span>
            )}
          </button>

          {isTodayMonday() && activeGoals.length > 0 && (
            <button className="btn btn-sm" style={{ background: 'rgba(124,106,255,0.12)', borderColor: 'rgba(124,106,255,0.4)', color: '#7c6aff', fontWeight: 700 }} onClick={() => setShowWeeklyModal(true)}>
              📅 Weekly commit
            </button>
          )}
          <button className="btn btn-primary" onClick={() => { setEditGoal(null); setShowGoalModal(true) }}>+ Add goal</button>
        </div>
      </div>

      {/* Focus Mode panel */}
      {showFocusMode && (
        <FocusMode
          nextActions={nextActions}
          goals={goals}
          onToggleTask={toggleTask}
          onClose={() => setShowFocusMode(false)}
        />
      )}

      {/* Monday commit reminder */}
      {isTodayMonday() && activeGoals.length > 0 && (
        <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 10, background: 'rgba(124,106,255,0.08)', border: '1px solid rgba(124,106,255,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7c6aff' }}>📅 It's Monday — time to commit</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Set your intention for each goal this week. What will you move forward?</div>
          </div>
          <button className="btn btn-sm" style={{ background: '#7c6aff', color: '#fff', borderColor: '#7c6aff' }} onClick={() => setShowWeeklyModal(true)}>Set commitments →</button>
        </div>
      )}

      {/* Urgent deadlines banner */}
      {(() => {
        const overdue  = activeGoals.filter(g => getCountdown(g.targetDate) !== null && getCountdown(g.targetDate) < 0)
        const critical = activeGoals.filter(g => { const d = getCountdown(g.targetDate); return d !== null && d >= 0 && d <= 3 })
        if (!overdue.length && !critical.length) return null
        return (
          <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>⚠️ Deadline alert</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              {overdue.length > 0 && <div>🔴 <strong>{overdue.map(g => g.title).join(', ')}</strong> — overdue. Recommit or reset the deadline now.</div>}
              {critical.length > 0 && <div>🟠 <strong>{critical.map(g => g.title).join(', ')}</strong> — {getCountdown(critical[0]?.targetDate) === 0 ? 'due TODAY' : `${getCountdown(critical[0]?.targetDate)}d left`}. Drop everything else.</div>}
            </div>
          </div>
        )
      })()}

      {/* Goal cards */}
      {sortedGoals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3>No active goals</h3>
          <p>Set your first goal with a real deadline — Parkinson's Law demands it</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sortedGoals.map(goal => {
            const isExpanded     = expandedGoal === goal.id
            const progress       = goal.progress || 0
            const milestones     = goal.milestones || []
            const doneMilestones = milestones.filter(m => m.done).length
            const color          = CATEGORY_COLORS[goal.category] || 'var(--accent)'
            const todayOneThing  = goal.oneThing?.find(o => o.date === formatDate())
            const daysLeft       = getCountdown(goal.targetDate)
            const isOverdue      = daysLeft !== null && daysLeft < 0
            const streak         = calcStreak(goal.oneThing)
            const thisWeekCommit = goal.weeklyCommitments?.find(w => w.week === formatDate())

            // Task stats
            const allTasks      = milestones.flatMap(m => m.tasks || [])
            const doneTasks     = allTasks.filter(t => t.done).length
            const goalNextActions = milestones.flatMap(m => (m.tasks || []).filter(t => t.isNextAction && !t.done))

            return (
              <div
                key={goal.id}
                className="card"
                style={{ borderLeft: `3px solid ${isOverdue ? '#ef4444' : color}`, cursor: 'pointer' }}
                onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
              >
                {/* COLLAPSED */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span className="badge" style={{ background: `${color}20`, color }}>{goal.category}</span>
                      <span className={`badge ${progress >= 75 ? 'badge-green' : progress >= 40 ? 'badge-amber' : 'badge-red'}`}>
                        {progress >= 75 ? '🟢 On track' : progress >= 40 ? '🟡 In progress' : '🔴 Just started'}
                      </span>
                      <CountdownBadge targetDate={goal.targetDate} />
                      {streak > 0 && <StreakBadge streak={streak} />}
                      {goalNextActions.length > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: 'rgba(124,106,255,0.12)', border: '1px solid rgba(124,106,255,0.3)', fontSize: 11, fontWeight: 700, color: '#9f91ff' }}>
                          ⚡ {goalNextActions.length} next action{goalNextActions.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{goal.title}</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="progress-bar" style={{ flex: 1, height: 8 }}>
                        <div className="progress-fill" style={{ width: `${progress}%`, background: isOverdue ? '#ef4444' : color }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isOverdue ? '#ef4444' : color }}>{progress}%</span>
                    </div>

                    {!isExpanded && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                        {milestones.length > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--text3)' }}>📌 {doneMilestones}/{milestones.length} milestones</span>
                        )}
                        {allTasks.length > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--text3)' }}>✅ {doneTasks}/{allTasks.length} tasks</span>
                        )}
                        {streak > 0 && <span style={{ fontSize: 11, color: streak >= 7 ? '#f97316' : '#f59e0b' }}>🔥 {streak}d streak</span>}
                        {todayOneThing && <span style={{ fontSize: 11, color: '#22c55e' }}>✓ ONE Thing done</span>}
                        {thisWeekCommit && (
                          <span style={{ fontSize: 11, color: '#7c6aff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>📅 {thisWeekCommit.text}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-sm"
                      style={{ background: todayOneThing ? 'var(--green-bg)' : 'var(--bg3)', borderColor: todayOneThing ? 'var(--green)' : 'var(--border2)', color: todayOneThing ? 'var(--green)' : 'var(--text)' }}
                      onClick={() => { setSelectedGoal(goal); setShowOneThingModal(true) }}
                      title="Log today's ONE Thing"
                    >
                      {todayOneThing ? '✓ Done' : '🎯 ONE Thing'}
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.4)', color: '#22c55e' }}
                      onClick={() => { setSelectedGoal(goal); setShowCompleteModal(true) }}
                    >✓ Complete</button>
                    <button className="btn btn-sm" onClick={() => { setEditGoal(goal); setShowGoalModal(true) }}>✏️</button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteGoal(goal.id)}>✕</button>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: 'var(--text3)', userSelect: 'none' }}>
                  {isExpanded ? '▲ less' : '▼ more'}
                </div>

                {/* EXPANDED */}
                {isExpanded && (
                  <div style={{ marginTop: 12 }} onClick={e => e.stopPropagation()}>

                    {goal.description && (
                      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>{goal.description}</div>
                    )}

                    {goal.why && (
                      <div style={{ fontSize: 12, color: '#f59e0b', marginBottom: 8, padding: '5px 10px', borderRadius: 6, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'inline-block' }}>
                        💡 {goal.why}
                      </div>
                    )}

                    {thisWeekCommit && (
                      <div style={{ fontSize: 12, color: '#7c6aff', marginBottom: 8, padding: '5px 10px', borderRadius: 6, background: 'rgba(124,106,255,0.08)', border: '1px solid rgba(124,106,255,0.2)' }}>
                        📅 This week: {thisWeekCommit.text}
                      </div>
                    )}

                    {milestones.length > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
                        {doneMilestones}/{milestones.length} milestones
                        {allTasks.length > 0 && ` · ${doneTasks}/${allTasks.length} tasks`}
                      </div>
                    )}

                    <CountdownBar targetDate={goal.targetDate} createdAt={goal.createdAt} progress={progress} />

                    {/* Milestones with task layer */}
                    {milestones.length > 0 && (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Milestones & Tasks</span>
                          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>
                            ⚡ = next action &nbsp;·&nbsp; click milestone to complete it
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          {milestones.map((m, i) => (
                            <MilestoneSection
                              key={i}
                              milestone={m}
                              milestoneIndex={i}
                              goalId={goal.id}
                              onToggleMilestone={toggleMilestone}
                              onAddTask={addTask}
                              onToggleTask={toggleTask}
                              onDeleteTask={deleteTask}
                              onSetNextAction={setNextAction}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* ONE Thing log */}
                    {goal.oneThing?.length > 0 && (
                      <>
                        <div className="divider" />
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>ONE Thing log</div>
                        {goal.oneThing.slice(0, 5).map((o, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                            <span style={{ color: 'var(--text3)', flexShrink: 0 }}>{o.date}</span>
                            <span style={{ color: 'var(--text2)' }}>{o.text}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Weekly commitments log */}
                    {goal.weeklyCommitments?.length > 0 && (
                      <>
                        <div className="divider" />
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Weekly commitments</div>
                        {goal.weeklyCommitments.slice(-4).reverse().map((w, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                            <span style={{ color: 'var(--text3)', flexShrink: 0 }}>{w.week}</span>
                            <span style={{ color: 'var(--text2)' }}>{w.text}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Manual progress slider */}
                    <div className="divider" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, color: 'var(--text3)' }}>Manual progress:</span>
                      <input
                        type="range" min="0" max="100" value={progress}
                        onChange={e => updateGoal(goal.id, { progress: parseInt(e.target.value) })}
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600, color: scoreColor(progress), width: 36 }}>{progress}%</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Completed goals */}
      {goals.filter(g => g.status !== 'active').length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="section-title" style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 8 }}>Completed goals 🏆</div>
          {goals.filter(g => g.status !== 'active').map(goal => (
            <div key={goal.id} className="card" style={{ opacity: 0.6, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 14, textDecoration: 'line-through' }}>{goal.title}</span>
                {goal.completedAt && (
                  <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 10 }}>
                    {new Date(goal.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
              <span className="badge badge-green">✓ Done</span>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showGoalModal && (
        <GoalModal editGoal={editGoal} onClose={() => setShowGoalModal(false)} onSave={data => editGoal ? updateGoal(editGoal.id, data) : addGoal(data)} />
      )}
      {showOneThingModal && selectedGoal && (
        <OneThingModal goal={selectedGoal} onClose={() => setShowOneThingModal(false)} onSave={logDailyOneThing} />
      )}
      {showCompleteModal && selectedGoal && (
        <CompleteModal goal={selectedGoal} onClose={() => { setShowCompleteModal(false); setSelectedGoal(null) }} onConfirm={() => handleComplete(selectedGoal)} />
      )}
      {showWeeklyModal && (
        <WeeklyCommitModal goals={activeGoals} onClose={() => setShowWeeklyModal(false)} onSave={handleWeeklyCommit} />
      )}
    </div>
  )
}
