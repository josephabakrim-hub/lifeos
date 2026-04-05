import { useState, useMemo } from 'react'
import { formatDate, scoreColor, getWeekStart } from '../lib/utils'

const TOPICS = ['Trading', 'Teaching', 'Personal growth', 'Health', 'Finance', 'Business', 'Technology', 'Other']
const TYPES = [
  { value: 'book',    label: '📖 Book' },
  { value: 'course',  label: '🎓 Course' },
  { value: 'video',   label: '▶️ Video / YouTube' },
  { value: 'podcast', label: '🎙️ Podcast' },
  { value: 'article', label: '📄 Article' },
  { value: 'other',   label: '📝 Other' },
]

const TOPIC_COLORS = {
  Trading: '#14b8a6', Teaching: '#3b82f6', 'Personal growth': '#a855f7',
  Health: '#f97316', Finance: '#22c55e', Business: '#7c6aff',
  Technology: '#ec4899', Other: '#9898b0',
}

const RECALL_LABELS = {
  1: { label: 'Blank',   sub: "Couldn't recall anything",  color: '#ef4444' },
  2: { label: 'Weak',    sub: 'Recalled very little',       color: '#f97316' },
  3: { label: 'Okay',    sub: 'Got the gist, gaps remain',  color: '#f59e0b' },
  4: { label: 'Good',    sub: 'Recalled most of it',        color: '#22c55e' },
  5: { label: 'Perfect', sub: 'Clear and complete recall',  color: '#a855f7' },
}

function typeIcon(value) {
  return TYPES.find(t => t.value === value)?.label?.split(' ')[0] || '📝'
}

function topicColor(topic) {
  return TOPIC_COLORS[topic] || 'var(--accent)'
}

function formatDuration(hours) {
  if (!hours || hours <= 0) return '—'
  const totalMins = Math.round(hours * 60)
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function daysUntilReview(nextReviewDate) {
  if (!nextReviewDate) return null
  const today = new Date(formatDate() + 'T12:00:00')
  const next  = new Date(nextReviewDate + 'T12:00:00')
  return Math.round((next - today) / 86400000)
}

// ─── Log session modal ────────────────────────────────────────────────────────

function LearningModal({ onClose, onSave, editItem }) {
  const [title,     setTitle]     = useState(editItem?.title    || '')
  const [type,      setType]      = useState(editItem?.type     || 'book')
  const [topic,     setTopic]     = useState(editItem?.topic    || 'Trading')
  const _stored     = editItem?.duration || 0
  const _storedMins = Math.round(_stored * 60)
  const [durationH, setDurationH] = useState(_storedMins > 0 ? String(Math.floor(_storedMins / 60)) : '')
  const [durationM, setDurationM] = useState(_storedMins > 0 ? String(_storedMins % 60) : '')
  const [takeaways, setTakeaways] = useState(editItem?.takeaways?.join('\n') || '')
  const [applied,   setApplied]   = useState(editItem?.applied  || false)
  const [date,      setDate]      = useState(editItem?.date     || formatDate())

  function handleSave() {
    if (!title.trim()) return
    onSave({
      title: title.trim(), type, topic,
      duration: (parseInt(durationH) || 0) + (parseInt(durationM) || 0) / 60,
      takeaways: takeaways.split('\n').filter(t => t.trim()),
      applied, date,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{editItem ? 'Edit session' : 'Log learning session'}</div>
        <div className="form-group">
          <label>Title / source</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Atomic Habits — Chapter 3" autoFocus />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Topic</label>
            <select value={topic} onChange={e => setTopic(e.target.value)}>
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Duration</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <input type="number" min="0" max="23" step="1" value={durationH} onChange={e => setDurationH(e.target.value)} placeholder="0" style={{ width: 64, textAlign: 'center' }} />
              <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600 }}>h</span>
              <input type="number" min="0" max="59" step="5" value={durationM} onChange={e => setDurationM(e.target.value)} placeholder="0" style={{ width: 64, textAlign: 'center' }} />
              <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600 }}>min</span>
            </div>
            {(parseInt(durationH) > 0 || parseInt(durationM) > 0) && (
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>
                = {formatDuration((parseInt(durationH) || 0) + (parseInt(durationM) || 0) / 60)}
              </span>
            )}
          </div>
        </div>
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Key takeaways <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(one per line — used for recall practice)</span></label>
          <textarea value={takeaways} onChange={e => setTakeaways(e.target.value)} rows={4} placeholder="What did you learn? One idea per line — you'll test yourself on these later." style={{ resize: 'vertical' }} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
          <div className={`checkbox ${applied ? 'checked' : ''}`} onClick={() => setApplied(!applied)}>
            {applied ? '✓' : ''}
          </div>
          I applied this or explained it to someone
        </label>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ─── Recall review modal ──────────────────────────────────────────────────────

function RecallModal({ item, onClose, onSave }) {
  const [rating, setRating] = useState(null)
  const color = topicColor(item.topic)

  function handleSave() {
    if (!rating) return
    onSave(rating)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-title">🔁 Recall check</div>
        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg3)', borderLeft: `3px solid ${color}`, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{typeIcon(item.type)} {item.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: item.takeaways?.length ? 10 : 0 }}>
            {item.topic} · Originally studied {item.date}
          </div>
          {item.takeaways?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {item.takeaways.map((t, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 6 }}>
                  <span style={{ color }}>💡</span><span>{t}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>Without looking at your notes</strong> — how well could you recall and explain this material right now?
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {[1,2,3,4,5].map(r => {
            const info = RECALL_LABELS[r]
            const active = rating === r
            return (
              <div
                key={r}
                onClick={() => setRating(r)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  borderRadius: 9, cursor: 'pointer',
                  background: active ? `${info.color}18` : 'var(--bg3)',
                  border: `1px solid ${active ? info.color : 'var(--border2)'}`,
                  transition: 'all 0.12s',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: active ? info.color : 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 13, color: active ? '#fff' : 'var(--text3)', transition: 'all 0.12s' }}>{r}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: active ? info.color : 'var(--text)' }}>{info.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{info.sub}</div>
                </div>
              </div>
            )
          })}
        </div>

        {rating && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
            Next review scheduled in <strong style={{ color: 'var(--text)' }}>
              {rating <= 1 ? '1 day' : rating === 2 ? '3 days' : rating === 3 ? 'a few days' : rating === 4 ? 'about 2× your last interval' : 'a longer interval'}
            </strong> — the more you recall, the longer it spaces out.
          </div>
        )}

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!rating}>Save recall</button>
        </div>
      </div>
    </div>
  )
}

// ─── Cancel / postpone recall modal ──────────────────────────────────────────

function CancelRecallModal({ item, onClose, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-title">⏭️ Manage recall schedule</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>{item.title}</strong> is scheduled for recall
          {item.nextReviewDate ? ` on ${item.nextReviewDate}` : ''}. What would you like to do?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {[
            { label: '⏭️ Postpone 3 days',  days: 3  },
            { label: '⏭️ Postpone 7 days',  days: 7  },
            { label: '⏭️ Postpone 14 days', days: 14 },
            { label: '🗑️ Remove recall schedule entirely', days: 0 },
          ].map(opt => (
            <button
              key={opt.days}
              className="btn"
              onClick={() => { onCancel(item.id, opt.days); onClose() }}
              style={{
                justifyContent: 'flex-start',
                color: opt.days === 0 ? 'var(--red)' : 'var(--text)',
                borderColor: opt.days === 0 ? 'var(--red)' : 'var(--border2)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Keep as scheduled</button>
        </div>
      </div>
    </div>
  )
}

// ─── Full takeaways modal ─────────────────────────────────────────────────────

function TakeawaysModal({ item, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div className="modal-title" style={{ margin: 0 }}>{typeIcon(item.type)} {item.title}</div>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <span className="badge badge-blue" style={{ fontSize: 11 }}>{item.topic}</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{formatDuration(item.duration)} — {item.date}</span>
          {item.applied && <span className="badge badge-green" style={{ fontSize: 11 }}>✓ Applied</span>}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          All takeaways ({item.takeaways.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {item.takeaways.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, borderLeft: `3px solid ${topicColor(item.topic)}`, fontSize: 14, color: 'var(--text)' }}>
              <span style={{ color: topicColor(item.topic), flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Learning card ────────────────────────────────────────────────────────────

function LearningCard({ item, onEdit, onDelete, onReview, onCancelReview }) {
  const [expanded,      setExpanded]      = useState(false)
  const [showAllModal,  setShowAllModal]  = useState(false)
  const [showRecall,    setShowRecall]    = useState(false)
  const [showCancel,    setShowCancel]    = useState(false)
  const color        = topicColor(item.topic)
  const hasMoreThan2 = item.takeaways?.length > 2
  const daysLeft     = daysUntilReview(item.nextReviewDate)
  const isDue        = daysLeft !== null && daysLeft <= 0
  const isDueSoon    = daysLeft !== null && daysLeft > 0 && daysLeft <= 2
  const isFuture     = daysLeft !== null && daysLeft > 2
  const lastRecall   = item.lastRecallRating ? RECALL_LABELS[item.lastRecallRating] : null
  const reviewCount  = item.reviewHistory?.length || 0

  return (
    <>
      <div className="card" style={{ borderLeft: `3px solid ${isDue ? '#f59e0b' : color}`, background: isDue ? 'rgba(245,158,11,0.04)' : undefined }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 18 }}>{typeIcon(item.type)}</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{item.title}</span>
              {item.applied && <span className="badge badge-green" style={{ fontSize: 11 }}>✓ Applied</span>}
              {isDue && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>
                  🔁 Review due
                </span>
              )}
              {isDueSoon && !isDue && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 11, color: '#f59e0b' }}>
                  🔁 Due in {daysLeft}d
                </span>
              )}
              {isFuture && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: 'var(--bg3)', border: '1px solid var(--border2)', fontSize: 11, color: 'var(--text3)' }}>
                  🗓 Review in {daysLeft}d
                </span>
              )}
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: item.takeaways?.length ? 10 : 0 }}>
              <span className="badge" style={{ fontSize: 11, background: `${color}20`, color }}>{item.topic}</span>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{formatDuration(item.duration)}</span>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>·</span>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{item.date}</span>
              {reviewCount > 0 && (
                <>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>·</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>🔁 {reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
                  {lastRecall && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: lastRecall.color }}>· Last: {lastRecall.label}</span>
                  )}
                </>
              )}
            </div>

            {/* Takeaways */}
            {item.takeaways?.length > 0 && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {(expanded ? item.takeaways : item.takeaways.slice(0, 2)).map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text2)' }}>
                      <span style={{ color, flexShrink: 0 }}>💡</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
                {hasMoreThan2 && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', fontWeight: 600, padding: 0 }}>
                      {expanded ? '▲ Show less' : `▼ Show all ${item.takeaways.length} takeaways`}
                    </button>
                    {!expanded && (
                      <button onClick={() => setShowAllModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text3)', fontWeight: 600, padding: 0 }}>
                        ↗ Open full view
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm" title="Edit" onClick={onEdit}>✏️</button>
              <button className="btn btn-sm btn-danger" title="Delete" onClick={onDelete}>✕</button>
            </div>
            <button
              onClick={() => setShowRecall(true)}
              title="Do a recall check"
              style={{
                padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${isDue ? '#f59e0b' : 'var(--border2)'}`,
                background: isDue ? 'rgba(245,158,11,0.12)' : 'var(--bg3)',
                color: isDue ? '#f59e0b' : 'var(--text3)',
                whiteSpace: 'nowrap',
              }}
            >
              🔁 {isDue ? 'Review now' : 'Recall check'}
            </button>
            {/* Cancel / postpone — only shown if a review is scheduled */}
            {item.nextReviewDate && onCancelReview && (
              <button
                onClick={() => setShowCancel(true)}
                title="Postpone or cancel recall schedule"
                style={{
                  padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  border: '1px solid var(--border2)',
                  background: 'var(--bg3)',
                  color: 'var(--text3)',
                  whiteSpace: 'nowrap',
                }}
              >
                ⏭️ Manage schedule
              </button>
            )}
          </div>
        </div>
      </div>

      {showAllModal && <TakeawaysModal item={item} onClose={() => setShowAllModal(false)} />}
      {showRecall   && <RecallModal item={item} onClose={() => setShowRecall(false)} onSave={rating => onReview(item.id, rating)} />}
      {showCancel   && <CancelRecallModal item={item} onClose={() => setShowCancel(false)} onCancel={onCancelReview} />}
    </>
  )
}

// ─── Topic group ──────────────────────────────────────────────────────────────

function TopicGroup({ topic, items, onEdit, onDelete, onReview, onCancelReview }) {
  const [collapsed, setCollapsed] = useState(false)
  const color      = topicColor(topic)
  const totalHours = items.reduce((acc, i) => acc + (i.duration || 0), 0)
  const dueCount   = items.filter(i => {
    const d = daysUntilReview(i.nextReviewDate)
    return d !== null && d <= 0
  }).length

  return (
    <div style={{ marginBottom: 20 }}>
      <div onClick={() => setCollapsed(c => !c)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: collapsed ? 0 : 10, cursor: 'pointer', padding: '8px 0' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 14, color }}>{topic}</span>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{items.length} session{items.length !== 1 ? 's' : ''} · {formatDuration(totalHours)}</span>
        {dueCount > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginLeft: 4 }}>· {dueCount} due 🔁</span>}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{collapsed ? '▼' : '▲'}</span>
      </div>
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(item => (
            <LearningCard key={item.id} item={item}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
              onReview={onReview}
              onCancelReview={onCancelReview}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Due for review panel ─────────────────────────────────────────────────────

function ReviewTab({ dueItems, onReview, onEdit, onCancelReview }) {
  if (dueItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>All caught up</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>
          No reviews due today. Come back when something is scheduled.<br />
          Reviews are spaced based on how well you recalled each session.
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
          🔁 {dueItems.length} session{dueItems.length !== 1 ? 's' : ''} due for recall today
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
          Close your notes and try to recall what you learned. Rate your recall honestly — that's what drives the spacing. Not ready? Use "Manage schedule" on any card to postpone or remove it.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {dueItems.map(item => (
          <LearningCard
            key={item.id}
            item={item}
            onEdit={() => onEdit(item)}
            onDelete={() => {}}
            onReview={onReview}
            onCancelReview={onCancelReview}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Calendar history ─────────────────────────────────────────────────────────

function LearnHistory({ learnings, onEdit, onDelete, onReview, onCancelReview }) {
  const now = new Date()
  const [year,     setYear]     = useState(now.getFullYear())
  const [month,    setMonth]    = useState(now.getMonth())
  const [dayPopup, setDayPopup] = useState(null)

  const monthName   = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const blanks      = firstDay === 0 ? 6 : firstDay - 1
  const today       = formatDate()

  const byDay = useMemo(() => {
    const map = {}
    learnings.forEach(l => {
      if (!map[l.date]) map[l.date] = []
      map[l.date].push(l)
    })
    return map
  }, [learnings])

  if (!learnings.length) return (
    <div style={{ color: 'var(--text3)', fontSize: 13, padding: '16px 0' }}>No sessions yet.</div>
  )

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
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', fontWeight: 600, padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {Array(blanks).fill(null).map((_, i) => <div key={`b${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day      = i + 1
          const dateStr  = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const sessions = byDay[dateStr] || []
          const isToday  = dateStr === today
          const hasApplied = sessions.some(s => s.applied)
          const isSelected = dayPopup === dateStr
          return (
            <div key={day} onClick={() => sessions.length && setDayPopup(isSelected ? null : dateStr)} style={{ minHeight: 38, borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: sessions.length ? 'pointer' : 'default', background: isSelected ? 'var(--accent-glow)' : isToday ? 'var(--accent-glow)' : 'var(--bg3)', border: `1px solid ${isSelected || isToday ? 'var(--accent)' : 'transparent'}` }}>
              <span style={{ fontSize: 12, color: isToday || isSelected ? 'var(--accent)' : 'var(--text2)', fontWeight: isToday || isSelected ? 700 : 400 }}>{day}</span>
              {sessions.length > 0 && (
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                  {hasApplied && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {dayPopup && byDay[dayPopup] && (
        <div style={{ marginTop: 12, background: 'var(--bg2)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border2)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 10 }}>{dayPopup}</div>
          {byDay[dayPopup].map(item => (
            <div key={item.id} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg3)', borderLeft: `3px solid ${topicColor(item.topic)}`, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span>{typeIcon(item.type)}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</span>
                {item.applied && <span className="badge badge-green" style={{ fontSize: 10 }}>✓ Applied</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: item.takeaways?.length ? 8 : 0 }}>
                <span className="badge badge-blue" style={{ fontSize: 10 }}>{item.topic}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{formatDuration(item.duration)}</span>
                {item.reviewHistory?.length > 0 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>· {item.reviewHistory.length} recall{item.reviewHistory.length !== 1 ? 's' : ''}</span>}
              </div>
              {item.takeaways?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {item.takeaways.map((t, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 6 }}>
                      <span style={{ color: topicColor(item.topic) }}>💡</span><span>{t}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} /> Session logged
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} /> Applied
        </span>
      </div>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function LearnView({
  learnings, loading,
  addLearning, updateLearning, deleteLearning,
  recordReview, cancelReview,
  getWeekLearnings, getDueForReview, getWeekScore, getWeekReviewCount, getTopicBreakdown,
}) {
  const [showModal,   setShowModal]   = useState(false)
  const [editItem,    setEditItem]    = useState(null)
  const [innerTab,    setInnerTab]    = useState('week')
  const [sortBy,      setSortBy]      = useState('date')
  const [filterTopic, setFilterTopic] = useState('All')

  const weekItems  = getWeekLearnings()
  const weekScore  = getWeekScore()
  const weekHours  = weekItems.reduce((acc, l) => acc + (l.duration || 0), 0)
  const dueItems   = getDueForReview ? getDueForReview() : []
  const dueCount   = dueItems.length

  // Accurate count — uses reviewHistory entries this week only, not lastReviewDate
  const weekReviewCount = getWeekReviewCount ? getWeekReviewCount() : 0

  const allSessions = useMemo(() => {
    let items = [...learnings]
    if (filterTopic !== 'All') items = items.filter(i => i.topic === filterTopic)
    if (sortBy === 'date')  items.sort((a, b) => b.date.localeCompare(a.date))
    if (sortBy === 'hours') items.sort((a, b) => (b.duration || 0) - (a.duration || 0))
    if (sortBy === 'due')   items.sort((a, b) => {
      const da  = daysUntilReview(a.nextReviewDate) ?? 999
      const db2 = daysUntilReview(b.nextReviewDate) ?? 999
      return da - db2
    })
    return items
  }, [learnings, filterTopic, sortBy])

  const byTopic = useMemo(() => {
    const map = {}
    allSessions.forEach(item => {
      if (!map[item.topic]) map[item.topic] = []
      map[item.topic].push(item)
    })
    return map
  }, [allSessions])

  const existingTopics = [...new Set(learnings.map(l => l.topic))].sort()

  if (loading) return <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div className="fade-in">

      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">📚 Learning</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Spaced repetition + Active recall · Ultralearning · Naval Ravikant</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowModal(true) }}>+ Log session</button>
      </div>

      {/* Week stats */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: weekHours >= 7 ? 'var(--green)' : 'var(--amber)' }}>
            {formatDuration(weekHours)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Time this week</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Ideal: 7h/week</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: 'var(--blue)' }}>
            {weekItems.filter(l => l.takeaways?.length > 0).length}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Sessions with notes</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Ideal: every session</div>
        </div>
        <div className="card" style={{ textAlign: 'center', cursor: dueCount > 0 ? 'pointer' : 'default' }} onClick={() => dueCount > 0 && setInnerTab('review')}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: weekReviewCount > 0 ? 'var(--green)' : dueCount > 0 ? '#f59e0b' : 'var(--text3)' }}>
            {weekReviewCount}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Recalls this week</div>
          <div style={{ fontSize: 11, color: dueCount > 0 ? '#f59e0b' : 'var(--text3)', marginTop: 4, fontWeight: dueCount > 0 ? 700 : 400 }}>
            {dueCount > 0 ? `${dueCount} due now →` : 'Ideal: ≥3/week'}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: scoreColor(weekScore) }}>{weekScore}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Week score</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Ideal: 90/100</div>
        </div>
      </div>

      {/* Inner tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'week',     label: '📅 This Week' },
          { id: 'review',   label: `🔁 Review${dueCount > 0 ? ` (${dueCount})` : ''}` },
          { id: 'all',      label: '📚 All Sessions' },
          { id: 'calendar', label: '🗓️ Calendar' },
        ].map(t => (
          <button key={t.id} onClick={() => setInnerTab(t.id)} style={{
            padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: 'none', border: 'none',
            color: t.id === 'review' && dueCount > 0 && innerTab !== 'review'
              ? '#f59e0b'
              : innerTab === t.id ? 'var(--accent)' : 'var(--text3)',
            borderBottom: innerTab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── THIS WEEK ── */}
      {innerTab === 'week' && (
        <>
          {weekItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <h3>No sessions logged this week</h3>
              <p>Log your first learning session to start tracking growth</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {weekItems.map(item => (
                <LearningCard key={item.id} item={item}
                  onEdit={() => { setEditItem(item); setShowModal(true) }}
                  onDelete={() => deleteLearning(item.id)}
                  onReview={recordReview}
                  onCancelReview={cancelReview}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── REVIEW ── */}
      {innerTab === 'review' && (
        <ReviewTab
          dueItems={dueItems}
          onReview={recordReview}
          onEdit={item => { setEditItem(item); setShowModal(true) }}
          onCancelReview={cancelReview}
        />
      )}

      {/* ── ALL SESSIONS ── */}
      {innerTab === 'all' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['All', ...existingTopics].map(t => (
                <button key={t} onClick={() => setFilterTopic(t)} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${filterTopic === t ? topicColor(t) : 'var(--border2)'}`, background: filterTopic === t ? `${topicColor(t)}20` : 'var(--bg3)', color: filterTopic === t ? topicColor(t) : 'var(--text3)' }}>{t}</button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>Sort:</span>
              {[['date','Date'],['topic','Topic'],['hours','Duration'],['due','Review due']].map(([val, label]) => (
                <button key={val} onClick={() => setSortBy(val)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${sortBy === val ? 'var(--accent)' : 'var(--border)'}`, background: sortBy === val ? 'var(--accent-glow)' : 'transparent', color: sortBy === val ? 'var(--accent)' : 'var(--text3)' }}>{label}</button>
              ))}
            </div>
          </div>

          {allSessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <h3>No sessions yet</h3>
              <p>Log your first learning session above</p>
            </div>
          ) : sortBy === 'topic' ? (
            Object.entries(byTopic).sort((a, b) => b[1].length - a[1].length).map(([topic, items]) => (
              <TopicGroup key={topic} topic={topic} items={items}
                onEdit={item => { setEditItem(item); setShowModal(true) }}
                onDelete={deleteLearning}
                onReview={recordReview}
                onCancelReview={cancelReview}
              />
            ))
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allSessions.map(item => (
                <LearningCard key={item.id} item={item}
                  onEdit={() => { setEditItem(item); setShowModal(true) }}
                  onDelete={() => deleteLearning(item.id)}
                  onReview={recordReview}
                  onCancelReview={cancelReview}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── CALENDAR ── */}
      {innerTab === 'calendar' && (
        <LearnHistory learnings={learnings}
          onEdit={item => { setEditItem(item); setShowModal(true) }}
          onDelete={deleteLearning}
          onReview={recordReview}
          onCancelReview={cancelReview}
        />
      )}

      {showModal && (
        <LearningModal
          editItem={editItem}
          onClose={() => setShowModal(false)}
          onSave={data => editItem ? updateLearning(editItem.id, data) : addLearning(data)}
        />
      )}
    </div>
  )
}
