import { useState, useMemo } from 'react'
import { IDEAL_WEEKLY_BENCHMARKS, IDEAL_NAME, calcIdealLifeScore, PILLAR_WEIGHTS, getCatchUpPlan, getGapStatus } from '../lib/idealJoseph'
import { scoreColor } from '../lib/utils'

// ── Fix 4: Specific fitness gap translation ──────────────────────────────────
// Instead of a meaningless "X minutes of training", tell the user exactly
// what they need: resistance sessions and/or Zone 2 minutes
function getFitnessGapText(gap, actualScore) {
  const resNeeded  = actualScore < 35 ? '1–2 more resistance sessions' : null
  const zone2Needed = actualScore < 70 ? '45–90 more Zone 2 minutes (or HIIT/jogging)' : null
  const sleepNeeded = actualScore < 90 ? '7.5h sleep logged each day' : null
  const parts = [resNeeded, zone2Needed, sleepNeeded].filter(Boolean)
  if (!parts.length) return `${gap} points — you're close, stay consistent`
  return parts.join(' + ')
}

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

// ─── Progress curve chart (TradingView-style) ────────────────────────────────

// ─── Weekly candle bar chart ──────────────────────────────────────────────────
// Each bar = one week's total Life Score. Score printed in the middle of the bar.
// A horizontal gold dashed line sits at Ideal Joseph's score across the whole chart.

function WeeklyBarChart({ weeklyHistory = [], idealScore, extended }) {
  const weeks = extended
    ? weeklyHistory.slice(-30)
    : weeklyHistory.slice(-12)

  if (!weeks.length) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
        No weekly history yet — keep logging and bars will appear here.
      </div>
    )
  }

  // Chart dimensions
  const CHART_H = 200   // total height of the bar area (0–100 scale)
  const BAR_GAP = 6

  return (
    <div style={{ marginTop: 4 }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 16, height: 12, borderRadius: 3, background: 'linear-gradient(180deg,#9f91ff,#7c6aff)', display: 'inline-block' }} />
          Weekly Life Score
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 18, borderTop: '2px dashed #fbbf24', display: 'inline-block' }} />
          Ideal Joseph ({idealScore})
        </span>
      </div>

      {/* Scrollable bar area */}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{
          position: 'relative',
          height: CHART_H + 40,  // +40 for x-axis labels
          minWidth: weeks.length * 44,
          display: 'flex',
          alignItems: 'flex-end',
          gap: BAR_GAP,
          paddingBottom: 28,     // space for labels
          paddingTop: 12,        // space above bars
          boxSizing: 'border-box',
        }}>

          {/* Ideal Joseph horizontal line — spans full width */}
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            // position from bottom: idealScore% of bar area
            bottom: 28 + (idealScore / 100) * (CHART_H - 12),
            borderTop: '2px dashed #fbbf24',
            opacity: 0.85,
            zIndex: 2,
            pointerEvents: 'none',
          }}>
            <span style={{
              position: 'absolute',
              right: 0,
              top: -16,
              fontSize: 10,
              fontWeight: 700,
              color: '#fbbf24',
              background: 'var(--bg)',
              padding: '1px 4px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
            }}>
              Ideal {idealScore}
            </span>
          </div>

          {/* Bars */}
          {weeks.map((wk, i) => {
            const score = wk.score ?? 0
            const barH  = Math.max(24, (score / 100) * (CHART_H - 12))
            const hitIdeal = score >= idealScore
            const isCurrentWeek = i === weeks.length - 1

            const label = new Date(wk.week + 'T12:00:00').toLocaleDateString('en-US', {
              month: 'short', day: 'numeric',
            })

            return (
              <div key={wk.week} style={{
                flex: '1 0 36px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                position: 'relative',
                height: '100%',
              }}>
                {/* Bar */}
                <div style={{
                  width: '100%',
                  height: barH,
                  borderRadius: '5px 5px 3px 3px',
                  background: hitIdeal
                    ? 'linear-gradient(180deg, #22c55e, #16a34a)'
                    : isCurrentWeek
                    ? 'linear-gradient(180deg, #c084fc, #7c6aff)'
                    : 'linear-gradient(180deg, #9f91ff 0%, #6d5fff 100%)',
                  opacity: isCurrentWeek ? 1 : 0.72,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isCurrentWeek ? '0 0 10px rgba(192,132,252,0.4)' : 'none',
                  border: hitIdeal ? '1px solid rgba(34,197,94,0.5)' : isCurrentWeek ? '1px solid rgba(192,132,252,0.4)' : 'none',
                  transition: 'height 0.5s ease',
                  minHeight: 24,
                  flexShrink: 0,
                  zIndex: 1,
                }}>
                  {/* Score number in the middle of the bar */}
                  <span style={{
                    fontSize: barH > 32 ? 11 : 9,
                    fontWeight: 800,
                    color: '#fff',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: -0.3,
                    lineHeight: 1,
                    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    userSelect: 'none',
                  }}>
                    {score}
                  </span>
                  {/* ★ if hit ideal */}
                  {hitIdeal && (
                    <span style={{ position: 'absolute', top: -14, fontSize: 10 }}>⭐</span>
                  )}
                </div>

                {/* X-axis label */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  fontSize: 9,
                  color: isCurrentWeek ? '#c084fc' : 'var(--text3)',
                  fontWeight: isCurrentWeek ? 700 : 400,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {isCurrentWeek ? 'Now' : label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ProgressCurveChart({ weeklyHistory = [], pillarScores, idealScore }) {
  const [timeframe, setTimeframe] = useState('weekly')
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [chartView, setChartView] = useState('curve') // 'curve' | 'bars'
  const [extended, setExtended]   = useState(false)    // false=12wks, true=30wks

  // ── Build daily data from weeklyHistory pillar breakdowns ────────────────
  // We approximate daily by interpolating between weekly data points
  const dailyData = useMemo(() => {
    if (!weeklyHistory.length) return []
    const points = []
    weeklyHistory.forEach((wk, wi) => {
      const weekStart = new Date(wk.week + 'T12:00:00')
      for (let d = 0; d < 7; d++) {
        const day = new Date(weekStart)
        day.setDate(day.getDate() + d)
        const dateStr = day.toISOString().split('T')[0]
        const today = new Date().toISOString().split('T')[0]
        if (dateStr > today) break
        // Interpolate score across the week with slight natural variation
        const nextScore = wi < weeklyHistory.length - 1 ? weeklyHistory[wi + 1].score : wk.score
        const t = d / 6
        const interpolated = Math.round(wk.score + (nextScore - wk.score) * t * 0.6)
        points.push({ date: dateStr, score: Math.max(0, Math.min(100, interpolated)), label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })
      }
    })
    return points
  }, [weeklyHistory])

  // ── Build monthly data ───────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    if (!weeklyHistory.length) return []
    const byMonth = {}
    weeklyHistory.forEach(wk => {
      const d = new Date(wk.week + 'T12:00:00')
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!byMonth[key]) byMonth[key] = []
      byMonth[key].push(wk.score)
    })
    return Object.entries(byMonth).sort().map(([key, scores]) => {
      const [year, month] = key.split('-')
      const d = new Date(parseInt(year), parseInt(month) - 1, 1)
      return {
        date: key,
        score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      }
    })
  }, [weeklyHistory])

  const weeklyData = useMemo(() => weeklyHistory.map(wk => ({
    date: wk.week,
    score: wk.score,
    label: new Date(wk.week + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })), [weeklyHistory])

  const data = timeframe === 'daily' ? dailyData : timeframe === 'weekly' ? weeklyData : monthlyData

  // Chart layout — only used in curve mode
  const W = 560, H = 160, PAD_L = 32, PAD_R = 24, PAD_T = 16, PAD_B = 28
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B

  const minScore = data.length ? Math.max(0, Math.min(...data.map(d => d.score)) - 10) : 0
  const maxScore = data.length ? Math.min(100, Math.max(...data.map(d => d.score)) + 10) : 100
  const range = maxScore - minScore || 10

  function xPos(i) { return PAD_L + (i / Math.max(data.length - 1, 1)) * chartW }
  function yPos(score) { return PAD_T + chartH - ((score - minScore) / range) * chartH }

  // Build SVG path
  const pts = data.map((d, i) => ({ x: xPos(i), y: yPos(d.score) }))

  // Smooth curve using cubic bezier
  function buildPath(points) {
    if (!points.length) return ''
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cp1x = prev.x + (curr.x - prev.x) * 0.4
      const cp1y = prev.y
      const cp2x = curr.x - (curr.x - prev.x) * 0.4
      const cp2y = curr.y
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
    }
    return d
  }

  const linePath  = buildPath(pts)
  const areaPath  = pts.length
    ? linePath + ` L ${pts[pts.length - 1].x} ${PAD_T + chartH} L ${PAD_L} ${PAD_T + chartH} Z`
    : ''

  const idealY = yPos(Math.min(maxScore, Math.max(minScore, idealScore)))

  // Summary stats
  const latest  = data[data.length - 1]?.score ?? 0
  const avg     = data.length ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length) : 0
  const best    = data.length ? Math.max(...data.map(d => d.score)) : 0
  const trend   = data.length >= 2 ? data[data.length - 1].score - data[data.length - 2].score : 0

  // X-axis labels: show up to 6 evenly spaced
  const xLabelIndices = useMemo(() => {
    if (data.length <= 6) return data.map((_, i) => i)
    const step = Math.floor(data.length / 5)
    const idxs = []
    for (let i = 0; i < data.length; i += step) idxs.push(i)
    if (!idxs.includes(data.length - 1)) idxs.push(data.length - 1)
    return idxs
  }, [data])

  const hovered = hoveredIdx !== null ? data[hoveredIdx] : null
  const hovX = hoveredIdx !== null ? xPos(hoveredIdx) : null
  const hovY = hoveredIdx !== null ? yPos(data[hoveredIdx]?.score ?? 0) : null

  return (
    <div className="card" style={{ marginTop: 20, border: '1px solid rgba(251,191,36,0.15)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div className="card-title" style={{ margin: 0, marginBottom: 2 }}>📈 Your progress curve</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>Life Score over time vs Ideal Joseph</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg3)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
            <button onClick={() => setChartView('curve')}
              style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: chartView === 'curve' ? 'var(--accent)' : 'transparent', color: chartView === 'curve' ? '#fff' : 'var(--text3)', transition: 'all 0.15s' }}>
              📈 Curve
            </button>
            <button onClick={() => setChartView('bars')}
              style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: chartView === 'bars' ? 'var(--accent)' : 'transparent', color: chartView === 'bars' ? '#fff' : 'var(--text3)', transition: 'all 0.15s' }}>
              📊 Bars
            </button>
          </div>
          {/* Timeframe toggle — only for curve */}
          {chartView === 'curve' && (
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
              {[{ id: 'daily', label: '1D' }, { id: 'weekly', label: '1W' }, { id: 'monthly', label: '1M' }].map(tf => (
                <button key={tf.id} onClick={() => { setTimeframe(tf.id); setHoveredIdx(null) }}
                  style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: timeframe === tf.id ? 'rgba(124,106,255,0.6)' : 'transparent', color: timeframe === tf.id ? '#fff' : 'var(--text3)', transition: 'all 0.15s' }}>
                  {tf.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bar chart view */}
      {chartView === 'bars' && (
        <>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', padding: 3, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 12, alignSelf: 'flex-start', width: 'fit-content' }}>
            <button onClick={() => setExtended(false)}
              style={{ padding: '4px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: !extended ? 'var(--accent)' : 'transparent', color: !extended ? '#fff' : 'var(--text3)', transition: 'all 0.15s' }}>
              Last 12 wks
            </button>
            <button onClick={() => setExtended(true)}
              style={{ padding: '4px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: extended ? 'var(--accent)' : 'transparent', color: extended ? '#fff' : 'var(--text3)', transition: 'all 0.15s' }}>
              Last 30 wks
            </button>
          </div>
          <WeeklyBarChart weeklyHistory={weeklyHistory} idealScore={idealScore} extended={extended} />
        </>
      )}

      {/* Curve view */}
      {chartView === 'curve' && <>
      {!data.length ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
          No history yet — keep logging and your curve will appear here.
        </div>
      ) : <>
      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {[
          { label: 'now', val: latest, color: '#9f91ff' },
          { label: 'avg', val: avg, color: '#3b82f6' },
          { label: 'best', val: best, color: '#22c55e' },
          { label: 'trend', val: (trend >= 0 ? '+' : '') + trend, color: trend >= 0 ? '#22c55e' : '#ef4444' },
        ].map(p => (
          <div key={p.label} style={{ padding: '3px 10px', borderRadius: 20, background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: 11 }}>
            <span style={{ color: 'var(--text3)' }}>{p.label} </span>
            <span style={{ fontWeight: 700, color: p.color }}>{p.val}</span>
          </div>
        ))}
        {data.filter(d => d.score >= idealScore).length > 0 && (
          <div style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', fontSize: 11 }}>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>★ {data.filter(d => d.score >= idealScore).length}× at ideal</span>
          </div>
        )}
      </div>

      {/* SVG Chart */}
      <div style={{ overflowX: 'auto', cursor: 'crosshair' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', minWidth: 320, display: 'block', userSelect: 'none' }}
          onMouseLeave={() => setHoveredIdx(null)}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const svgX = ((e.clientX - rect.left) / rect.width) * W
            const relX = svgX - PAD_L
            if (relX < 0 || relX > chartW) { setHoveredIdx(null); return }
            const idx = Math.round((relX / chartW) * (data.length - 1))
            setHoveredIdx(Math.max(0, Math.min(data.length - 1, idx)))
          }}
        >
          <defs>
            <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9f91ff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#9f91ff" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7c6aff" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(v => {
            if (v < minScore - 5 || v > maxScore + 5) return null
            const y = yPos(v)
            return (
              <g key={v}>
                <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 4" />
                <text x={PAD_L - 4} y={y + 4} fontSize={8} fill="var(--text3)" textAnchor="end">{v}</text>
              </g>
            )
          })}

          {/* Ideal Joseph reference line */}
          {idealY >= PAD_T && idealY <= PAD_T + chartH && (
            <g>
              <line x1={PAD_L} y1={idealY} x2={W - PAD_R} y2={idealY} stroke="#fbbf24" strokeWidth={1} strokeDasharray="5 3" opacity={0.7} />
              <text x={W - PAD_R + 2} y={idealY + 4} fontSize={8} fill="#fbbf24" fontWeight="600">Ideal</text>
            </g>
          )}

          {/* Area fill */}
          {areaPath && <path d={areaPath} fill="url(#curveGrad)" />}

          {/* Curve line */}
          {linePath && <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}

          {/* Hover vertical line */}
          {hovX !== null && (
            <line x1={hovX} y1={PAD_T} x2={hovX} y2={PAD_T + chartH} stroke="var(--border2)" strokeWidth={1} strokeDasharray="2 2" />
          )}

          {/* Data dots — just endpoints + hover */}
          {pts.length > 0 && (
            <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={3} fill="#c084fc" />
          )}
          {hovX !== null && hovY !== null && (
            <circle cx={hovX} cy={hovY} r={4} fill="#9f91ff" stroke="var(--bg)" strokeWidth={2} />
          )}

          {/* X-axis labels */}
          {xLabelIndices.map(i => (
            <text key={i} x={xPos(i)} y={H - 4} fontSize={8} fill={hoveredIdx === i ? '#9f91ff' : 'var(--text3)'} textAnchor="middle" fontWeight={hoveredIdx === i ? '700' : '400'}>
              {data[i]?.label}
            </text>
          ))}

          {/* Hover tooltip */}
          {hovered && hovX !== null && hovY !== null && (() => {
            const tipW = 80, tipH = 40
            const tipX = Math.min(W - PAD_R - tipW, Math.max(PAD_L, hovX - tipW / 2))
            const tipY = hovY > PAD_T + 50 ? hovY - tipH - 8 : hovY + 12
            const scoreC = hovered.score >= idealScore ? '#22c55e' : hovered.score >= idealScore - 15 ? '#f59e0b' : '#9f91ff'
            return (
              <g>
                <rect x={tipX} y={tipY} width={tipW} height={tipH} rx={6} fill="var(--bg)" stroke={scoreC} strokeWidth={1} />
                <text x={tipX + tipW / 2} y={tipY + 13} fontSize={9} fill="var(--text3)" textAnchor="middle">{hovered.label}</text>
                <text x={tipX + tipW / 2} y={tipY + 28} fontSize={14} fontWeight="800" fill={scoreC} textAnchor="middle" fontFamily="var(--font-display)">{hovered.score}</text>
              </g>
            )
          })()}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 16, height: 2, background: 'linear-gradient(90deg, #7c6aff, #c084fc)', display: 'inline-block', borderRadius: 1 }} />
          Your Life Score
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 14, height: 1, background: '#fbbf24', display: 'inline-block', borderRadius: 1, borderTop: '1px dashed #fbbf24' }} />
          Ideal Joseph ({idealScore})
        </span>
      </div>

      {/* Motivational note */}
      {data.length >= 2 && (
        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--bg3)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
          {trend > 5
            ? `🔥 Trending up +${trend} pts. That curve is going in the right direction.`
            : trend >= 0
            ? `📈 Holding steady. Consistency is the game — the curve tells the truth.`
            : `⚡ Down ${Math.abs(trend)} pts. One focused week flips this. You know what to do.`}
        </div>
      )}
      </>}
      </>}
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
                  {p.key === 'fitness'  ? getFitnessGapText(gap, pillarScores.fitness) :
                   p.key === 'learning' ? `${(gap * 0.07).toFixed(1)} hours of deep learning` :
                   p.key === 'habits'   ? `${Math.round(gap / 14)} habit misses per day` :
                   `${gap} execution points`} left on the table.
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Progress curve chart ── */}
      <ProgressCurveChart weeklyHistory={weeklyHistory} pillarScores={pillarScores} idealScore={idealScore} />

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
