import { useState } from 'react'
import { calcIdealLifeScore, calcLifeScore, IDEAL_WEEKLY_BENCHMARKS, PILLAR_WEIGHTS, getGapStatus, getCatchUpPlan } from '../lib/idealJoseph'
import { scoreColor, formatDate } from '../lib/utils'

const PILLAR_META = [
  { key: 'habits',   label: 'Habits',   icon: '🧠', tab: 'habits',  pillar: 'habits'   },
  { key: 'weekly',   label: 'Weekly',   icon: '📅', tab: 'weekly',  pillar: 'weekly'   },
  { key: 'fitness',  label: 'Fitness',  icon: '💪', tab: 'fitness', pillar: 'fitness'  },
  { key: 'mental',   label: 'Mental',   icon: '🧘', tab: 'mental',  pillar: 'mental'   },
  { key: 'social',   label: 'Social',   icon: '❤️', tab: 'social',  pillar: 'social'   },
  { key: 'learning', label: 'Learning', icon: '📚', tab: 'learn',   pillar: 'learning' },
  { key: 'goals',    label: 'Goals',    icon: '🎯', tab: 'goals',   pillar: 'goals'    },
]

// What Ideal Joseph does every single day per pillar
const DAILY_IDEAL = {
  habits:   { label: 'All habits done',         desc: 'Every scheduled habit completed' },
  weekly:   { label: 'Weekly plan active',       desc: 'Top 3 goals set for this week' },
  fitness:  { label: 'Workout or check-in',      desc: 'Any workout logged today' },
  mental:   { label: 'Morning check-in done',    desc: 'Intention + mood logged' },
  social:   { label: 'Someone contacted',        desc: 'Reached out to at least one person' },
  learning: { label: 'Learning session logged',  desc: 'At least one session today' },
  goals:    { label: 'ONE Thing done',           desc: 'Next action on a goal completed' },
}

function ScoreRing({ score, size = 80, color }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg4)" strokeWidth={6} />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke={color || scoreColor(score)}
          strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="score-ring-label">
        <div className="score-ring-number" style={{ fontSize: size * 0.28, color: color || scoreColor(score) }}>{score}</div>
      </div>
    </div>
  )
}

function GapBar({ label, actual, ideal, color }) {
  return (
    <div className="gap-bar-row">
      <span className="gap-bar-label">{label}</span>
      <div className="gap-bar-track">
        <div className="gap-bar-you" style={{ width: `${actual}%`, background: color }} />
        <div className="gap-bar-ideal" style={{ left: `${ideal}%` }} />
      </div>
      <span className="gap-bar-score" style={{ color }}>{actual}</span>
    </div>
  )
}

// ─── Daily checklist card ─────────────────────────────────────────────────────

function DailyChecklistCard({ checks, dailyScore, onTabChange }) {
  return (
    <div className="card" style={{ gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="card-title" style={{ margin: 0 }}>Today vs Ideal Joseph</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: scoreColor(dailyScore) }}>
          {checks.filter(c => c.done).length}/{checks.length}
          <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>done today</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {checks.map(c => (
          <div
            key={c.key}
            onClick={() => onTabChange(c.tab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 8, cursor: 'pointer',
              background: c.done ? 'rgba(34,197,94,0.07)' : 'var(--bg3)',
              border: `1px solid ${c.done ? 'rgba(34,197,94,0.25)' : 'var(--border)'}`,
              transition: 'border-color 0.15s',
            }}
          >
            {/* Checkbox */}
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: c.done ? 'var(--green)' : 'transparent',
              border: `2px solid ${c.done ? 'var(--green)' : 'var(--border2)'}`,
            }}>
              {c.done && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{ fontSize: 16 }}>{c.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.done ? 'var(--text2)' : 'var(--text)', textDecoration: c.done ? 'line-through' : 'none' }}>
                {DAILY_IDEAL[c.key].label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{DAILY_IDEAL[c.key].desc}</div>
            </div>
            <span style={{ fontSize: 11, color: c.done ? 'var(--green)' : 'var(--text3)', fontWeight: 600 }}>
              {c.done ? 'Done ✓' : 'Tap →'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardView({ pillarScores, lifeScore, habitsData, weeklyData, fitnessData, mentalData, socialData, learnData, goalsData, onTabChange, journeyStartDate, dayNumber }) {
  const [viewMode, setViewMode] = useState('daily') // 'daily' | 'weekly'

  const idealScore  = calcIdealLifeScore()
  const today       = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const todayStr    = formatDate()
  const dowIndex    = new Date().getDay() // 0=Sun,1=Mon...6=Sat
  const isLateWeek  = dowIndex >= 4 || dowIndex === 0 // Thu, Fri, Sat, Sun

  const todayHabitScore = habitsData.getTodayScore()
  const currentPlan     = weeklyData.getCurrentPlan()

  // ── Build daily checks ───────────────────────────────────────────────────────
  const todayWorkout   = fitnessData.workouts.some(w => w.date === todayStr)
  const todayMental    = mentalData.logs.some(l => l.date === todayStr && l.morning)
  const todayLearning  = learnData.learnings.some(l => l.date === todayStr)
  const todaySocial    = socialData.people.some(p => p.lastContacted === todayStr)
  const todayGoalDone  = goalsData.goals.some(g =>
    (g.milestones || []).some(m => (m.tasks || []).some(t => t.done && t.completedAt === todayStr))
  )

  const dailyChecks = [
    { key: 'habits',   icon: '🧠', tab: 'habits',  done: todayHabitScore === 100 },
    { key: 'weekly',   icon: '📅', tab: 'weekly',  done: !!(currentPlan?.goals?.some(g => g.text)) },
    { key: 'fitness',  icon: '💪', tab: 'fitness', done: todayWorkout },
    { key: 'mental',   icon: '🧘', tab: 'mental',  done: todayMental },
    { key: 'social',   icon: '❤️', tab: 'social',  done: todaySocial },
    { key: 'learning', icon: '📚', tab: 'learn',   done: todayLearning },
    { key: 'goals',    icon: '🎯', tab: 'goals',   done: todayGoalDone },
  ]

  const dailyScore = Math.round((dailyChecks.filter(c => c.done).length / dailyChecks.length) * 100)

  // ── Catch-up banners — smarter rules ────────────────────────────────────────
  // Mon–Wed: only show if gap > 40 (truly catastrophic)
  // Thu–Sun: show if gap > 20 (lagging or behind)
  const suppressComparisons = dayNumber != null && dayNumber <= 7
  const catchupPillars = suppressComparisons
    ? []
    : PILLAR_META.filter(p => {
        const score = pillarScores[p.key] || 0
        const ideal = IDEAL_WEEKLY_BENCHMARKS[p.pillar]?.score || 100
        const gap   = ideal - score
        if (isLateWeek) return gap > 20   // Thu–Sun: lagging or behind
        return gap > 40                    // Mon–Wed: only truly catastrophic
      })

  // Real data stats
  const weekWorkouts      = fitnessData.getWeekWorkouts().length
  const weekLearnSessions = learnData.getWeekLearnings().length
  const deepWorkHours     = currentPlan?.deepWorkHours ? parseFloat(currentPlan.deepWorkHours) : null
  const mentalWeekScore   = pillarScores['mental'] || 0

  // Display score depends on mode
  const displayScore = viewMode === 'daily' ? dailyScore : lifeScore
  const displayIdeal = 100 // daily ideal is always 100% (all 7 done)

  return (
    <div className="fade-in">
      {/* Catch-up banners */}
      {catchupPillars.map(p => {
        const plan = getCatchUpPlan(p.pillar, pillarScores[p.key] || 0)
        if (!plan) return null
        const gap = (IDEAL_WEEKLY_BENCHMARKS[p.pillar]?.score || 100) - (pillarScores[p.key] || 0)
        return (
          <div key={p.key} className="catchup-banner">
            <h4>{isLateWeek && gap > 20 ? '⏰' : '🔴'} {isLateWeek ? 'End-of-week push' : 'Far behind'} — {p.label} ({gap} pts gap)</h4>
            <p>{plan}</p>
          </div>
        )
      })}

      {/* Top row: Life Score + today snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>

        {/* Score card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 28 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
            {viewMode === 'daily' ? 'Today\'s Score' : 'Life Score'}
          </div>
          <div className="life-score-big" style={{ fontSize: viewMode === 'daily' ? 64 : 72 }}>{displayScore}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            {viewMode === 'daily'
              ? `${dailyChecks.filter(c => c.done).length} of 7 pillars done today`
              : `Ideal Joseph: ${idealScore}`}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: displayScore >= (viewMode === 'daily' ? 85 : idealScore * 0.85) ? 'var(--green)' : displayScore >= 50 ? 'var(--amber)' : 'var(--red)' }}>
            {suppressComparisons
              ? `🌱 Day ${dayNumber} — just getting started`
              : viewMode === 'daily'
                ? displayScore === 100 ? '🌟 Perfect day!' : displayScore >= 71 ? '⚡ Strong day' : displayScore >= 43 ? '📈 Keep going' : '🎯 Get started'
                : lifeScore >= idealScore * 0.85 ? '✓ On track' : `${idealScore - lifeScore} pts behind ideal`}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            {viewMode === 'daily' ? 'resets at midnight' : 'week average'}
          </div>
        </div>

        {/* Today snapshot */}
        <div className="card">
          <div className="card-title">Today — {today}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: scoreColor(todayHabitScore) }}>
                {todayHabitScore}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Habits today</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--blue)' }}>
                {weekWorkouts}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Workouts this week</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--amber)' }}>
                {weekLearnSessions}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Learning sessions</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: deepWorkHours !== null ? scoreColor(Math.round((deepWorkHours / 28) * 100)) : 'var(--text3)' }}>
                {deepWorkHours !== null ? `${deepWorkHours}h` : '—'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Deep work hrs</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: mentalWeekScore > 0 ? scoreColor(mentalWeekScore) : 'var(--text3)' }}>
                {mentalWeekScore > 0 ? mentalWeekScore : '—'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Mental score</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>
                {goalsData.goals.filter(g => g.status === 'active').length}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Active goals</div>
            </div>
          </div>

          {currentPlan?.goals?.filter(g => g.text).length > 0 && (
            <>
              <div className="divider" />
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>This week's top goals</div>
              {currentPlan.goals.filter(g => g.text).slice(0, 3).map((g, i) => (
                <div key={i} className="checkbox-row" style={{ padding: '6px 0', cursor: 'default' }}>
                  <div className={`checkbox ${g.done ? 'checked' : ''}`}>{g.done ? '✓' : ''}</div>
                  <span style={{ fontSize: 13, color: g.done ? 'var(--text3)' : 'var(--text)', textDecoration: g.done ? 'line-through' : 'none' }}>
                    {g.text}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Pillar section header with Daily / Weekly toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', letterSpacing: 0.3 }}>
          {viewMode === 'daily' ? '📋 Today vs Ideal Joseph' : '📊 This Week vs Ideal Joseph'}
        </div>
        <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border2)' }}>
          {[
            { id: 'daily',  label: '☀️ Daily' },
            { id: 'weekly', label: '📅 Weekly' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id)}
              style={{
                padding: '6px 16px', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                background: viewMode === m.id ? 'var(--accent)' : 'var(--bg3)',
                color: viewMode === m.id ? '#fff' : 'var(--text3)',
                transition: 'all 0.15s',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pillar grid — switches between daily checklist and weekly gap bars */}
      <div className="grid-3" style={{ marginBottom: 16 }}>
        {viewMode === 'daily' ? (
          <>
            {/* Daily pillar cards — show done/not-done with what to do */}
            {dailyChecks.map(c => {
              const meta   = PILLAR_META.find(p => p.key === c.key)
              const weekly = pillarScores[c.key] || 0
              return (
                <div
                  key={c.key}
                  className="card"
                  style={{ cursor: 'pointer', transition: 'border-color 0.15s', borderLeft: `3px solid ${c.done ? 'var(--green)' : 'var(--border2)'}` }}
                  onClick={() => onTabChange(meta.tab)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = c.done ? 'var(--green)' : 'var(--border2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = c.done ? 'var(--green)' : 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{meta.icon}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{meta.label}</span>
                    </div>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: c.done ? 'var(--green)' : 'transparent',
                      border: `2px solid ${c.done ? 'var(--green)' : 'var(--border2)'}`,
                    }}>
                      {c.done && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: c.done ? 'var(--green)' : 'var(--text2)', fontWeight: 600, marginBottom: 4 }}>
                    {c.done ? '✓ ' : '○ '}{DAILY_IDEAL[c.key].label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
                    {DAILY_IDEAL[c.key].desc}
                  </div>
                  {/* Weekly progress bar as context */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${weekly}%`, background: scoreColor(weekly) }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>{weekly} wk</span>
                  </div>
                </div>
              )
            })}

            {/* Daily checklist summary card */}
            <DailyChecklistCard checks={dailyChecks} dailyScore={dailyScore} onTabChange={onTabChange} />
          </>
        ) : (
          <>
            {/* Weekly pillar cards — existing gap view */}
            {PILLAR_META.map(p => {
              const score  = pillarScores[p.key] || 0
              const ideal  = IDEAL_WEEKLY_BENCHMARKS[p.pillar]?.score || 100
              const gap    = ideal - score
              const status = getGapStatus(score, p.pillar)
              return (
                <div
                  key={p.key}
                  className="card"
                  style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onClick={() => onTabChange(p.tab)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{p.icon}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{p.label}</span>
                    </div>
                    <span className={`badge ${status === 'on-track' ? 'badge-green' : status === 'lagging' ? 'badge-amber' : 'badge-red'}`}>
                      {status === 'on-track' ? '✓ On track' : status === 'lagging' ? '↑ Lagging' : '⚠ Behind'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <ScoreRing score={score} size={64} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>vs Ideal Joseph ({ideal})</div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${score}%`, background: scoreColor(score) }} />
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, color: gap > 0 ? 'var(--amber)' : 'var(--green)' }}>
                        {gap > 0 ? `${gap} pts gap` : 'Matching ideal!'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                    {IDEAL_WEEKLY_BENCHMARKS[p.pillar]?.framework}
                  </div>
                </div>
              )
            })}

            {/* Gap overview card */}
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <div className="card-title">You vs Ideal Joseph — this week</div>
              {PILLAR_META.map(p => (
                <GapBar
                  key={p.key}
                  label={p.label}
                  actual={pillarScores[p.key] || 0}
                  ideal={IDEAL_WEEKLY_BENCHMARKS[p.pillar]?.score || 100}
                  color={scoreColor(pillarScores[p.key] || 0)}
                />
              ))}
              <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12, color: 'var(--text3)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 4, background: 'var(--accent)', display: 'inline-block', borderRadius: 2 }} /> You
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 2, height: 12, background: '#fbbf24', display: 'inline-block' }} /> Ideal Joseph
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Active goals quick view */}
      {goalsData.goals.filter(g => g.status === 'active').length > 0 && (
        <div className="card">
          <div className="card-title">Active goals</div>
          <div className="grid-3">
            {goalsData.goals.filter(g => g.status === 'active').slice(0, 3).map(goal => (
              <div key={goal.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{goal.title}</div>
                <div className="progress-bar" style={{ marginBottom: 4 }}>
                  <div className="progress-fill" style={{ width: `${goal.progress || 0}%`, background: scoreColor(goal.progress || 0) }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{goal.progress || 0}% complete</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
