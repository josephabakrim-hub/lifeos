import { useState, useMemo } from 'react'
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

// ─── Gap meter ────────────────────────────────────────────────────────────────

function GapMeter({ actual, ideal, color }) {
  const gap = ideal - actual
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

// ─── Weekly history chart ─────────────────────────────────────────────────────

function WeeklyHistoryChart({ weeklyHistory = [], idealScore }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  if (!weeklyHistory || weeklyHistory.length === 0) return null

  // Chart dimensions
  const BAR_W    = 32
  const BAR_GAP  = 6
  const HEIGHT   = 110
  const IDEAL_Y  = Math.round((1 - idealScore / 100) * HEIGHT)

  const maxScore = 100
  const weeks = weeklyHistory

  // Summary stats
  const avg      = Math.round(weeks.reduce((s, w) => s + w.score, 0) / weeks.length)
  const best     = Math.max(...weeks.map(w => w.score))
  const trend    = weeks.length >= 2 ? weeks[weeks.length - 1].score - weeks[weeks.length - 2].score : 0
  const beatIdeal = weeks.filter(w => w.score >= idealScore).length

  function fmtWeek(weekStart) {
    const d = new Date(weekStart + 'T12:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function barColor(score) {
    if (score >= idealScore) return '#22c55e'
    if (score >= idealScore - 15) return '#f59e0b'
    return '#9f91ff'
  }

  const totalW = weeks.length * (BAR_W + BAR_GAP) - BAR_GAP

  return (
    <div className="card" style={{ marginTop: 20, border: '1px solid rgba(251,191,36,0.15)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div className="card-title" style={{ margin: 0, marginBottom: 2 }}>📈 Your journey vs {IDEAL_NAME}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>Weekly Life Score history — last {weeks.length} week{weeks.length !== 1 ? 's' : ''}</div>
        </div>
        {/* Summary pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <div style={{ padding: '4px 10px', borderRadius: 20, background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: 11 }}>
            <span style={{ color: 'var(--text3)' }}>avg </span>
            <span style={{ fontWeight: 700, color: scoreColor(avg) }}>{avg}</span>
          </div>
          <div style={{ padding: '4px 10px', borderRadius: 20, background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: 11 }}>
            <span style={{ color: 'var(--text3)' }}>best </span>
            <span style={{ fontWeight: 700, color: '#22c55e' }}>{best}</span>
          </div>
          <div style={{ padding: '4px 10px', borderRadius: 20, background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: 11 }}>
            <span style={{ color: 'var(--text3)' }}>trend </span>
            <span style={{ fontWeight: 700, color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
              {trend >= 0 ? '↑' : '↓'}{Math.abs(trend)}
            </span>
          </div>
          {beatIdeal > 0 && (
            <div style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', fontSize: 11 }}>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>★ {beatIdeal}× matched ideal</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ position: 'relative', minWidth: totalW + 40, height: HEIGHT + 52, paddingLeft: 28 }}>

          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map(v => {
            const y = Math.round((1 - v / 100) * HEIGHT)
            return (
              <div key={v} style={{ position: 'absolute', left: 0, top: y - 6, fontSize: 9, color: 'var(--text3)', width: 22, textAlign: 'right', lineHeight: 1 }}>
                {v}
              </div>
            )
          })}

          {/* Grid lines */}
          <svg style={{ position: 'absolute', left: 28, top: 0, width: totalW, height: HEIGHT, overflow: 'visible' }}>
            {[0, 25, 50, 75, 100].map(v => {
              const y = Math.round((1 - v / 100) * HEIGHT)
              return (
                <line key={v} x1={0} y1={y} x2={totalW} y2={y}
                  stroke={v === 0 || v === 100 ? 'var(--border2)' : 'var(--border)'}
                  strokeWidth={1} strokeDasharray={v === 0 || v === 100 ? 'none' : '3 4'}
                />
              )
            })}

            {/* Ideal Joseph line */}
            <line x1={0} y1={IDEAL_Y} x2={totalW} y2={IDEAL_Y}
              stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.8}
            />
            {/* Ideal label */}
            <text x={totalW + 4} y={IDEAL_Y + 4} fontSize={9} fill="#fbbf24" fontWeight={600}>
              Ideal
            </text>
          </svg>

          {/* Bars */}
          <div style={{ position: 'absolute', left: 28, top: 0, display: 'flex', alignItems: 'flex-end', gap: BAR_GAP, height: HEIGHT }}>
            {weeks.map((w, i) => {
              const barH   = Math.max(4, Math.round((w.score / maxScore) * HEIGHT))
              const color  = barColor(w.score)
              const isHov  = hoveredIdx === i
              const isLast = i === weeks.length - 1

              return (
                <div
                  key={w.week}
                  style={{ position: 'relative', width: BAR_W, flexShrink: 0, cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Hover tooltip */}
                  {isHov && (
                    <div style={{
                      position: 'absolute', bottom: barH + 8, left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--bg)', border: `1px solid ${color}`,
                      borderRadius: 8, padding: '6px 10px', zIndex: 10,
                      whiteSpace: 'nowrap', boxShadow: `0 4px 16px rgba(0,0,0,0.3)`,
                      pointerEvents: 'none',
                    }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{fmtWeek(w.week)}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{w.score}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                        {w.score >= idealScore ? '✨ beat ideal' : `${idealScore - w.score} pts behind`}
                      </div>
                    </div>
                  )}

                  {/* Bar */}
                  <div style={{
                    width: BAR_W, height: barH,
                    borderRadius: '4px 4px 0 0',
                    background: isHov
                      ? color
                      : `linear-gradient(180deg, ${color}dd 0%, ${color}88 100%)`,
                    transition: 'height 0.4s ease, opacity 0.15s',
                    opacity: hoveredIdx !== null && !isHov ? 0.45 : 1,
                    position: 'relative',
                  }}>
                    {/* Score label on bar if tall enough */}
                    {barH > 28 && (
                      <div style={{
                        position: 'absolute', top: 6, left: 0, right: 0,
                        textAlign: 'center', fontSize: 10, fontWeight: 700,
                        color: '#fff', opacity: 0.9,
                      }}>{w.score}</div>
                    )}
                    {/* "This week" indicator */}
                    {isLast && (
                      <div style={{
                        position: 'absolute', top: -18, left: 0, right: 0,
                        textAlign: 'center', fontSize: 9, fontWeight: 700, color,
                      }}>NOW</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* X-axis date labels */}
          <div style={{ position: 'absolute', left: 28, top: HEIGHT + 6, display: 'flex', gap: BAR_GAP }}>
            {weeks.map((w, i) => {
              const showLabel = weeks.length <= 8 || i % 2 === 0 || i === weeks.length - 1
              return (
                <div key={w.week} style={{ width: BAR_W, flexShrink: 0, textAlign: 'center' }}>
                  {showLabel && (
                    <div style={{ fontSize: 9, color: hoveredIdx === i ? scoreColor(w.score) : 'var(--text3)', fontWeight: hoveredIdx === i ? 700 : 400, lineHeight: 1.2 }}>
                      {fmtWeek(w.week).replace(' ', '\n')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 12, height: 3, background: '#fbbf24', display: 'inline-block', borderRadius: 1 }} />
          Ideal Joseph ({idealScore})
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e', display: 'inline-block' }} />
          At or above ideal
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} />
          Within 15 pts
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#9f91ff', display: 'inline-block' }} />
          Building
        </span>
      </div>

      {/* Motivational note */}
      {weeks.length >= 2 && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--bg3)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
          {trend > 5
            ? `🔥 You're trending up +${trend} pts from last week. Keep this energy.`
            : trend >= 0
            ? `📈 Holding steady. Consistency is the game — keep showing up.`
            : `⚡ Down ${Math.abs(trend)} pts from last week. One focused week flips this. You know what to do.`}
        </div>
      )}
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

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
          {gap <= 10 ? " You're nearly matching your ideal self. Stay consistent." : gap <= 25 ? ' One focused week can close most of this gap.' : ' Pick the weakest pillar below and attack it first.'}
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
          const actual    = pillarScores[p.key] || 0
          const benchmark = IDEAL_WEEKLY_BENCHMARKS[p.key]
          const ideal     = benchmark?.score || 100
          const status    = getGapStatus(actual, p.key)
          const catchup   = getCatchUpPlan(p.key, actual)
          const weight    = PILLAR_WEIGHTS[p.key === 'learning' ? 'learning' : p.key]

          return (
            <div key={p.key} className="card" style={{ borderLeft: `3px solid ${p.color}` }}>
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
            const ideal  = IDEAL_WEEKLY_BENCHMARKS[p.key]?.score || 100
            const gap    = ideal - actual
            if (gap === 0) return <div key={p.key}>{p.icon} <strong>{p.label}:</strong> <span style={{ color: 'var(--green)' }}>✨ Perfect — matching {IDEAL_NAME}!</span></div>
            return (
              <div key={p.key}>
                {p.icon} <strong>{p.label}:</strong>{' '}
                <span style={{ color: gap <= 10 ? 'var(--amber)' : 'var(--red)' }}>
                  {IDEAL_NAME} scored {ideal}. You scored {actual}. That's {gap} points and roughly{' '}
                  {p.key === 'fitness'  ? `${Math.round(gap * 1.35)} minutes of training` :
                   p.key === 'learning' ? `${(gap * 0.07).toFixed(1)} hours of learning` :
                   p.key === 'habits'   ? `${Math.round(gap / 14)} habit misses per day` :
                   `${gap} execution points`} left on the table.
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Weekly history chart ── */}
      <WeeklyHistoryChart weeklyHistory={weeklyHistory} idealScore={idealScore} />

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
              { icon: '🧠', title: 'Atomic Habits',                   author: 'James Clear',              note: 'Identity-based habits. 2-minute rule. 4 laws of behaviour change.' },
              { icon: '📅', title: 'The 12 Week Year',                author: 'Brian Moran',              note: 'Treat each week like a quarter. 95% execution is world-class.' },
              { icon: '💪', title: 'Huberman Lab',                    author: 'Andrew Huberman',          note: '3x resistance + 135 min Zone 2/week + 7.5h sleep. Non-negotiable.' },
              { icon: '🧘', title: 'CBT + ACT',                       author: 'Aaron Beck + Steven Hayes',note: 'Daily check-ins, trigger awareness, thought reframing. The inner game.' },
              { icon: '❤️', title: 'Never Eat Alone + Give and Take', author: 'Ferrazzi + Grant',         note: '5-minute rule: genuine attention keeps relationships warm. Give first, always.' },
              { icon: '📚', title: 'Ultralearning',                   author: 'Scott Young',              note: 'Learn by doing. Retrieval practice beats re-reading. Teach to know.' },
              { icon: '🎯', title: 'The ONE Thing',                   author: 'Gary Keller',              note: "What's the ONE thing that makes everything else easier or unnecessary?" },
              { icon: '🔮', title: 'WOOP Method',                     author: 'Dr. Gabriele Oettingen',  note: 'Seeing your ideal self vividly increases follow-through. Science-backed.' },
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
