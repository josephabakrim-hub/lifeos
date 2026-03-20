import { useState, useMemo } from 'react'
import { formatDate } from '../lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────
// Based on: Dunbar's Layers (2012) + Granovetter's Strength of Weak Ties (1973)
// + Fringeships research (Fingerman et al., 2025) + Role-based social ties
//
// 7 tiers that cover the full spectrum of human social relationships:
// Inner Circle (5) → Close Friends (15) → Good Friends (50) → Acquaintances (150)
// + Family (biological/chosen) + Professional + Growing/New

const CATEGORIES = [
  {
    id:    'inner',
    label: 'Inner Circle',
    icon:  '💛',
    color: '#f59e0b',
    desc:  'Your 5 people. Deep, mutual, unconditional — Dunbar\'s support clique',
  },
  {
    id:    'close',
    label: 'Close Friends',
    icon:  '❤️',
    color: '#ec4899',
    desc:  'Meaningful friends you invest in regularly — Dunbar\'s sympathy group (~15)',
  },
  {
    id:    'good',
    label: 'Good Friends',
    icon:  '🙂',
    color: '#a855f7',
    desc:  'People you genuinely like and see often, but not deeply close',
  },
  {
    id:    'acquaintance',
    label: 'Acquaintances',
    icon:  '🌐',
    color: '#3b82f6',
    desc:  'Weak ties with real value — Granovetter: these bring you opportunities & new info',
  },
  {
    id:    'family',
    label: 'Family',
    icon:  '👨‍👩‍👧',
    color: '#14b8a6',
    desc:  'Biological or chosen family — unconditional by nature, not choice',
  },
  {
    id:    'professional',
    label: 'Professional',
    icon:  '💼',
    color: '#64748b',
    desc:  'Colleagues, mentors, collaborators — work & career ties',
  },
  {
    id:    'growing',
    label: 'Growing',
    icon:  '🌱',
    color: '#22c55e',
    desc:  'New connections or fringeships you want to invest in and deepen',
  },
]

const CAT_BY_ID    = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))
// Legacy support — old data used label strings as the category field
const CAT_ICONS    = Object.fromEntries(CATEGORIES.map(c => [c.id, c.icon]))
const CAT_COLORS   = Object.fromEntries(CATEGORIES.map(c => [c.id, c.color]))

function getCatInfo(catId) {
  // Handle legacy label-based ids gracefully
  return CAT_BY_ID[catId] || CATEGORIES.find(c => c.label === catId) || { id: catId, label: catId, icon: '👤', color: '#9898b0', desc: '' }
}

const REFLECTION_QUESTIONS = [
  { key: 'conversations',  label: 'How many real conversations did you have this week?',    placeholder: 'A number or a rough sense — 1, 3, many...' },
  { key: 'quality',        label: 'Quality of your social life this week — 1 to 5',          type: 'slider' },
  { key: 'connected',      label: 'Did you feel connected or isolated this week?',           placeholder: 'Be honest. Connected? Somewhat? Isolated?' },
  { key: 'neglected',      label: 'Who did you neglect that you should reach out to?',       placeholder: 'Name someone specific. Don\'t skip this one.' },
  { key: 'metNew',         label: 'Did you meet anyone new this week?',                      type: 'yesno' },
  { key: 'metNewNote',     label: 'If yes — who, and what was the context?',                 placeholder: 'Name, where you met, what you talked about...' },
  { key: 'doNext',         label: 'What will you do differently socially next week?',        placeholder: 'One specific action — not vague intention.' },
]

// ─── Modals ───────────────────────────────────────────────────────────────────

function PersonModal({ onClose, onSave, editPerson }) {
  const [name,     setName]     = useState(editPerson?.name     || '')
  const [category, setCategory] = useState(editPerson?.category || 'close')
  const [note,     setNote]     = useState(editPerson?.note     || '')

  function handleSave() {
    if (!name.trim()) return
    onSave({ name: name.trim(), category, note: note.trim() })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">{editPerson ? 'Edit person' : 'Add to My People'}</div>
        <div className="form-group">
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah" autoFocus />
        </div>
        <div className="form-group">
          <label>Category <span style={{ color: 'var(--text3)', fontWeight: 400 }}>— you can change this any time as the relationship evolves</span></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {CATEGORIES.map(cat => (
              <div key={cat.id} onClick={() => setCategory(cat.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', background: category === cat.id ? cat.color + '15' : 'var(--bg3)', border: `1px solid ${category === cat.id ? cat.color : 'var(--border2)'}` }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${category === cat.id ? cat.color : 'var(--border2)'}`, background: category === cat.id ? cat.color : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {category === cat.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <span style={{ fontSize: 16 }}>{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: category === cat.id ? 700 : 400, color: category === cat.id ? cat.color : 'var(--text)' }}>{cat.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{cat.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Note (optional)</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Met at trading conference, want to stay in touch" />
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{editPerson ? 'Update' : 'Add person'}</button>
        </div>
      </div>
    </div>
  )
}

function ReflectionModal({ onClose, onSave, existing, people }) {
  const init = existing || {}
  const [answers, setAnswers]       = useState({
    conversations: init.conversations || '',
    quality:       init.quality       || 3,
    connected:     init.connected     || '',
    neglected:     init.neglected     || '',
    metNew:        init.metNew        || false,
    metNewNote:    init.metNewNote    || '',
    doNext:        init.doNext        || '',
  })
  const [contactedIds, setContactedIds] = useState(init.contactedIds || [])

  function set(key, val) { setAnswers(a => ({ ...a, [key]: val })) }

  function toggleContact(id) {
    setContactedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])
  }

  function handleSave() {
    onSave({ ...answers, contactedIds })
    onClose()
  }

  const QUALITY_LABELS = { 1: '😞 Very poor', 2: '😐 Poor', 3: '🙂 Okay', 4: '😊 Good', 5: '🌟 Great' }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">📋 Weekly Social Reflection</div>

        {/* Who did you connect with this week */}
        <div className="form-group">
          <label>Who did you connect with this week?</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {people.length === 0 && <div style={{ fontSize: 13, color: 'var(--text3)' }}>No people added yet — add them in My People first.</div>}
            {people.map(p => {
              const checked = contactedIds.includes(p.id)
              return (
                <div key={p.id} onClick={() => toggleContact(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', background: checked ? getCatInfo(p.category).color + '18' : 'var(--bg3)', border: `1px solid ${checked ? getCatInfo(p.category).color : 'var(--border2)'}` }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? getCatInfo(p.category).color : 'var(--border2)'}`, background: checked ? getCatInfo(p.category).color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {checked && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 15 }}>{getCatInfo(p.category).icon}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>{p.category}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Structured questions */}
        {REFLECTION_QUESTIONS.map(q => {
          if (q.key === 'metNewNote' && !answers.metNew) return null
          return (
            <div key={q.key} className="form-group">
              <label>{q.label}</label>
              {q.type === 'slider' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>1 = very poor</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#ec4899' }}>{QUALITY_LABELS[answers.quality]}</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>5 = great</span>
                  </div>
                  <input type="range" min={1} max={5} step={1} value={answers.quality} onChange={e => set('quality', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#ec4899' }} />
                </div>
              ) : q.type === 'yesno' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Yes', 'No'].map(opt => {
                    const active = (opt === 'Yes') === answers.metNew
                    return (
                      <button key={opt} onClick={() => set('metNew', opt === 'Yes')} style={{
                        flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        border: `2px solid ${active ? (opt === 'Yes' ? 'var(--green)' : 'var(--red)') : 'var(--border2)'}`,
                        background: active ? (opt === 'Yes' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)') : 'var(--bg3)',
                        color: active ? (opt === 'Yes' ? 'var(--green)' : 'var(--red)') : 'var(--text3)',
                      }}>{opt}</button>
                    )
                  })}
                </div>
              ) : (
                <textarea value={answers[q.key]} onChange={e => set(q.key, e.target.value)} placeholder={q.placeholder} rows={2} style={{ resize: 'vertical', fontSize: 13 }} />
              )}
            </div>
          )
        })}

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save reflection</button>
        </div>
      </div>
    </div>
  )
}

// ─── My People section ────────────────────────────────────────────────────────

function MyPeople({ people, addPerson, updatePerson, deletePerson, archivePerson, unarchivePerson, markContacted }) {
  const [showModal,    setShowModal]    = useState(false)
  const [editPerson,   setEditPerson]   = useState(null)
  const [openCats,     setOpenCats]     = useState(() => {
    // Start with all non-empty categories open
    const set = new Set(['inner', 'close', 'family'])
    return set
  })
  const [movingId,     setMovingId]     = useState(null) // person id being moved

  const today = formatDate()

  function daysSince(dateStr) {
    if (!dateStr) return 999
    return Math.floor((new Date(today) - new Date(dateStr)) / 86400000)
  }

  function urgencyColor(dateStr) {
    const days = daysSince(dateStr)
    if (days >= 30) return 'var(--red)'
    if (days >= 7)  return 'var(--amber)'
    return 'var(--green)'
  }

  function toggleCat(id) {
    setOpenCats(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const activePeople   = people.filter(p => !p.archived)
  const archivedPeople = people.filter(p => p.archived)

  const byCategory = useMemo(() => {
    const map = {}
    CATEGORIES.forEach(cat => { map[cat.id] = activePeople.filter(p => (p.category === cat.id || p.category === cat.label)) })
    return map
  }, [activePeople])

  function MoveDropdown({ person }) {
    if (movingId !== person.id) return (
      <button className="btn btn-sm" title="Move to another category" style={{ fontSize: 11 }} onClick={() => setMovingId(person.id)}>↕️</button>
    )
    return (
      <select
        autoFocus
        defaultValue=""
        style={{ fontSize: 12, padding: '3px 6px', borderRadius: 6, background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)' }}
        onChange={e => {
          if (e.target.value) updatePerson(person.id, { category: e.target.value })
          setMovingId(null)
        }}
        onBlur={() => setMovingId(null)}
      >
        <option value="">Move to…</option>
        {CATEGORIES.filter(c => c.id !== (person.category || 'close') && c.id !== person.category).map(c => (
          <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
        ))}
      </select>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>👥 My People</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            Dunbar's layers + Granovetter's weak ties + Fringeships research
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditPerson(null); setShowModal(true) }}>+ Add person</button>
      </div>

      {activePeople.length === 0 && archivedPeople.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>Your people list is empty</h3>
          <p>Add the people who matter across all layers of your social life</p>
        </div>
      ) : (
        <>
          {/* Active people — accordion by category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CATEGORIES.map(cat => {
              const catPeople = byCategory[cat.id] || []
              const isOpen    = openCats.has(cat.id)
              if (catPeople.length === 0) return null

              return (
                <div key={cat.id} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${isOpen ? cat.color + '40' : 'var(--border)'}` }}>
                  {/* Category header — always visible, tap to expand */}
                  <div
                    onClick={() => toggleCat(cat.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer', background: isOpen ? cat.color + '10' : 'var(--bg3)', transition: 'background 0.15s' }}
                  >
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: cat.color }}>{cat.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{cat.desc}</div>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{catPeople.length}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>

                  {/* People list — only shown when open */}
                  {isOpen && (
                    <div style={{ background: 'var(--bg2)', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {catPeople.map(p => {
                        const days  = daysSince(p.lastContacted)
                        const color = urgencyColor(p.lastContacted)
                        return (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--bg3)', borderLeft: `3px solid ${cat.color}` }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                              {p.note && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{p.note}</div>}
                              <div style={{ fontSize: 12, color, marginTop: 3, fontWeight: 600 }}>
                                {p.lastContacted
                                  ? days === 0 ? '✓ Contacted today' : `Last contact: ${days}d ago`
                                  : 'Never contacted'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
                              <button className="btn btn-sm" style={{ color: 'var(--green)', borderColor: 'var(--green)' }} title="Mark as contacted today" onClick={() => markContacted(p.id)}>📞</button>
                              <MoveDropdown person={p} />
                              <button className="btn btn-sm" title="Edit" onClick={() => { setEditPerson(p); setShowModal(true) }}>✏️</button>
                              <button className="btn btn-sm" title="Archive" style={{ color: 'var(--amber)', borderColor: 'var(--amber)' }} onClick={() => archivePerson(p.id)}>📦</button>
                              <button className="btn btn-sm btn-danger" title="Delete" onClick={() => deletePerson(p.id)}>✕</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Archived people */}
          {archivedPeople.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>📦 Archived people</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {archivedPeople.map(p => {
                  const cat = getCatInfo(p.category)
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--bg3)', borderLeft: `3px solid ${cat.color}`, opacity: 0.7 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{cat.icon} {cat.label}{p.note ? ` · ${p.note}` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        <button className="btn btn-sm" title="Edit" onClick={() => { setEditPerson(p); setShowModal(true) }}>✏️</button>
                        <button className="btn btn-sm" title="Unarchive" style={{ color: 'var(--green)', borderColor: 'var(--green)' }} onClick={() => unarchivePerson(p.id)}>♻️</button>
                        <button className="btn btn-sm btn-danger" title="Delete permanently" onClick={() => deletePerson(p.id)}>✕</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <PersonModal
          editPerson={editPerson}
          onClose={() => { setShowModal(false); setEditPerson(null) }}
          onSave={data => editPerson ? updatePerson(editPerson.id, data) : addPerson(data)}
        />
      )}
    </div>
  )
}

// ─── Weekly reflection section ────────────────────────────────────────────────

function WeeklyReflection({ currentLog, people, saveLog, deleteLog, getWeekScore }) {
  const [showModal, setShowModal] = useState(false)
  const score = getWeekScore()

  const contactedPeople = (currentLog?.contactedIds || [])
    .map(id => people.find(p => p.id === id))
    .filter(Boolean)

  const QUALITY_LABELS = { 1: '😞', 2: '😐', 3: '🙂', 4: '😊', 5: '🌟' }

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>📋 Weekly Reflection</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Once a week — honest check-in on your social life</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Social score</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)' }}>{score}</div>
          </div>
          <button className="btn btn-primary" style={{ background: '#ec4899', borderColor: '#ec4899' }} onClick={() => setShowModal(true)}>
            {currentLog ? '✏️ Edit reflection' : '📝 Log this week'}
          </button>
          {currentLog && (
            <button className="btn btn-sm btn-danger" title="Delete this week's reflection" onClick={() => deleteLog(currentLog.id)}>✕</button>
          )}
        </div>
      </div>

      {currentLog ? (
        <div className="card" style={{ borderTop: '3px solid #ec4899' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#ec4899' }}>
                {QUALITY_LABELS[currentLog.quality] || '—'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Quality {currentLog.quality}/5</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#a855f7' }}>
                {contactedPeople.length}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>People connected</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: currentLog.metNew ? 'var(--green)' : 'var(--text3)' }}>
                {currentLog.metNew ? '✓' : '—'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Met someone new</div>
            </div>
          </div>

          {contactedPeople.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Connected with</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {contactedPeople.map(p => (
                  <span key={p.id} style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: getCatInfo(p.category).color + '20', color: getCatInfo(p.category).color }}>
                    {getCatInfo(p.category).icon} {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {[
            { key: 'connected',  label: 'Connected / isolated?' },
            { key: 'neglected',  label: 'Neglected?' },
            { key: 'doNext',     label: 'Next week?' },
          ].map(({ key, label }) => currentLog[key] ? (
            <div key={key} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 3 }}>{label}</div>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{currentLog[key]}</p>
            </div>
          ) : null)}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 32, borderTop: '3px solid #ec4899' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No reflection this week yet</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Takes 3 minutes. The honest check-in that makes the pattern visible.</div>
        </div>
      )}

      {showModal && (
        <ReflectionModal
          existing={currentLog}
          people={people}
          onClose={() => setShowModal(false)}
          onSave={saveLog}
        />
      )}
    </div>
  )
}

// ─── History calendar ─────────────────────────────────────────────────────────

function SocialCalendar({ logs, people, saveLog, deleteLog }) {
  const now = new Date()
  const [year,      setYear]      = useState(now.getFullYear())
  const [month,     setMonth]     = useState(now.getMonth())
  const [dayPopup,  setDayPopup]  = useState(null)
  const [editLog,   setEditLog]   = useState(null) // log to edit via ReflectionModal

  const monthName   = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const blanks      = firstDay === 0 ? 6 : firstDay - 1

  function weekStartFor(dateStr) {
    const d = new Date(dateStr)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  }

  const logByWeekStart = useMemo(() => {
    const map = {}
    logs.forEach(l => { map[l.weekStart] = l })
    return map
  }, [logs])

  const peopleMap = useMemo(() => {
    const m = {}
    people.forEach(p => { m[p.id] = p })
    return m
  }, [people])

  const QUALITY_LABELS = { 1: '😞 Very poor', 2: '😐 Poor', 3: '🙂 Okay', 4: '😊 Good', 5: '🌟 Great' }

  // Save an edited historical log back to its specific doc
  async function handleEditSave(data) {
    if (!editLog) return
    const { doc, updateDoc } = await import('firebase/firestore')
    const { db } = await import('../lib/firebase')
    await updateDoc(doc(db, 'lo_social_logs', editLog.id), {
      ...data,
      updatedAt: new Date().toISOString(),
    })
    setEditLog(null)
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      {/* Header */}
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
          const day      = i + 1
          const dateStr  = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const ws       = weekStartFor(dateStr)
          const log      = logByWeekStart[ws]
          const isToday  = dateStr === formatDate()
          const isActive = dayPopup && weekStartFor(dayPopup) === ws
          const dotColor = log
            ? (log.quality >= 4 ? 'var(--green)' : log.quality >= 3 ? 'var(--amber)' : 'var(--red)')
            : null
          return (
            <div
              key={day}
              onClick={() => log && setDayPopup(dayPopup === dateStr ? null : dateStr)}
              style={{
                minHeight: 38, borderRadius: 6, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                cursor: log ? 'pointer' : 'default',
                background: isActive ? 'rgba(236,72,153,0.12)' : isToday ? 'var(--bg4)' : 'var(--bg3)',
                border: `1px solid ${isActive ? '#ec4899' : isToday ? 'var(--border2)' : 'transparent'}`,
              }}
            >
              <span style={{ fontSize: 12, color: isToday ? 'var(--text)' : 'var(--text2)', fontWeight: isToday ? 700 : 400 }}>{day}</span>
              {dotColor && <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, marginTop: 2 }} />}
            </div>
          )
        })}
      </div>

      {/* Popup — full reflection with edit + delete */}
      {dayPopup && (() => {
        const ws  = weekStartFor(dayPopup)
        const log = logByWeekStart[ws]
        if (!log) return null
        const contactedPeople = (log.contactedIds || []).map(id => peopleMap[id]).filter(Boolean)
        return (
          <div style={{ marginTop: 12, background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border2)', overflow: 'hidden' }}>
            {/* Popup header */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
                Week of {new Date(ws).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm" title="Edit this reflection" onClick={() => setEditLog(log)}>✏️ Edit</button>
                <button className="btn btn-sm btn-danger" title="Delete this reflection" onClick={() => { deleteLog(log.id); setDayPopup(null) }}>✕ Delete</button>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
              {log.quality && (
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>Quality</div>
                  <strong style={{ color: '#ec4899' }}>{QUALITY_LABELS[log.quality]}</strong>
                </div>
              )}
              {log.conversations && (
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>Conversations</div>
                  <strong>{log.conversations}</strong>
                </div>
              )}
              <div>
                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>Met someone new</div>
                <strong style={{ color: log.metNew ? 'var(--green)' : 'var(--text3)' }}>{log.metNew ? '✓ Yes' : '— No'}</strong>
              </div>
            </div>

            {/* Connected with */}
            {contactedPeople.length > 0 && (
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Connected with</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {contactedPeople.map(p => (
                    <span key={p.id} style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: getCatInfo(p.category).color + '20', color: getCatInfo(p.category).color }}>
                      {getCatInfo(p.category).icon} {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reflection answers */}
            {[
              { key: 'connected',  label: 'Connected / isolated?' },
              { key: 'neglected',  label: 'Who did you neglect?' },
              { key: 'metNewNote', label: 'Who did you meet?' },
              { key: 'doNext',     label: 'Next week commitment' },
            ].filter(({ key }) => log[key]).map(({ key, label }) => (
              <div key={key} style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 3 }}>{label}</div>
                <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0, lineHeight: 1.5 }}>{log[key]}</p>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>
        {[['var(--green)','Quality 4–5'],['var(--amber)','Quality 3'],['var(--red)','Quality 1–2']].map(([c, l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />{l}
          </span>
        ))}
      </div>

      {/* Edit modal for historical reflections */}
      {editLog && (
        <ReflectionModal
          existing={editLog}
          people={people}
          onClose={() => setEditLog(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  )
}

// ─── Insights section ─────────────────────────────────────────────────────────

function Insights({ insights, people }) {
  if (!people.length) return null
  const { neglected7, neglected30, mostNeglectedCat } = insights

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>💡 Insights</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        {neglected30.length > 0 && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 6 }}>
              🔴 {neglected30.length} {neglected30.length === 1 ? 'person' : 'people'} not contacted in 30+ days
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {neglected30.map(p => (
                <span key={p.id} style={{ padding: '2px 8px', borderRadius: 10, fontSize: 12, background: getCatInfo(p.category).color + '20', color: getCatInfo(p.category).color, fontWeight: 600 }}>
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {neglected7.length > 0 && neglected7.length !== neglected30.length && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)', marginBottom: 6 }}>
              🟡 {neglected7.length} {neglected7.length === 1 ? 'person' : 'people'} not contacted in 7+ days
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {neglected7.filter(p => !neglected30.find(n => n.id === p.id)).map(p => (
                <span key={p.id} style={{ padding: '2px 8px', borderRadius: 10, fontSize: 12, background: getCatInfo(p.category).color + '20', color: getCatInfo(p.category).color, fontWeight: 600 }}>
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {mostNeglectedCat && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border2)' }}>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              <span style={{ fontSize: 16, marginRight: 8 }}>{getCatInfo(mostNeglectedCat).icon}</span>
              Most neglected category: <strong style={{ color: getCatInfo(mostNeglectedCat).color }}>{mostNeglectedCat}</strong>
            </div>
          </div>
        )}

        {neglected7.length === 0 && neglected30.length === 0 && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
            ✓ You're keeping up with everyone. Well done.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Ideal Joseph sub-section ─────────────────────────────────────────────────

function IdealSection({ people, currentLog, getWeekScore }) {
  const score = getWeekScore()

  const contactedIds  = currentLog?.contactedIds || []
  const catsContacted = new Set(contactedIds.map(id => people.find(p => p.id === id)?.category).filter(Boolean))

  const benchmarks = [
    { label: 'Weekly reflection done',       ideal: 'Every week', yours: currentLog ? '✓ Done' : '✗ Not yet', met: !!currentLog },
    { label: 'Quality rating',               ideal: '4/5',         yours: currentLog?.quality ? `${currentLog.quality}/5` : '—', met: (currentLog?.quality || 0) >= 4 },
    { label: 'People contacted',             ideal: '1 per category', yours: `${catsContacted.size}/4 categories`, met: catsContacted.size >= 4 },
    { label: 'Met someone new',              ideal: 'Weekly',      yours: currentLog?.metNew ? '✓ Yes' : '— No', met: !!currentLog?.metNew },
    { label: 'Inner circle (no 7d gap)',     ideal: 'Always warm', yours: people.filter(p => p.category === 'Close friends').filter(p => { const d = new Date(); d.setDate(d.getDate()-7); return (p.lastContacted || '1970') >= formatDate(d) }).length + '/' + people.filter(p => p.category === 'Close friends').length + ' up to date', met: people.filter(p => p.category === 'Close friends' && (!p.lastContacted || new Date() - new Date(p.lastContacted) > 7*86400000)).length === 0 },
  ]

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>👤 Ideal Joseph</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>Dunbar's Number + Never Eat Alone + Give and Take</div>

      <div className="card" style={{ marginBottom: 14, padding: '16px 20px', background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.2)' }}>
        <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Social Score target</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 800, color: '#fbbf24', lineHeight: 1 }}>85</div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Ideal Joseph benchmark</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: score >= 80 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)' }}>Your score: {score}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {benchmarks.map(({ label, ideal, yours, met }) => (
          <div key={label} className="card" style={{ padding: '12px 16px', borderLeft: `3px solid ${met ? 'var(--green)' : 'var(--amber)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: met ? 'var(--green)' : 'var(--amber)', fontWeight: 600 }}>{yours}</span>
                <span style={{ fontSize: 12, color: '#fbbf24' }}>Ideal: {ideal}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border2)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
        <strong style={{ color: 'var(--text)' }}>The 5-Minute Rule</strong> — A relationship only needs 5 minutes of genuine attention to stay warm. A text, a voice note, a quick call. The barrier is never time — it's intention. <em>(Never Eat Alone — Keith Ferrazzi)</em>
      </div>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function SocialView({ people, logs, loading, addPerson, updatePerson, deletePerson, archivePerson, unarchivePerson, markContacted, getCurrentLog, saveLog, deleteLog, getWeekScore, getInsights }) {
  const [subTab, setSubTab] = useState('people')
  const [showHistory, setShowHistory] = useState(false)

  const currentLog = getCurrentLog()
  const insights   = getInsights()
  const score      = getWeekScore()

  if (loading) return <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">❤️ Social</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Dunbar's layers + Granovetter's weak ties + Fringeships (Fingerman et al.)</div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)' }}>
          {score}<span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}> /100</span>
        </div>
      </div>

      {/* Sub-tab pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[
          { id: 'people',     label: '👥 My People' },
          { id: 'reflection', label: '📋 Weekly' },
          { id: 'ideal',      label: '👤 Ideal Joseph' },
        ].map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} style={{
            padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: subTab === t.id ? '#ec4899' : 'var(--bg3)',
            border: `1px solid ${subTab === t.id ? '#ec4899' : 'var(--border2)'}`,
            color: subTab === t.id ? '#fff' : 'var(--text3)',
          }}>{t.label}</button>
        ))}
      </div>

      {subTab === 'people' && (
        <>
          <Insights insights={insights} people={people.filter(p => !p.archived)} />
          <div style={{ marginTop: insights.neglected7.length || insights.neglected30.length ? 24 : 0 }}>
            <MyPeople
              people={people}
              addPerson={addPerson}
              updatePerson={updatePerson}
              deletePerson={deletePerson}
              archivePerson={archivePerson}
              unarchivePerson={unarchivePerson}
              markContacted={markContacted}
            />
          </div>
        </>
      )}

      {subTab === 'reflection' && (
        <>
          <WeeklyReflection
            currentLog={currentLog}
            people={people.filter(p => !p.archived)}
            saveLog={saveLog}
            deleteLog={deleteLog}
            getWeekScore={getWeekScore}
          />
          {/* History toggle */}
          <div style={{ marginTop: 28 }}>
            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'center', marginBottom: showHistory ? 16 : 0 }}
              onClick={() => setShowHistory(h => !h)}
            >
              {showHistory ? '▲ Hide history' : '▼ Show history (calendar)'}
            </button>
            {showHistory && <SocialCalendar logs={logs} people={people} saveLog={saveLog} deleteLog={deleteLog} />}
          </div>
        </>
      )}

      {subTab === 'ideal' && (
        <IdealSection people={people.filter(p => !p.archived)} currentLog={currentLog} getWeekScore={getWeekScore} />
      )}
    </div>
  )
}
