function round(value) {
  return Math.round(value)
}

function toPositiveNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeSex(value) {
  return value === 'female' ? 'female' : 'male'
}

function normalizeExpLevel(value) {
  return String(value).toLowerCase() === 'advanced' ? 'Advanced' : 'Novice'
}

function getPhase(bodyFatPct, sex) {
  if (sex === 'female') {
    if (bodyFatPct >= 30) return 1
    if (bodyFatPct >= 25) return 2
    if (bodyFatPct >= 20) return 3
    return 4
  }

  if (bodyFatPct >= 20) return 1
  if (bodyFatPct >= 15) return 2
  if (bodyFatPct >= 12) return 3
  return 4
}

function getPhaseMeta(phase) {
  const map = {
    1: {
      phaseLabel: '第 1 阶段',
      phaseStrategy: '高体脂重组',
    },
    2: {
      phaseLabel: '第 2 阶段',
      phaseStrategy: '维持热量重组',
    },
    3: {
      phaseLabel: '第 3 阶段',
      phaseStrategy: '黄金精益增肌',
    },
    4: {
      phaseLabel: '第 4 阶段',
      phaseStrategy: '主动盈余',
    },
  }

  return map[phase] ?? map[1]
}

function getStageFatFactors(sex, bodyFatPct) {
  if (sex === 'female') {
    return [0.7, 0.8, 0.8, bodyFatPct < 15 ? 1.2 : 1.0]
  }

  return [0.6, 0.7, 0.8, 1.0]
}

function getStageCalories(tdee, sex) {
  const floor = getCalorieFloor(sex)
  const formulas = [
    tdee - 300,
    tdee,
    round(tdee * 1.065),
    round(tdee * 1.1),
  ]

  return formulas.map((value) => Math.max(round(value), floor))
}

function buildMacroPlan({ weightKg, targetCalories, fatFactor }) {
  const protein = round(weightKg * 1.6)
  const fatFloor = weightKg * 0.5
  const fat = Math.max(round(weightKg * fatFactor), round(fatFloor))
  const carbs = Math.max(0, round((targetCalories - protein * 4 - fat * 9) / 4))

  return {
    protein,
    fat,
    carbs,
    carb: carbs,
    proteinGrams: protein,
    fatGrams: fat,
    carbGrams: carbs,
  }
}

function getMacroCalories(macroPlan) {
  const carbs = macroPlan?.carbs ?? macroPlan?.carb ?? 0
  return macroPlan.protein * 4 + macroPlan.fat * 9 + carbs * 4
}

function getCalorieFloor(sex) {
  return sex === 'female' ? 1200 : 1500
}

function toWeeklyAverages(history) {
  if (!Array.isArray(history)) return []

  return history
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
}

function getPhaseOneTwoDecision(weeklyAverageWeights) {
  if (weeklyAverageWeights.length < 3) {
    return {
      adjustmentDecision: 'observe-only',
      adjustmentReason: '至少记录 3 周周均体重后，再决定是否下调碳水。',
      carbAdjustmentPct: 0,
    }
  }

  const recent = weeklyAverageWeights.slice(-3)
  const rising = recent[0] < recent[1] && recent[1] < recent[2]

  if (rising) {
    return {
      adjustmentDecision: 'reduce-carbs',
      adjustmentReason: '最近 3 周的周均体重连续上升，下周建议把碳水下调 10%。',
      carbAdjustmentPct: -10,
    }
  }

  return {
    adjustmentDecision: 'hold',
    adjustmentReason: '最近 3 周的周均体重没有连续上升，当前摄入先保持不变。',
    carbAdjustmentPct: 0,
  }
}

function getPhaseThreeFourDecision({ weeklyAverageWeights, expLevel }) {
  if (weeklyAverageWeights.length < 2) {
    return {
      adjustmentDecision: 'observe-only',
      adjustmentReason: '至少记录 2 周周均体重后，才能判断增重速率是否超出阈值。',
      carbAdjustmentPct: 0,
      weeklyGainPct: null,
      weeklyGainThresholdPct: expLevel === 'Advanced' ? 0.25 : 0.5,
    }
  }

  const previous = weeklyAverageWeights[weeklyAverageWeights.length - 2]
  const current = weeklyAverageWeights[weeklyAverageWeights.length - 1]
  const weeklyGainPct = previous > 0 ? ((current - previous) / previous) * 100 : 0
  const weeklyGainThresholdPct = expLevel === 'Advanced' ? 0.25 : 0.5

  if (weeklyGainPct > weeklyGainThresholdPct) {
    return {
      adjustmentDecision: 'reduce-carbs',
      adjustmentReason: '当前周增重速度高于阈值，下周建议把碳水下调 10%。',
      carbAdjustmentPct: -10,
      weeklyGainPct,
      weeklyGainThresholdPct,
    }
  }

  return {
    adjustmentDecision: 'hold',
    adjustmentReason: '当前周增重速度仍在阈值内，先维持现在的摄入。',
    carbAdjustmentPct: 0,
    weeklyGainPct,
    weeklyGainThresholdPct,
  }
}

function getAdjustmentDecision({ phase, weeklyAverageWeights, expLevel }) {
  if (phase <= 2) {
    return getPhaseOneTwoDecision(weeklyAverageWeights)
  }

  return getPhaseThreeFourDecision({ weeklyAverageWeights, expLevel })
}

function applyCarbAdjustment(macroPlan, carbAdjustmentPct, calorieFloor, baseTargetCalories) {
  if (!carbAdjustmentPct) {
    return {
      macroPlan,
      targetCalories: Math.max(baseTargetCalories, getMacroCalories(macroPlan)),
      carbAdjustmentPct: 0,
    }
  }

  const adjustedCarbs = Math.max(0, round(macroPlan.carbs * (1 + carbAdjustmentPct / 100)))
  const adjustedMacroPlan = {
    ...macroPlan,
    carbs: adjustedCarbs,
    carb: adjustedCarbs,
    carbGrams: adjustedCarbs,
  }
  const adjustedCalories = getMacroCalories(adjustedMacroPlan)

  if (adjustedCalories >= calorieFloor) {
    return {
      macroPlan: adjustedMacroPlan,
      targetCalories: adjustedCalories,
      carbAdjustmentPct,
    }
  }

  const protectedCarbs = Math.max(
    0,
    Math.ceil((calorieFloor - macroPlan.protein * 4 - macroPlan.fat * 9) / 4)
  )
  const protectedMacroPlan = {
    ...macroPlan,
    carbs: protectedCarbs,
    carb: protectedCarbs,
    carbGrams: protectedCarbs,
  }
  const actualReductionApplied = protectedCarbs < macroPlan.carbs

  return {
    macroPlan: protectedMacroPlan,
    targetCalories: getMacroCalories(protectedMacroPlan),
    carbAdjustmentPct: actualReductionApplied ? carbAdjustmentPct : 0,
    adjustmentDecision: actualReductionApplied ? 'reduce-carbs' : 'hold',
    adjustmentReason: actualReductionApplied
      ? '周趋势仍支持下调碳水，但热量下限限制了本次可下调的幅度。'
      : '如果继续下调碳水，摄入会低于热量下限，所以本周目标维持不变。',
  }
}

export function buildLeanGainCalorieLogicPlan({
  sex = 'male',
  bodyFatPct,
  tdee = 0,
  weightKg = 0,
  expLevel = 'Novice',
  weeklyAverageWeights = [],
} = {}) {
  const normalizedSex = normalizeSex(sex)
  const normalizedBodyFatPct = Number(bodyFatPct)

  if (!Number.isFinite(normalizedBodyFatPct) || normalizedBodyFatPct <= 0) {
    return {
      gateState: 'reminder',
      title: '先补充体脂率',
      description: '只有拿到体脂率，这套逻辑才能判断所处阶段并给出热量目标。',
      phase: null,
      phaseLabel: null,
      phaseStrategy: null,
      stages: [],
      carbAdjustmentPct: 0,
      adjustmentDecision: 'observe-only',
      adjustmentReason: '缺少体脂率时，模块无法计算阶段与计划。',
    }
  }

  const safeTdee = toPositiveNumber(tdee)
  const safeWeightKg = toPositiveNumber(weightKg)

  if (!safeTdee || !safeWeightKg) {
    return {
      gateState: 'incomplete',
      title: '先补全核心输入',
      description: '只有同时具备 TDEE 和体重，这套逻辑才能生成热量与宏量营养建议。',
      phase: null,
      phaseLabel: null,
      phaseStrategy: null,
      stages: [],
      carbAdjustmentPct: 0,
      adjustmentDecision: 'observe-only',
      adjustmentReason: '需要有效的 TDEE 和体重后，模块才能计算计划。',
    }
  }

  const normalizedExpLevel = normalizeExpLevel(expLevel)
  const normalizedWeeklyAverageWeights = toWeeklyAverages(weeklyAverageWeights)
  const phase = getPhase(normalizedBodyFatPct, normalizedSex)
  const { phaseLabel, phaseStrategy } = getPhaseMeta(phase)
  const fatFactors = getStageFatFactors(normalizedSex, normalizedBodyFatPct)
  const calorieFloor = getCalorieFloor(normalizedSex)
  const stageCalories = getStageCalories(safeTdee, normalizedSex)
  const adjustment = getAdjustmentDecision({
    phase,
    weeklyAverageWeights: normalizedWeeklyAverageWeights,
    expLevel: normalizedExpLevel,
  })

  const stages = stageCalories.map((baseTargetCalories, index) => {
    const stageNumber = index + 1
    const baseMacroPlan = buildMacroPlan({
      weightKg: safeWeightKg,
      targetCalories: baseTargetCalories,
      fatFactor: fatFactors[index],
    })
    const currentStageAdjustment = stageNumber === phase
      ? applyCarbAdjustment(baseMacroPlan, adjustment.carbAdjustmentPct, calorieFloor, baseTargetCalories)
      : {
          macroPlan: baseMacroPlan,
          targetCalories: baseTargetCalories,
        }
    const macroPlan = currentStageAdjustment.macroPlan

    return {
      stage: stageNumber,
      label: `第 ${stageNumber} 阶段`,
      baseTargetCalories,
      targetCalories: currentStageAdjustment.targetCalories,
      carbAdjustmentPct: currentStageAdjustment.carbAdjustmentPct,
      adjustmentDecision: currentStageAdjustment.adjustmentDecision,
      adjustmentReason: currentStageAdjustment.adjustmentReason,
      macroPlan,
      proteinGrams: macroPlan.protein,
      fatGrams: macroPlan.fat,
      carbGrams: macroPlan.carbs,
      isCurrent: stageNumber === phase,
    }
  })

  const activeStage = stages[phase - 1]

  return {
    gateState: 'ready',
    phase,
    phaseLabel,
    phaseStrategy,
    expLevel: normalizedExpLevel,
    carbAdjustmentPct: activeStage.carbAdjustmentPct ?? adjustment.carbAdjustmentPct,
    adjustmentDecision: activeStage.adjustmentDecision ?? adjustment.adjustmentDecision,
    adjustmentReason: activeStage.adjustmentReason ?? adjustment.adjustmentReason,
    weeklyGainPct: adjustment.weeklyGainPct ?? null,
    weeklyGainThresholdPct: adjustment.weeklyGainThresholdPct ?? null,
    targetCalories: activeStage.targetCalories,
    macroPlan: activeStage.macroPlan,
    proteinGrams: activeStage.macroPlan.protein,
    fatGrams: activeStage.macroPlan.fat,
    carbGrams: activeStage.macroPlan.carbs,
    stages,
  }
}
