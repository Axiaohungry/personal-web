import { buildGoalTarget } from './caloriePlanning.js'

function round(value) {
  return Math.round(value)
}

export function buildMacroPlan({ weightKg, targetCalories, mode }) {
  // 宏量营养的分配思路是：
  // 先按目标模式锁一个蛋白倍率，再给脂肪一个最低保护值，
  // 剩余热量全部回填给碳水，确保不同模式下都能快速得到一套可执行起点。
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
  // 这里兼容了两种调用方式：
  // 1. 新版传对象；
  // 2. 旧版只传一个 tdee。
  // 这样改动调用方时不需要一次性改完整个项目。
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
    // 维持方案不需要额外区间，只保留当前 TDEE 作为中性起点。
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
