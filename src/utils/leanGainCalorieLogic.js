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
      phaseLabel: 'Phase 1',
      phaseStrategy: 'High body-fat recomposition',
    },
    2: {
      phaseLabel: 'Phase 2',
      phaseStrategy: 'Maintenance recomposition',
    },
    3: {
      phaseLabel: 'Phase 3',
      phaseStrategy: 'Golden lean-gain',
    },
    4: {
      phaseLabel: 'Phase 4',
      phaseStrategy: 'Active surplus',
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
      adjustmentReason: 'Need at least 3 weekly averages before changing carbs.',
      carbAdjustmentPct: 0,
    }
  }

  const recent = weeklyAverageWeights.slice(-3)
  const rising = recent[0] < recent[1] && recent[1] < recent[2]

  if (rising) {
    return {
      adjustmentDecision: 'reduce-carbs',
      adjustmentReason: 'The last 3 weekly averages kept rising, so next week carbs drop 10%.',
      carbAdjustmentPct: -10,
    }
  }

  return {
    adjustmentDecision: 'hold',
    adjustmentReason: 'Recent weekly averages are not rising 3 weeks in a row.',
    carbAdjustmentPct: 0,
  }
}

function getPhaseThreeFourDecision({ weeklyAverageWeights, expLevel }) {
  if (weeklyAverageWeights.length < 2) {
    return {
      adjustmentDecision: 'observe-only',
      adjustmentReason: 'Need at least 2 weekly averages before checking rate of gain.',
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
      adjustmentReason: 'Weekly gain is above the current threshold, so next week carbs drop 10%.',
      carbAdjustmentPct: -10,
      weeklyGainPct,
      weeklyGainThresholdPct,
    }
  }

  return {
    adjustmentDecision: 'hold',
    adjustmentReason: 'Weekly gain is within the current threshold.',
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

function applyCarbAdjustment(macroPlan, carbAdjustmentPct, calorieFloor) {
  if (!carbAdjustmentPct) {
    return {
      macroPlan,
      targetCalories: getMacroCalories(macroPlan),
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
      ? 'Weekly trend still supports a carb reduction, but the calorie floor limits how far it can go.'
      : 'A carb reduction would push intake below the calorie floor, so the current target stays in place.',
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
      title: 'Add body-fat first',
      description: 'This logic needs body-fat percentage before it can assign a phase and intake target.',
      phase: null,
      phaseLabel: null,
      phaseStrategy: null,
      stages: [],
      carbAdjustmentPct: 0,
      adjustmentDecision: 'observe-only',
      adjustmentReason: 'Body-fat percentage is required before the module can calculate a plan.',
    }
  }

  const safeTdee = toPositiveNumber(tdee)
  const safeWeightKg = toPositiveNumber(weightKg)

  if (!safeTdee || !safeWeightKg) {
    return {
      gateState: 'incomplete',
      title: 'Complete the core inputs first',
      description: 'This logic needs both TDEE and body weight before it can build a calorie and macro plan.',
      phase: null,
      phaseLabel: null,
      phaseStrategy: null,
      stages: [],
      carbAdjustmentPct: 0,
      adjustmentDecision: 'observe-only',
      adjustmentReason: 'Valid TDEE and body weight are required before the module can calculate a plan.',
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
      ? applyCarbAdjustment(baseMacroPlan, adjustment.carbAdjustmentPct, calorieFloor)
      : {
          macroPlan: baseMacroPlan,
          targetCalories: baseTargetCalories,
        }
    const macroPlan = currentStageAdjustment.macroPlan

    return {
      stage: stageNumber,
      label: `Phase ${stageNumber}`,
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
