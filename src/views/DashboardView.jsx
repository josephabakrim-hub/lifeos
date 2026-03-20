import { calcIdealLifeScore, IDEAL_WEEKLY_BENCHMARKS, PILLAR_WEIGHTS, getGapStatus, getCatchUpPlan } from '../lib/idealJoseph'
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

export default function DashboardView({ pillarScores, lifeScore, habitsData, weeklyData, fitnessData, mentalData, socialData, learnData, goalsData, onTabChange, journeyStartDate, dayNumber }) {
  const idealScore = calcIdealLifeScore()
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const todayHabitScore = habitsData.getTodayScore()
  const currentPlan = weeklyData.getCurrentPlan()

  // Suppress catch-up banners in first 7 days — give time to get going
  const suppressComparisons = dayNumber != null && dayNumber <= 7
  const catchupPillars = suppressComparisons
    ? []
    : PILLAR_META.filter(p => getGapStatus(pillarScores[p.key] || 0, p.pillar) === 'behind')

  // Real data only — no keyword parsing
  const weekWorkouts = fitnessData.getWeekWorkouts().length
  const weekLearnSessions = learnData.getWeekLearnings().length
  const deepWorkHours = currentPlan?.deepWorkHours ? parseFloat(currentPlan.deepWorkHours) : null

  // Mental data — only if the section exists and has real data
  const mentalWeekScore = pillarScores['mental'] || 0

  return (
    <div className="fade-in">
      {/* Catch-up banners */}
      {catchupPillars.map(p => {
        const plan = getCatchUpPlan(p.pillar, pillarScores[p.key] || 0)
        if (!plan) return null
        return (
          <div key={p.key} className="catchup-banner">
            <h4>🔴 Catch-up needed — {p.label}</h4>
            <p>{plan}</p>
          </div>
        )
      })}

      {/* Top row: Life Score + today snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>

        {/* Life Score card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 28 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Life Score</div>
          <div className="life-score-big">{lifeScore}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>Ideal Joseph: {idealScore}</div>
          <div style={{ fontSize: 11, color: lifeScore >= idealScore * 0.85 ? 'var(--green)' : 'var(--amber)', fontWeight: 600 }}>
            {suppressComparisons
              ? `🌱 Day ${dayNumber} — just getting started`
              : lifeScore >= idealScore * 0.85
                ? '✓ On track'
                : `${idealScore - lifeScore} pts behind ideal`}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>week average</div>
        </div>

        {/* Today snapshot — only real tracked data */}
        <div className="card">
          <div className="card-title">Today — {today}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>

            {/* Habits — real, from useHabits */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: scoreColor(todayHabitScore) }}>
                {todayHabitScore}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Habits today</div>
            </div>

            {/* Workouts — real, from useFitness */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--blue)' }}>
                {weekWorkouts}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Workouts this week</div>
            </div>

            {/* Learning sessions — real, from useLearn */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--amber)' }}>
                {weekLearnSessions}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Learning sessions</div>
            </div>

            {/* Deep work hours — real, from weekly plan input only */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: deepWorkHours !== null ? scoreColor(Math.round((deepWorkHours / 28) * 100)) : 'var(--text3)' }}>
                {deepWorkHours !== null ? `${deepWorkHours}h` : '—'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Deep work hrs</div>
            </div>

            {/* Mental score — real, from useMental */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: mentalWeekScore > 0 ? scoreColor(mentalWeekScore) : 'var(--text3)' }}>
                {mentalWeekScore > 0 ? mentalWeekScore : '—'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Mental score</div>
            </div>

            {/* Active goals count — real, from useGoals */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>
                {goalsData.goals.filter(g => g.status === 'active').length}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Active goals</div>
            </div>

          </div>

          {/* This week's top goals */}
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

      {/* Pillars grid */}
      <div className="grid-3" style={{ marginBottom: 16 }}>
        {PILLAR_META.map(p => {
          const score = pillarScores[p.key] || 0
          const ideal = IDEAL_WEEKLY_BENCHMARKS[p.pillar]?.score || 100
          const gap = ideal - score
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
