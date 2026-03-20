import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatDate } from '../lib/utils'
import { IDEAL_WEEKLY_BENCHMARKS, PILLAR_WEIGHTS } from '../lib/idealJoseph'

// ─── Static data ──────────────────────────────────────────────────────────────

const MOOD_LABELS  = { 1: '😔 Low', 2: '😐 Okay', 3: '🙂 Good', 4: '😊 Great', 5: '🌟 Peak' }
const STRESS_LABELS = { 1: '😌 Calm', 2: '🟢 Mild', 3: '🟡 Moderate', 4: '🟠 High', 5: '🔴 Very high' }
const CLARITY_LABELS = { 1: '🌫️ Foggy', 2: '😶 Hazy', 3: '🙂 Clear', 4: '🎯 Sharp', 5: '⚡ Razor sharp' }

const STRESS_TRIGGERS = [
  'Trading loss or mistake', 'Overtrading / broke my plan', 'Financial pressure',
  'Work overload', 'Poor sleep', 'Conflict with someone',
  'Uncertainty / fear of the future', 'Physical discomfort or illness',
  'Social comparison', 'Feeling behind on goals',
]
const EMOTIONAL_STATES = [
  'Anxiety / worry', 'Frustration / irritability', 'Low motivation / apathy',
  'Restlessness / can\'t focus', 'Sadness / low mood', 'Overwhelm',
  'Self-doubt', 'Anger', 'Loneliness', 'Guilt or shame',
]
const RESPONSES = [
  'Breathed through it', 'Took a break / stepped away', 'Talked to someone',
  'Journaled it', 'Ignored it / pushed through', 'Meditated',
  'Exercised', 'Did nothing — let it pass', 'Reframed the thought',
  'Made a plan to address it',
]

const IDEAL = IDEAL_WEEKLY_BENCHMARKS.mental

// ─── Shared sub-components ────────────────────────────────────────────────────

function SliderInput({ label, value, onChange, labels, color = 'var(--accent)' }) {
  return (
    <div className="form-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label style={{ marginBottom: 0 }}>{label}</label>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{labels[value]}</span>
      </div>
      <input
        type="range" min={1} max={5} step={1} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{ width: '100%', accentColor: color }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
        <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
      </div>
    </div>
  )
}

function ScoreDot({ value, max = 5, color }) {
  const pct = (value / max) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 24 }}>{value}/5</span>
    </div>
  )
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function MorningModal({ onClose, onSave, existing }) {
  const [mood,      setMood]      = useState(existing?.mood      || 3)
  const [energy,    setEnergy]    = useState(existing?.energy    || 3)
  const [intention, setIntention] = useState(existing?.intention || '')
  const [g1, setG1] = useState(existing?.gratitude?.[0] || '')
  const [g2, setG2] = useState(existing?.gratitude?.[1] || '')
  const [g3, setG3] = useState(existing?.gratitude?.[2] || '')
  const [breathing, setBreathing] = useState(existing?.breathing || false)

  function handleSave() {
    onSave({ mood, energy, intention, gratitude: [g1, g2, g3].filter(g => g.trim()), breathing })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">🌅 Morning Intention</div>

        <SliderInput label="Mood" value={mood} onChange={setMood} labels={MOOD_LABELS} color="#f59e0b" />
        <SliderInput label="Energy" value={energy} onChange={setEnergy} labels={MOOD_LABELS} color="#22c55e" />

        <div className="form-group">
          <label>Today's intention</label>
          <input value={intention} onChange={e => setIntention(e.target.value)} placeholder="I intend to stay patient and not force trades today..." />
        </div>

        <div className="form-group">
          <label>Gratitude — 3 things</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[[g1, setG1], [g2, setG2], [g3, setG3]].map(([val, set], i) => (
              <input key={i} value={val} onChange={e => set(e.target.value)} placeholder={`I'm grateful for... ${i + 1}`} />
            ))}
          </div>
        </div>

        <div
          onClick={() => setBreathing(!breathing)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: breathing ? 'rgba(34,197,94,0.1)' : 'var(--bg3)', border: `1px solid ${breathing ? 'var(--green)' : 'var(--border2)'}`, marginBottom: 16 }}
        >
          <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${breathing ? 'var(--green)' : 'var(--border2)'}`, background: breathing ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {breathing && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>🫁 Morning breathing / physiological sigh done</span>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save morning</button>
        </div>
      </div>
    </div>
  )
}

function EveningModal({ onClose, onSave, existing, morningIntention }) {
  const [mood,       setMood]       = useState(existing?.mood       || 3)
  const [stress,     setStress]     = useState(existing?.stress     || 2)
  const [clarity,    setClarity]    = useState(existing?.clarity    || 3)
  const [intentKept, setIntentKept] = useState(existing?.intentKept || '')
  const [oneWord,    setOneWord]    = useState(existing?.oneWord    || '')
  const [triggers,   setTriggers]   = useState(existing?.triggers   || [])
  const [practices,  setPractices]  = useState(existing?.practices  || { quietTime: false, meditation: false, reframedSelfTalk: false })

  function addTrigger() {
    setTriggers(t => [...t, { trigger: '', emotion: '', response: '' }])
  }
  function updateTrigger(i, field, val) {
    setTriggers(t => t.map((tr, idx) => idx === i ? { ...tr, [field]: val } : tr))
  }
  function removeTrigger(i) {
    setTriggers(t => t.filter((_, idx) => idx !== i))
  }
  function togglePractice(key) {
    setPractices(p => ({ ...p, [key]: !p[key] }))
  }

  function handleSave() {
    onSave({ mood, stress, clarity, intentKept, oneWord, triggers: triggers.filter(t => t.trigger), practices })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">🌙 Evening Reflection</div>

        <SliderInput label="Mood — how did the day end?" value={mood} onChange={setMood} labels={MOOD_LABELS} color="#7c6aff" />
        <SliderInput label="Stress level" value={stress} onChange={setStress} labels={STRESS_LABELS} color="#ef4444" />
        <SliderInput label="Clarity / focus" value={clarity} onChange={setClarity} labels={CLARITY_LABELS} color="#3b82f6" />

        {morningIntention && (
          <div className="form-group">
            <label>Did you keep your morning intention?</label>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8, fontStyle: 'italic' }}>"{morningIntention}"</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Yes', 'Partially', 'No'].map(opt => (
                <button key={opt} onClick={() => setIntentKept(opt)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  border: `2px solid ${intentKept === opt ? (opt === 'Yes' ? 'var(--green)' : opt === 'Partially' ? 'var(--amber)' : 'var(--red)') : 'var(--border2)'}`,
                  background: intentKept === opt ? (opt === 'Yes' ? 'rgba(34,197,94,0.12)' : opt === 'Partially' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)') : 'var(--bg3)',
                  color: intentKept === opt ? (opt === 'Yes' ? 'var(--green)' : opt === 'Partially' ? 'var(--amber)' : 'var(--red)') : 'var(--text3)',
                }}>{opt}</button>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>One word to describe today</label>
          <input value={oneWord} onChange={e => setOneWord(e.target.value)} placeholder="e.g. focused, scattered, disciplined, heavy..." maxLength={30} />
        </div>

        {/* Trigger log */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ marginBottom: 0 }}>Trigger log (optional)</label>
            <button className="btn btn-sm" onClick={addTrigger}>+ Add trigger</button>
          </div>
          {triggers.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>No triggers today? Great. Or add one if something came up.</div>
          )}
          {triggers.map((t, i) => (
            <div key={i} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', marginBottom: 8, borderLeft: '3px solid var(--red)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>Trigger {i + 1}</span>
                <button className="btn btn-sm btn-danger" onClick={() => removeTrigger(i)}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <select value={t.trigger} onChange={e => updateTrigger(i, 'trigger', e.target.value)}>
                  <option value="">What caused it?</option>
                  {STRESS_TRIGGERS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select value={t.emotion} onChange={e => updateTrigger(i, 'emotion', e.target.value)}>
                  <option value="">How did it show up?</option>
                  {EMOTIONAL_STATES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select value={t.response} onChange={e => updateTrigger(i, 'response', e.target.value)}>
                  <option value="">What did I do?</option>
                  {RESPONSES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Evening practices */}
        <div className="form-group">
          <label>Evening practices</label>
          {[
            { key: 'quietTime',        label: '🤫 Quiet time — 10 min no phone' },
            { key: 'meditation',       label: '🧘 Meditation' },
            { key: 'reframedSelfTalk', label: '🧠 Caught and reframed negative self-talk' },
          ].map(({ key, label }) => (
            <div key={key} onClick={() => togglePractice(key)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 6, background: practices[key] ? 'rgba(34,197,94,0.1)' : 'var(--bg3)', border: `1px solid ${practices[key] ? 'var(--green)' : 'var(--border2)'}` }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${practices[key] ? 'var(--green)' : 'var(--border2)'}`, background: practices[key] ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {practices[key] && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
              </div>
              <span style={{ fontSize: 14 }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save evening</button>
        </div>
      </div>
    </div>
  )
}

// ─── Today sub-section ────────────────────────────────────────────────────────

function TodaySection({ todayLog, saveMorning, saveEvening, deleteLog }) {
  const [showMorning, setShowMorning] = useState(false)
  const [showEvening, setShowEvening] = useState(false)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const morning = todayLog?.morning
  const evening = todayLog?.evening

  // Delete only morning field — keep evening intact
  async function deleteMorning() {
    if (todayLog) await deleteLog(todayLog.id, 'morning')
  }
  async function deleteEvening() {
    if (todayLog) await deleteLog(todayLog.id, 'evening')
  }

  // Practice score
  const practices = [
    morning?.breathing,
    morning?.gratitude?.length >= 1,
    evening?.practices?.quietTime,
    evening?.practices?.meditation,
    evening?.practices?.reframedSelfTalk,
    !!evening,
  ]
  const practiceScore = Math.round((practices.filter(Boolean).length / practices.length) * 100)

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>{today}</div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        {/* Morning card */}
        <div className="card" style={{ borderTop: `3px solid #f59e0b` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="card-title" style={{ margin: 0 }}>🌅 Morning Intention</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {morning
                ? <span className="badge badge-green">✓ Done</span>
                : <span className="badge badge-amber">Not yet</span>
              }
              {morning && (
                <button className="btn btn-sm btn-danger" title="Delete morning entry" onClick={deleteMorning}>✕</button>
              )}
            </div>
          </div>
          {morning ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>MOOD</div>
                <ScoreDot value={morning.mood} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>ENERGY</div>
                <ScoreDot value={morning.energy} color="#22c55e" />
              </div>
              {morning.intention && (
                <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', padding: '8px 10px', background: 'var(--bg3)', borderRadius: 6, borderLeft: '2px solid #f59e0b' }}>
                  "{morning.intention}"
                </div>
              )}
              {morning.gratitude?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>GRATITUDE</div>
                  {morning.gratitude.map((g, i) => g && <div key={i} style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>🙏 {g}</div>)}
                </div>
              )}
              {morning.breathing && <span className="badge badge-green" style={{ alignSelf: 'flex-start', fontSize: 11 }}>🫁 Breathing done</span>}
            </div>
          ) : (
            <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 12 }}>Set your intention for the day.</div>
          )}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={() => setShowMorning(true)}>
            {morning ? '✏️ Edit morning' : '🌅 Log morning'}
          </button>
        </div>

        {/* Evening card */}
        <div className="card" style={{ borderTop: `3px solid #7c6aff` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="card-title" style={{ margin: 0 }}>🌙 Evening Reflection</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {evening
                ? <span className="badge badge-green">✓ Done</span>
                : <span className="badge" style={{ background: 'var(--bg3)', color: 'var(--text3)' }}>Not yet</span>
              }
              {evening && (
                <button className="btn btn-sm btn-danger" title="Delete evening entry" onClick={deleteEvening}>✕</button>
              )}
            </div>
          </div>
          {evening ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>MOOD</div>
                <ScoreDot value={evening.mood} color="#7c6aff" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>STRESS</div>
                <ScoreDot value={evening.stress} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>CLARITY</div>
                <ScoreDot value={evening.clarity} color="#3b82f6" />
              </div>
              {evening.oneWord && (
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textAlign: 'center', padding: '6px 0' }}>
                  "{evening.oneWord}"
                </div>
              )}
              {evening.intentKept && (
                <span className={`badge ${evening.intentKept === 'Yes' ? 'badge-green' : evening.intentKept === 'Partially' ? 'badge-amber' : 'badge-red'}`} style={{ alignSelf: 'flex-start' }}>
                  Intention: {evening.intentKept}
                </span>
              )}
              {evening.triggers?.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>⚡ {evening.triggers.length} trigger{evening.triggers.length > 1 ? 's' : ''} logged</div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 12 }}>Reflect on how your day went.</div>
          )}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 12, background: '#7c6aff', borderColor: '#7c6aff' }} onClick={() => setShowEvening(true)}>
            {evening ? '✏️ Edit evening' : '🌙 Log evening'}
          </button>
        </div>
      </div>

      {/* Daily practices summary */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="card-title" style={{ margin: 0 }}>Daily mental practices</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: practiceScore >= 80 ? 'var(--green)' : practiceScore >= 50 ? 'var(--amber)' : 'var(--red)' }}>
            {practiceScore}%
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { done: !!morning?.breathing,                                     label: '🫁 Morning breathing / physiological sigh' },
            { done: (morning?.gratitude?.filter(Boolean).length || 0) >= 1,  label: '🙏 Gratitude logged (3 things)' },
            { done: !!evening?.practices?.quietTime,                          label: '🤫 Quiet time — 10 min no phone' },
            { done: !!evening?.practices?.meditation,                         label: '🧘 Meditation' },
            { done: !!evening?.practices?.reframedSelfTalk,                   label: '🧠 Caught & reframed negative self-talk' },
            { done: !!evening,                                                label: '🌙 Evening reflection done' },
          ].map(({ done, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: done ? 'rgba(34,197,94,0.08)' : 'var(--bg3)', border: `1px solid ${done ? 'rgba(34,197,94,0.2)' : 'var(--border)'}` }}>
              <span style={{ fontSize: 16, color: done ? 'var(--green)' : 'var(--text3)' }}>{done ? '✓' : '○'}</span>
              <span style={{ fontSize: 13, color: done ? 'var(--text)' : 'var(--text3)' }}>{label}</span>
            </div>
          ))}
        </div>
        <div className="progress-bar" style={{ height: 6, marginTop: 14 }}>
          <div className="progress-fill" style={{ width: `${practiceScore}%`, background: practiceScore >= 80 ? 'var(--green)' : 'var(--amber)' }} />
        </div>
      </div>

      {showMorning && (
        <MorningModal existing={morning} onClose={() => setShowMorning(false)} onSave={saveMorning} />
      )}
      {showEvening && (
        <EveningModal existing={evening} morningIntention={morning?.intention} onClose={() => setShowEvening(false)} onSave={saveEvening} />
      )}
    </div>
  )
}

// ─── Trends sub-section ───────────────────────────────────────────────────────

function TrendsSection({ last30Days, weekStats }) {
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  const moodData = last30Days.map(d => ({
    name: d.day,
    'Morning mood': d.morningMood,
    'Evening mood': d.eveningMood,
  }))

  const stressData = last30Days.map(d => ({ name: d.day, Stress: d.stress }))
  const clarityData = last30Days.map(d => ({ name: d.day, Clarity: d.clarity }))

  const chartProps = { margin: { top: 5, right: 5, left: -20, bottom: 0 } }
  const axisStyle  = { fontSize: 10, fill: '#5a5a72' }
  const gridStyle  = { stroke: '#2a2a38', strokeDasharray: '3 3' }

  return (
    <div>
      {/* Weekly metrics card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">This week's mental metrics</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Avg mood',       value: weekStats.avgMood    ? `${weekStats.avgMood}/5` : '—', color: '#f59e0b' },
            { label: 'Avg stress',     value: weekStats.avgStress  ? `${weekStats.avgStress}/5` : '—', color: '#ef4444' },
            { label: 'Avg clarity',    value: weekStats.avgClarity ? `${weekStats.avgClarity}/5` : '—', color: '#3b82f6' },
            { label: 'Meditation days', value: `${weekStats.meditationDays}/7`, color: '#a855f7' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
        {weekStats.topTrigger && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.07)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', fontSize: 13 }}>
            <span style={{ color: 'var(--red)', fontWeight: 600 }}>⚡ Top trigger this week: </span>
            <span style={{ color: 'var(--text2)' }}>{weekStats.topTrigger}</span>
          </div>
        )}
      </div>

      {/* Mood chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Mood — last 30 days</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={moodData} {...chartProps}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="name" tick={axisStyle} interval={4} />
            <YAxis domain={[0, 5]} ticks={[1,2,3,4,5]} tick={axisStyle} />
            <Tooltip contentStyle={{ background: '#18181f', border: '1px solid #2a2a38', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Morning mood" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="Evening mood" stroke="#7c6aff" strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stress chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Stress — last 30 days</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={stressData} {...chartProps}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="name" tick={axisStyle} interval={4} />
            <YAxis domain={[0, 5]} ticks={[1,2,3,4,5]} tick={axisStyle} />
            <Tooltip contentStyle={{ background: '#18181f', border: '1px solid #2a2a38', borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="Stress" stroke="#ef4444" strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Lower is better — Ideal Joseph: 2/5</div>
      </div>

      {/* Clarity chart */}
      <div className="card">
        <div className="card-title">Clarity / Focus — last 30 days</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={clarityData} {...chartProps}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="name" tick={axisStyle} interval={4} />
            <YAxis domain={[0, 5]} ticks={[1,2,3,4,5]} tick={axisStyle} />
            <Tooltip contentStyle={{ background: '#18181f', border: '1px solid #2a2a38', borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="Clarity" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Higher is better — Ideal Joseph: 4.5/5</div>
      </div>
    </div>
  )
}

// ─── Ideal Joseph sub-section ─────────────────────────────────────────────────

function IdealSection({ weekStats }) {
  const benchmarks = [
    { label: 'Morning check-in',  ideal: '7/7 days', yours: `${weekStats.morningDone}/7`, met: weekStats.morningDone === 7, pct: (weekStats.morningDone / 7) * 100 },
    { label: 'Evening reflection', ideal: '7/7 days', yours: `${weekStats.eveningDone}/7`, met: weekStats.eveningDone === 7, pct: (weekStats.eveningDone / 7) * 100 },
    { label: 'Meditation days',   ideal: '7/7 days', yours: `${weekStats.meditationDays}/7`, met: weekStats.meditationDays === 7, pct: (weekStats.meditationDays / 7) * 100 },
    { label: 'Avg mood',          ideal: '4/5',    yours: weekStats.avgMood ? `${weekStats.avgMood}/5` : '—', met: weekStats.avgMood >= 4, pct: weekStats.avgMood ? (weekStats.avgMood / 4) * 100 : 0 },
    { label: 'Avg stress',        ideal: '2/5 max', yours: weekStats.avgStress ? `${weekStats.avgStress}/5` : '—', met: weekStats.avgStress <= 2, pct: weekStats.avgStress ? Math.max(0, (1 - (weekStats.avgStress - 2) / 3)) * 100 : 0, lowerBetter: true },
    { label: 'Avg clarity',       ideal: '4.5/5',  yours: weekStats.avgClarity ? `${weekStats.avgClarity}/5` : '—', met: weekStats.avgClarity >= 4.5, pct: weekStats.avgClarity ? (weekStats.avgClarity / 4.5) * 100 : 0 },
  ]

  return (
    <div>
      <div className="card" style={{ marginBottom: 16, padding: '18px 20px', background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.2)' }}>
        <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Mental Score — Ideal Joseph</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 800, color: '#fbbf24', lineHeight: 1 }}>90</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Your this week: <strong style={{ color: weekStats.weekScore >= 80 ? 'var(--green)' : weekStats.weekScore >= 50 ? 'var(--amber)' : 'var(--red)' }}>{weekStats.weekScore}</strong></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {benchmarks.map(({ label, ideal, yours, met, pct, lowerBetter }) => (
          <div key={label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>You: <strong style={{ color: met ? 'var(--green)' : 'var(--amber)' }}>{yours}</strong></span>
                <span style={{ fontSize: 12, color: '#fbbf24' }}>Ideal: {ideal}</span>
              </div>
            </div>
            <div style={{ position: 'relative', height: 8, background: 'var(--bg4)', borderRadius: 4, overflow: 'visible' }}>
              <div style={{ height: '100%', borderRadius: 4, width: `${Math.min(100, pct)}%`, background: met ? 'var(--green)' : 'var(--amber)', transition: 'width 0.5s' }} />
              <div style={{ position: 'absolute', top: -3, left: `${Math.min(99, 100)}%`, width: 2, height: 14, background: '#fbbf24', borderRadius: 1 }} />
            </div>
            {lowerBetter && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>Lower stress = higher score</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── History calendar ─────────────────────────────────────────────────────────

function MentalCalendar({ logs, saveMorning, saveEvening, deleteLog }) {
  const now = new Date()
  const [year,        setYear]        = useState(now.getFullYear())
  const [month,       setMonth]       = useState(now.getMonth())
  const [dayPopup,    setDayPopup]    = useState(null)
  const [editMorning, setEditMorning] = useState(null) // log object
  const [editEvening, setEditEvening] = useState(null) // log object

  const monthName   = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const blanks      = firstDay === 0 ? 6 : firstDay - 1

  const MOOD_LABELS    = { 1: '😔 1', 2: '😐 2', 3: '🙂 3', 4: '😊 4', 5: '🌟 5' }
  const STRESS_LABELS  = { 1: '😌 1', 2: '🟢 2', 3: '🟡 3', 4: '🟠 4', 5: '🔴 5' }
  const CLARITY_LABELS = { 1: '🌫️ 1', 2: '😶 2', 3: '🙂 3', 4: '🎯 4', 5: '⚡ 5' }

  const logByDate = useMemo(() => {
    const map = {}
    logs.forEach(l => { map[l.date] = l })
    return map
  }, [logs])

  function dotColor(log) {
    if (!log) return null
    if (log.morning && log.evening) return 'var(--green)'
    if (log.morning || log.evening) return 'var(--amber)'
    return null
  }

  // When editing from history, we override saveMorning/saveEvening to target the historical date
  async function handleEditMorning(data) {
    // saveMorning always saves to "today" in the hook — for history edits we need to update the specific doc
    if (editMorning) {
      const { doc, updateDoc } = await import('firebase/firestore')
      const { db } = await import('../lib/firebase')
      await updateDoc(doc(db, 'lo_mental_logs', editMorning.id), {
        morning: data,
        updatedAt: new Date().toISOString(),
      })
    }
    setEditMorning(null)
  }

  async function handleEditEvening(data) {
    if (editEvening) {
      const { doc, updateDoc } = await import('firebase/firestore')
      const { db } = await import('../lib/firebase')
      await updateDoc(doc(db, 'lo_mental_logs', editEvening.id), {
        evening: data,
        updatedAt: new Date().toISOString(),
      })
    }
    setEditEvening(null)
  }

  return (
    <div className="card">
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
          const day     = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const log     = logByDate[dateStr]
          const isToday = dateStr === new Date().toISOString().split('T')[0]
          const dc      = dotColor(log)
          return (
            <div
              key={day}
              onClick={() => log && setDayPopup(dayPopup === dateStr ? null : dateStr)}
              style={{
                minHeight: 38, borderRadius: 6, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                cursor: log ? 'pointer' : 'default',
                background: dayPopup === dateStr ? 'var(--accent-glow)' : isToday ? 'var(--bg4)' : 'var(--bg3)',
                border: `1px solid ${dayPopup === dateStr ? 'var(--accent)' : isToday ? 'var(--border2)' : 'transparent'}`,
              }}
            >
              <span style={{ fontSize: 12, color: isToday ? 'var(--text)' : 'var(--text2)', fontWeight: isToday ? 700 : 400 }}>{day}</span>
              {dc && <div style={{ width: 6, height: 6, borderRadius: '50%', background: dc, marginTop: 2 }} />}
            </div>
          )
        })}
      </div>

      {/* Day popup with edit + delete */}
      {dayPopup && logByDate[dayPopup] && (() => {
        const log = logByDate[dayPopup]
        return (
          <div style={{ marginTop: 12, background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border2)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>{dayPopup}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: log.morning && log.evening ? '1fr 1fr' : '1fr', gap: 0 }}>
              {/* Morning block */}
              {log.morning && (
                <div style={{ padding: '12px 14px', borderRight: log.evening ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>🌅 Morning</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm" style={{ fontSize: 11, padding: '2px 8px' }} title="Edit morning" onClick={() => setEditMorning(log)}>✏️</button>
                      <button className="btn btn-sm btn-danger" style={{ fontSize: 11, padding: '2px 8px' }} title="Delete morning" onClick={() => deleteLog(log.id, 'morning')}>✕</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span>Mood: <strong>{MOOD_LABELS[log.morning.mood]}</strong></span>
                    <span>Energy: <strong>{log.morning.energy}/5</strong></span>
                    {log.morning.intention && (
                      <span style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', borderLeft: '2px solid #f59e0b', paddingLeft: 6 }}>"{log.morning.intention}"</span>
                    )}
                    {log.morning.gratitude?.filter(Boolean).length > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                        {log.morning.gratitude.filter(Boolean).map((g, i) => <div key={i}>🙏 {g}</div>)}
                      </div>
                    )}
                    {log.morning.breathing && <span style={{ color: 'var(--green)', fontSize: 11 }}>🫁 Breathing done</span>}
                  </div>
                </div>
              )}

              {/* Evening block */}
              {log.evening && (
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#7c6aff', textTransform: 'uppercase' }}>🌙 Evening</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm" style={{ fontSize: 11, padding: '2px 8px' }} title="Edit evening" onClick={() => setEditEvening(log)}>✏️</button>
                      <button className="btn btn-sm btn-danger" style={{ fontSize: 11, padding: '2px 8px' }} title="Delete evening" onClick={() => deleteLog(log.id, 'evening')}>✕</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span>Mood: <strong>{MOOD_LABELS[log.evening.mood]}</strong></span>
                    <span>Stress: <strong>{STRESS_LABELS[log.evening.stress]}</strong></span>
                    <span>Clarity: <strong>{CLARITY_LABELS[log.evening.clarity]}</strong></span>
                    {log.evening.oneWord && <span style={{ color: 'var(--accent)', fontWeight: 700 }}>"{log.evening.oneWord}"</span>}
                    {log.evening.intentKept && (
                      <span className={`badge ${log.evening.intentKept === 'Yes' ? 'badge-green' : log.evening.intentKept === 'Partially' ? 'badge-amber' : 'badge-red'}`} style={{ alignSelf: 'flex-start', fontSize: 10 }}>
                        Intention: {log.evening.intentKept}
                      </span>
                    )}
                    {log.evening.triggers?.length > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>⚡ {log.evening.triggers.length} trigger{log.evening.triggers.length > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Delete entire day */}
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm btn-danger" onClick={() => { deleteLog(log.id); setDayPopup(null) }}>
                ✕ Delete entire day
              </button>
            </div>
          </div>
        )
      })()}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>
        {[['var(--green)','Both logged'],['var(--amber)','Partial']].map(([c, l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />{l}
          </span>
        ))}
      </div>

      {/* Edit modals for history entries */}
      {editMorning && (
        <MorningModal
          existing={editMorning.morning}
          onClose={() => setEditMorning(null)}
          onSave={handleEditMorning}
        />
      )}
      {editEvening && (
        <EveningModal
          existing={editEvening.evening}
          morningIntention={editEvening.morning?.intention}
          onClose={() => setEditEvening(null)}
          onSave={handleEditEvening}
        />
      )}
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function MentalView({ logs, loading, saveMorning, saveEvening, deleteLog, getTodayLog, getWeekStats, getLast30DaysData }) {
  const [subTab,      setSubTab]      = useState('today')
  const [showHistory, setShowHistory] = useState(false)

  const todayLog   = getTodayLog()
  const weekStats  = getWeekStats()
  const last30Days = getLast30DaysData()

  // Partial-field delete: removes only morning or evening from the day's doc
  async function handleDeleteLog(id, field) {
    await deleteLog(id, field)
  }

  if (loading) return <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">🧘 Mental</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>CBT + ACT + Huberman — daily mind check-in system</div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: weekStats.weekScore >= 80 ? 'var(--green)' : weekStats.weekScore >= 50 ? 'var(--amber)' : 'var(--red)' }}>
          {weekStats.weekScore}<span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}> /100</span>
        </div>
      </div>

      {/* Sub-tab pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[{ id: 'today', label: '🌅 Today' }, { id: 'trends', label: '📈 Trends' }, { id: 'ideal', label: '👤 Ideal Joseph' }].map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} style={{
            padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: subTab === t.id ? 'var(--accent)' : 'var(--bg3)',
            border: `1px solid ${subTab === t.id ? 'var(--accent)' : 'var(--border2)'}`,
            color: subTab === t.id ? '#fff' : 'var(--text3)',
          }}>{t.label}</button>
        ))}
      </div>

      {subTab === 'today' && (
        <>
          <TodaySection todayLog={todayLog} saveMorning={saveMorning} saveEvening={saveEvening} deleteLog={handleDeleteLog} />
          {/* History toggle */}
          <div style={{ marginTop: 24 }}>
            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'center', marginBottom: showHistory ? 16 : 0 }}
              onClick={() => setShowHistory(h => !h)}
            >
              {showHistory ? '▲ Hide history' : '▼ Show history (calendar)'}
            </button>
            {showHistory && <MentalCalendar logs={logs} saveMorning={saveMorning} saveEvening={saveEvening} deleteLog={handleDeleteLog} />}
          </div>
        </>
      )}
      {subTab === 'trends' && <TrendsSection last30Days={last30Days} weekStats={weekStats} />}
      {subTab === 'ideal' && <IdealSection weekStats={weekStats} />}
    </div>
  )
}
