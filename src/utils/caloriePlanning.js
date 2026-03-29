function round(value) {
  return Math.round(value)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function roundUpToStep(value, step = 0.5) {
  const safeStep = step > 0 ? step : 0.5
  return Math.ceil((value - 1e-9) / safeStep) * safeStep
}

export function normalizeSex(value) {
  return value === 'female' ? 'female' : 'male'
}

export function normalizeGoal(value) {
  return value === 'gain' ? 'gain' : 'cut'
}

export function normalizeWeeks(value, fallback = 8) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 4 ? parsed : fallback
}

export function normalizePositiveNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function getPlanningTargetKg(goal, targetKg) {
  return normalizePositiveNumber(targetKg, goal === 'gain' ? 2 : 3)
}

export function getDailyAdjustment(goal, targetKg, weeks) {
  const totalEnergyPerKg = goal === 'gain' ? 5500 : 7700
  return round((targetKg * totalEnergyPerKg) / (weeks * 7))
}

export function getGoalCalorieRange({ goal, sex, tdee }) {
  const normalizedGoal = normalizeGoal(goal)
  const normalizedSex = normalizeSex(sex)

  if (normalizedGoal === 'cut') {
    const multipliers = normalizedSex === 'female'
      ? { min: 0.82, max: 0.92 }
      : { min: 0.8, max: 0.9 }
    return {
      min: round(tdee * multipliers.min),
      max: round(tdee * multipliers.max),
    }
  }

  const multipliers = normalizedSex === 'female'
    ? { min: 1.04, max: 1.09 }
    : { min: 1.05, max: 1.12 }

  return {
    min: round(tdee * multipliers.min),
    max: round(tdee * multipliers.max),
  }
}

export function getGoalClampTargetKg({ goal, sex, weeks, tdee, step = 0.5 }) {
  const normalizedGoal = normalizeGoal(goal)
  const cycleWeeks = normalizeWeeks(weeks)
  const safeTdee = Number(tdee)

  if (!Number.isFinite(safeTdee) || safeTdee <= 0) {
    return null
  }

  const range = getGoalCalorieRange({
    goal: normalizedGoal,
    sex,
    tdee: safeTdee,
  })

  const kcalDeltaToClamp = normalizedGoal === 'cut'
    ? safeTdee - range.min
    : range.max - safeTdee

  if (kcalDeltaToClamp <= 0) {
    return Math.max(1, step)
  }

  const kcalPerKg = (normalizedGoal === 'gain' ? 5500 : 7700) / (cycleWeeks * 7)
  const clampKg = roundUpToStep(kcalDeltaToClamp / kcalPerKg, step)

  return Number(Math.max(1, clampKg).toFixed(1))
}

export function getGoalClampGuidance({ goal, sex, weeks, tdee, step = 0.5 }) {
  const normalizedGoal = normalizeGoal(goal)
  const safeTdee = Number(tdee)

  if (!Number.isFinite(safeTdee) || safeTdee <= 0) {
    return null
  }

  const range = getGoalCalorieRange({
    goal: normalizedGoal,
    sex,
    tdee: safeTdee,
  })

  return {
    clampKg: getGoalClampTargetKg({ goal, sex, weeks, tdee, step }),
    clampCalories: normalizedGoal === 'cut' ? range.min : range.max,
    guardrailLabel: normalizedGoal === 'cut' ? '减脂下限' : '增肌上限',
    trendLabel: normalizedGoal === 'cut' ? '继续下降' : '继续上升',
  }
}

export function buildGoalTarget({ goal, sex, weeks, targetKg, tdee }) {
  const normalizedGoal = normalizeGoal(goal)
  const cycleWeeks = normalizeWeeks(weeks)
  const normalizedTargetKg = getPlanningTargetKg(normalizedGoal, targetKg)
  const dailyAdjustment = getDailyAdjustment(normalizedGoal, normalizedTargetKg, cycleWeeks)
  const range = getGoalCalorieRange({
    goal: normalizedGoal,
    sex,
    tdee,
  })
  const rawTarget = normalizedGoal === 'cut'
    ? round(tdee - dailyAdjustment)
    : round(tdee + dailyAdjustment)

  return {
    ...range,
    target: clamp(rawTarget, range.min, range.max),
    dailyAdjustment,
    weeks: cycleWeeks,
    targetKg: normalizedTargetKg,
  }
}
