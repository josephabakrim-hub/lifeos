import { useState } from 'react'
import { formatDate, scoreColor } from '../lib/utils'

const CATEGORIES = ['Trading', 'Health', 'Focus', 'Learning', 'Mental', 'Social', 'Other']

function GoalModal({ onClose, onSave, editGoal }) {
  const [title, setTitle] = useState(editGoal?.title || '')
  const [description, setDescription] = useState(editGoal?.description || '')
  const [category, setCategory] = useState(editGoal?.category || 'Personal')
  const [targetDate, setTargetDate] = useState(editGoal?.targetDate || '')
  const [milestones, setMilestones] = useState(editGoal?.milestones?.map(m => m.text).join('\n') || '')
  const [oneThing, setOneThing] = useState(editGoal?.dailyOneThing?.[0]?.text || '')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{editGoal ? 'Edit goal' : 'Add new goal'}</div>
        <div className="form-group">
          <label>Goal title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Become consistently profitable trader" autoFocus />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Why does this goal matter to you?" style={{ resize: 'vertical' }} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Target date</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Milestones (one per line)</label>
          <textarea value={milestones} onChange={e => setMilestones(e.target.value)} rows={3} placeholder="Break it down into checkpoints..." style={{ resize: 'vertical' }} />
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            if (!title.trim()) return
            const milestoneList = milestones.split('\n').filter(m => m.trim()).map(text => ({ text: text.trim(), done: false }))
            onSave({ title: title.trim(), description, category, targetDate, milestones: milestoneList })
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

const CATEGORY_COLORS = {
  Trading: '#14b8a6', Health: '#f97316', Focus: '#7c6aff',
  Learning: '#f59e0b', Mental: '#a855f7', Social: '#ec4899',
  Other: '#9898b0'
}

export default function GoalsView({ goals, loading, addGoal, updateGoal, deleteGoal, toggleMilestone, logDailyOneThing, getWeekScore }) {
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showOneThingModal, setShowOneThingModal] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [expandedGoal, setExpandedGoal] = useState(null)
  const weekScore = getWeekScore()
  const activeGoals = goals.filter(g => g.status === 'active')

  if (loading) return <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div className="fade-in">
      <div className="section-header">
        <div>
          <div className="section-title">🎯 Goals</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Based on The ONE Thing + OKRs</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Week score</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: scoreColor(weekScore) }}>{weekScore}</div>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditGoal(null); setShowGoalModal(true) }}>+ Add goal</button>
        </div>
      </div>

      {activeGoals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3>No active goals</h3>
          <p>Set your first big life goal to start making progress</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {activeGoals.map(goal => {
            const isExpanded = expandedGoal === goal.id
            const progress = goal.progress || 0
            const milestones = goal.milestones || []
            const doneMilestones = milestones.filter(m => m.done).length
            const color = CATEGORY_COLORS[goal.category] || 'var(--accent)'
            const todayOneThing = goal.oneThing?.find(o => o.date === formatDate())

            return (
              <div key={goal.id} className="card" style={{ borderLeft: `3px solid ${color}` }}>
                {/* Goal header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span className="badge" style={{ background: `${color}20`, color }}>{goal.category}</span>
                      {goal.targetDate && (
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                          📅 {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      <span className={`badge ${progress >= 75 ? 'badge-green' : progress >= 40 ? 'badge-amber' : 'badge-red'}`}>
                        {progress >= 75 ? '🟢 On track' : progress >= 40 ? '🟡 In progress' : '🔴 Just started'}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{goal.title}</div>
                    {goal.description && <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>{goal.description}</div>}

                    {/* Progress bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="progress-bar" style={{ flex: 1, height: 8 }}>
                        <div className="progress-fill" style={{ width: `${progress}%`, background: color }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color }}>{progress}%</span>
                    </div>
                    {milestones.length > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{doneMilestones}/{milestones.length} milestones</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      className="btn btn-sm"
                      style={{ background: todayOneThing ? 'var(--green-bg)' : 'var(--bg3)', borderColor: todayOneThing ? 'var(--green)' : 'var(--border2)', color: todayOneThing ? 'var(--green)' : 'var(--text)' }}
                      onClick={() => { setSelectedGoal(goal); setShowOneThingModal(true) }}
                      title="Log today's ONE Thing"
                    >
                      {todayOneThing ? '✓ Done' : '🎯 ONE Thing'}
                    </button>
                    <button className="btn btn-sm" onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}>
                      {isExpanded ? '▲' : '▼'}
                    </button>
                    <button className="btn btn-sm" onClick={() => { setEditGoal(goal); setShowGoalModal(true) }}>✏️</button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteGoal(goal.id)}>✕</button>
                  </div>
                </div>

                {/* Expanded: milestones + ONE Thing log */}
                {isExpanded && (
                  <div style={{ marginTop: 16 }}>
                    {milestones.length > 0 && (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Milestones</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          {milestones.map((m, i) => (
                            <div key={i} className="checkbox-row" onClick={() => toggleMilestone(goal.id, i)}>
                              <div className={`checkbox ${m.done ? 'checked' : ''}`}>{m.done ? '✓' : ''}</div>
                              <span style={{ fontSize: 14, textDecoration: m.done ? 'line-through' : 'none', color: m.done ? 'var(--text3)' : 'var(--text)' }}>{m.text}</span>
                              {m.done && m.completedAt && <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>{m.completedAt}</span>}
                            </div>
                          ))}
                        </div>
                      </>
                    )}

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

                    {/* Manual progress update */}
                    <div className="divider" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, color: 'var(--text3)' }}>Update progress:</span>
                      <input
                        type="range" min="0" max="100" value={progress}
                        onChange={e => updateGoal(goal.id, { progress: parseInt(e.target.value) })}
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600, color, width: 36 }}>{progress}%</span>
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
          <div className="section-title" style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 8 }}>Completed goals</div>
          {goals.filter(g => g.status !== 'active').map(goal => (
            <div key={goal.id} className="card" style={{ opacity: 0.6, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, textDecoration: 'line-through' }}>{goal.title}</span>
              <span className="badge badge-green">✓ Done</span>
            </div>
          ))}
        </div>
      )}

      {showGoalModal && (
        <GoalModal
          editGoal={editGoal}
          onClose={() => setShowGoalModal(false)}
          onSave={data => editGoal ? updateGoal(editGoal.id, data) : addGoal(data)}
        />
      )}
      {showOneThingModal && selectedGoal && (
        <OneThingModal
          goal={selectedGoal}
          onClose={() => setShowOneThingModal(false)}
          onSave={logDailyOneThing}
        />
      )}
    </div>
  )
}
