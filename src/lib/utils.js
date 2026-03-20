export function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0]
}

export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return formatDate(d)
}

export function getWeekEnd(date = new Date()) {
  const start = new Date(getWeekStart(date))
  start.setDate(start.getDate() + 6)
  return formatDate(start)
}

export function getWeekLabel(weekStart) {
  const start = new Date(weekStart)
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const opts = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

export function getDayLabel(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(formatDate(d))
  }
  return days
}

export function getLast30Days() {
  const days = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(formatDate(d))
  }
  return days
}

export function getLast90Days() {
  const days = []
  for (let i = 89; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(formatDate(d))
  }
  return days
}

export function scoreColor(score) {
  if (score >= 85) return '#22c55e'
  if (score >= 65) return '#3b82f6'
  if (score >= 45) return '#f59e0b'
  return '#ef4444'
}

export function scoreLabel(score) {
  if (score >= 85) return 'Excellent'
  if (score >= 65) return 'Good'
  if (score >= 45) return 'Average'
  return 'Needs work'
}

export function gapColor(gap) {
  if (gap <= 5) return '#22c55e'
  if (gap <= 20) return '#f59e0b'
  return '#ef4444'
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}

export function getMonthDays(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

export function isSameDay(d1, d2) {
  return formatDate(new Date(d1)) === formatDate(new Date(d2))
}

export function getStreak(logs, habitId) {
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = formatDate(d)
    const log = logs.find(l => l.habitId === habitId && l.date === dateStr)
    if (log?.done) streak++
    else if (i > 0) break
  }
  return streak
}

export function getCompletionRate(logs, habitId, days = 30) {
  const daysList = []
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    daysList.push(formatDate(d))
  }
  const done = daysList.filter(date =>
    logs.find(l => l.habitId === habitId && l.date === date && l.done)
  ).length
  return Math.round((done / days) * 100)
}
