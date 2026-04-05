import { useState, useMemo } from 'react'
import { formatDate, scoreColor, getWeekStart } from '../lib/utils'

// ─── Workout type config ──────────────────────────────────────────────────────

const HUBERMAN_TYPES = [
  { value: 'resistance', label: 'Resistance training', icon: '🏋️', color: '#3b82f6' },
  { value: 'zone2',      label: 'Zone 2 cardio',        icon: '🫀', color: '#3b82f6' },
  { value: 'hiit',       label: 'HIIT',                  icon: '⚡', color: '#3b82f6' },
]

const SECONDARY_TYPES = [
  { value: 'jogging',         label: 'Jogging',              icon: '🏃', color: '#f97316', calisthenics: false },
  { value: 'pullups',         label: 'Calisthenics: Pull-ups', icon: '🔝', color: '#f97316', calisthenics: true  },
  { value: 'pushups',         label: 'Calisthenics: Push-ups', icon: '💪', color: '#f97316', calisthenics: true  },
  { value: 'dips',            label: 'Calisthenics: Dips',    icon: '🤸', color: '#f97316', calisthenics: true  },
  { value: 'situps',          label: 'Calisthenics: Sit-ups', icon: '🧘', color: '#f97316', calisthenics: true  },
  { value: 'walk',            label: 'Walk',                  icon: '🚶', color: '#f97316', calisthenics: false },
  { value: 'sport',           label: 'Sport / activity',      icon: '⚽', color: '#f97316', calisthenics: false },
  { value: 'other',           label: 'Other',                 icon: '🏃', color: '#f97316', calisthenics: false },
]

const ALL_TYPES = [...HUBERMAN_TYPES, ...SECONDARY_TYPES]

function getTypeInfo(value) {
  return ALL_TYPES.find(t => t.value === value) || { label: value, icon: '🏃', color: '#f97316', calisthenics: false }
}

function isHuberman(type) { return HUBERMAN_TYPES.some(t => t.value === type) }

// ─── Nutrition food database (Vietnam-friendly) ───────────────────────────────
// per 100g unless noted — { name, cal, protein, carbs, fat, fiber, category, unit, unitGrams, vietnam }

const FOOD_DB = [
  // PROTEIN SOURCES
  { id: 'chicken_breast',   name: 'Chicken breast',       cal: 165, protein: 31, carbs: 0,  fat: 3.6, fiber: 0,   category: 'protein', unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'chicken_thigh',    name: 'Chicken thigh',        cal: 209, protein: 26, carbs: 0,  fat: 11,  fiber: 0,   category: 'protein', unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'pork_lean',        name: 'Lean pork (thịt heo)', cal: 143, protein: 26, carbs: 0,  fat: 4,   fiber: 0,   category: 'protein', unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'fish_mackerel',    name: 'Mackerel (cá thu)',     cal: 205, protein: 19, carbs: 0,  fat: 14,  fiber: 0,   category: 'protein', unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'fish_tilapia',     name: 'Tilapia (cá rô phi)',  cal: 96,  protein: 20, carbs: 0,  fat: 2,   fiber: 0,   category: 'protein', unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'shrimp',           name: 'Shrimp (tôm)',          cal: 99,  protein: 24, carbs: 0,  fat: 0.3, fiber: 0,   category: 'protein', unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'squid',            name: 'Squid (mực)',           cal: 92,  protein: 16, carbs: 3,  fat: 1.4, fiber: 0,   category: 'protein', unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'egg_whole',        name: 'Egg (whole)',           cal: 155, protein: 13, carbs: 1,  fat: 11,  fiber: 0,   category: 'protein', unit: '1 egg',   unitGrams: 60,  vietnam: true  },
  { id: 'egg_white',        name: 'Egg white',            cal: 52,  protein: 11, carbs: 1,  fat: 0.2, fiber: 0,   category: 'protein', unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'tofu_firm',        name: 'Tofu firm (đậu hũ)',   cal: 76,  protein: 8,  carbs: 2,  fat: 4,   fiber: 0.3, category: 'protein', unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'peanuts',          name: 'Peanuts (đậu phộng)',  cal: 567, protein: 26, carbs: 16, fat: 49,  fiber: 8.5, category: 'protein', unit: '30g',     unitGrams: 30,  vietnam: true  },
  { id: 'black_beans',      name: 'Black beans (đậu đen)',cal: 132, protein: 9,  carbs: 24, fat: 0.5, fiber: 8.7, category: 'protein', unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'lentils',          name: 'Lentils (đậu lăng)',   cal: 116, protein: 9,  carbs: 20, fat: 0.4, fiber: 7.9, category: 'protein', unit: '100g',    unitGrams: 100, vietnam: false },
  { id: 'greek_yogurt',     name: 'Greek yogurt',         cal: 59,  protein: 10, carbs: 3.6,fat: 0.4, fiber: 0,   category: 'protein', unit: '100g',    unitGrams: 100, vietnam: false },
  { id: 'snails',           name: 'Snails (ốc)',           cal: 90,  protein: 16, carbs: 2,  fat: 1.4, fiber: 0,   category: 'protein', unit: '100g',    unitGrams: 100, vietnam: true  },
  // CARB SOURCES
  { id: 'white_rice',       name: 'White rice (cơm)',     cal: 130, protein: 2.7,carbs: 28, fat: 0.3, fiber: 0.4, category: 'carbs',   unit: '1 bowl (180g)', unitGrams: 180, vietnam: true },
  { id: 'brown_rice',       name: 'Brown rice (gạo lứt)', cal: 112, protein: 2.6,carbs: 23, fat: 0.9, fiber: 1.8, category: 'carbs',   unit: '1 bowl (180g)', unitGrams: 180, vietnam: true },
  { id: 'oats',             name: 'Oats (yến mạch)',      cal: 389, protein: 17, carbs: 66, fat: 7,   fiber: 10,  category: 'carbs',   unit: '100g',    unitGrams: 100, vietnam: false },
  { id: 'sweet_potato',     name: 'Sweet potato (khoai)', cal: 86,  protein: 1.6,carbs: 20, fat: 0.1, fiber: 3,   category: 'carbs',   unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'bread_white',      name: 'Bánh mì (white)',      cal: 265, protein: 9,  carbs: 49, fat: 3.2, fiber: 2.7, category: 'carbs',   unit: '1 slice (35g)', unitGrams: 35, vietnam: true },
  { id: 'bread_whole',      name: 'Whole grain bread',   cal: 247, protein: 13, carbs: 41, fat: 4.2, fiber: 6,   category: 'carbs',   unit: '1 slice (35g)', unitGrams: 35, vietnam: false },
  { id: 'banana',           name: 'Banana (chuối)',        cal: 89,  protein: 1.1,carbs: 23, fat: 0.3, fiber: 2.6, category: 'carbs',   unit: '1 medium (120g)', unitGrams: 120, vietnam: true },
  { id: 'mango',            name: 'Mango (xoài)',          cal: 60,  protein: 0.8,carbs: 15, fat: 0.4, fiber: 1.6, category: 'carbs',   unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'noodles_pho',      name: 'Phở noodles',          cal: 108, protein: 2.5,carbs: 24, fat: 0.2, fiber: 0.5, category: 'carbs',   unit: '1 bowl (200g)', unitGrams: 200, vietnam: true },
  { id: 'cassava',          name: 'Cassava (khoai mì)',   cal: 160, protein: 1.4,carbs: 38, fat: 0.3, fiber: 1.8, category: 'carbs',   unit: '100g',    unitGrams: 100, vietnam: true  },
  // VEGETABLES / FIBER
  { id: 'broccoli',         name: 'Broccoli',             cal: 34,  protein: 2.8,carbs: 7,  fat: 0.4, fiber: 2.6, category: 'veggies', unit: '100g',    unitGrams: 100, vietnam: false },
  { id: 'spinach',          name: 'Spinach (rau bina)',   cal: 23,  protein: 2.9,carbs: 3.6,fat: 0.4, fiber: 2.2, category: 'veggies', unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'morning_glory',    name: 'Morning glory (rau muống)', cal: 19, protein: 2.6, carbs: 3.1, fat: 0.2, fiber: 2, category: 'veggies', unit: '100g', unitGrams: 100, vietnam: true },
  { id: 'cabbage',          name: 'Cabbage (bắp cải)',    cal: 25,  protein: 1.3,carbs: 5.8,fat: 0.1, fiber: 2.5, category: 'veggies', unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'carrot',           name: 'Carrot (cà rốt)',      cal: 41,  protein: 0.9,carbs: 10, fat: 0.2, fiber: 2.8, category: 'veggies', unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'tomato',           name: 'Tomato (cà chua)',     cal: 18,  protein: 0.9,carbs: 3.9,fat: 0.2, fiber: 1.2, category: 'veggies', unit: '1 medium (150g)', unitGrams: 150, vietnam: true },
  { id: 'eggplant',         name: 'Eggplant (cà tím)',    cal: 25,  protein: 1,  carbs: 5.9,fat: 0.2, fiber: 3,   category: 'veggies', unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'cucumber',         name: 'Cucumber (dưa leo)',   cal: 15,  protein: 0.7,carbs: 3.6,fat: 0.1, fiber: 0.5, category: 'veggies', unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'bean_sprouts',     name: 'Bean sprouts (giá đỗ)',cal: 31,  protein: 3.1,carbs: 5.9,fat: 0.2, fiber: 1.8, category: 'veggies', unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'bitter_melon',     name: 'Bitter melon (khổ qua)',cal: 17, protein: 1,  carbs: 3.7,fat: 0.2, fiber: 2.8, category: 'veggies', unit: '100g',    unitGrams: 100, vietnam: true  },
  // FRUITS
  { id: 'papaya',           name: 'Papaya (đu đủ)',       cal: 43,  protein: 0.5,carbs: 11, fat: 0.3, fiber: 1.7, category: 'fruits',  unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'watermelon',       name: 'Watermelon (dưa hấu)', cal: 30,  protein: 0.6,carbs: 7.6,fat: 0.2, fiber: 0.4, category: 'fruits',  unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'pineapple',        name: 'Pineapple (dứa)',      cal: 50,  protein: 0.5,carbs: 13, fat: 0.1, fiber: 1.4, category: 'fruits',  unit: '100g',    unitGrams: 100, vietnam: true  },
  { id: 'orange',           name: 'Orange (cam)',          cal: 47,  protein: 0.9,carbs: 12, fat: 0.1, fiber: 2.4, category: 'fruits',  unit: '1 medium (150g)', unitGrams: 150, vietnam: true },
  { id: 'dragon_fruit',     name: 'Dragon fruit (thanh long)', cal: 60, protein: 1.2, carbs: 13, fat: 0, fiber: 3, category: 'fruits', unit: '100g', unitGrams: 100, vietnam: true },
  { id: 'lychee',           name: 'Lychee (vải)',          cal: 66,  protein: 0.8,carbs: 17, fat: 0.4, fiber: 1.3, category: 'fruits',  unit: '100g',    unitGrams: 100, vietnam: true  },
  // HEALTHY FATS
  { id: 'avocado',          name: 'Avocado (bơ)',          cal: 160, protein: 2,  carbs: 9,  fat: 15,  fiber: 7,   category: 'fats',    unit: '½ fruit (75g)', unitGrams: 75, vietnam: true },
  { id: 'coconut_oil',      name: 'Coconut oil',           cal: 862, protein: 0,  carbs: 0,  fat: 100, fiber: 0,   category: 'fats',    unit: '1 tbsp (14g)',  unitGrams: 14, vietnam: true },
  { id: 'olive_oil',        name: 'Olive oil',             cal: 884, protein: 0,  carbs: 0,  fat: 100, fiber: 0,   category: 'fats',    unit: '1 tbsp (14g)',  unitGrams: 14, vietnam: false },
  { id: 'fish_salmon',      name: 'Salmon',                cal: 208, protein: 20, carbs: 0,  fat: 13,  fiber: 0,   category: 'fats',    unit: '100g',    unitGrams: 100, vietnam: false },
  { id: 'cashews',          name: 'Cashews (hạt điều)',    cal: 553, protein: 18, carbs: 30, fat: 44,  fiber: 3.3, category: 'fats',    unit: '30g',     unitGrams: 30,  vietnam: true  },
  // MIXED MEALS
  { id: 'pho_bo',           name: 'Phở bò (beef noodle soup)', cal: 350, protein: 22, carbs: 45, fat: 8, fiber: 1.5, category: 'mixed', unit: '1 bowl',  unitGrams: 500, vietnam: true  },
  { id: 'com_tam',          name: 'Cơm tấm (broken rice)',    cal: 520, protein: 35, carbs: 55, fat: 16, fiber: 2,  category: 'mixed', unit: '1 plate', unitGrams: 400, vietnam: true  },
  { id: 'banh_mi',          name: 'Bánh mì (sandwich)',       cal: 380, protein: 18, carbs: 48, fat: 12, fiber: 3,  category: 'mixed', unit: '1 bánh',  unitGrams: 200, vietnam: true  },
  { id: 'bun_bo_hue',       name: 'Bún bò Huế',              cal: 420, protein: 25, carbs: 48, fat: 14, fiber: 2,  category: 'mixed', unit: '1 bowl',  unitGrams: 500, vietnam: true  },
  { id: 'rice_chicken',     name: 'Grilled chicken + rice + veg', cal: 480, protein: 42, carbs: 45, fat: 9, fiber: 4, category: 'mixed', unit: '1 plate', unitGrams: 450, vietnam: true },
  { id: 'fried_rice',       name: 'Cơm chiên (fried rice)',  cal: 300, protein: 10, carbs: 42, fat: 10, fiber: 1.5, category: 'mixed', unit: '1 plate', unitGrams: 300, vietnam: true  },
  { id: 'stir_fry_tofu',    name: 'Tofu stir-fry + rice',    cal: 380, protein: 18, carbs: 48, fat: 10, fiber: 4,  category: 'mixed', unit: '1 plate', unitGrams: 350, vietnam: true  },
]

const FOOD_CATEGORIES = [
  { key: 'protein', label: 'Protein',     icon: '🥩', color: '#ef4444' },
  { key: 'carbs',   label: 'Carbs',       icon: '🍚', color: '#f59e0b' },
  { key: 'veggies', label: 'Vegetables',  icon: '🥦', color: '#22c55e' },
  { key: 'fruits',  label: 'Fruits',      icon: '🍌', color: '#f97316' },
  { key: 'fats',    label: 'Healthy Fats',icon: '🥑', color: '#14b8a6' },
  { key: 'mixed',   label: 'Mixed Meals', icon: '🍜', color: '#8b5cf6' },
]

const QUANTITY_MULTIPLIERS = [0.5, 1, 1.5, 2, 2.5, 3]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

function getWeekStartFor(dateStr) {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getLast12WeekStarts() {
  const starts = []
  for (let i = 0; i < 12; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i * 7)
    starts.push(getWeekStartFor(d.toISOString().split('T')[0]))
  }
  return [...new Set(starts)].sort((a, b) => b.localeCompare(a))
}

function getWeekLabel(weekStart) {
  const s = new Date(weekStart)
  const e = new Date(weekStart)
  e.setDate(e.getDate() + 6)
  const o = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString('en-US', o)} – ${e.toLocaleDateString('en-US', o)}`
}

function calcMacros(foodId, qty) {
  const food = FOOD_DB.find(f => f.id === foodId)
  if (!food) return null
  const factor = (food.unitGrams * qty) / 100
  return {
    cal:     Math.round(food.cal     * factor),
    protein: Math.round(food.protein * factor * 10) / 10,
    carbs:   Math.round(food.carbs   * factor * 10) / 10,
    fat:     Math.round(food.fat     * factor * 10) / 10,
    fiber:   Math.round(food.fiber   * factor * 10) / 10,
  }
}

function calcDailyTargets(weightKg, goal, activityLevel) {
  // Protein: 1.8–2.2g/kg for muscle, 1.4–1.6g/kg for maintain, 1.6–2g/kg for cut
  const proteinMultiplier = goal === 'muscle' ? 2.0 : goal === 'cut' ? 1.8 : 1.6
  const protein = Math.round(weightKg * proteinMultiplier)

  // TDEE estimate: BMR * activity factor (simplified — no height needed)
  const activityFactor = activityLevel === 'very_active' ? 1.7 : activityLevel === 'moderate' ? 1.55 : 1.35
  const bmrApprox = weightKg * 22 * 1.1 // rough approximation
  const tdee = Math.round(bmrApprox * activityFactor)

  const calTarget = goal === 'muscle' ? tdee + 300 : goal === 'cut' ? tdee - 400 : tdee
  const proteinCals = protein * 4
  const fatCals = Math.round(calTarget * 0.25)
  const fat = Math.round(fatCals / 9)
  const carbs = Math.round((calTarget - proteinCals - fatCals) / 4)
  const fiber = Math.round(calTarget / 1000 * 15)

  return { calories: calTarget, protein, carbs, fat, fiber }
}

// localStorage helpers for nutrition targets
function getSavedTargets() {
  try { return JSON.parse(localStorage.getItem('lifeos_nutrition_targets') || 'null') } catch { return null }
}
function saveTargets(targets) {
  try { localStorage.setItem('lifeos_nutrition_targets', JSON.stringify(targets)) } catch {}
}

// ─── Workout modals ───────────────────────────────────────────────────────────

function WorkoutModal({ onClose, onSave, editWorkout }) {
  const [type,     setType]     = useState(editWorkout?.type     || 'resistance')
  const [duration, setDuration] = useState(editWorkout?.duration?.toString() || '')
  const [reps,     setReps]     = useState(editWorkout?.reps?.toString()     || '')
  const [notes,    setNotes]    = useState(editWorkout?.notes    || '')
  const [date,     setDate]     = useState(editWorkout?.date     || formatDate())

  const isCalisthenics = getTypeInfo(type).calisthenics

  function handleSave() {
    onSave({ type, duration: parseInt(duration) || 0, notes, date, ...(isCalisthenics ? { reps: parseInt(reps) || 0 } : {}) })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{editWorkout ? 'Edit workout' : 'Log workout'}</div>
        <div className="form-group">
          <label style={{ fontWeight: 700, color: '#3b82f6', marginBottom: 6 }}>Primary — Huberman Protocols</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {HUBERMAN_TYPES.map(t => (
              <div key={t.value} onClick={() => setType(t.value)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', background: type === t.value ? '#3b82f620' : 'var(--bg3)', border: `1px solid ${type === t.value ? '#3b82f6' : 'transparent'}` }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${type === t.value ? '#3b82f6' : 'var(--border2)'}`, background: type === t.value ? '#3b82f6' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {type === t.value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{t.icon}</span>
                <span style={{ fontSize: 14, fontWeight: type === t.value ? 600 : 400, color: type === t.value ? '#3b82f6' : 'var(--text)' }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label style={{ fontWeight: 700, color: '#f97316', marginBottom: 6 }}>Secondary — Personal Training</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SECONDARY_TYPES.map(t => (
              <div key={t.value} onClick={() => setType(t.value)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', background: type === t.value ? '#f9731620' : 'var(--bg3)', border: `1px solid ${type === t.value ? '#f97316' : 'transparent'}` }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${type === t.value ? '#f97316' : 'var(--border2)'}`, background: type === t.value ? '#f97316' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {type === t.value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{t.icon}</span>
                <span style={{ fontSize: 14, fontWeight: type === t.value ? 600 : 400, color: type === t.value ? '#f97316' : 'var(--text)' }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Duration (mins)</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="45" min="1" />
          </div>
          {isCalisthenics && (
            <div className="form-group">
              <label>Reps</label>
              <input type="number" value={reps} onChange={e => setReps(e.target.value)} placeholder="e.g. 15" min="1" />
            </div>
          )}
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Notes (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Upper body push day" />
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{editWorkout ? 'Update' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

function MetricsModal({ onClose, onSave }) {
  const [weight, setWeight] = useState('')
  const [sleep,  setSleep]  = useState('')
  const [water,  setWater]  = useState('')
  const [energy, setEnergy] = useState('3')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Log today's metrics</div>
        <div className="form-row">
          <div className="form-group">
            <label>Weight (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70.5" step="0.1" />
          </div>
          <div className="form-group">
            <label>Sleep (hours)</label>
            <input type="number" value={sleep} onChange={e => setSleep(e.target.value)} placeholder="7.5" step="0.5" min="0" max="12" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Water (litres)</label>
            <input type="number" value={water} onChange={e => setWater(e.target.value)} placeholder="2.5" step="0.25" min="0" max="6" />
          </div>
          <div className="form-group">
            <label>Energy level (1–5)</label>
            <select value={energy} onChange={e => setEnergy(e.target.value)}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} — {['Very low','Low','Average','High','Peak'][n-1]}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            onSave({ weight: parseFloat(weight)||null, sleep: parseFloat(sleep)||null, water: parseFloat(water)||null, energy: parseInt(energy) })
            onClose()
          }}>Save metrics</button>
        </div>
      </div>
    </div>
  )
}

// ─── Nutrition targets setup modal ───────────────────────────────────────────

function NutritionSetupModal({ onClose, onSave, existing }) {
  const [weight,   setWeight]   = useState(existing?.weightKg?.toString()   || '')
  const [goal,     setGoal]     = useState(existing?.goal     || 'muscle')
  const [activity, setActivity] = useState(existing?.activity || 'moderate')

  const preview = weight ? calcDailyTargets(parseFloat(weight), goal, activity) : null

  const GOALS = [
    { value: 'muscle', label: '💪 Build muscle', desc: 'Small calorie surplus, high protein' },
    { value: 'maintain', label: '⚖️ Maintain', desc: 'Match energy output, balanced macros' },
    { value: 'cut', label: '🔥 Lose fat', desc: 'Calorie deficit, preserve muscle' },
  ]
  const ACTIVITIES = [
    { value: 'sedentary',   label: 'Sedentary',    desc: 'Mostly sitting, light movement' },
    { value: 'moderate',    label: 'Moderate',     desc: '3–5 workouts/week' },
    { value: 'very_active', label: 'Very active',  desc: '6+ workouts/week, physical job' },
  ]

  function handleSave() {
    if (!weight || !preview) return
    onSave({ weightKg: parseFloat(weight), goal, activity, targets: preview })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">⚙️ Set my nutrition targets</div>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.6 }}>
          Answer 3 quick questions. The app calculates your daily targets using Huberman Lab + sports nutrition protocols.
        </p>

        <div className="form-group">
          <label>Your current weight (kg)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 70" step="0.5" />
        </div>

        <div className="form-group">
          <label>Your goal</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {GOALS.map(g => (
              <div key={g.value} onClick={() => setGoal(g.value)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', background: goal === g.value ? 'rgba(124,106,255,0.1)' : 'var(--bg3)', border: `1px solid ${goal === g.value ? 'var(--accent)' : 'var(--border2)'}` }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${goal === g.value ? 'var(--accent)' : 'var(--border2)'}`, background: goal === g.value ? 'var(--accent)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {goal === g.value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: goal === g.value ? 'var(--accent2)' : 'var(--text)' }}>{g.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{g.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Activity level</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ACTIVITIES.map(a => (
              <div key={a.value} onClick={() => setActivity(a.value)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', background: activity === a.value ? 'rgba(124,106,255,0.1)' : 'var(--bg3)', border: `1px solid ${activity === a.value ? 'var(--accent)' : 'var(--border2)'}` }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${activity === a.value ? 'var(--accent)' : 'var(--border2)'}`, background: activity === a.value ? 'var(--accent)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activity === a.value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: activity === a.value ? 'var(--accent2)' : 'var(--text)' }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {preview && (
          <div style={{ background: 'rgba(124,106,255,0.08)', border: '1px solid rgba(124,106,255,0.25)', borderRadius: 10, padding: '14px 16px', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your daily targets</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, textAlign: 'center' }}>
              {[
                { label: 'Calories', val: `${preview.calories}`, unit: 'kcal', color: 'var(--text)' },
                { label: 'Protein',  val: `${preview.protein}g`, unit: '',      color: '#ef4444' },
                { label: 'Carbs',    val: `${preview.carbs}g`,   unit: '',      color: '#f59e0b' },
                { label: 'Fat',      val: `${preview.fat}g`,     unit: '',      color: '#14b8a6' },
                { label: 'Fiber',    val: `${preview.fiber}g`,   unit: '',      color: '#22c55e' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!preview}>Save targets</button>
        </div>
      </div>
    </div>
  )
}

// ─── Smart food log modal ─────────────────────────────────────────────────────

function SmartFoodModal({ onClose, onSave, editEntry }) {
  const [step,        setStep]        = useState(editEntry ? 'details' : 'category')
  const [category,    setCategory]    = useState(editEntry?.category    || null)
  const [selectedFood, setSelectedFood] = useState(editEntry?.foodId ? FOOD_DB.find(f => f.id === editEntry.foodId) : null)
  const [qty,         setQty]         = useState(editEntry?.qty         || 1)
  const [meal,        setMeal]        = useState(editEntry?.meal        || 'Lunch')
  const [notes,       setNotes]       = useState(editEntry?.notes       || '')
  const [date,        setDate]        = useState(editEntry?.date        || formatDate())
  const [search,      setSearch]      = useState('')
  const [vietnamOnly, setVietnamOnly] = useState(false)

  const filteredFoods = useMemo(() => {
    let list = category ? FOOD_DB.filter(f => f.category === category) : FOOD_DB
    if (vietnamOnly) list = list.filter(f => f.vietnam)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(f => f.name.toLowerCase().includes(q))
    }
    return list
  }, [category, search, vietnamOnly])

  const macros = selectedFood ? calcMacros(selectedFood.id, qty) : null

  const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

  function handleSave() {
    if (!selectedFood || !macros) return
    onSave({
      foodId:    selectedFood.id,
      foodName:  selectedFood.name,
      category:  selectedFood.category,
      qty,
      meal,
      notes,
      date,
      ...macros,
    })
    onClose()
  }

  // Step 1: category picker
  if (step === 'category') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-title">🥗 Log meal — pick a category</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {FOOD_CATEGORIES.map(cat => (
              <div
                key={cat.key}
                onClick={() => { setCategory(cat.key); setStep('food') }}
                style={{ padding: '16px 14px', borderRadius: 10, cursor: 'pointer', background: 'var(--bg3)', border: '1px solid var(--border2)', textAlign: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.background = cat.color + '15' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg3)' }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>{cat.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{cat.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  {FOOD_DB.filter(f => f.category === cat.key).length} foods
                </div>
              </div>
            ))}
          </div>
          <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep('food')}>
            🔍 Search all foods
          </button>
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text3)' }}>Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: food picker
  if (step === 'food') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <button className="btn btn-sm" onClick={() => setStep('category')}>← Back</button>
            <div className="modal-title" style={{ margin: 0 }}>
              {category ? `${FOOD_CATEGORIES.find(c => c.key === category)?.icon} ${FOOD_CATEGORIES.find(c => c.key === category)?.label}` : '🔍 All foods'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search food..."
              style={{ flex: 1 }}
            />
            <button
              onClick={() => setVietnamOnly(v => !v)}
              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${vietnamOnly ? '#22c55e' : 'var(--border2)'}`, background: vietnamOnly ? 'rgba(34,197,94,0.1)' : 'var(--bg3)', color: vietnamOnly ? '#22c55e' : 'var(--text3)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              🇻🇳 VN only
            </button>
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filteredFoods.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 13 }}>No foods found</div>
            ) : filteredFoods.map(food => (
              <div
                key={food.id}
                onClick={() => { setSelectedFood(food); setStep('details') }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: 'var(--bg3)', border: '1px solid transparent', transition: 'all 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg4)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'var(--bg3)' }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{food.name}{food.vietnam && <span style={{ marginLeft: 6, fontSize: 11, color: '#22c55e' }}>🇻🇳</span>}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>per {food.unit}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text3)' }}>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>{Math.round(food.protein * food.unitGrams / 100)}g P</span>
                  <span>{Math.round(food.cal * food.unitGrams / 100)} kcal</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text3)' }}>Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  // Step 3: quantity + details
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          {!editEntry && <button className="btn btn-sm" onClick={() => setStep('food')}>← Back</button>}
          <div className="modal-title" style={{ margin: 0 }}>{selectedFood?.name}</div>
        </div>

        {/* Quantity selector */}
        <div className="form-group">
          <label>Quantity ({selectedFood?.unit})</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {QUANTITY_MULTIPLIERS.map(q => (
              <button
                key={q}
                onClick={() => setQty(q)}
                style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${qty === q ? 'var(--accent)' : 'var(--border2)'}`, background: qty === q ? 'rgba(124,106,255,0.15)' : 'var(--bg3)', color: qty === q ? 'var(--accent2)' : 'var(--text)', fontWeight: qty === q ? 700 : 400, cursor: 'pointer', fontSize: 13 }}
              >
                ×{q}
              </button>
            ))}
            <input
              type="number"
              value={qty}
              onChange={e => setQty(parseFloat(e.target.value) || 1)}
              step="0.5"
              min="0.25"
              style={{ width: 70 }}
              placeholder="custom"
            />
          </div>
        </div>

        {/* Live macro preview */}
        {macros && (
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, border: '1px solid var(--border2)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Nutritional content — {qty === 1 ? '' : `${qty}× `}{selectedFood?.unit}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, textAlign: 'center' }}>
              {[
                { label: 'Calories', val: macros.cal,     unit: 'kcal', color: 'var(--text)' },
                { label: 'Protein',  val: `${macros.protein}g`, unit: '', color: '#ef4444' },
                { label: 'Carbs',    val: `${macros.carbs}g`,   unit: '', color: '#f59e0b' },
                { label: 'Fat',      val: `${macros.fat}g`,     unit: '', color: '#14b8a6' },
                { label: 'Fiber',    val: `${macros.fiber}g`,   unit: '', color: '#22c55e' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Meal</label>
            <select value={meal} onChange={e => setMeal(e.target.value)}>
              {MEALS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Notes (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder='e.g. "felt energized after"' />
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{editEntry ? 'Update' : '✓ Log this meal'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── History sub-components ───────────────────────────────────────────────────

function CalendarView({ workouts, updateWorkout, deleteWorkout }) {
  const now   = new Date()
  const [year,      setYear]      = useState(now.getFullYear())
  const [month,     setMonth]     = useState(now.getMonth())
  const [dayPopup,  setDayPopup]  = useState(null)
  const [editWorkout, setEditWorkout] = useState(null)

  const { firstDay, daysInMonth } = getMonthDays(year, month)
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const workoutsByDay = useMemo(() => {
    const map = {}
    workouts.forEach(w => {
      if (!map[w.date]) map[w.date] = []
      map[w.date].push(w)
    })
    return map
  }, [workouts])

  const blanks = firstDay === 0 ? 6 : firstDay - 1

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="card-title" style={{ margin: 0 }}>📅 Calendar</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-sm" onClick={() => { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1) }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 120, textAlign: 'center' }}>{monthName}</span>
          <button className="btn btn-sm" onClick={() => { if (month === 11) { setMonth(0); setYear(y => y+1) } else setMonth(m => m+1) }}>›</button>
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
          const day = i + 1
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const dayWorkouts = workoutsByDay[dateStr] || []
          const isToday = dateStr === formatDate()
          const isActive = dayPopup === dateStr
          const hasHuberman  = dayWorkouts.some(w => isHuberman(w.type))
          const hasSecondary = dayWorkouts.some(w => !isHuberman(w.type))
          return (
            <div
              key={day}
              onClick={() => dayWorkouts.length && setDayPopup(isActive ? null : dateStr)}
              style={{ minHeight: 38, borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: dayWorkouts.length ? 'pointer' : 'default', background: isActive ? 'var(--accent-glow)' : isToday ? 'var(--bg4)' : 'var(--bg3)', border: `1px solid ${isActive ? 'var(--accent)' : isToday ? 'var(--border2)' : 'transparent'}` }}
            >
              <span style={{ fontSize: 12, color: isToday ? 'var(--text)' : 'var(--text2)', fontWeight: isToday ? 700 : 400 }}>{day}</span>
              {dayWorkouts.length > 0 && (
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  {hasHuberman  && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />}
                  {hasSecondary && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316' }} />}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {dayPopup && workoutsByDay[dayPopup] && (
        <div style={{ marginTop: 12, background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border2)', overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>{dayPopup}</div>
          {workoutsByDay[dayPopup].map(w => {
            const t = getTypeInfo(w.type)
            return (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: t.color }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, display: 'flex', gap: 10 }}>
                    {w.duration > 0 && <span>⏱ {w.duration} min</span>}
                    {w.reps     > 0 && <span>✕ {w.reps} reps</span>}
                    {w.notes       && <span style={{ fontStyle: 'italic' }}>{w.notes}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-sm" onClick={() => setEditWorkout(w)}>✏️</button>
                  <button className="btn btn-sm btn-danger" onClick={() => { deleteWorkout(w.id); if ((workoutsByDay[dayPopup]||[]).length <= 1) setDayPopup(null) }}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} /> Huberman protocol</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316', display: 'inline-block' }} /> Personal training</span>
      </div>
      {editWorkout && (
        <WorkoutModal editWorkout={editWorkout} onClose={() => setEditWorkout(null)} onSave={data => { updateWorkout(editWorkout.id, data); setEditWorkout(null) }} />
      )}
    </div>
  )
}

function WeekHistoryCards({ workouts }) {
  const weekStarts = getLast12WeekStarts()
  const currentWeekStart = getWeekStart()
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Last 12 weeks</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {weekStarts.filter(ws => ws !== currentWeekStart).map(ws => {
          const weekEnd = (() => { const d = new Date(ws); d.setDate(d.getDate()+6); return d.toISOString().split('T')[0] })()
          const ww = workouts.filter(w => w.date >= ws && w.date <= weekEnd)
          const resistance = ww.filter(w => w.type === 'resistance').length
          const zone2Mins  = ww.filter(w => w.type === 'zone2').reduce((a, w) => a + (w.duration||0), 0)
          const total      = ww.length
          const score = total === 0 ? 0 : Math.min(100, Math.round(Math.min(100, (resistance/3)*100) * 0.5 + Math.min(100, (zone2Mins/135)*100) * 0.5))
          return (
            <div key={ws} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{getWeekLabel(ws)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>🏋️ {resistance}</span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>🫀 {zone2Mins}m</span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{total} workouts</span>
                <span className={`badge ${score >= 80 ? 'badge-green' : score >= 50 ? 'badge-amber' : 'badge-red'}`}>{score}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Nutrition basics card ────────────────────────────────────────────────────

function NutritionBasics({ onDismiss }) {
  const MACROS = [
    { macro: 'Protein', cal: '4 cal/g', color: '#ef4444', role: 'Builds & repairs muscle — your #1 priority for physique', foods: 'Chicken, fish, eggs, tofu, beans' },
    { macro: 'Carbs',   cal: '4 cal/g', color: '#f59e0b', role: 'Main energy source for workouts and daily life', foods: 'Rice, oats, sweet potato, banana' },
    { macro: 'Fats',    cal: '9 cal/g', color: '#14b8a6', role: 'Hormones, brain health, satiety — go for healthy sources', foods: 'Avocado, peanuts, olive oil, fatty fish' },
    { macro: 'Fiber',   cal: 'n/a',    color: '#22c55e', role: 'Digestion, fullness, blood sugar control. Aim ~15g per 1000 kcal', foods: 'Veggies, beans, whole grains, fruit' },
  ]
  return (
    <div className="card" style={{ marginBottom: 16, border: '1px solid rgba(124,106,255,0.2)', background: 'rgba(124,106,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent2)' }}>📖 Nutrition basics</div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text3)' }}>Dismiss</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MACROS.map(m => (
          <div key={m.macro} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ minWidth: 64, fontSize: 13, fontWeight: 700, color: m.color }}>{m.macro} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text3)' }}>{m.cal}</span></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.4 }}>{m.role}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>e.g. {m.foods}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(34,197,94,0.07)', borderRadius: 8, fontSize: 12, color: 'var(--text3)' }}>
        💡 Simple rule: Fill ½ your plate with vegetables, ¼ with protein, ¼ with carbs.
      </div>
    </div>
  )
}

// ─── Food section ─────────────────────────────────────────────────────────────

function FoodSection({ foodLogs, logFood, updateFood, deleteFood, latestWeight }) {
  const [showModal,      setShowModal]      = useState(false)
  const [editEntry,      setEditEntry]      = useState(null)
  const [showSetup,      setShowSetup]      = useState(false)
  const [showBasics,     setShowBasics]     = useState(() => {
    try { return !localStorage.getItem('lifeos_basics_dismissed') } catch { return true }
  })
  const [nutritionConfig, setNutritionConfig] = useState(() => getSavedTargets())

  const today     = formatDate()
  const todayLogs = foodLogs.filter(f => f.date === today)

  // Aggregate today's macros from smart logs
  const todayMacros = useMemo(() => {
    return todayLogs.reduce((acc, f) => ({
      cal:     acc.cal     + (f.cal     || 0),
      protein: acc.protein + (f.protein || 0),
      carbs:   acc.carbs   + (f.carbs   || 0),
      fat:     acc.fat     + (f.fat     || 0),
      fiber:   acc.fiber   + (f.fiber   || 0),
    }), { cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
  }, [todayLogs])

  const targets = nutritionConfig?.targets || null

  // Daily food score
  const foodScore = useMemo(() => {
    if (!targets || todayLogs.length === 0) return null
    let score = 0
    const reasons = []

    // Protein: up to 40 pts
    const proteinPct = Math.min(100, (todayMacros.protein / targets.protein) * 100)
    const proteinPts = Math.round(proteinPct * 0.4)
    score += proteinPts
    reasons.push({ label: 'Protein', pts: proteinPts, max: 40, ok: proteinPct >= 80 })

    // Calories in range: up to 30 pts
    const calLow  = targets.calories * 0.85
    const calHigh = targets.calories * 1.15
    const calOk   = todayMacros.cal >= calLow && todayMacros.cal <= calHigh
    const calPts  = calOk ? 30 : todayMacros.cal < calLow ? Math.round(30 * (todayMacros.cal / calLow)) : Math.round(30 * Math.max(0, 1 - (todayMacros.cal - calHigh) / (targets.calories * 0.2)))
    score += calPts
    reasons.push({ label: 'Calories', pts: calPts, max: 30, ok: calOk })

    // Fiber: up to 20 pts
    const fiberPct = Math.min(100, (todayMacros.fiber / targets.fiber) * 100)
    const fiberPts = Math.round(fiberPct * 0.2)
    score += fiberPts
    reasons.push({ label: 'Fiber', pts: fiberPts, max: 20, ok: fiberPct >= 70 })

    // Logged meals: up to 10 pts (incentivise logging 3+ times)
    const logPts = Math.min(10, todayLogs.length * 3)
    score += logPts
    reasons.push({ label: 'Consistency', pts: logPts, max: 10, ok: todayLogs.length >= 3 })

    return { score: Math.round(score), reasons }
  }, [todayLogs, todayMacros, targets])

  function dismissBasics() {
    try { localStorage.setItem('lifeos_basics_dismissed', '1') } catch {}
    setShowBasics(false)
  }

  function handleSaveConfig(config) {
    saveTargets(config)
    setNutritionConfig(config)
  }

  function handleSaveFood(data) {
    if (editEntry) updateFood(editEntry.id, data)
    else logFood(data)
  }

  const catMeta = Object.fromEntries(FOOD_CATEGORIES.map(c => [c.key, c]))

  return (
    <div style={{ marginTop: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div className="section-title" style={{ fontSize: 15 }}>🥗 Food & Nutrition</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Huberman Lab + sports nutrition protocols</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" onClick={() => setShowSetup(true)}>⚙️ {nutritionConfig ? 'Edit targets' : 'Set targets'}</button>
          <button className="btn btn-primary" onClick={() => { setEditEntry(null); setShowModal(true) }}>+ Log meal</button>
        </div>
      </div>

      {/* Nutrition basics */}
      {showBasics && <NutritionBasics onDismiss={dismissBasics} />}

      {/* Daily targets + macro bars */}
      {targets && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="card-title" style={{ margin: 0 }}>Today's nutrition</div>
            {foodScore && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>Food score</span>
                <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', color: foodScore.score >= 80 ? '#22c55e' : foodScore.score >= 55 ? '#f59e0b' : '#ef4444' }}>
                  {foodScore.score}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>/100</span>
              </div>
            )}
          </div>

          {/* Macro progress bars */}
          {[
            { key: 'protein', label: 'Protein',  val: todayMacros.protein, target: targets.protein, unit: 'g', color: '#ef4444' },
            { key: 'carbs',   label: 'Carbs',    val: todayMacros.carbs,   target: targets.carbs,   unit: 'g', color: '#f59e0b' },
            { key: 'fat',     label: 'Fat',      val: todayMacros.fat,     target: targets.fat,     unit: 'g', color: '#14b8a6' },
            { key: 'fiber',   label: 'Fiber',    val: todayMacros.fiber,   target: targets.fiber,   unit: 'g', color: '#22c55e' },
            { key: 'cal',     label: 'Calories', val: todayMacros.cal,     target: targets.calories, unit: 'kcal', color: 'var(--accent2)' },
          ].map(m => {
            const pct = Math.min(100, Math.round((m.val / m.target) * 100))
            return (
              <div key={m.key} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: m.color, fontWeight: 600 }}>{m.label}</span>
                  <span style={{ color: 'var(--text3)' }}>{Math.round(m.val * 10) / 10}{m.unit} / {m.target}{m.unit} ({pct}%)</span>
                </div>
                <div className="progress-bar" style={{ height: 7 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 90 ? '#22c55e' : pct >= 60 ? m.color : '#ef4444' }} />
                </div>
              </div>
            )
          })}

          {/* Score breakdown */}
          {foodScore && foodScore.reasons.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {foodScore.reasons.map(r => (
                <span key={r.label} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, background: r.ok ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: r.ok ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
                  {r.ok ? '✓' : '↑'} {r.label} {r.pts}/{r.max}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No targets set yet */}
      {!targets && (
        <div style={{ padding: '16px 20px', borderRadius: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', marginBottom: 2 }}>⚙️ Set your nutrition targets</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Takes 30 seconds — enables macro tracking and daily food score</div>
          </div>
          <button className="btn btn-sm" style={{ borderColor: '#f59e0b', color: '#f59e0b', flexShrink: 0 }} onClick={() => setShowSetup(true)}>Set up now →</button>
        </div>
      )}

      {/* Today's meal logs */}
      {todayLogs.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <div className="empty-state-icon">🥗</div>
          <h3>No meals logged today</h3>
          <p>Tap "+ Log meal" to start tracking your nutrition</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          {todayLogs.map(f => {
            const cat = catMeta[f.category]
            const borderColor = cat?.color || 'var(--border2)'
            return (
              <div key={f.id} className="card" style={{ borderLeft: `3px solid ${borderColor}`, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{f.meal}</span>
                      {cat && <span style={{ fontSize: 11, color: cat.color, fontWeight: 600 }}>{cat.icon} {cat.label}</span>}
                      {f.qty && f.qty !== 1 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>×{f.qty}</span>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: f.notes ? 4 : 0 }}>{f.foodName || f.what}</div>
                    {/* Macro pills */}
                    {(f.protein || f.cal) && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                        {f.cal     > 0 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{f.cal} kcal</span>}
                        {f.protein > 0 && <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>{f.protein}g protein</span>}
                        {f.carbs   > 0 && <span style={{ fontSize: 11, color: '#f59e0b' }}>{f.carbs}g carbs</span>}
                        {f.fat     > 0 && <span style={{ fontSize: 11, color: '#14b8a6' }}>{f.fat}g fat</span>}
                        {f.fiber   > 0 && <span style={{ fontSize: 11, color: '#22c55e' }}>{f.fiber}g fiber</span>}
                      </div>
                    )}
                    {f.notes && <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', marginTop: 3 }}>{f.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-sm" onClick={() => { setEditEntry(f); setShowModal(true) }}>✏️</button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteFood(f.id)}>✕</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <SmartFoodModal
          editEntry={editEntry}
          onClose={() => { setShowModal(false); setEditEntry(null) }}
          onSave={handleSaveFood}
        />
      )}
      {showSetup && (
        <NutritionSetupModal
          existing={nutritionConfig}
          onClose={() => setShowSetup(false)}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function FitnessView({ workouts, metrics, foodLogs, loading, logWorkout, updateWorkout, deleteWorkout, logMetrics, logFood, updateFood, deleteFood, getWeekWorkouts, getWeekScore, getLatestWeight }) {
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [showMetricsModal, setShowMetricsModal] = useState(false)
  const [editWorkout,      setEditWorkout]      = useState(null)
  const [showHistory,      setShowHistory]      = useState(false)

  const weekWorkouts    = getWeekWorkouts()
  const weekScore       = getWeekScore()
  const resistanceCount = weekWorkouts.filter(w => w.type === 'resistance').length
  const zone2Mins       = weekWorkouts.filter(w => w.type === 'zone2').reduce((a, w) => a + (w.duration||0), 0)
  const todayMetrics    = metrics.find(m => m.date === formatDate())
  const latestWeight    = getLatestWeight()

  function handleSaveWorkout(data) {
    if (editWorkout) updateWorkout(editWorkout.id, data)
    else logWorkout(data)
  }

  if (loading) return <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div className="fade-in">
      <div className="section-header">
        <div>
          <div className="section-title">💪 Fitness</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Based on Huberman Lab protocols</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setShowMetricsModal(true)}>📊 Log metrics</button>
          <button className="btn btn-primary" onClick={() => { setEditWorkout(null); setShowWorkoutModal(true) }}>+ Log workout</button>
        </div>
      </div>

      {/* Week stats */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: resistanceCount >= 3 ? 'var(--green)' : 'var(--amber)' }}>{resistanceCount}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Resistance</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Ideal: 3/week</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: zone2Mins >= 135 ? 'var(--green)' : 'var(--amber)' }}>{zone2Mins}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Zone 2 mins</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Ideal: 135/week</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: todayMetrics?.sleep >= 7.5 ? 'var(--green)' : todayMetrics?.sleep ? 'var(--amber)' : 'var(--text3)' }}>
            {todayMetrics?.sleep || '—'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Sleep hrs</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Ideal: 7.5–8</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: scoreColor(weekScore) }}>{weekScore}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Week score</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Ideal: 95</div>
        </div>
      </div>

      {/* Zone 2 progress */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Huberman Zone 2 target</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>
          <span>{zone2Mins} mins done</span><span>Target: 135 mins</span>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div className="progress-fill" style={{ width: `${Math.min(100, (zone2Mins/135)*100)}%`, background: zone2Mins >= 135 ? 'var(--green)' : 'var(--teal)' }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
          {zone2Mins >= 135 ? '✓ Weekly target met!' : `${135 - zone2Mins} mins remaining this week`}
        </div>
      </div>

      {/* Today metrics */}
      {todayMetrics && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Today's metrics</div>
          <div className="grid-4">
            {todayMetrics.weight && <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: 18 }}>{todayMetrics.weight} kg</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>Weight</div></div>}
            {todayMetrics.sleep  && <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: 18 }}>{todayMetrics.sleep} hrs</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>Sleep</div></div>}
            {todayMetrics.water  && <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: 18 }}>{todayMetrics.water} L</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>Water</div></div>}
            {todayMetrics.energy && <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: 18 }}>{todayMetrics.energy}/5</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>Energy</div></div>}
          </div>
        </div>
      )}

      {/* This week's workouts */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="section-title" style={{ fontSize: 15 }}>This week's workouts</div>
      </div>
      {weekWorkouts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💪</div>
          <h3>No workouts logged yet</h3>
          <p>Log your first workout to start tracking</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {weekWorkouts.map(w => {
            const t = getTypeInfo(w.type)
            return (
              <div key={w.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderLeft: `3px solid ${t.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 10, marginTop: 2 }}>
                      {w.duration > 0 && <span>{w.duration} min</span>}
                      {w.reps     > 0 && <span>{w.reps} reps</span>}
                      {w.notes       && <span style={{ fontStyle: 'italic' }}>{w.notes}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{w.date}</span>
                  <button className="btn btn-sm" onClick={() => { setEditWorkout(w); setShowWorkoutModal(true) }}>✏️</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteWorkout(w.id)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Food section */}
      <FoodSection
        foodLogs={foodLogs}
        logFood={logFood}
        updateFood={updateFood}
        deleteFood={deleteFood}
        latestWeight={latestWeight}
      />

      {/* History toggle */}
      <div style={{ marginTop: 28 }}>
        <button
          className="btn"
          style={{ width: '100%', justifyContent: 'center', marginBottom: showHistory ? 16 : 0 }}
          onClick={() => setShowHistory(h => !h)}
        >
          {showHistory ? '▲ Hide history' : '▼ Show history (calendar + last 12 weeks)'}
        </button>
        {showHistory && (
          <>
            <CalendarView workouts={workouts} updateWorkout={updateWorkout} deleteWorkout={deleteWorkout} />
            <WeekHistoryCards workouts={workouts} />
          </>
        )}
      </div>

      {/* Modals */}
      {showWorkoutModal && (
        <WorkoutModal
          editWorkout={editWorkout}
          onClose={() => { setShowWorkoutModal(false); setEditWorkout(null) }}
          onSave={handleSaveWorkout}
        />
      )}
      {showMetricsModal && (
        <MetricsModal onClose={() => setShowMetricsModal(false)} onSave={logMetrics} />
      )}
    </div>
  )
}
