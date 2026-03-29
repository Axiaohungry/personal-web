import { buildGoalTarget } from './caloriePlanning.js'

function round(value) {
  return Math.round(value)
}

export function buildMacroPlan({ weightKg, targetCalories, mode }) {
  const proteinRatioByMode = {
    maintain: 1.8,
    cut: 2.2,
    'lean-gain': 1.8,
  }

  const proteinRatio = proteinRatioByMode[mode] ?? proteinRatioByMode.maintain
  const protein = round(weightKg * proteinRatio)
  const fat = Math.max(round(weightKg * 0.8), 45)
  const carbs = Math.max(0, round((targetCalories - protein * 4 - fat * 9) / 4))

  return {
    protein,
    fat,
    carbs,
  }
}

export function buildScenarioPlans(input, legacyTdee) {
  const options = input && typeof input === 'object'
    ? input
    : { tdee: legacyTdee }

  const {
    sex = 'male',
    weeks = 8,
    targetKg = 3,
    tdee,
  } = options

  const cut = buildGoalTarget({
    goal: 'cut',
    sex,
    weeks,
    targetKg,
    tdee,
  })
  const leanGain = buildGoalTarget({
    goal: 'gain',
    sex,
    weeks,
    targetKg,
    tdee,
  })

  const {
    min: cutMin,
    max: cutMax,
    target: cutTarget,
    dailyAdjustment: cutDailyAdjustment,
  } = cut

  const {
    min: gainMin,
    max: gainMax,
    target: gainTarget,
    dailyAdjustment: gainDailyAdjustment,
  } = leanGain

  return {
    maintain: { target: round(tdee) },
    cut: {
      min: cutMin,
      max: cutMax,
      target: cutTarget,
      dailyAdjustment: cutDailyAdjustment,
    },
    'lean-gain': {
      min: gainMin,
      max: gainMax,
      target: gainTarget,
      dailyAdjustment: gainDailyAdjustment,
    },
  }
}
