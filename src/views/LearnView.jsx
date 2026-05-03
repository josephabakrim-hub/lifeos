import { useState, useMemo } from 'react'
import { formatDate, scoreColor, getWeekStart } from '../lib/utils'

// ─── Book Extract — pre-loaded library ───────────────────────────────────────

const BOOK_LIBRARY = [
  {
    id: 'titzone', title: 'Trading in the Zone', author: 'Mark Douglas', topic: 'Trading', emoji: '🧠',
    cards: [
      { id: '1', type: 'Principle',  front: 'Every trade outcome is statistically independent', back: 'Losing last time has zero bearing on this trade. Your edge plays out over a series, not a single outcome. Treat each trade as one instance of a probability.' },
      { id: '2', type: 'Principle',  front: 'The market doesn\'t know you exist', back: 'The market has no obligation to give you money. It isn\'t punishing or rewarding you personally. Price moves according to collective belief, not your position size.' },
      { id: '3', type: 'Framework',  front: 'The 5 trading truths you must believe', back: '1) Anything can happen. 2) You don\'t need to know what happens next to make money. 3) There is a random distribution of wins and losses. 4) An edge is just a higher probability. 5) Every moment in the market is unique.' },
      { id: '4', type: 'If-Then',    front: 'If I feel certain about a trade\'s outcome', back: 'Then I am in a mental danger zone. Certainty breeds overconfidence, oversizing, and failure to cut losses. Remind yourself: I only have an edge, not a guarantee.' },
      { id: '5', type: 'Principle',  front: 'Define your risk before you enter — always', back: 'The moment you enter without a defined stop is the moment the market controls you, not the other way around. Risk is the only variable you fully control.' },
      { id: '6', type: 'If-Then',    front: 'If a loss triggers anger or revenge trading', back: 'Then your belief system is broken, not your strategy. Anger is evidence that you expected an outcome the market didn\'t owe you. Step away and reset.' },
      { id: '7', type: 'Framework',  front: 'Two minds: analytical vs. trading mind', back: 'Analytical mind sees patterns in hindsight clearly. Trading mind must act in the live moment with uncertainty. You must train the trading mind separately through screen time and discipline.' },
      { id: '8', type: 'Principle',  front: 'Consistency comes from a consistent mental state', back: 'You can\'t think your way to discipline. You build it by executing your rules repeatedly until belief in your edge is deeper than fear of the next loss.' },
      { id: '9', type: 'If-Then',    front: 'If you deviate from your rules once and win', back: 'Then the danger is greater than if you\'d lost. A random reward reinforces bad process and teaches your brain that rules are optional.' },
      { id: '10', type: 'Question',  front: 'Am I trading my edge or trading my emotions right now?', back: 'Ask this before every entry. If you can\'t answer clearly, that\'s the answer. Emotional trading masquerades as analysis but is driven by fear, hope, or greed.' },
    ]
  },
  {
    id: 'disctrade', title: 'The Disciplined Trader', author: 'Mark Douglas', topic: 'Trading', emoji: '📈',
    cards: [
      { id: '1', type: 'Principle',  front: 'Fear is the primary obstacle to trading success', back: 'Fear of loss, fear of being wrong, fear of missing out. Each fear distorts perception and causes you to act against your own rules. Discipline is the antidote.' },
      { id: '2', type: 'Framework',  front: 'Three stages of trader development', back: 'Stage 1: Mechanical — following rules rigidly. Stage 2: Subjective — reading the market contextually. Stage 3: Intuitive — pattern recognition without conscious thought. Most traders never leave Stage 1.' },
      { id: '3', type: 'Principle',  front: 'Your beliefs about money shape every trade decision', back: 'If you believe money is scarce or that you don\'t deserve profits, you will unconsciously sabotage winning trades. Trading psychology begins with your relationship with money itself.' },
      { id: '4', type: 'If-Then',    front: 'If you move your stop loss to avoid being stopped out', back: 'Then you are letting hope override your system. This is the single most dangerous habit a trader can have. A stop is a decision made when thinking was clear — honour it.' },
      { id: '5', type: 'Principle',  front: 'The market is always right — your opinion is not', back: 'Having a strong view and holding a losing position are not the same as being a disciplined analyst. The market tells you the truth. Your opinion tells you what you wish were true.' },
      { id: '6', type: 'Question',   front: 'What rule am I about to break, and why?', back: 'State it out loud before breaking it. Making the justification explicit often exposes it as rationalisation. Most rule-breaks happen in silence, which is where they gain their power.' },
      { id: '7', type: 'Framework',  front: 'The pain-avoidance loop that destroys traders', back: 'Pain of loss → avoid losses → widen stops or hold losers → bigger loss → more pain. Breaking the loop requires accepting small losses as the cost of participation, not failures.' },
      { id: '8', type: 'If-Then',    front: 'If a trade hits your target and you feel reluctant to exit', back: 'Then greed has entered the picture. Take the profit. You can always re-enter. Greed at exits is as destructive as fear at entries.' },
      { id: '9', type: 'Principle',  front: 'Mental rehearsal before the session is not optional', back: 'Elite traders pre-experience likely scenarios before the open. When the scenario plays out live, the disciplined response is already wired. Reaction time and emotion are both reduced.' },
      { id: '10', type: 'Question',  front: 'Is this trade based on my system or my need to be active?', back: 'Boredom is one of the most underrated causes of bad trades. The need to participate is not a signal. If no setup exists, do nothing — that is also a disciplined decision.' },
    ]
  },
  {
    id: 'atomhab', title: 'Atomic Habits', author: 'James Clear', topic: 'Personal growth', emoji: '⚡',
    cards: [
      { id: '1', type: 'Principle',  front: '1% better every day is 37× better by year end', back: 'Habits are the compound interest of self-improvement. Small consistent improvements feel invisible in the moment but produce extraordinary results over years. The math forces this conclusion.' },
      { id: '2', type: 'Framework',  front: 'The 4 laws of behaviour change', back: 'Make it Obvious (cue) → Make it Attractive (craving) → Make it Easy (response) → Make it Satisfying (reward). To break a bad habit, invert each law: invisible, unattractive, difficult, unsatisfying.' },
      { id: '3', type: 'Principle',  front: 'Identity drives habits — not outcomes or processes', back: 'Don\'t aim to read more. Aim to be a reader. Every action is a vote for the identity you want to become. Habits are the evidence you collect about who you are.' },
      { id: '4', type: 'Framework',  front: 'Habit stacking: anchor new habits to existing ones', back: 'Formula: After [current habit], I will [new habit]. Example: After morning coffee, I will review my trading plan. The existing habit becomes a reliable cue requiring no willpower.' },
      { id: '5', type: 'If-Then',    front: 'If the environment makes bad habits easy', back: 'Then willpower will lose every time. Redesign the environment. Put the book on the pillow. Remove the phone from the desk. Architecture beats intention.' },
      { id: '6', type: 'Principle',  front: 'Never miss twice — the real rule', back: 'Missing once is an accident. Missing twice is the start of a new habit. One bad day doesn\'t ruin progress. Two in a row starts a downward spiral. The second miss is where the habit dies.' },
      { id: '7', type: 'Framework',  front: 'The Goldilocks Rule for sustained motivation', back: 'Humans peak in motivation when working at the edge of their ability — hard enough to stretch, easy enough to succeed. Design habits to stay in this zone. Too easy = boredom. Too hard = anxiety.' },
      { id: '8', type: 'If-Then',    front: 'If a habit feels hard to start', back: 'Then the implementation intention is missing. Specify when, where, and how: "I will [behaviour] at [time] in [location]." Vague intentions fail. Specific plans execute.' },
      { id: '9', type: 'Principle',  front: 'Make the reward immediate, not distant', back: 'The brain rewards behaviour that feels good now. If the benefit of a habit is months away, add an immediate reward. Track it, celebrate it, or pair it with something enjoyable.' },
      { id: '10', type: 'Question',  front: 'Does my environment make the right thing the default?', back: 'Audit your space. The choice architecture around you either supports or fights your habits. Friction is the enemy of new habits and the friend of habit-breaking.' },
    ]
  },
  {
    id: '12weekyr', title: 'The 12 Week Year', author: 'Brian Moran', topic: 'Personal growth', emoji: '📅',
    cards: [
      { id: '1', type: 'Principle',  front: 'A year is too long — it creates false safety', back: 'Annual planning breeds complacency. When the deadline is 12 months away, urgency is absent until Q4. Compress the year to 12 weeks and every week becomes critical.' },
      { id: '2', type: 'Framework',  front: 'The 12 Week Year system in 4 steps', back: '1) Set 12-week goals (no more than 3). 2) Create a weekly tactical plan. 3) Score your execution weekly. 4) Conduct a weekly accountability review. Repeat every 12 weeks with new goals.' },
      { id: '3', type: 'Principle',  front: 'Execution score, not results, is the leading indicator', back: 'You cannot control outcomes — you can control actions. Score your weekly execution (tasks completed / tasks planned). A score of 85%+ consistently produces results. Below 85%: fix the plan, not the goal.' },
      { id: '4', type: 'If-Then',    front: 'If your weekly plan has more than 5 priority tasks', back: 'Then it isn\'t a plan — it\'s a wishlist. Ruthlessly limit weekly priorities to the actions that produce the biggest results toward your 12-week goals. Everything else waits.' },
      { id: '5', type: 'Framework',  front: 'The three principles: Accountability, Commitment, Greatness in the Moment', back: 'Accountability = ownership without blame. Commitment = doing what you said regardless of how you feel. Greatness in the Moment = each action executed fully, present, with intention.' },
      { id: '6', type: 'Principle',  front: 'Vision without tension is just daydreaming', back: 'A compelling vision creates productive tension between where you are and where you want to be. That tension is the fuel for action. Without a clear vision, urgency has no direction.' },
      { id: '7', type: 'If-Then',    front: 'If Week 1 execution is low', back: 'Then do not adjust the goal — adjust the daily plan. Most underperformance is a planning failure, not a goal problem. Diagnose the gap before changing anything.' },
      { id: '8', type: 'Question',   front: 'Is my current week aligned with my 12-week goal?', back: 'Ask every Monday. If your scheduled tasks don\'t directly move your 12-week goals forward, you are managing tasks, not executing strategy. Realign before the week starts.' },
      { id: '9', type: 'Principle',  front: 'Peer accountability is the most underused lever', back: 'A weekly check-in with one trusted person who asks "Did you do what you said?" changes behaviour more than any app or system. Social accountability is the oldest performance tool.' },
      { id: '10', type: 'Framework', front: 'The Performance Time model: Strategic, Buffer, Breakout', back: 'Strategic time = deep work on your highest-leverage activities (15–20h/week). Buffer time = reactive tasks, email, admin. Breakout time = real rest that recharges capacity. Block all three.' },
    ]
  },
  {
    id: 'psytrade', title: 'The Psychology of Trading', author: 'Brett Steenbarger', topic: 'Trading', emoji: '🔬',
    cards: [
      { id: '1', type: 'Principle',  front: 'Trading performance is a skill that can be trained', back: 'Steenbarger treats trading like athletic performance: it can be systematically developed through deliberate practice, feedback loops, and psychological self-coaching. Random screen time is not practice.' },
      { id: '2', type: 'Framework',  front: 'Solution-focused self-coaching in 3 questions', back: '1) When am I at my trading best? 2) What am I doing differently in those moments? 3) How do I recreate those conditions consistently? Focus on replicating peaks, not eliminating flaws.' },
      { id: '3', type: 'If-Then',    front: 'If emotional arousal is high before a trade', back: 'Then wait. High arousal — positive or negative — narrows attention and accelerates poor decisions. Develop a pre-trade routine that brings arousal to a calm, alert baseline.' },
      { id: '4', type: 'Principle',  front: 'Your trading problems are patterns, not random failures', back: 'Keep a process journal. The same mistakes repeat because they are driven by the same underlying patterns — overconfidence after wins, revenge after losses. Name the pattern to break it.' },
      { id: '5', type: 'Framework',  front: 'The biofeedback principle for traders', back: 'Physical state drives mental state. Heart rate, breathing, and muscle tension all affect decision quality. A pre-session physical routine (breathing, movement) measurably improves execution quality.' },
      { id: '6', type: 'If-Then',    front: 'If you are reviewing a losing day, focus on process first', back: 'Then ask: did I follow my plan? If yes and you lost, the edge needs review. If no and you lost, the discipline needs review. Never conflate outcome with process quality.' },
      { id: '7', type: 'Principle',  front: 'Self-efficacy is built through mastery experiences', back: 'Confidence in trading comes from executing small, defined plans successfully — not from big wins. Design your practice to generate frequent proof that your process works.' },
      { id: '8', type: 'Question',   front: 'What emotional state am I in right now, and is it safe to trade?', back: 'Not all emotional states produce equal decisions. Frustration, excitement, boredom, and anxiety all degrade judgment in different ways. Knowing your state is the first step to managing it.' },
      { id: '9', type: 'Framework',  front: 'The performance zone model', back: 'Underarousal (boredom) → mistakes from inattention. Optimal zone → sharp, focused, decisive. Overarousal (stress/excitement) → impulsive, tunnel-visioned. Your job is to stay in the zone.' },
      { id: '10', type: 'Principle', front: 'Deliberate practice requires immediate, accurate feedback', back: 'Screen time without journaling is not practice — it\'s repetition of existing patterns. Effective learning requires recording what you did, why you did it, and what happened as a result.' },
    ]
  },
  {
    id: 'mastery', title: 'Mastery', author: 'Robert Greene', topic: 'Personal growth', emoji: '🏆',
    cards: [
      { id: '1', type: 'Principle',  front: 'Your Life\'s Task is encoded in your deepest inclinations', back: 'Mastery begins by identifying what you were drawn to before the world told you what to value. These early inclinations point toward your unique path. Ignoring them leads to mediocrity and quiet misery.' },
      { id: '2', type: 'Framework',  front: 'The three phases of Mastery', back: 'Phase 1: Apprenticeship — absorb, observe, submit. Phase 2: Creative-Active — experiment, take risks, develop your own voice. Phase 3: Mastery — intuitive, fluid, field-changing. Each requires different mental strategies.' },
      { id: '3', type: 'Principle',  front: 'The Apprenticeship phase demands 10,000 hours of deep observation', back: 'Not just doing — watching the master closely, learning the unspoken rules of the field, absorbing tacit knowledge. The goal is not output. The goal is transformation of how you see and think.' },
      { id: '4', type: 'If-Then',    front: 'If you feel bored or unchallenged in your current work', back: 'Then you are in the wrong phase or the wrong field. Boredom at the apprentice level signals either a mismatch with your Life\'s Task or insufficient depth of engagement. Diagnose before you quit.' },
      { id: '5', type: 'Framework',  front: 'The Ideal Apprenticeship: the 3 steps', back: '1) Choose a place that offers the most learning, not the most money. 2) Find mentors who embody what you want to become. 3) After absorbing enough, move on before comfort sets in.' },
      { id: '6', type: 'Principle',  front: 'Resistance to learning is the enemy of mastery', back: 'The greatest obstacle is the ego\'s need to already know. Masters maintain beginner\'s mind at every stage. They ask more questions than they answer and prefer being taught over being admired.' },
      { id: '7', type: 'If-Then',    front: 'If a mentor relationship goes stale or becomes controlling', back: 'Then it is time to move on. The mentor\'s role is to accelerate your development, not to create dependency. Outgrowing a mentor is a sign of progress, not disloyalty.' },
      { id: '8', type: 'Question',   front: 'Am I in accumulation mode or performance mode right now?', back: 'Mastery requires knowing which phase you are in. Apprentices who perform before they\'ve accumulated enough knowledge create shallow work. Masters who accumulate without output never realise their potential.' },
      { id: '9', type: 'Principle',  front: 'Social intelligence is as critical as technical skill', back: 'Greene documents repeatedly how masters who lacked social intelligence were undermined, sidelined, or destroyed by those threatened by their talent. Understanding human nature protects your work.' },
      { id: '10', type: 'Framework', front: 'The Dimensional Mind: convergence of intuition and knowledge', back: 'At mastery level, years of practice compress into instant pattern recognition. You see what others miss, feel the field, and act without deliberate analysis. This is not talent — it is accumulated depth surfacing.' },
    ]
  },
  {
    id: 'deepwork', title: 'Deep Work', author: 'Cal Newport', topic: 'Personal growth', emoji: '🎯',
    cards: [
      { id: '1', type: 'Principle',  front: 'Deep work is the superpower of the 21st century', back: 'The ability to focus without distraction on cognitively demanding tasks is becoming rare and increasingly valuable. Most people are optimising for busyness. Deep workers are optimising for output quality.' },
      { id: '2', type: 'Framework',  front: 'The 4 philosophies of deep work scheduling', back: 'Monastic (near-total isolation), Bimodal (deep seasons + shallow seasons), Rhythmic (daily scheduled blocks), Journalistic (wherever gaps exist). Choose based on your constraints, not your preferences.' },
      { id: '3', type: 'Principle',  front: 'Attention residue destroys cognitive quality', back: 'When you switch tasks, attention from the previous task bleeds into the new one. Multiple task-switches per day mean you never reach full depth on anything. Batch and block to minimise residue.' },
      { id: '4', type: 'If-Then',    front: 'If you check your phone or email in the first hour of work', back: 'Then you have handed your agenda to other people\'s priorities. The first hour sets the depth of the day. Protect it as if it\'s the most valuable asset you have — because it is.' },
      { id: '5', type: 'Framework',  front: 'The 4DX framework applied to deep work', back: '1) Focus on the wildly important. 2) Act on lead measures (hours of deep work), not lag measures (results). 3) Keep a scoreboard. 4) Create a cadence of accountability. Measure depth, not activity.' },
      { id: '6', type: 'Principle',  front: 'Boredom tolerance is a trainable skill', back: 'If you seek distraction whenever boredom appears, your brain learns it cannot concentrate. Practice sitting with boredom daily — waiting in line, walking without your phone — to build the neural capacity for depth.' },
      { id: '7', type: 'If-Then',    front: 'If a task can be done adequately by someone else or a tool', back: 'Then it is shallow work and should be batched, delegated, or eliminated. Your hours of peak cognitive energy should never be spent on shallow work regardless of how urgent it feels.' },
      { id: '8', type: 'Framework',  front: 'The Shutdown Ritual — why it matters', back: 'End each workday with a ritual: review incomplete tasks, set tomorrow\'s plan, say "shutdown complete." This signals to the brain that work is done, reducing evening rumination and improving recovery.' },
      { id: '9', type: 'Question',   front: 'How many hours of genuine deep work did I do today?', back: 'Track this number daily. Most knowledge workers do less than 1 hour of true deep work per day. 4 hours of uninterrupted depth is elite. The number exposes the truth about how you actually spend your capacity.' },
      { id: '10', type: 'Principle', front: 'Craftsman mindset beats passion mindset', back: 'Don\'t follow your passion — develop rare and valuable skills, and passion will follow. The craftsman focuses relentlessly on the quality of their output, which builds both mastery and meaning over time.' },
    ]
  },
  {
    id: 'principles', title: 'Principles', author: 'Ray Dalio', topic: 'Business', emoji: '⚖️',
    cards: [
      { id: '1', type: 'Principle',  front: 'Pain + Reflection = Progress', back: 'Every mistake and setback contains a lesson. The formula is not avoiding pain but processing it deliberately. Without reflection, pain is just suffering. With it, pain is the primary engine of growth.' },
      { id: '2', type: 'Framework',  front: 'The 5-Step Process to get what you want', back: '1) Set clear goals. 2) Identify the problems blocking you. 3) Diagnose the root causes. 4) Design solutions. 5) Execute. Most people skip diagnosis and design solutions for symptoms, not causes.' },
      { id: '3', type: 'Principle',  front: 'Radical open-mindedness is not the same as being agreeable', back: 'True open-mindedness means genuinely considering that you are wrong, especially when it is uncomfortable. It requires intellectual curiosity to outweigh ego. Most people mistake politeness for open-mindedness.' },
      { id: '4', type: 'If-Then',    front: 'If you disagree with a decision that has been made', back: 'Then you have an obligation to speak up in the moment — not after. Silent disagreement followed by non-commitment is the most destructive pattern in organisations and trading partnerships.' },
      { id: '5', type: 'Framework',  front: 'Believability-weighted decision making', back: 'Not all opinions are equal. Weight input based on track record in the relevant domain. Seek out people with proven expertise who disagree with you. Average opinions produce average outcomes.' },
      { id: '6', type: 'Principle',  front: 'You are not your mistakes — you are how you respond to them', back: 'The most successful people Dalio has observed treat failure as data, not identity. They distinguish between the machine (their system) and themselves as the designer of the machine.' },
      { id: '7', type: 'Question',   front: 'Is my ego protecting me from accurate information right now?', back: 'The ego interprets criticism as attack and deflects feedback. Ask yourself if you are defending a position or genuinely evaluating it. The two feel identical from the inside — which is why this question matters.' },
      { id: '8', type: 'Framework',  front: 'The Two Yous: higher-level you vs. lower-level you', back: 'Higher-level you observes, evaluates, designs. Lower-level you reacts emotionally and seeks comfort. The job of the higher-level you is to manage the lower-level you with the same objectivity you\'d apply to others.' },
      { id: '9', type: 'Principle',  front: 'Systemise everything worth repeating', back: 'When you make a good decision, write the principle behind it. When you make a bad one, write what you\'ll do differently next time. Over time, your principle set becomes a decision-making machine.' },
      { id: '10', type: 'If-Then',   front: 'If a problem recurs more than twice', back: 'Then it is a systems failure, not a personal one. Stop blaming people and redesign the system. Recurring problems are never solved by trying harder — they are solved by changing what produces them.' },
    ]
  },
  {
    id: '48laws', title: 'The 48 Laws of Power', author: 'Robert Greene', topic: 'Business', emoji: '♟️',
    cards: [
      { id: '1', type: 'Principle',  front: 'Never outshine the master (Law 1)', back: 'Make those above you feel superior. Their insecurity is a threat to your position. Let them have the spotlight. Your time to shine comes when you are the master. Patience here is a form of power.' },
      { id: '2', type: 'Principle',  front: 'Never put too much trust in friends — use enemies (Law 2)', back: 'Friends become envious. Former enemies, once converted, are more loyal because they have more to prove. Keep friends emotionally at arm\'s length while maintaining useful allies strategically.' },
      { id: '3', type: 'Framework',  front: 'The 3 categories of people in any power structure', back: 'Allies (useful now), Opponents (useful to convert or neutralise), Naïve (will be exploited by others). Correctly categorising people protects you from misplacing trust and missing strategic moves.' },
      { id: '4', type: 'Principle',  front: 'Always say less than necessary (Law 4)', back: 'Power is accumulated in silence and lost in chatter. Every word you speak gives others information about your thinking. Cultivate an air of mystery. Let others fill the silence — they always reveal more than you.' },
      { id: '5', type: 'If-Then',    front: 'If someone attacks you emotionally or publicly', back: 'Then do not react immediately. Reaction is what they want — it signals that they have power over you. Pause. A measured or surprising response is always more powerful than an emotional one.' },
      { id: '6', type: 'Principle',  front: 'Reputation is the cornerstone of power (Law 5)', back: 'Guard it with your life. A strong reputation creates a force field — opponents hesitate, opportunities arrive. A damaged reputation is almost impossible to restore. Make maintaining it a daily discipline.' },
      { id: '7', type: 'Framework',  front: 'The 4 types of power moves', back: 'Coercion (force), Seduction (desire), Manipulation (misdirection), Persuasion (logic + emotion). The most durable power uses persuasion and seduction. Coercion creates enemies. Manipulation, when exposed, is fatal.' },
      { id: '8', type: 'If-Then',    front: 'If you are new to a group or organisation', back: 'Then observe for longer than feels comfortable before acting. The power structures, alliances, and unspoken rules are invisible at first. Acting too early based on surface information is one of the most common costly mistakes.' },
      { id: '9', type: 'Principle',  front: 'Concentrate your forces (Law 23)', back: 'Intensity beats extensity. One skill developed to mastery produces more power than ten skills developed to adequacy. One strong alliance is worth ten weak ones. Focus is a power strategy, not just a productivity one.' },
      { id: '10', type: 'Question',  front: 'Who benefits from this situation — and is it actually me?', back: 'Greene\'s core lesson: always trace the real beneficiary of any situation. When you can\'t see who benefits, you are probably the one being used. Power requires seeing the game clearly before playing it.' },
    ]
  },
  {
    id: 'neversplit', title: 'Never Split the Difference', author: 'Chris Voss', topic: 'Business', emoji: '🤝',
    cards: [
      { id: '1', type: 'Principle',  front: 'Negotiation is not a rational exercise — it\'s emotional', back: 'People make decisions based on feeling, then justify with logic. The FBI hostage negotiator who wins isn\'t the smartest — it\'s the one who best understands and manages the other party\'s emotional state.' },
      { id: '2', type: 'Framework',  front: 'Tactical Empathy: the core skill', back: 'Understand and verbalise the other person\'s perspective and feelings — not to agree, but to demonstrate that you see their world. This disarms defensiveness and builds trust without conceding anything.' },
      { id: '3', type: 'If-Then',    front: 'If the other person seems defensive or closed off', back: 'Then label their emotion: "It seems like you\'re frustrated." Labelling de-escalates. It makes people feel heard, which reduces the emotional charge that is blocking rational conversation.' },
      { id: '4', type: 'Framework',  front: 'The Mirroring technique', back: 'Repeat the last 1–3 words the other person said, with a slight upward inflection. They will elaborate, often revealing information you need. It requires no cleverness — just silence and repetition.' },
      { id: '5', type: 'Principle',  front: '"No" is not failure — it\'s the beginning of negotiation', back: '"Yes" is often false (commitment they don\'t mean). "No" is real. It means they feel safe enough to be honest. Get to "No" early and work from there. Protect their right to say no.' },
      { id: '6', type: 'Framework',  front: 'Calibrated questions that create motion without pressure', back: 'Use "How" and "What" questions: "How am I supposed to do that?" / "What does success look like for you?" These force the other party to solve your problem and reveal their constraints without confrontation.' },
      { id: '7', type: 'If-Then',    front: 'If you need to make a concession', back: 'Then make it non-round and decreasing. Offer 185, then 192, then 194. Round numbers signal that more is available. Decreasing increments signal you are approaching your limit. Never split the difference — it rewards bad-faith anchoring.' },
      { id: '8', type: 'Principle',  front: 'The late-night FM DJ voice creates compliance', back: 'A calm, slow, low-pitched voice with a downward inflection signals authority and certainty without aggression. It bypasses the fight-or-flight response. Practise it in any high-stakes conversation.' },
      { id: '9', type: 'Framework',  front: 'The Accusation Audit — preempt their objections', back: 'List every negative thing the other party could think about you or your offer, then say them out loud first. "You probably think this is a terrible deal..." This disarms the power of those objections before they\'re raised.' },
      { id: '10', type: 'Question',  front: 'What does this person need to feel to say yes?', back: 'Not what do they need to know — what do they need to feel? Safety? Respected? Like they won? Design your approach around the emotional outcome, not the logical argument. Logic follows emotion in every deal.' },
    ]
  },
]

const CARD_TYPE_STYLES = {
  Principle: { color: '#a855f7', bg: 'rgba(168,85,247,0.1)', icon: '💎' },
  Framework: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: '🗺️' },
  'If-Then':  { color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', icon: '⚡' },
  Question:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '❓' },
}

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

// ─── Note formats ─────────────────────────────────────────────────────────────

const NOTE_FORMATS = [
  {
    id: 'takeaways',
    icon: '💡',
    label: 'Key Takeaways',
    short: 'Bullet insights',
    description: 'Simple bullet-point insights. Best for any session — also drives spaced repetition recall.',
    science: 'Elaborative interrogation',
  },
  {
    id: 'cornell',
    icon: '✏️',
    label: 'Cornell Notes',
    short: 'Cues + Notes',
    description: 'Split into main notes + margin cues/questions you can cover to self-test later.',
    science: 'Cornell University recall system',
  },
  {
    id: 'feynman',
    icon: '🧠',
    label: 'Feynman Technique',
    short: 'Explain simply',
    description: 'Explain what you learned as if to a 12-year-old. Exposes gaps instantly.',
    science: 'Richard Feynman — Nobel physicist',
  },
  {
    id: 'sqr3',
    icon: '❓',
    label: 'SQ3R',
    short: 'Question → Answer',
    description: 'Survey → Question → Read → Recite → Review. Structured reading comprehension.',
    science: 'Francis Robinson, 1946',
  },
  {
    id: 'progressive',
    icon: '📊',
    label: 'Progressive Summary',
    short: 'Layer highlights',
    description: 'Layer 1: capture → Layer 2: bold the best → Layer 3: write the executive summary.',
    science: 'Tiago Forte — Building a Second Brain',
  },
  {
    id: 'conceptmap',
    icon: '🗺️',
    label: 'Concept Map',
    short: 'Hub + connections',
    description: 'Central idea + how other concepts connect to it. Forces relational thinking.',
    science: 'Joseph Novak — Cornell, 1972',
  },
]

function getNoteFormatById(id) {
  return NOTE_FORMATS.find(f => f.id === id) || NOTE_FORMATS[0]
}

// Extract takeaways array from any note format (for recall/spaced repetition)
function extractTakeaways(noteFormat, noteData) {
  if (!noteData) return []
  switch (noteFormat) {
    case 'takeaways':
      return (noteData.takeaways || '').split('\n').filter(t => t.trim())
    case 'cornell':
      return [
        ...(noteData.cues || '').split('\n').filter(t => t.trim()),
        ...(noteData.notes || '').split('\n').filter(t => t.trim()),
      ].slice(0, 8)
    case 'feynman':
      return (noteData.explanation || '').split('\n').filter(t => t.trim()).slice(0, 5)
    case 'sqr3':
      return [noteData.question, noteData.answer, noteData.review].filter(Boolean)
    case 'progressive':
      return (noteData.summary || '').split('\n').filter(t => t.trim())
    case 'conceptmap':
      return [
        noteData.centralIdea,
        ...(noteData.connections || '').split('\n').filter(t => t.trim()),
      ].filter(Boolean).slice(0, 6)
    default:
      return []
  }
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

// ─── Note format fields ───────────────────────────────────────────────────────

function TakeawaysFields({ data, onChange }) {
  return (
    <div className="form-group">
      <label>
        Key takeaways
        <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(one per line — used for recall practice)</span>
      </label>
      <textarea
        value={data.takeaways || ''}
        onChange={e => onChange({ ...data, takeaways: e.target.value })}
        rows={4}
        placeholder="What did you learn? One idea per line — you'll test yourself on these later."
        style={{ resize: 'vertical' }}
      />
    </div>
  )
}

function CornellFields({ data, onChange }) {
  return (
    <>
      <div className="form-group">
        <label>
          📝 Main notes
          <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(capture everything as you learn)</span>
        </label>
        <textarea
          value={data.notes || ''}
          onChange={e => onChange({ ...data, notes: e.target.value })}
          rows={4}
          placeholder="Write your main notes here — concepts, facts, ideas, examples..."
          style={{ resize: 'vertical' }}
        />
      </div>
      <div className="form-group">
        <label>
          ❓ Cues / questions
          <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(one per line — cover these to self-test later)</span>
        </label>
        <textarea
          value={data.cues || ''}
          onChange={e => onChange({ ...data, cues: e.target.value })}
          rows={3}
          placeholder="What questions does your main note answer? e.g. 'What is compound interest?'"
          style={{ resize: 'vertical' }}
        />
      </div>
      <div className="form-group">
        <label>
          📋 Summary
          <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(2–3 sentences, bottom of the page)</span>
        </label>
        <textarea
          value={data.summary || ''}
          onChange={e => onChange({ ...data, summary: e.target.value })}
          rows={2}
          placeholder="Summarise this session in your own words..."
          style={{ resize: 'vertical' }}
        />
      </div>
    </>
  )
}

function FeynmanFields({ data, onChange }) {
  return (
    <>
      <div className="form-group">
        <label>
          🧠 Explain it simply
          <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(write as if explaining to a 12-year-old)</span>
        </label>
        <textarea
          value={data.explanation || ''}
          onChange={e => onChange({ ...data, explanation: e.target.value })}
          rows={5}
          placeholder="What did you learn? Explain it in plain language, no jargon. If you can't explain it simply, you don't understand it yet..."
          style={{ resize: 'vertical' }}
        />
      </div>
      <div className="form-group">
        <label>
          🚧 Gaps identified
          <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(what was hard to explain? what do you still need to learn?)</span>
        </label>
        <textarea
          value={data.gaps || ''}
          onChange={e => onChange({ ...data, gaps: e.target.value })}
          rows={2}
          placeholder="Where did you get stuck or use jargon? That's what to study next..."
          style={{ resize: 'vertical' }}
        />
      </div>
    </>
  )
}

function SQR3Fields({ data, onChange }) {
  return (
    <>
      <div className="form-group">
        <label>❓ Question <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(what did you want to learn going in?)</span></label>
        <input
          value={data.question || ''}
          onChange={e => onChange({ ...data, question: e.target.value })}
          placeholder="e.g. How does the brain consolidate long-term memory?"
        />
      </div>
      <div className="form-group">
        <label>✅ Answer / key points <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(what did you find?)</span></label>
        <textarea
          value={data.answer || ''}
          onChange={e => onChange({ ...data, answer: e.target.value })}
          rows={3}
          placeholder="Summarise the answer to your question and the main points..."
          style={{ resize: 'vertical' }}
        />
      </div>
      <div className="form-group">
        <label>🔄 Review <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(what would you still revisit or verify?)</span></label>
        <textarea
          value={data.review || ''}
          onChange={e => onChange({ ...data, review: e.target.value })}
          rows={2}
          placeholder="What sections would you re-read? What still needs clarifying?"
          style={{ resize: 'vertical' }}
        />
      </div>
    </>
  )
}

function ProgressiveFields({ data, onChange }) {
  return (
    <>
      <div className="form-group">
        <label>
          Layer 1 — Capture
          <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(save anything that resonates)</span>
        </label>
        <textarea
          value={data.layer1 || ''}
          onChange={e => onChange({ ...data, layer1: e.target.value })}
          rows={3}
          placeholder="Paste or write the most interesting quotes, ideas, and passages..."
          style={{ resize: 'vertical' }}
        />
      </div>
      <div className="form-group">
        <label>
          Layer 2 — Bold the best
          <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(the most important 10–20%)</span>
        </label>
        <textarea
          value={data.layer2 || ''}
          onChange={e => onChange({ ...data, layer2: e.target.value })}
          rows={3}
          placeholder="From Layer 1, what are the most essential ideas? Write only those..."
          style={{ resize: 'vertical' }}
        />
      </div>
      <div className="form-group">
        <label>
          Layer 3 — Executive summary
          <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(your own words — 2 to 4 sentences)</span>
        </label>
        <textarea
          value={data.summary || ''}
          onChange={e => onChange({ ...data, summary: e.target.value })}
          rows={2}
          placeholder="Distil everything into a short paragraph. This is your permanent note."
          style={{ resize: 'vertical' }}
        />
      </div>
    </>
  )
}

function ConceptMapFields({ data, onChange }) {
  return (
    <>
      <div className="form-group">
        <label>🎯 Central idea <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(the core concept of this session)</span></label>
        <input
          value={data.centralIdea || ''}
          onChange={e => onChange({ ...data, centralIdea: e.target.value })}
          placeholder="e.g. Dopamine drives motivation, not pleasure"
        />
      </div>
      <div className="form-group">
        <label>
          🔗 Connected concepts
          <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(one per line — how does each connect to the central idea?)</span>
        </label>
        <textarea
          value={data.connections || ''}
          onChange={e => onChange({ ...data, connections: e.target.value })}
          rows={4}
          placeholder="e.g. Reward anticipation → dopamine spikes before, not during reward&#10;Habit loops → dopamine released on cue, not just reward&#10;Addiction → hijacks natural dopamine pathways"
          style={{ resize: 'vertical' }}
        />
      </div>
      <div className="form-group">
        <label>💬 Real-world application <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(how will you use this?)</span></label>
        <input
          value={data.application || ''}
          onChange={e => onChange({ ...data, application: e.target.value })}
          placeholder="e.g. Use implementation intentions to front-load the anticipation..."
        />
      </div>
    </>
  )
}

function NoteFormatFields({ format, data, onChange }) {
  switch (format) {
    case 'takeaways':   return <TakeawaysFields data={data} onChange={onChange} />
    case 'cornell':     return <CornellFields data={data} onChange={onChange} />
    case 'feynman':     return <FeynmanFields data={data} onChange={onChange} />
    case 'sqr3':        return <SQR3Fields data={data} onChange={onChange} />
    case 'progressive': return <ProgressiveFields data={data} onChange={onChange} />
    case 'conceptmap':  return <ConceptMapFields data={data} onChange={onChange} />
    default:            return <TakeawaysFields data={data} onChange={onChange} />
  }
}

// ─── Display note content on card ────────────────────────────────────────────

function NoteDisplay({ noteFormat, noteData, color }) {
  if (!noteData) return null
  const fmt = noteFormat || 'takeaways'

  const rowStyle = {
    display: 'flex', gap: 8, fontSize: 13, color: 'var(--text2)', marginBottom: 3,
  }
  const labelStyle = {
    fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 4, marginTop: 8,
  }

  switch (fmt) {
    case 'takeaways': {
      const lines = (noteData.takeaways || '').split('\n').filter(t => t.trim())
      if (!lines.length) return null
      return (
        <div>
          {lines.slice(0, 3).map((t, i) => (
            <div key={i} style={rowStyle}>
              <span style={{ color, flexShrink: 0 }}>💡</span><span>{t}</span>
            </div>
          ))}
          {lines.length > 3 && (
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>+{lines.length - 3} more takeaways</div>
          )}
        </div>
      )
    }
    case 'cornell': {
      const cues  = (noteData.cues || '').split('\n').filter(t => t.trim())
      const notes = (noteData.notes || '').split('\n').filter(t => t.trim())
      return (
        <div>
          {cues.length > 0 && (
            <>
              <div style={labelStyle}>❓ Cues</div>
              {cues.slice(0, 2).map((c, i) => (
                <div key={i} style={rowStyle}><span style={{ color, flexShrink: 0 }}>→</span><span>{c}</span></div>
              ))}
            </>
          )}
          {notes.length > 0 && (
            <>
              <div style={labelStyle}>📝 Notes</div>
              {notes.slice(0, 2).map((n, i) => (
                <div key={i} style={rowStyle}><span style={{ color, flexShrink: 0 }}>·</span><span>{n}</span></div>
              ))}
            </>
          )}
          {noteData.summary && (
            <>
              <div style={labelStyle}>📋 Summary</div>
              <div style={{ ...rowStyle, fontStyle: 'italic' }}>{noteData.summary}</div>
            </>
          )}
        </div>
      )
    }
    case 'feynman': {
      const lines = (noteData.explanation || '').split('\n').filter(t => t.trim())
      return (
        <div>
          <div style={labelStyle}>🧠 Simple explanation</div>
          {lines.slice(0, 3).map((l, i) => (
            <div key={i} style={rowStyle}><span style={{ color, flexShrink: 0 }}>→</span><span>{l}</span></div>
          ))}
          {noteData.gaps && (
            <>
              <div style={labelStyle}>🚧 Gaps to revisit</div>
              <div style={{ ...rowStyle, color: '#f59e0b' }}>{noteData.gaps}</div>
            </>
          )}
        </div>
      )
    }
    case 'sqr3': {
      return (
        <div>
          {noteData.question && (
            <>
              <div style={labelStyle}>❓ Question</div>
              <div style={rowStyle}><span style={{ color, flexShrink: 0 }}>→</span><span>{noteData.question}</span></div>
            </>
          )}
          {noteData.answer && (
            <>
              <div style={labelStyle}>✅ Answer</div>
              <div style={{ ...rowStyle, whiteSpace: 'pre-wrap' }}>{noteData.answer.substring(0, 180)}{noteData.answer.length > 180 ? '…' : ''}</div>
            </>
          )}
        </div>
      )
    }
    case 'progressive': {
      return (
        <div>
          {noteData.summary ? (
            <>
              <div style={labelStyle}>📊 Executive summary</div>
              <div style={{ ...rowStyle, fontStyle: 'italic' }}>{noteData.summary}</div>
            </>
          ) : noteData.layer2 ? (
            <>
              <div style={labelStyle}>⭐ Best ideas</div>
              <div style={rowStyle}>{noteData.layer2.substring(0, 200)}{noteData.layer2.length > 200 ? '…' : ''}</div>
            </>
          ) : null}
        </div>
      )
    }
    case 'conceptmap': {
      const conns = (noteData.connections || '').split('\n').filter(t => t.trim())
      return (
        <div>
          {noteData.centralIdea && (
            <>
              <div style={labelStyle}>🎯 Central idea</div>
              <div style={{ ...rowStyle, fontWeight: 600 }}>{noteData.centralIdea}</div>
            </>
          )}
          {conns.length > 0 && (
            <>
              <div style={labelStyle}>🔗 Connections</div>
              {conns.slice(0, 3).map((c, i) => (
                <div key={i} style={rowStyle}><span style={{ color, flexShrink: 0 }}>→</span><span>{c}</span></div>
              ))}
            </>
          )}
          {noteData.application && (
            <>
              <div style={labelStyle}>💬 Application</div>
              <div style={{ ...rowStyle, color: 'var(--green)' }}>{noteData.application}</div>
            </>
          )}
        </div>
      )
    }
    default: return null
  }
}

// ─── Note format picker ───────────────────────────────────────────────────────

function NoteFormatPicker({ value, onChange }) {
  const [showInfo, setShowInfo] = useState(null)

  return (
    <div className="form-group">
      <label style={{ marginBottom: 8 }}>Note format</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
        {NOTE_FORMATS.map(fmt => {
          const active = value === fmt.id
          return (
            <div key={fmt.id} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => onChange(fmt.id)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: 9,
                  border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border2)'}`,
                  background: active ? 'rgba(124,106,255,0.12)' : 'var(--bg3)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.12s',
                }}
              >
                <div style={{ fontSize: 16, marginBottom: 2 }}>{fmt.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: active ? 'var(--accent2)' : 'var(--text)', lineHeight: 1.2 }}>{fmt.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{fmt.short}</div>
              </button>
              {/* Info tooltip trigger */}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setShowInfo(showInfo === fmt.id ? null : fmt.id) }}
                style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--bg4)', border: '1px solid var(--border2)',
                  cursor: 'pointer', fontSize: 10, color: 'var(--text3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, lineHeight: 1,
                }}
              >?</button>
            </div>
          )
        })}
      </div>

      {/* Info tooltip */}
      {showInfo && (() => {
        const fmt = NOTE_FORMATS.find(f => f.id === showInfo)
        if (!fmt) return null
        return (
          <div style={{
            marginTop: 8, padding: '10px 12px', borderRadius: 8,
            background: 'var(--bg4)', border: '1px solid var(--border2)',
            fontSize: 12, lineHeight: 1.6, color: 'var(--text2)',
          }}>
            <strong style={{ color: 'var(--text)' }}>{fmt.icon} {fmt.label}</strong>
            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--accent2)', fontWeight: 600 }}>Based on: {fmt.science}</span>
            <div style={{ marginTop: 4 }}>{fmt.description}</div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Full notes modal (view all) ──────────────────────────────────────────────

function FullNotesModal({ item, onClose }) {
  const fmt   = item.noteFormat || 'takeaways'
  const color = topicColor(item.topic)
  const fmtInfo = getNoteFormatById(fmt)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div className="modal-title" style={{ margin: 0 }}>{typeIcon(item.type)} {item.title}</div>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <span className="badge badge-blue" style={{ fontSize: 11 }}>{item.topic}</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{formatDuration(item.duration)} — {item.date}</span>
          {item.applied && <span className="badge badge-green" style={{ fontSize: 11 }}>✓ Applied</span>}
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            background: 'rgba(124,106,255,0.1)', color: 'var(--accent2)',
            border: '1px solid rgba(124,106,255,0.2)',
          }}>
            {fmtInfo.icon} {fmtInfo.label}
          </span>
        </div>

        {/* Render full note content by format */}
        {fmt === 'takeaways' && (() => {
          const lines = (item.noteData?.takeaways || item.takeaways?.join('\n') || '').split('\n').filter(t => t.trim())
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lines.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, borderLeft: `3px solid ${color}`, fontSize: 14 }}>
                  <span style={{ color, flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          )
        })()}

        {fmt === 'cornell' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>❓ Cues</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(item.noteData?.cues || '').split('\n').filter(t => t.trim()).map((c, i) => (
                  <div key={i} style={{ padding: '8px 10px', background: 'var(--bg3)', borderRadius: 7, borderLeft: `3px solid ${color}`, fontSize: 13, color: 'var(--text2)' }}>{c}</div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>📝 Notes</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap', padding: '8px 10px', background: 'var(--bg3)', borderRadius: 7 }}>{item.noteData?.notes}</div>
            </div>
            {item.noteData?.summary && (
              <div style={{ gridColumn: '1 / -1', padding: '10px 12px', background: 'rgba(124,106,255,0.08)', borderRadius: 8, borderTop: '2px solid var(--accent)', fontSize: 13, color: 'var(--text2)', fontStyle: 'italic' }}>
                <strong style={{ color: 'var(--text)', fontStyle: 'normal' }}>📋 Summary: </strong>{item.noteData.summary}
              </div>
            )}
          </div>
        )}

        {fmt === 'feynman' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>🧠 Simple explanation</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8, whiteSpace: 'pre-wrap', padding: '12px 14px', background: 'var(--bg3)', borderRadius: 8, borderLeft: `3px solid ${color}` }}>{item.noteData?.explanation}</div>
            </div>
            {item.noteData?.gaps && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>🚧 Gaps to revisit</div>
                <div style={{ fontSize: 13, color: '#f59e0b', padding: '10px 12px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, borderLeft: '3px solid #f59e0b' }}>{item.noteData.gaps}</div>
              </div>
            )}
          </div>
        )}

        {fmt === 'sqr3' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: 'question', icon: '❓', label: 'Question' },
              { key: 'answer',   icon: '✅', label: 'Answer / Key points' },
              { key: 'review',   icon: '🔄', label: 'Review' },
            ].map(({ key, icon, label }) => item.noteData?.[key] && (
              <div key={key} style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, borderLeft: `3px solid ${color}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 4 }}>{icon} {label}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>{item.noteData[key]}</div>
              </div>
            ))}
          </div>
        )}

        {fmt === 'progressive' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: 'layer1',  icon: '1️⃣', label: 'Layer 1 — Capture',           color: 'var(--text3)' },
              { key: 'layer2',  icon: '2️⃣', label: 'Layer 2 — Best ideas',         color: '#f59e0b' },
              { key: 'summary', icon: '3️⃣', label: 'Layer 3 — Executive summary',  color: 'var(--accent2)' },
            ].map(({ key, icon, label, color: lc }) => item.noteData?.[key] && (
              <div key={key} style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, borderLeft: `3px solid ${lc}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: lc, marginBottom: 4 }}>{icon} {label}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>{item.noteData[key]}</div>
              </div>
            ))}
          </div>
        )}

        {fmt === 'conceptmap' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {item.noteData?.centralIdea && (
              <div style={{ textAlign: 'center', padding: '14px 16px', background: `${color}18`, borderRadius: 10, border: `2px solid ${color}`, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                🎯 {item.noteData.centralIdea}
              </div>
            )}
            {(item.noteData?.connections || '').split('\n').filter(t => t.trim()).map((c, i) => (
              <div key={i} style={{ padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, borderLeft: `3px solid ${color}`, fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 8 }}>
                <span style={{ color, fontWeight: 700 }}>→</span><span>{c}</span>
              </div>
            ))}
            {item.noteData?.application && (
              <div style={{ padding: '10px 12px', background: 'rgba(34,197,94,0.08)', borderRadius: 8, borderLeft: '3px solid var(--green)', fontSize: 13, color: 'var(--green)' }}>
                <strong>💬 Application: </strong>{item.noteData.application}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Log session modal ────────────────────────────────────────────────────────

function LearningModal({ onClose, onSave, editItem }) {
  const [title,      setTitle]      = useState(editItem?.title    || '')
  const [type,       setType]       = useState(editItem?.type     || 'book')
  const [topic,      setTopic]      = useState(editItem?.topic    || 'Trading')
  const _stored     = editItem?.duration || 0
  const _storedMins = Math.round(_stored * 60)
  const [durationH,  setDurationH]  = useState(_storedMins > 0 ? String(Math.floor(_storedMins / 60)) : '')
  const [durationM,  setDurationM]  = useState(_storedMins > 0 ? String(_storedMins % 60) : '')
  const [applied,    setApplied]    = useState(editItem?.applied  || false)
  const [date,       setDate]       = useState(editItem?.date     || formatDate())

  // Note format state
  const [noteFormat, setNoteFormat] = useState(editItem?.noteFormat || 'takeaways')
  const [noteData,   setNoteData]   = useState(() => {
    if (editItem?.noteData) return editItem.noteData
    // Backwards compat: if old item has takeaways array, seed the field
    if (editItem?.takeaways) return { takeaways: editItem.takeaways.join('\n') }
    return {}
  })

  function handleSave() {
    if (!title.trim()) return
    const takeaways = extractTakeaways(noteFormat, noteData)
    onSave({
      title: title.trim(), type, topic,
      duration: (parseInt(durationH) || 0) + (parseInt(durationM) || 0) / 60,
      noteFormat,
      noteData,
      takeaways, // kept for spaced repetition compatibility
      applied, date,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
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

        {/* ── Note format picker ── */}
        <NoteFormatPicker value={noteFormat} onChange={id => { setNoteFormat(id); setNoteData({}) }} />

        {/* ── Format-specific fields ── */}
        <div style={{ padding: '14px 14px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border2)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 15 }}>{getNoteFormatById(noteFormat).icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>{getNoteFormatById(noteFormat).label}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>— {getNoteFormatById(noteFormat).science}</span>
          </div>
          <NoteFormatFields format={noteFormat} data={noteData} onChange={setNoteData} />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, marginBottom: 4 }}>
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

  const takeaways = item.takeaways?.length > 0
    ? item.takeaways
    : extractTakeaways(item.noteFormat, item.noteData)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-title">🔁 Recall check</div>
        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg3)', borderLeft: `3px solid ${color}`, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{typeIcon(item.type)} {item.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: takeaways?.length ? 10 : 0 }}>
            {item.topic} · Originally studied {item.date}
          </div>
          {takeaways?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {takeaways.map((t, i) => (
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

// ─── Learning card ────────────────────────────────────────────────────────────

function LearningCard({ item, onEdit, onDelete, onReview, onCancelReview }) {
  const [showFullNotes, setShowFullNotes]  = useState(false)
  const [showRecall,    setShowRecall]    = useState(false)
  const [showCancel,    setShowCancel]    = useState(false)
  const color        = topicColor(item.topic)
  const daysLeft     = daysUntilReview(item.nextReviewDate)
  const isDue        = daysLeft !== null && daysLeft <= 0
  const isDueSoon    = daysLeft !== null && daysLeft > 0 && daysLeft <= 2
  const isFuture     = daysLeft !== null && daysLeft > 2
  const lastRecall   = item.lastRecallRating ? RECALL_LABELS[item.lastRecallRating] : null
  const reviewCount  = item.reviewHistory?.length || 0
  const fmtInfo      = getNoteFormatById(item.noteFormat || 'takeaways')

  // Determine if there are notes to show
  const hasNotes = item.noteData
    ? Object.values(item.noteData).some(v => v && String(v).trim())
    : item.takeaways?.length > 0

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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: hasNotes ? 10 : 0 }}>
              <span className="badge" style={{ fontSize: 11, background: `${color}20`, color }}>{item.topic}</span>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{formatDuration(item.duration)}</span>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>·</span>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{item.date}</span>
              {/* Note format badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: 'rgba(124,106,255,0.08)', color: 'var(--accent2)',
                border: '1px solid rgba(124,106,255,0.15)',
              }}>
                {fmtInfo.icon} {fmtInfo.label}
              </span>
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

            {/* Note preview */}
            {hasNotes && (
              <div>
                <NoteDisplay
                  noteFormat={item.noteFormat || 'takeaways'}
                  noteData={item.noteData || (item.takeaways ? { takeaways: item.takeaways.join('\n') } : {})}
                  color={color}
                />
                <button
                  onClick={() => setShowFullNotes(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', fontWeight: 600, padding: '4px 0 0 0', marginTop: 4 }}
                >
                  ↗ View full notes
                </button>
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

      {showFullNotes && <FullNotesModal item={item} onClose={() => setShowFullNotes(false)} />}
      {showRecall    && <RecallModal item={item} onClose={() => setShowRecall(false)} onSave={rating => onReview(item.id, rating)} />}
      {showCancel    && <CancelRecallModal item={item} onClose={() => setShowCancel(false)} onCancel={onCancelReview} />}
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
          {byDay[dayPopup].map(item => {
            const fmtInfo = getNoteFormatById(item.noteFormat || 'takeaways')
            return (
              <div key={item.id} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg3)', borderLeft: `3px solid ${topicColor(item.topic)}`, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span>{typeIcon(item.type)}</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</span>
                  {item.applied && <span className="badge badge-green" style={{ fontSize: 10 }}>✓ Applied</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <span className="badge badge-blue" style={{ fontSize: 10 }}>{item.topic}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{formatDuration(item.duration)}</span>
                  <span style={{ fontSize: 11, color: 'var(--accent2)', fontWeight: 600 }}>{fmtInfo.icon} {fmtInfo.label}</span>
                  {item.reviewHistory?.length > 0 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>· {item.reviewHistory.length} recall{item.reviewHistory.length !== 1 ? 's' : ''}</span>}
                </div>
                {(item.noteData || item.takeaways?.length > 0) && (
                  <NoteDisplay
                    noteFormat={item.noteFormat || 'takeaways'}
                    noteData={item.noteData || (item.takeaways ? { takeaways: item.takeaways.join('\n') } : {})}
                    color={topicColor(item.topic)}
                  />
                )}
              </div>
            )
          })}
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

// ─── Book Extract Modal ───────────────────────────────────────────────────────

function BookExtractModal({ onClose, onSave, existingExtracts }) {
  const [step,         setStep]        = useState('pick') // pick | review
  const [selectedBook, setSelectedBook] = useState(null)
  const [cards,        setCards]       = useState([])
  const [editingCard,  setEditingCard] = useState(null)
  const [editFront,    setEditFront]   = useState('')
  const [editBack,     setEditBack]    = useState('')

  const extractedIds = new Set((existingExtracts || []).map(e => e.bookTitle))

  function loadBook(book) {
    setSelectedBook(book)
    setCards(book.cards.map(c => ({ ...c })))
    setStep('review')
  }

  function startEdit(idx) {
    setEditingCard(idx)
    setEditFront(cards[idx].front)
    setEditBack(cards[idx].back)
  }

  function saveEdit(idx) {
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, front: editFront, back: editBack } : c))
    setEditingCard(null)
  }

  function removeCard(idx) {
    setCards(prev => prev.filter((_, i) => i !== idx))
  }

  function handleSave() {
    if (!selectedBook || cards.length < 3) return
    onSave({ ...selectedBook, cards })
    onClose()
  }

  const alreadyExtracted = selectedBook && extractedIds.has(selectedBook.title)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
          <div>
            <div className="modal-title" style={{ margin: 0 }}>📖 Extract a Book</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
              10 pre-extracted cards per book. Review, edit, then drill with spaced repetition.
            </div>
          </div>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Step: Pick */}
        {step === 'pick' && (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 10 }}>
              Your library — select a book to load
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BOOK_LIBRARY.map(book => {
                const done = extractedIds.has(book.title)
                return (
                  <div
                    key={book.id}
                    onClick={() => !done && loadBook(book)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 10, cursor: done ? 'default' : 'pointer',
                      background: done ? 'var(--bg2)' : 'var(--bg3)',
                      border: `1px solid ${done ? 'var(--border)' : 'var(--border2)'}`,
                      opacity: done ? 0.6 : 1,
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { if (!done) e.currentTarget.style.borderColor = 'var(--accent)' }}
                    onMouseLeave={e => { if (!done) e.currentTarget.style.borderColor = 'var(--border2)' }}
                  >
                    <span style={{ fontSize: 24 }}>{book.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{book.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{book.author} · {book.topic} · {book.cards.length} cards ready</div>
                    </div>
                    {done ? (
                      <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>✓ Added</span>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Load →</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <>
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(124,106,255,0.08)', border: '1px solid rgba(124,106,255,0.2)', marginBottom: 14, flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedBook?.emoji} {selectedBook?.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                {cards.length} cards ready · Edit or remove any before saving · Each card gets its own spaced repetition schedule
              </div>
            </div>

            {/* Card type legend */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, flexShrink: 0 }}>
              {Object.entries(CARD_TYPE_STYLES).map(([type, style]) => (
                <span key={type} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: style.bg, color: style.color }}>
                  {style.icon} {type}
                </span>
              ))}
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cards.map((card, idx) => {
                const style = CARD_TYPE_STYLES[card.type] || CARD_TYPE_STYLES['Principle']
                const isEditing = editingCard === idx
                return (
                  <div key={card.id} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg3)', border: `1px solid ${style.color}40`, borderLeft: `3px solid ${style.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isEditing ? 10 : 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: style.bg, color: style.color }}>
                        {style.icon} {card.type}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {isEditing ? (
                          <>
                            <button className="btn btn-sm" onClick={() => setEditingCard(null)}>Cancel</button>
                            <button className="btn btn-sm btn-primary" onClick={() => saveEdit(idx)}>Save</button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-sm" onClick={() => startEdit(idx)}>✏️</button>
                            <button className="btn btn-sm btn-danger" onClick={() => removeCard(idx)}>✕</button>
                          </>
                        )}
                      </div>
                    </div>
                    {isEditing ? (
                      <>
                        <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginBottom: 4 }}>FRONT (prompt)</div>
                        <input value={editFront} onChange={e => setEditFront(e.target.value)} style={{ marginBottom: 8, fontSize: 13 }} />
                        <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginBottom: 4 }}>BACK (answer)</div>
                        <textarea value={editBack} onChange={e => setEditBack(e.target.value)} rows={2} style={{ resize: 'vertical', fontSize: 13 }} />
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{card.front}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{card.back}</div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="modal-footer" style={{ flexShrink: 0, marginTop: 12 }}>
              <button className="btn" onClick={() => { setStep('pick'); setCards([]) }}>← Back to library</button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={cards.length < 3}
              >
                ✓ Save {cards.length} cards to library
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Card Recall Modal ────────────────────────────────────────────────────────

function CardRecallModal({ cardItem, onClose, onSave }) {
  // cardItem: { extractId, bookTitle, author, topic, card }
  const [phase,  setPhase]  = useState('question') // question | answer | rate
  const [rating, setRating] = useState(null)
  const style = CARD_TYPE_STYLES[cardItem.card.type] || CARD_TYPE_STYLES['Principle']

  function handleSave() {
    if (!rating) return
    onSave(cardItem.extractId, cardItem.card.id, rating)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="modal-title" style={{ margin: 0 }}>🔁 Card Recall</div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12, background: style.bg, color: style.color }}>
            {style.icon} {cardItem.card.type}
          </span>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
          {cardItem.bookTitle} · {cardItem.author}
        </div>

        {/* Question */}
        <div style={{ padding: '16px 18px', borderRadius: 10, background: 'var(--bg3)', borderLeft: `3px solid ${style.color}`, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>PROMPT</div>
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{cardItem.card.front}</div>
        </div>

        {/* Answer — revealed on tap */}
        {phase === 'question' ? (
          <button
            onClick={() => setPhase('answer')}
            style={{ width: '100%', padding: '14px', borderRadius: 10, border: `1px dashed ${style.color}60`, background: `${style.bg}`, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: style.color, marginBottom: 16 }}
          >
            Tap to reveal answer →
          </button>
        ) : (
          <div style={{ padding: '14px 16px', borderRadius: 10, background: `${style.bg}`, border: `1px solid ${style.color}40`, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: style.color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>ANSWER</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)' }}>{cardItem.card.back}</div>
          </div>
        )}

        {/* Rating — only shown after answer revealed */}
        {phase === 'answer' && (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>How well did you recall this?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {[1,2,3,4,5].map(r => {
                const info   = RECALL_LABELS[r]
                const active = rating === r
                return (
                  <div key={r} onClick={() => setRating(r)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderRadius: 8, cursor: 'pointer', background: active ? `${info.color}18` : 'var(--bg3)', border: `1px solid ${active ? info.color : 'var(--border2)'}`, transition: 'all 0.1s' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: active ? info.color : 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 12, color: active ? '#fff' : 'var(--text3)' }}>{r}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: active ? info.color : 'var(--text)' }}>{info.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{info.sub}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!rating}>Save recall</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Books Tab ────────────────────────────────────────────────────────────────

function BooksTab({ extracts, dueCards, onAddExtract, onCardReview, onPostponeCard, onDeleteExtract }) {
  const [recallingCard, setRecallingCard] = useState(null)
  const [expandedId,    setExpandedId]    = useState(null)

  const totalCards    = extracts.reduce((acc, e) => acc + (e.cards?.length || 0), 0)
  const reviewedCards = extracts.reduce((acc, e) => acc + (e.cards?.filter(c => c.reviewHistory?.length > 0).length || 0), 0)
  const dueCount      = dueCards.length

  return (
    <div>
      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--accent2)' }}>{extracts.length}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Books extracted</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>of 10 in library</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--blue)' }}>{totalCards}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Total cards</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{reviewedCards} reviewed</div>
        </div>
        <div className="card" style={{ textAlign: 'center', cursor: dueCount > 0 ? 'pointer' : 'default' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: dueCount > 0 ? '#f59e0b' : 'var(--text3)' }}>{dueCount}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Cards due today</div>
          <div style={{ fontSize: 11, color: dueCount > 0 ? '#f59e0b' : 'var(--text3)', marginTop: 4, fontWeight: dueCount > 0 ? 700 : 400 }}>
            {dueCount > 0 ? 'Review now →' : 'All caught up'}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--green)' }}>
            {totalCards > 0 ? Math.round((reviewedCards / totalCards) * 100) : 0}%
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Cards reviewed</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Overall progress</div>
        </div>
      </div>

      {/* Due cards banner */}
      {dueCount > 0 && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>
            🔁 {dueCount} card{dueCount !== 1 ? 's' : ''} due for recall today
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {dueCards.slice(0, 5).map(dc => {
              const style = CARD_TYPE_STYLES[dc.card.type] || CARD_TYPE_STYLES['Principle']
              return (
                <div key={`${dc.extractId}::${dc.card.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border2)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: style.bg, color: style.color, flexShrink: 0 }}>{style.icon} {dc.card.type}</span>
                  <span style={{ fontSize: 13, flex: 1, color: 'var(--text2)' }}>{dc.card.front}</span>
                  <button
                    onClick={() => setRecallingCard(dc)}
                    style={{ padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', flexShrink: 0 }}
                  >
                    Review
                  </button>
                </div>
              )
            })}
            {dueCount > 5 && (
              <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>+{dueCount - 5} more due cards below</div>
            )}
          </div>
        </div>
      )}

      {/* Extract button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>Your book extracts</div>
        <button className="btn btn-primary" onClick={onAddExtract}>+ Extract a book</button>
      </div>

      {/* Extract list */}
      {extracts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📖</div>
          <h3>No book extracts yet</h3>
          <p>Extract a book from the library above. Claude distils the 10 most actionable ideas into flashcards you drill over 2 weeks.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {extracts.map(extract => {
            const cards       = extract.cards || []
            const reviewed    = cards.filter(c => c.reviewHistory?.length > 0).length
            const dueHere     = cards.filter(c => c.nextReviewDate && c.nextReviewDate <= formatDate()).length
            const pct         = cards.length > 0 ? Math.round((reviewed / cards.length) * 100) : 0
            const isExpanded  = expandedId === extract.id
            const bookInfo    = BOOK_LIBRARY.find(b => b.title === extract.bookTitle) || {}

            return (
              <div key={extract.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{bookInfo.emoji || '📖'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{extract.bookTitle}</span>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>by {extract.author}</span>
                      {dueHere > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                          🔁 {dueHere} due
                        </span>
                      )}
                      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        80% score weight
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--bg4)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: pct === 100 ? 'var(--green)' : 'var(--accent)', width: `${pct}%`, transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>{reviewed}/{cards.length} reviewed ({pct}%)</span>
                    </div>

                    {/* Card type distribution */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {Object.entries(
                        cards.reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc }, {})
                      ).map(([type, count]) => {
                        const s = CARD_TYPE_STYLES[type] || CARD_TYPE_STYLES['Principle']
                        return (
                          <span key={type} style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: s.bg, color: s.color }}>
                            {s.icon} {count} {type}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-sm" onClick={() => setExpandedId(isExpanded ? null : extract.id)}>
                      {isExpanded ? '▲ Hide' : '▼ Cards'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => onDeleteExtract(extract.id)}>✕</button>
                  </div>
                </div>

                {/* Expanded cards */}
                {isExpanded && (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    {cards.map(card => {
                      const s      = CARD_TYPE_STYLES[card.type] || CARD_TYPE_STYLES['Principle']
                      const isDue  = card.nextReviewDate && card.nextReviewDate <= formatDate()
                      const done   = card.reviewHistory?.length > 0
                      const daysLeft = card.nextReviewDate ? Math.round((new Date(card.nextReviewDate + 'T12:00:00') - new Date(formatDate() + 'T12:00:00')) / 86400000) : null

                      return (
                        <div key={card.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 9, background: isDue ? 'rgba(245,158,11,0.04)' : 'var(--bg3)', border: `1px solid ${isDue ? 'rgba(245,158,11,0.3)' : 'var(--border2)'}` }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: s.bg, color: s.color }}>{s.icon} {card.type}</span>
                              {done && <span style={{ fontSize: 11, color: 'var(--green)' }}>✓ {card.reviewHistory.length} review{card.reviewHistory.length !== 1 ? 's' : ''}</span>}
                              {isDue && <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>🔁 Due now</span>}
                              {!isDue && daysLeft !== null && daysLeft > 0 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Next review in {daysLeft}d</span>}
                              {card.lastRecallRating && <span style={{ fontSize: 11, color: RECALL_LABELS[card.lastRecallRating]?.color }}>Last: {RECALL_LABELS[card.lastRecallRating]?.label}</span>}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{card.front}</div>
                            <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{card.back}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                            <button
                              onClick={() => setRecallingCard({ extractId: extract.id, bookTitle: extract.bookTitle, author: extract.author, topic: extract.topic, card })}
                              style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${isDue ? '#f59e0b' : 'var(--border2)'}`, background: isDue ? 'rgba(245,158,11,0.12)' : 'var(--bg4)', color: isDue ? '#f59e0b' : 'var(--text3)', whiteSpace: 'nowrap' }}
                            >
                              🔁 {isDue ? 'Review' : 'Recall'}
                            </button>
                            {card.nextReviewDate && (
                              <button
                                onClick={() => onPostponeCard(extract.id, card.id, 7)}
                                style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer', border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text3)', whiteSpace: 'nowrap' }}
                              >
                                ⏭️ +7d
                              </button>
                            )}
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
      )}

      {recallingCard && (
        <CardRecallModal
          cardItem={recallingCard}
          onClose={() => setRecallingCard(null)}
          onSave={(extractId, cardId, rating) => {
            onCardReview(extractId, cardId, rating)
            setRecallingCard(null)
          }}
        />
      )}
    </div>
  )
}



export default function LearnView({
  learnings, loading,
  addLearning, updateLearning, deleteLearning,
  addBookExtract, recordCardReview, postponeCard,
  recordReview, cancelReview,
  getWeekLearnings, getDueForReview, getDueCards, getWeekScore, getWeekReviewCount, getTopicBreakdown,
}) {
  const [showModal,       setShowModal]       = useState(false)
  const [showExtractModal,setShowExtractModal] = useState(false)
  const [editItem,        setEditItem]        = useState(null)
  const [innerTab,        setInnerTab]        = useState('week')
  const [sortBy,          setSortBy]          = useState('date')
  const [filterTopic,     setFilterTopic]     = useState('All')

  const weekItems  = getWeekLearnings()
  const weekScore  = getWeekScore()
  const weekHours  = weekItems.filter(l => l.type !== 'book_extract').reduce((acc, l) => acc + (l.duration || 0), 0)
  const dueItems   = getDueForReview ? getDueForReview() : []
  // Regular session-level due items only (for legacy review tab)
  const dueRegular = dueItems.filter(d => !d._isCard)
  const dueCount   = dueItems.length
  const weekReviewCount = getWeekReviewCount ? getWeekReviewCount() : 0

  // Book extracts
  const extracts   = learnings.filter(l => l.type === 'book_extract')
  const dueCards   = getDueCards ? getDueCards() : []
  const extractDueCount = dueCards.length

  const allSessions = useMemo(() => {
    let items = [...learnings].filter(l => l.type !== 'book_extract')
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

  const existingTopics = [...new Set(learnings.filter(l => l.type !== 'book_extract').map(l => l.topic))].sort()

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
            {weekItems.filter(l => l.type !== 'book_extract' && (l.noteData || l.takeaways?.length > 0)).length}
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
          { id: 'books',    label: `📖 Books${extractDueCount > 0 ? ` (${extractDueCount})` : ''}` },
          { id: 'all',      label: '📚 All Sessions' },
          { id: 'calendar', label: '🗓️ Calendar' },
        ].map(t => (
          <button key={t.id} onClick={() => setInnerTab(t.id)} style={{
            padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: 'none', border: 'none',
            color: (t.id === 'review' && dueCount > 0 && innerTab !== 'review') ||
                   (t.id === 'books'  && extractDueCount > 0 && innerTab !== 'books')
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
              {weekItems.filter(l => l.type !== 'book_extract').map(item => (
                <LearningCard key={item.id} item={item}
                  onEdit={() => { setEditItem(item); setShowModal(true) }}
                  onDelete={() => deleteLearning(item.id)}
                  onReview={recordReview}
                  onCancelReview={cancelReview}
                />
              ))}
              {extracts.filter(e => e.date >= getWeekStart()).map(e => (
                <div key={e.id} className="card" style={{ borderLeft: '3px solid var(--accent2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{BOOK_LIBRARY.find(b => b.title === e.bookTitle)?.emoji || '📖'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{e.bookTitle}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>Book Extract · {e.cards?.length || 0} cards · 80% score weight</div>
                    </div>
                    <button className="btn btn-sm" onClick={() => setInnerTab('books')}>View cards →</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── REVIEW ── */}
      {innerTab === 'review' && (
        <ReviewTab
          dueItems={dueRegular}
          onReview={recordReview}
          onEdit={item => { setEditItem(item); setShowModal(true) }}
          onCancelReview={cancelReview}
        />
      )}

      {/* ── BOOKS ── */}
      {innerTab === 'books' && (
        <BooksTab
          extracts={extracts}
          dueCards={dueCards}
          onAddExtract={() => setShowExtractModal(true)}
          onCardReview={recordCardReview}
          onPostponeCard={postponeCard}
          onDeleteExtract={deleteLearning}
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
        <LearnHistory learnings={learnings.filter(l => l.type !== 'book_extract')}
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

      {showExtractModal && (
        <BookExtractModal
          existingExtracts={extracts}
          onClose={() => setShowExtractModal(false)}
          onSave={extractData => addBookExtract(extractData)}
        />
      )}
    </div>
  )
}
