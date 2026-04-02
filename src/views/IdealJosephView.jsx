import { useState } from 'react'
import { IDEAL_WEEKLY_BENCHMARKS, IDEAL_NAME, calcIdealLifeScore, PILLAR_WEIGHTS, getCatchUpPlan, getGapStatus } from '../lib/idealJoseph'
import { scoreColor } from '../lib/utils'

const PILLARS = [
  { key: 'habits',   label: 'Habits',   icon: '🧠', color: '#14b8a6' },
  { key: 'weekly',   label: 'Weekly',   icon: '📅', color: '#3b82f6' },
  { key: 'fitness',  label: 'Fitness',  icon: '💪', color: '#f97316' },
  { key: 'mental',   label: 'Mental',   icon: '🧘', color: '#a855f7' },
  { key: 'social',   label: 'Social',   icon: '❤️', color: '#ec4899' },
  { key: 'learning', label: 'Learning', icon: '📚', color: '#f59e0b' },
  { key: 'goals',    label: 'Goals',    icon: '🎯', color: '#22c55e' },
]

function GapMeter({ actual, ideal, color }) {
  const gap = ideal - actual
  const gapPct = Math.round((gap / ideal) * 100)
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>
        <span>You: {actual}</span>
        <span style={{ color: '#fbbf24', fontWeight: 600 }}>{IDEAL_NAME}: {ideal}</span>
      </div>
      <div style={{ position: 'relative', height: 10, background: 'var(--bg4)', borderRadius: 5, overflow: 'visible' }}>
        <div style={{ height: '100%', borderRadius: 5, background: color, width: `${actual}%`, transition: 'width 0.6s ease' }} />
        <div style={{ position: 'absolute', top: -2, left: `${ideal}%`, width: 2, height: 14, background: '#fbbf24', borderRadius: 1 }} />
      </div>
      {gap > 0 && (
        <div style={{ fontSize: 12, color: gap <= 10 ? 'var(--amber)' : 'var(--red)', marginTop: 4, fontWeight: 600 }}>
          {gap <= 5 ? '🟢 Almost there!' : gap <= 20 ? `🟡 ${gap} pts gap` : `🔴 ${gap} pts behind`}
        </div>
      )}
      {gap === 0 && <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4, fontWeight: 600 }}>✨ Matching Ideal Joseph!</div>}
    </div>
  )
}

function WeeklyComparison({ pillarScores }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 2 }}>
      <div style={{ padding: '10px 16px', background: 'var(--bg3)', borderRadius: '8px 0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--accent2)', textAlign: 'center' }}>
        YOU THIS WEEK
      </div>
      <div style={{ padding: '10px 16px', background: 'rgba(251,191,36,0.1)', borderRadius: '0 8px 8px 0', fontSize: 13, fontWeight: 600, color: '#fbbf24', textAlign: 'center' }}>
        {IDEAL_NAME.toUpperCase()}
      </div>
    </div>
  )
}

function WeeklyHistoryCalendar({ weeklyHistory = [], idealScore }) {
  const [expandedWeek, setExpandedWeek] = useState(null)
  if (!weeklyHistory || weeklyHistory.length === 0) return null

  const sorted = [...weeklyHistory].sort((a, b) => b.week.localeCompare(a.week)) // newest first

  return (
    <div style={{ marginTop: 20 }}>
      <div className="card" style={{ border: '1px solid rgba(251,191,36,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="card-title" style={{ margin: 0 }}>📅 Past weeks — You vs {IDEAL_NAME}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />≥ ideal
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />close
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />behind
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sorted.map(entry => {
            const isOpen   = expandedWeek === entry.week
            const yourScore = Math.round(entry.score)
            const gap      = idealScore - yourScore
            const dotColor = gap <= 0 ? '#22c55e' : gap <= 15 ? '#f59e0b' : '#ef4444'
            const bgColor  = gap <= 0 ? 'rgba(34,197,94,0.08)' : gap <= 15 ? 'rgba(245,158,11,0.07)' : 'rgba(239,68,68,0.06)'
            const borderColor = gap <= 0 ? 'rgba(34,197,94,0.25)' : gap <= 15 ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.2)'
            const pct = Math.round((yourScore / idealScore) * 100)

            // Format week label e.g. "Mar 24 – Mar 30"
            const weekDate = new Date(entry.week + 'T12:00:00')
            const endDate  = new Date(weekDate); endDate.setDate(endDate.getDate() + 6)
            const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const weekLabel = `${fmt(weekDate)} – ${fmt(endDate)}`

            return (
              <div key={entry.week} style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${isOpen ? borderColor : 'var(--border)'}` }}>
                {/* Row */}
                <div
                  onClick={() => setExpandedWeek(isOpen ? null : entry.week)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', background: isOpen ? bgColor : 'var(--bg3)', gap: 10 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{weekLabel}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {/* Mini score comparison */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <span style={{ fontWeight: 700, color: dotColor }}>{yourScore}</span>
                      <span style={{ color: 'var(--text3)' }}>vs</span>
                      <span style={{ fontWeight: 700, color: '#fbbf24' }}>{idealScore}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ padding: '14px 16px', background: 'var(--bg2)', borderTop: `1px solid ${borderColor}` }}>
                    {/* Progress bar comparison */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>
                        <span>Your score</span>
                        <span style={{ color: '#fbbf24' }}>Ideal Joseph target</span>
                      </div>
                      <div style={{ position: 'relative', height: 12, background: 'var(--bg4)', borderRadius: 6, overflow: 'visible' }}>
                        <div style={{ height: '100%', borderRadius: 6, background: dotColor, width: `${Math.min(yourScore, 100)}%`, transition: 'width 0.4s ease' }} />
                        <div style={{ position: 'absolute', top: -3, left: `${Math.min(idealScore, 100)}%`, width: 2, height: 18, background: '#fbbf24', borderRadius: 1 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11 }}>
                        <span style={{ color: dotColor, fontWeight: 700 }}>{yourScore} pts ({pct}% of ideal)</span>
                        <span style={{ color: '#fbbf24', fontWeight: 600 }}>{idealScore} pts</span>
                      </div>
                    </div>

                    {/* Gap summary */}
                    <div style={{
                      padding: '10px 12px', borderRadius: 8, fontSize: 13,
                      background: gap <= 0 ? 'rgba(34,197,94,0.08)' : gap <= 15 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.07)',
                      border: `1px solid ${borderColor}`,
                      color: 'var(--text2)', lineHeight: 1.6,
                    }}>
                      {gap <= 0
                        ? <span>✨ <strong>You matched or beat Ideal Joseph</strong> this week. This is what peak looks like.</span>
                        : gap <= 10
                        ? <span>🟡 <strong>{gap} pts behind</strong> — so close. One more focused day would have closed this gap.</span>
                        : gap <= 25
                        ? <span>🟠 <strong>{gap} pts behind</strong> — a solid week, but there's room. Identify your weakest pillar and attack it.</span>
                        : <span>🔴 <strong>{gap} pts behind</strong> — tough week. Remember: one bad week doesn't define the journey. Reset and go again.</span>
                      }
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


export default function IdealJosephView({ pillarScores, lifeScore, weeklyHistory = [] }) {
  const idealScore = calcIdealLifeScore()
  const gap = idealScore - lifeScore
  const [frameworksOpen, setFrameworksOpen] = useState(false)

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 32 }}>👤</span>
          <div>
            <div className="section-title">{IDEAL_NAME}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>The disciplined version of you — built on proven systems</div>
          </div>
        </div>
        <div style={{ padding: '14px 18px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
          <strong style={{ color: '#fbbf24' }}>The psychology behind this:</strong> Seeing the ideal version of yourself vividly makes you <em>more</em> likely to close the gap — not less. This is Dr. Gabriele Oettingen's WOOP method (Wish, Outcome, Obstacle, Plan) combined with James Clear's identity-based habits. You're not chasing numbers. You're becoming a different person.
        </div>
      </div>

      {/* Life Score comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ textAlign: 'center', padding: 28 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Your Life Score</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 800, lineHeight: 1,
            background: 'linear-gradient(135deg, #9f91ff, #c084fc)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>{lifeScore}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>This week's average</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 28, border: '1px solid rgba(251,191,36,0.3)' }}>
          <div style={{ fontSize: 12, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{IDEAL_NAME}</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 800, lineHeight: 1,
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>{idealScore}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>
            {gap === 0 ? '🌟 You are him!' : `${gap} pts ahead of you`}
          </div>
        </div>
      </div>

      {/* Gap summary banner */}
      {gap > 0 && (
        <div style={{
          padding: '16px 20px', marginBottom: 20, borderRadius: 'var(--radius)',
          background: gap <= 10 ? 'var(--green-bg)' : gap <= 25 ? 'var(--amber-bg)' : 'var(--red-bg)',
          border: `1px solid ${gap <= 10 ? 'rgba(34,197,94,0.3)' : gap <= 25 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
          fontSize: 14, color: 'var(--text)',
        }}>
          <strong>{gap <= 10 ? '🌟 So close!' : gap <= 25 ? '⚡ You can close this gap!' : '🔥 Time to level up.'}</strong>{' '}
          {IDEAL_NAME} is scoring <strong>{idealScore}</strong> this week. You're at <strong>{lifeScore}</strong>. That's a <strong>{gap}-point gap</strong>.
          {gap <= 10 ? ' You\'re nearly matching your ideal self. Stay consistent.' : gap <= 25 ? ' One focused week can close most of this gap.' : ' Pick the weakest pillar below and attack it first.'}
        </div>
      )}
      {gap === 0 && (
        <div style={{ padding: '16px 20px', marginBottom: 20, borderRadius: 'var(--radius)', background: 'var(--green-bg)', border: '1px solid rgba(34,197,94,0.3)', fontSize: 14 }}>
          <strong>🌟 You ARE Ideal Joseph this week.</strong> You've matched the benchmark across all pillars. This is what peak performance looks like. Keep it up.
        </div>
      )}

      {/* Pillar-by-pillar comparison */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {PILLARS.map(p => {
          const actual = pillarScores[p.key] || 0
          const benchmark = IDEAL_WEEKLY_BENCHMARKS[p.key]
          const ideal = benchmark?.score || 100
          const status = getGapStatus(actual, p.key)
          const catchup = getCatchUpPlan(p.key, actual)
          const weight = PILLAR_WEIGHTS[p.key === 'learning' ? 'learning' : p.key]

          return (
            <div key={p.key} className="card" style={{ borderLeft: `3px solid ${p.color}` }}>
              {/* Pillar header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{weight}% of Life Score · {benchmark?.framework}</div>
                  </div>
                </div>
                <span className={`badge ${status === 'on-track' ? 'badge-green' : status === 'lagging' ? 'badge-amber' : 'badge-red'}`}>
                  {status === 'on-track' ? '✓ On track' : status === 'lagging' ? '↑ Lagging' : '⚠ Behind'}
                </span>
              </div>

              <GapMeter actual={actual} ideal={ideal} color={p.color} />

              {/* Side-by-side comparison table */}
              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>You</div>
                  <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800, color: scoreColor(actual) }}>{actual}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>week score</div>
                </div>
                <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#fbbf24', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{IDEAL_NAME}</div>
                  <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fbbf24' }}>{ideal}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{benchmark?.description}</div>
                </div>
              </div>

              {/* Catch-up plan */}
              {catchup && status !== 'on-track' && (
                <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>🔴 3-day catch-up plan</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{catchup}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Gap report */}
      <div className="card" style={{ marginTop: 20, border: '1px solid rgba(251,191,36,0.2)' }}>
        <div className="card-title" style={{ color: '#fbbf24' }}>📊 Weekly gap report</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.9 }}>
          {PILLARS.map(p => {
            const actual = pillarScores[p.key] || 0
            const ideal = IDEAL_WEEKLY_BENCHMARKS[p.key]?.score || 100
            const gap = ideal - actual
            if (gap === 0) return <div key={p.key}>{p.icon} <strong>{p.label}:</strong> <span style={{ color: 'var(--green)' }}>✨ Perfect — matching {IDEAL_NAME}!</span></div>
            return (
              <div key={p.key}>
                {p.icon} <strong>{p.label}:</strong>{' '}
                <span style={{ color: gap <= 10 ? 'var(--amber)' : 'var(--red)' }}>
                  {IDEAL_NAME} scored {ideal}. You scored {actual}. That's {gap} points and roughly{' '}
                  {p.key === 'fitness' ? `${Math.round(gap * 1.35)} minutes of training` :
                   p.key === 'learning' ? `${(gap * 0.07).toFixed(1)} hours of learning` :
                   p.key === 'habits' ? `${Math.round(gap / 14)} habit misses per day` :
                   `${gap} execution points`} left on the table.
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly history calendar */}
      <WeeklyHistoryCalendar weeklyHistory={weeklyHistory} idealScore={idealScore} />

      {/* The frameworks — collapsible */}
      <div className="card" style={{ marginTop: 16 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setFrameworksOpen(o => !o)}
        >
          <div className="card-title" style={{ marginBottom: 0 }}>📖 The frameworks powering {IDEAL_NAME}</div>
          <span style={{ fontSize: 13, color: 'var(--text3)', marginLeft: 12 }}>{frameworksOpen ? '▲' : '▼'}</span>
        </div>

        {frameworksOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {[
              { icon: '🧠', title: 'Atomic Habits', author: 'James Clear', note: 'Identity-based habits. 2-minute rule. 4 laws of behaviour change.' },
              { icon: '📅', title: 'The 12 Week Year', author: 'Brian Moran', note: 'Treat each week like a quarter. 95% execution is world-class.' },
              { icon: '💪', title: 'Huberman Lab', author: 'Andrew Huberman', note: '3x resistance + 135 min Zone 2/week + 7.5h sleep. Non-negotiable.' },
              { icon: '🧘', title: 'CBT + ACT', author: 'Aaron Beck + Steven Hayes', note: 'Daily check-ins, trigger awareness, thought reframing. The inner game.' },
              { icon: '❤️', title: 'Never Eat Alone + Give and Take', author: 'Ferrazzi + Grant', note: '5-minute rule: genuine attention keeps relationships warm. Give first, always.' },
              { icon: '📚', title: 'Ultralearning', author: 'Scott Young', note: 'Learn by doing. Retrieval practice beats re-reading. Teach to know.' },
              { icon: '🎯', title: 'The ONE Thing', author: 'Gary Keller', note: 'What\'s the ONE thing that makes everything else easier or unnecessary?' },
              { icon: '🔮', title: 'WOOP Method', author: 'Dr. Gabriele Oettingen', note: 'Seeing your ideal self vividly increases follow-through. Science-backed.' },
            ].map(f => (
              <div key={f.title} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.title} <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: 12 }}>— {f.author}</span></div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{f.note}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
