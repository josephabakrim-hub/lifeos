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

function typeIcon(value) {
  return TYPES.find(t => t.value === value)?.label?.split(' ')[0] || '📝'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekStartFor(dateStr) {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function LearningModal({ onClose, onSave, editItem }) {
  const [title,     setTitle]     = useState(editItem?.title    || '')
  const [type,      setType]      = useState(editItem?.type     || 'book')
  const [topic,     setTopic]     = useState(editItem?.topic    || 'Trading')
  const [duration,  setDuration]  = useState(editItem?.duration || '')
  const [takeaways, setTakeaways] = useState(editItem?.takeaways?.join('\n') || '')
  const [applied,   setApplied]   = useState(editItem?.applied  || false)
  const [date,      setDate]      = useState(editItem?.date     || formatDate())

  function handleSave() {
    if (!title.trim()) return
    onSave({
      title: title.trim(), type, topic,
      duration: parseFloat(duration) || 0,
      takeaways: takeaways.split('\n').filter(t => t.trim()),
      applied, date,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{editItem ? 'Edit learning' : 'Log learning session'}</div>
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
        <div className="form-row">
          <div className="form-group">
            <label>Duration (hours)</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="1.0" step="0.25" min="0.25" />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Key takeaways (one per line)</label>
          <textarea value={takeaways} onChange={e => setTakeaways(e.target.value)} rows={3} placeholder="What did you learn? What will you apply?" style={{ resize: 'vertical' }} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
          <div className={`checkbox ${applied ? 'checked' : ''}`} onClick={() => setApplied(!applied)}>
            {applied ? '✓' : ''}
          </div>
          I applied or taught this concept (Feynman method ✓)
        </label>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ─── Learning card ────────────────────────────────────────────────────────────

function LearningCard({ item, onEdit, onDelete }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span>{typeIcon(item.type)}</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</span>
            {item.applied && <span className="badge badge-green" style={{ fontSize: 11 }}>✓ Applied</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: item.takeaways?.length ? 6 : 0 }}>
            <span className="badge badge-blue" style={{ fontSize: 11 }}>{item.topic}</span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{item.duration}h — {item.date}</span>
          </div>
          {item.takeaways?.length > 0 && (
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              {item.takeaways.slice(0, 2).map((t, i) => (
                <div key={i} style={{ marginBottom: 2 }}>💡 {t}</div>
              ))}
              {item.takeaways.length > 2 && <div style={{ color: 'var(--text3)' }}>+{item.takeaways.length - 2} more takeaways</div>}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button className="btn btn-sm" title="Edit" onClick={onEdit}>✏️</button>
          <button className="btn btn-sm btn-danger" title="Delete" onClick={onDelete}>✕</button>
        </div>
      </div>
    </div>
  )
}

// ─── History ──────────────────────────────────────────────────────────────────

function LearnHistory({ learnings }) {
  const now = new Date()
  const [year,     setYear]     = useState(now.getFullYear())
  const [month,    setMonth]    = useState(now.getMonth())
  const [dayPopup, setDayPopup] = useState(null)

  const monthName  = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstDay   = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const blanks     = firstDay === 0 ? 6 : firstDay - 1

  // Map dateStr -> sessions[]
  const byDay = useMemo(() => {
    const map = {}
    learnings.forEach(l => {
      if (!map[l.date]) map[l.date] = []
      map[l.date].push(l)
    })
    return map
  }, [learnings])

  if (!learnings.length) {
    return <div style={{ color: 'var(--text3)', fontSize: 13, padding: '16px 0' }}>No past learning sessions yet.</div>
  }

  return (
    <div className="card">
      {/* Calendar header */}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {Array(blanks).fill(null).map((_, i) => <div key={`b${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day     = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const sessions = byDay[dateStr] || []
          const isToday  = dateStr === formatDate()
          const hasApplied = sessions.some(l => l.applied)
          return (
            <div
              key={day}
              onClick={() => sessions.length && setDayPopup(dayPopup === dateStr ? null : dateStr)}
              style={{
                minHeight: 38, borderRadius: 6, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                cursor: sessions.length ? 'pointer' : 'default',
                background: isToday ? 'var(--accent-glow)' : 'var(--bg3)',
                border: `1px solid ${isToday ? 'var(--accent)' : 'transparent'}`,
              }}
            >
              <span style={{ fontSize: 12, color: isToday ? 'var(--accent)' : 'var(--text2)', fontWeight: isToday ? 700 : 400 }}>{day}</span>
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

      {/* Day popup */}
      {dayPopup && byDay[dayPopup] && (
        <div style={{ marginTop: 12, background: 'var(--bg2)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border2)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 10 }}>{dayPopup}</div>
          {byDay[dayPopup].map(item => (
            <div key={item.id} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg3)', borderLeft: '3px solid var(--accent)', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span>{typeIcon(item.type)}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</span>
                {item.applied && <span className="badge badge-green" style={{ fontSize: 10 }}>✓ Applied</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: item.takeaways?.length ? 5 : 0 }}>
                <span className="badge badge-blue" style={{ fontSize: 10 }}>{item.topic}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{item.duration}h</span>
              </div>
              {item.takeaways?.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {item.takeaways.slice(0, 2).map((t, i) => <div key={i}>💡 {t}</div>)}
                  {item.takeaways.length > 2 && <div style={{ color: 'var(--text3)' }}>+{item.takeaways.length - 2} more</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} /> Session logged
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} /> Applied / taught
        </span>
      </div>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function LearnView({ learnings, loading, addLearning, updateLearning, deleteLearning, getWeekLearnings, getWeekScore, getTopicBreakdown }) {
  const [showModal,    setShowModal]    = useState(false)
  const [editItem,     setEditItem]     = useState(null)
  const [showHistory,  setShowHistory]  = useState(false)

  const weekItems      = getWeekLearnings()
  const weekScore      = getWeekScore()
  const weekHours      = weekItems.reduce((acc, l) => acc + (l.duration || 0), 0)
  const topicBreakdown = getTopicBreakdown()

  if (loading) return <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div className="fade-in">

      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">📚 Learning</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Based on Ultralearning + Naval Ravikant</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowModal(true) }}>+ Log session</button>
      </div>

      {/* Week stats */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: weekHours >= 7 ? 'var(--green)' : 'var(--amber)' }}>
            {weekHours.toFixed(1)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Hours this week</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Ideal: 7 hrs/week</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: 'var(--blue)' }}>
            {weekItems.filter(l => l.takeaways?.length > 0).length}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Sessions with notes</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Ideal: every session</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: weekItems.some(l => l.applied) ? 'var(--green)' : 'var(--text3)' }}>
            {weekItems.filter(l => l.applied).length}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Applied / taught</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Feynman method</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: scoreColor(weekScore) }}>{weekScore}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Week score</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Ideal: 90/100</div>
        </div>
      </div>

      {/* Topic breakdown */}
      {Object.keys(topicBreakdown).length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Topic breakdown (all time)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(topicBreakdown).sort((a, b) => b[1] - a[1]).map(([topic, count]) => (
              <span key={topic} className="badge badge-purple" style={{ fontSize: 12, padding: '4px 10px' }}>
                {topic} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* This week's sessions */}
      <div className="section-title" style={{ marginBottom: 12, fontSize: 15 }}>This week's sessions</div>
      {weekItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No sessions logged this week</h3>
          <p>Log your first learning session to start tracking growth</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {weekItems.map(item => (
            <LearningCard
              key={item.id}
              item={item}
              onEdit={() => { setEditItem(item); setShowModal(true) }}
              onDelete={() => deleteLearning(item.id)}
            />
          ))}
        </div>
      )}

      {/* History toggle */}
      <div style={{ marginTop: 8 }}>
        <button
          className="btn"
          style={{ width: '100%', justifyContent: 'center', marginBottom: showHistory ? 16 : 0 }}
          onClick={() => setShowHistory(h => !h)}
        >
          {showHistory ? '▲ Hide history' : '▼ Show history (last 12 weeks)'}
        </button>

        {showHistory && <LearnHistory learnings={learnings} />}
      </div>

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
