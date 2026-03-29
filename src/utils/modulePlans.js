import {
  getDailyAdjustment,
  getPlanningTargetKg,
  normalizeGoal,
  normalizeWeeks,
} from './caloriePlanning.js'

function round(value) {
  return Math.round(value)
}

function splitWeeks(totalWeeks) {
  const weeks = normalizeWeeks(totalWeeks)
  const base = Math.floor(weeks / 3)
  const remainder = weeks % 3
  return [
    base + (remainder > 0 ? 1 : 0),
    base + (remainder > 1 ? 1 : 0),
    Math.max(base, 1),
  ]
}

function formatCarbDensity(carbs, weightKg) {
  const safeWeight = Number(weightKg) > 0 ? Number(weightKg) : 1
  return `${(carbs / safeWeight).toFixed(1)} g/kg`
}

function getProteinMultiplier({ goal, sex }) {
  if (goal === 'gain') {
    return sex === 'female' ? 1.5 : 1.6
  }
  return sex === 'female' ? 1.7 : 1.8
}

function getFatMultiplier({ sex, dayType }) {
  const female = sex === 'female'
  const map = female
    ? { high: 0.7, medium: 0.9, low: 1.1 }
    : { high: 0.6, medium: 0.8, low: 1.0 }
  return map[dayType]
}

function buildMacroSplit({ weightKg, targetCalories, proteinMultiplier, fatMultiplier }) {
  const protein = round(weightKg * proteinMultiplier)
  const fat = round(weightKg * fatMultiplier)
  const carbs = Math.max(0, round((targetCalories - protein * 4 - fat * 9) / 4))
  return { protein, fat, carbs }
}

function getCutDayOffsets(sex) {
  return sex === 'female'
    ? { high: 140, medium: 20, low: -90 }
    : { high: 165, medium: 25, low: -110 }
}

function getGainDayOffsets(sex) {
  return sex === 'female'
    ? { high: 85, medium: -35, low: -180 }
    : { high: 107, medium: -43, low: -243 }
}

function getCutStageOffsets(sex) {
  return sex === 'female'
    ? [260, 140, 30]
    : [300, 165, 30]
}

function getGainStageOffsets(sex) {
  return sex === 'female'
    ? [80, 0, -80]
    : [100, 0, -100]
}

export function buildCarbCyclingPlan({
  goal = 'cut',
  weeks = 8,
  tdee = 2200,
  weightKg = 70,
  targetKg = 3,
  sex = 'male',
}) {
  const normalizedGoal = normalizeGoal(goal)
  const cycleWeeks = normalizeWeeks(weeks)
  const normalizedTargetKg = getPlanningTargetKg(normalizedGoal, targetKg)
  const dailyAdjustment = getDailyAdjustment(normalizedGoal, normalizedTargetKg, cycleWeeks)
  const proteinMultiplier = getProteinMultiplier({ goal: normalizedGoal, sex })
  const offsets = normalizedGoal === 'cut' ? getCutDayOffsets(sex) : getGainDayOffsets(sex)

  const dayTargets = normalizedGoal === 'cut'
    ? {
        high: round(tdee - dailyAdjustment + offsets.high),
        medium: round(tdee - dailyAdjustment + offsets.medium),
        low: round(tdee - dailyAdjustment + offsets.low),
      }
    : {
        high: round(tdee + dailyAdjustment + offsets.high),
        medium: round(tdee + dailyAdjustment + offsets.medium),
        low: round(tdee + dailyAdjustment + offsets.low),
      }

  const days = [
    {
      key: 'high',
      label: normalizedGoal === 'cut' ? '高碳训练日' : '高碳推进日',
      targetCalories: dayTargets.high,
      trainingFocus: normalizedGoal === 'cut' ? '下肢 / 高容量 / 表现优先训练' : '高容量力量 / 重点增肌训练',
      macroPlan: buildMacroSplit({
        weightKg,
        targetCalories: dayTargets.high,
        proteinMultiplier,
        fatMultiplier: getFatMultiplier({ sex, dayType: 'high' }),
      }),
    },
    {
      key: 'medium',
      label: '中碳维持日',
      targetCalories: dayTargets.medium,
      trainingFocus: '常规力量训练 / 有氧恢复',
      macroPlan: buildMacroSplit({
        weightKg,
        targetCalories: dayTargets.medium,
        proteinMultiplier,
        fatMultiplier: getFatMultiplier({ sex, dayType: 'medium' }),
      }),
    },
    {
      key: 'low',
      label: normalizedGoal === 'cut' ? '低碳休息日' : '低碳恢复日',
      targetCalories: dayTargets.low,
      trainingFocus: normalizedGoal === 'cut' ? '休息 / 轻活动 / 控制饥饿窗口' : '休息 / 控制溢出热量',
      macroPlan: buildMacroSplit({
        weightKg,
        targetCalories: dayTargets.low,
        proteinMultiplier,
        fatMultiplier: getFatMultiplier({ sex, dayType: 'low' }),
      }),
    },
  ]

  const weeklyPattern = normalizedGoal === 'cut'
    ? [
        { day: '周一', calorieKey: 'high', type: '高碳', focus: '下肢训练', note: '把更多主食放在训练前后 2 餐。' },
        { day: '周二', calorieKey: 'medium', type: '中碳', focus: '上肢训练', note: '主食维持，避免额外零食。' },
        { day: '周三', calorieKey: 'low', type: '低碳', focus: '休息 / 步行', note: '用蔬菜、蛋白和高体积食物维持饱腹。' },
        { day: '周四', calorieKey: 'high', type: '高碳', focus: '全身训练', note: '高强度日优先保证碳水表现。' },
        { day: '周五', calorieKey: 'medium', type: '中碳', focus: '辅助训练', note: '围绕训练补碳，不用整天都吃高。' },
        { day: '周六', calorieKey: 'low', type: '低碳', focus: '恢复', note: '控制外卖和液体热量。' },
        { day: '周日', calorieKey: 'medium', type: '中碳', focus: '主动恢复', note: '为下周训练维持稳定状态。' },
      ]
    : [
        { day: '周一', calorieKey: 'high', type: '高碳', focus: '下肢训练', note: '高容量日优先给足主食。' },
        { day: '周二', calorieKey: 'medium', type: '中碳', focus: '上肢训练', note: '维持推进，但不必每餐都堆碳。' },
        { day: '周三', calorieKey: 'low', type: '低碳', focus: '恢复', note: '控制溢出热量，避免胃口失控。' },
        { day: '周四', calorieKey: 'high', type: '高碳', focus: '全身训练', note: '重点训练日维持轻盈盈余。' },
        { day: '周五', calorieKey: 'medium', type: '中碳', focus: '辅助训练', note: '把碳水集中给训练窗口。' },
        { day: '周六', calorieKey: 'high', type: '高碳', focus: '专项推进', note: '高碳日和高容量训练绑定。' },
        { day: '周日', calorieKey: 'low', type: '低碳', focus: '休息', note: '只做轻微回撤，不做极端压碳。' },
      ]

  return {
    goal: normalizedGoal,
    weeks: cycleWeeks,
    targetKg: normalizedTargetKg,
    dailyAdjustment,
    headline: normalizedGoal === 'cut' ? '用训练日保表现、休息日拉开缺口' : '用高碳日推进训练、低碳日管理溢出',
    weeklyAverageCalories: round(
      weeklyPattern.reduce((sum, item) => sum + dayTargets[item.calorieKey], 0) / weeklyPattern.length
    ),
    days,
    weeklyPattern,
  }
}

export function buildCarbTaperPlan({
  goal = 'cut',
  weeks = 8,
  tdee = 2200,
  weightKg = 70,
  targetKg = 3,
  sex = 'male',
}) {
  const normalizedGoal = normalizeGoal(goal)
  const cycleWeeks = normalizeWeeks(weeks)
  const normalizedTargetKg = getPlanningTargetKg(normalizedGoal, targetKg)
  const dailyAdjustment = getDailyAdjustment(normalizedGoal, normalizedTargetKg, cycleWeeks)
  const stageWeeks = splitWeeks(cycleWeeks)
  const proteinMultiplier = getProteinMultiplier({ goal: normalizedGoal, sex })
  const cutOffsets = getCutStageOffsets(sex)
  const gainOffsets = getGainStageOffsets(sex)

  const stageTargets = normalizedGoal === 'cut'
    ? [
        round(tdee - dailyAdjustment + cutOffsets[0]),
        round(tdee - dailyAdjustment + cutOffsets[1]),
        round(tdee - dailyAdjustment + cutOffsets[2]),
      ]
    : [
        round(tdee + dailyAdjustment + gainOffsets[0]),
        round(tdee + dailyAdjustment + gainOffsets[1]),
        round(tdee + dailyAdjustment + gainOffsets[2]),
      ]

  const focusByGoal = normalizedGoal === 'cut'
    ? [
        '先砍液体热量和加餐，主食只做轻微回撤。',
        '开始压缩休息日主食，把碳水向训练窗口集中。',
        '平台期再下调，优先守住训练表现和睡眠。',
      ]
    : [
        '先建立稳定盈余，保证训练日前后主食充足。',
        '只减少多余零食和晚间精制碳水，防止脂肪增长过快。',
        '在接近周期末端时做轻微收口，让体重增长更平稳。',
      ]

  const stages = stageTargets.map((targetCalories, index) => {
    const macroPlan = buildMacroSplit({
      weightKg,
      targetCalories,
      proteinMultiplier,
      fatMultiplier: sex === 'female' ? 0.9 + index * 0.1 : 0.8 + index * 0.1,
    })

    return {
      stage: `第 ${index + 1} 阶段`,
      weeksLabel: `第 ${stageWeeks.slice(0, index).reduce((sum, item) => sum + item, 0) + 1}-${stageWeeks.slice(0, index + 1).reduce((sum, item) => sum + item, 0)} 周`,
      targetCalories,
      carbRange: formatCarbDensity(macroPlan.carbs, weightKg),
      focus: focusByGoal[index],
      macroPlan,
    }
  })

  return {
    goal: normalizedGoal,
    weeks: cycleWeeks,
    targetKg: normalizedTargetKg,
    dailyAdjustment,
    headline: normalizedGoal === 'cut' ? '分阶段下调，而不是一次性极低碳' : '增肌期做温和回撤，避免热量和胃口一起失控',
    stages,
    checkpointRules: [
      '至少连续观察 7 天平均体重，不用单日波动下结论。',
      '如果主项训练明显下滑，先回看睡眠、步数和总热量。',
      '平台期优先增加活动量或稳定执行，再决定是否继续下调碳水。',
    ],
  }
}
