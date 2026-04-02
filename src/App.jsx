import { useState } from 'react'
import { useHabits }   from './hooks/useHabits'
import { useWeekly }   from './hooks/useWeekly'
import { useFitness }  from './hooks/useFitness'
import { useMental }   from './hooks/useMental'
import { useSocial }   from './hooks/useSocial'
import { useLearn }    from './hooks/useLearn'
import { useGoals }    from './hooks/useGoals'
import { useJourney }  from './hooks/useJourney'
import { calcLifeScore } from './lib/idealJoseph'
import DashboardView   from './views/DashboardView'
import HabitsView      from './views/HabitsView'
import WeeklyView      from './views/WeeklyView'
import FitnessView     from './views/FitnessView'
import MentalView      from './views/MentalView'
import SocialView      from './views/SocialView'
import LearnView       from './views/LearnView'
import GoalsView       from './views/GoalsView'
import IdealJosephView from './views/IdealJosephView'

const TABS = [
  { id: 'dashboard', label: 'Dashboard',   icon: '⚡' },
  { id: 'habits',    label: 'Habits',       icon: '🧠' },
  { id: 'weekly',    label: 'Weekly',       icon: '📅' },
  { id: 'fitness',   label: 'Fitness',      icon: '💪' },
  { id: 'mental',    label: 'Mental',       icon: '🧘' },
  { id: 'social',    label: 'Social',       icon: '❤️' },
  { id: 'learn',     label: 'Learn',        icon: '📚' },
  { id: 'goals',     label: 'Goals',        icon: '🎯' },
  { id: 'ideal',     label: 'Ideal Joseph', icon: '👤', special: true },
]

// ─── Pre-journey screen shown until the user clicks "Begin" ──────────────────

function JourneyStartScreen({ onBegin, onExplore }) {
  const [confirming, setConfirming] = useState(false)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'var(--bg)', textAlign: 'center' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #7c6aff, #c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', boxShadow: '0 4px 20px rgba(124,106,255,0.4)' }}>L</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800 }}>
          Life<span style={{ background: 'linear-gradient(135deg, #9f91ff, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>OS</span>
        </div>
      </div>

      {/* Main card */}
      <div style={{ maxWidth: 520, width: '100%' }}>
        <div style={{ fontSize: 42, marginBottom: 16 }}>🌅</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
          Your system is ready.<br />You decide when to start.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 32 }}>
          LifeOS tracks your progress against Ideal Joseph — the best version of you. But that comparison only makes sense from the day <em>you</em> choose to begin. There's no pressure. When you're ready, click the button below and today becomes Day 1.
        </p>

        {/* Framework pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
          {['🧠 Atomic Habits', '📅 12 Week Year', '💪 Huberman Lab', '🧘 CBT + ACT', '❤️ Dunbar\'s Layers', '📚 Ultralearning', '🎯 The ONE Thing'].map(f => (
            <span key={f} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text3)' }}>{f}</span>
          ))}
        </div>

        {/* CTA */}
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            style={{ padding: '16px 40px', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #7c6aff, #c084fc)', color: '#fff', boxShadow: '0 4px 20px rgba(124,106,255,0.4)', transition: 'transform 0.1s, box-shadow 0.1s', letterSpacing: 0.3 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(124,106,255,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,106,255,0.4)' }}
          >
            I'm ready — begin my journey
          </button>
        ) : (
          <div style={{ padding: '20px 24px', borderRadius: 12, background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.3)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Starting today — {today}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.6 }}>
              This becomes your Day 1. All scoring and comparisons with Ideal Joseph start from this moment.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn" onClick={() => setConfirming(false)}>Not yet</button>
              <button
                onClick={onBegin}
                style={{ padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #7c6aff, #c084fc)', color: '#fff' }}
              >
                ✓ Yes, start today
              </button>
            </div>
          </div>
        )}

        {/* Explore link — no commitment, just browse */}
        <div style={{ marginTop: 28 }}>
          <button
            onClick={onExplore}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text3)', textDecoration: 'underline', padding: 0 }}
          >
            Not ready yet — explore the app first →
          </button>
          <p style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
            You can set up habits, goals, and your people list without committing to a start date.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Sticky "begin journey" banner shown while exploring ──────────────────────

function JourneyBanner({ onBegin }) {
  const [confirming, setConfirming] = useState(false)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(124,106,255,0.12), rgba(192,132,252,0.08))', border: '1px solid rgba(124,106,255,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent2)', marginBottom: 2 }}>🌅 You're in explore mode — scores aren't tracking yet</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Set up your habits, goals, and people first. When you're ready, begin your journey and Day 1 starts.</div>
      </div>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #7c6aff, #c084fc)', color: '#fff', flexShrink: 0 }}
        >
          Begin journey
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>Start today — {today}?</span>
          <button className="btn btn-sm" onClick={() => setConfirming(false)}>Not yet</button>
          <button onClick={onBegin} style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #7c6aff, #c084fc)', color: '#fff' }}>
            ✓ Yes, Day 1
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab,  setActiveTab]  = useState('dashboard')
  const [exploring,  setExploring]  = useState(false) // bypass start screen without committing

  const journey     = useJourney()
  const habitsData  = useHabits()
  const weeklyData  = useWeekly()
  const fitnessData = useFitness()
  const mentalData  = useMental()
  const socialData  = useSocial()
  const learnData   = useLearn()
  const goalsData   = useGoals()

  // Scores only count once journey has formally started
  const pillarScores = journey.journeyStarted ? {
    habits:   habitsData.getWeekScore(),
    weekly:   weeklyData.getWeekScore(),
    fitness:  fitnessData.getWeekScore(),
    mental:   mentalData.getWeekScore(),
    social:   socialData.getWeekScore(),
    learning: learnData.getWeekScore(),
    goals:    goalsData.getWeekScore(),
  } : { habits: 0, weekly: 0, fitness: 0, mental: 0, social: 0, learning: 0, goals: 0 }

  const lifeScore = journey.journeyStarted ? calcLifeScore(pillarScores) : 0

  if (journey.loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading...</div>
      </div>
    )
  }

  // Show start screen only if: journey not started AND not in explore mode
  if (!journey.journeyStarted && !exploring) {
    return (
      <JourneyStartScreen
        onBegin={journey.beginJourney}
        onExplore={() => setExploring(true)}
      />
    )
  }

  const dayNum = journey.journeyStarted ? journey.dayNumber() : null

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #7c6aff, #c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-display)', color: '#fff', flexShrink: 0, letterSpacing: -1, boxShadow: '0 2px 12px rgba(124,106,255,0.35)' }}>L</div>
          <div>
            <div className="header-logo">
              Life<span style={{ background: 'linear-gradient(135deg, #9f91ff, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>OS</span>
            </div>
            <div className="header-subtitle">
              {!journey.journeyStarted
                ? '🔍 Explore mode — not tracking yet'
                : dayNum <= 7
                ? `🌱 Day ${dayNum} — welcome to your journey`
                : dayNum <= 30
                ? `⚡ Day ${dayNum} — building momentum`
                : dayNum <= 90
                ? `🔥 Day ${dayNum} — consistency is compounding`
                : `🌟 Day ${dayNum} — you've built something real`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Life Score</span>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, background: 'linear-gradient(135deg, #9f91ff, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {lifeScore}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tabs-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.special ? 'ideal-tab' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="content">
        {activeTab === 'dashboard' && (
          <>
            {!journey.journeyStarted && (
              <JourneyBanner onBegin={journey.beginJourney} />
            )}
            <DashboardView
              pillarScores={pillarScores}
              lifeScore={lifeScore}
              habitsData={habitsData}
              weeklyData={weeklyData}
              fitnessData={fitnessData}
              mentalData={mentalData}
              socialData={socialData}
              learnData={learnData}
              goalsData={goalsData}
              onTabChange={setActiveTab}
              journeyStartDate={journey.startDate}
              dayNumber={dayNum}
            />
          </>
        )}
        {activeTab === 'habits'  && <HabitsView  {...habitsData} />}
        {activeTab === 'weekly'  && (
          <WeeklyView
            {...weeklyData}
            savePlan={data => weeklyData.savePlan({ ...data, lifeScore })}
          />
        )}
        {activeTab === 'fitness' && <FitnessView {...fitnessData} />}
        {activeTab === 'mental'  && <MentalView  {...mentalData} />}
        {activeTab === 'social'  && <SocialView  {...socialData} />}
        {activeTab === 'learn'   && <LearnView   {...learnData} />}
        {activeTab === 'goals'   && <GoalsView   {...goalsData} />}
        {activeTab === 'ideal'   && (
          <IdealJosephView
            pillarScores={pillarScores}
            lifeScore={lifeScore}
            weeklyHistory={(weeklyData.plans || [])
              .filter(p => p.weekStart && p.lifeScore != null)
              .map(p => ({ week: p.weekStart, score: p.lifeScore }))
            }
          />
        )}
      </main>
    </div>
  )
}
