function round(value) {
  return Math.round(value)
}

function clamp(value, min, max) {
  // 所有目标热量最终都要被限制在安全区间内，避免推演目标过激。
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
  // 用户没填目标变化时，减脂默认 3kg，增肌默认 2kg。
  return normalizePositiveNumber(targetKg, goal === 'gain' ? 2 : 3)
}

export function getDailyAdjustment(goal, targetKg, weeks) {
  // 把总目标换算成“平均每天需要多/少多少热量”。
  // 减脂按 7700 kcal/kg，增肌按更保守的 5500 kcal/kg。
  const totalEnergyPerKg = goal === 'gain' ? 5500 : 7700
  return round((targetKg * totalEnergyPerKg) / (weeks * 7))
}

export function getGoalCalorieRange({ goal, sex, tdee }) {
  // 每种目标都先给一个允许区间。
  // 最终建议不能无限偏离 TDEE，而要落在这个区间里。
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
  // 这个函数反推“最多能安全推到多少 kg 目标变化”。
  // 本质上是在看：如果继续按目标推，哪一步会撞到热量护栏。
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
  // UI 层需要的不只是 clampKg，还需要给用户看得懂的护栏说明文案。
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
  // 这是最核心的目标推演函数：
  // 先算出按目标需要的 rawTarget，再把它钳制到安全区间内，得到最终建议热量。
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
