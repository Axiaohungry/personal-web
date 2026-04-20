function round(value) {
  return Math.round(value)
}

function toPositiveNumber(value, fallback = 0) {
  // 这个模块所有核心输入都要求是“正数”。
  // 像 0、空字符串、NaN 这种值都会退回到 fallback，避免后面的热量和体重计算失真。
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeSex(value) {
  return value === 'female' ? 'female' : 'male'
}

function normalizeExpLevel(value) {
  // 当前只允许两档训练经验：
  // - Novice：阈值更宽松
  // - Advanced：阈值更严格
  // 其他任何输入都默认按 Novice 处理，避免把未知值误判成更激进策略。
  return String(value).toLowerCase() === 'advanced' ? 'Advanced' : 'Novice'
}

function getPhase(bodyFatPct, sex) {
  // 体脂阶段是精益增肌逻辑的第一层分流。
  // 女性和男性使用不同阈值，是因为对应的体脂风险区间不同。
  if (sex === 'female') {
    // 女性阶段阈值整体更高，不是“更宽松”，而是对应不同的体脂风险区间。
    if (bodyFatPct >= 30) return 1
    if (bodyFatPct >= 25) return 2
    if (bodyFatPct >= 20) return 3
    return 4
  }

  // 男性阶段阈值更低，进入精益增肌和主动盈余阶段的门槛也更靠前。
  if (bodyFatPct >= 20) return 1
  if (bodyFatPct >= 15) return 2
  if (bodyFatPct >= 12) return 3
  return 4
}

function getPhaseMeta(phase) {
  // phase 本身只是数字，这里把数字翻译成页面可直接展示的中文标签和策略名称。
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
  // 每个阶段的脂肪系数不一样：
  // 体脂越低，越需要在某些阶段给更高的脂肪保护，避免摄入过低。
  if (sex === 'female') {
    return [0.7, 0.8, 0.8, bodyFatPct < 15 ? 1.2 : 1.0]
  }

  return [0.6, 0.7, 0.8, 1.0]
}

function getStageCalories(tdee, sex) {
  // 四个阶段先各自生成一个“基础目标热量”，
  // 然后统一受 calorie floor 保护，避免建议掉到极端值。
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
  // 精益增肌模块里的宏量分配顺序是固定的：
  // 1. 先锁蛋白锚点；
  // 2. 再保证脂肪别低于最低保护值；
  // 3. 剩余热量全部留给碳水。
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
  // 历史数据里可能同时出现 carb 和 carbs 两种字段名，这里统一兼容。
  const carbs = macroPlan?.carbs ?? macroPlan?.carb ?? 0
  return macroPlan.protein * 4 + macroPlan.fat * 9 + carbs * 4
}

function getCalorieFloor(sex) {
  // 最低热量护栏不是建议值，而是“再低就不往下算”的安全边界。
  return sex === 'female' ? 1200 : 1500
}

function toWeeklyAverages(history) {
  // 历史里只保留有效、可比较的周均体重。
  // 这里顺手把字符串数字转成 Number，并滤掉 0 或非法值。
  if (!Array.isArray(history)) return []

  return history
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
}

function getPhaseOneTwoDecision(weeklyAverageWeights) {
  // 前两个阶段更保守：
  // 必须看到连续 3 周上升，才认为需要下调碳水。
  if (weeklyAverageWeights.length < 3) {
    return {
      adjustmentDecision: 'observe-only',
      adjustmentReason: '至少记录 3 周周均体重后，再决定是否下调碳水。',
      carbAdjustmentPct: 0,
    }
  }

  const recent = weeklyAverageWeights.slice(-3)
  // 前两阶段不是看“涨了没”，而是看“最近三周是不是连着涨”。
  // 这样能减少因为水分波动或某一周异常造成的误判。
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
  // 后两个阶段改看“周增重速率”，
  // 因为这时用户已经进入更偏增肌的状态，判断标准应该更贴近增长速度本身。
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
  // 周增重速率 = 最近一周相对上一周的增长百分比。
  // 这里不用绝对 kg，而用百分比，是为了让不同体重的人能共用同一套阈值逻辑。
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
  // 阶段 1/2 和阶段 3/4 用的是两套不同判断逻辑，
  // 这里统一做总分发，页面层不用知道底层阈值细节。
  if (phase <= 2) {
    return getPhaseOneTwoDecision(weeklyAverageWeights)
  }

  return getPhaseThreeFourDecision({ weeklyAverageWeights, expLevel })
}

function applyCarbAdjustment(macroPlan, carbAdjustmentPct, calorieFloor, baseTargetCalories) {
  // 这里是安全阀：
  // 允许减碳，但不允许因为减碳把总热量打穿最低护栏。
  if (!carbAdjustmentPct) {
    // 不需要减碳时，也要重新计算一次 targetCalories，
    // 因为宏量整数化之后，理论热量和基础目标热量可能会有少量偏差。
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
    // 情况 1：减完碳后仍高于热量下限，说明这次调整可以完整执行。
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

  // 情况 2：按原计划减碳会跌破热量下限。
  // 这时不是直接放弃，而是回推“在不低于下限的前提下，碳水最多能减到哪里”。
  // 如果连 1g 都减不动，就把本次决策从 reduce-carbs 改回 hold。
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
  // 整个精益增肌模块的生成流程：
  // 1. 校验体脂 / TDEE / 体重是否足够；
  // 2. 根据体脂判断当前阶段；
  // 3. 生成四个阶段的基础热量和宏量；
  // 4. 只对当前阶段应用周趋势带来的碳水修正；
  // 5. 返回给页面一个可直接渲染的完整计划对象。
  const normalizedSex = normalizeSex(sex)
  const normalizedBodyFatPct = Number(bodyFatPct)

  if (!Number.isFinite(normalizedBodyFatPct) || normalizedBodyFatPct <= 0) {
    // 第一层提前返回：没有体脂率，就无法判断当前属于哪一阶段。
    // 这时页面应该展示“提醒补全输入”，而不是硬给一个看似精确的计划。
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
    // 第二层提前返回：即便有体脂率，如果 TDEE 或体重缺失，宏量分配仍然没法成立。
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
    // 只有“当前阶段”才会吃到本周趋势带来的减碳修正。
    // 其他阶段仍然保留基础值，方便页面拿来对照完整四阶段结构。
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

  // 最终返回对象兼顾两类消费方：
  // 1. 页面顶部卡片直接读 activeStage；
  // 2. 阶段一览区域直接读完整 stages。
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
