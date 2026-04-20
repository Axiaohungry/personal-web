import {
  buildGoalTarget,
  getDailyAdjustment,
  getPlanningTargetKg,
  normalizeGoal,
  normalizeWeeks,
} from './caloriePlanning.js'
import { buildMacroPlan } from './macros.js'
export { buildLeanGainCalorieLogicPlan } from './leanGainCalorieLogic.js'

function round(value) {
  return Math.round(value)
}

function roundToOneDecimal(value) {
  return Number(value.toFixed(1))
}

function splitWeeks(totalWeeks) {
  // 把总周期大致均分成三段，用于阶段型模块（比如碳水渐降）的阶段展示。
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

function distributeTotal(total, ratios) {
  // 把热量或蛋白按比例拆到多餐/多阶段，同时保证拆分后的整数和仍然等于总量。
  const safeTotal = round(total)
  const base = ratios.map((ratio) => Math.floor(safeTotal * ratio))
  let remainder = safeTotal - base.reduce((sum, item) => sum + item, 0)

  return base.map((value) => {
    if (remainder <= 0) return value
    remainder -= 1
    return value + 1
  })
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
  // 模块页里的宏量拆分比主工作台更细：
  // 这里允许不同日类型/阶段使用不同蛋白和脂肪倍率。
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

function describeProjectedGap(projectedChangeKg, targetKg) {
  const difference = projectedChangeKg - targetKg

  if (Math.abs(difference) <= 0.4) {
    return '和你现在设的目标挺接近，更适合先做 2 到 4 周，再回来看看身体和状态怎么回应。'
  }

  if (difference > 0) {
    return '按这个节奏走，速度会比你现在设的目标稍快一点，更适合愿意接受两天明显收一收的人。'
  }

  return '按这个节奏走，会比你现在设的目标慢一点，但通常也会更稳，更不容易把自己弄得太累。'
}

export function buildCarbCyclingPlan({
  goal = 'cut',
  weeks = 8,
  tdee = 2200,
  weightKg = 70,
  targetKg = 3,
  sex = 'male',
}) {
  // 碳循环的核心逻辑：
  // 先根据目标推导日均调整量，再叠加“高/中/低碳日偏移量”，
  // 最终得到每种日类型的热量与宏量。
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
  // 碳水渐降更像“分阶段收口”。
  // 它不在一开始就极端压碳，而是按周期拆成三个阶段，逐步调整目标热量与密度。
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

export function buildFiveTwoFastingPlan({
  goal = 'cut',
  weeks = 8,
  tdee = 2200,
  weightKg = 70,
  targetKg = 3,
  sex = 'male',
}) {
  // 5+2 模块的关键不是精确到每餐，而是回答：
  // 两天轻断食 + 五天常规吃，平均下来会落到什么热量节奏、适不适合当前目标。
  const normalizedGoal = normalizeGoal(goal)
  const cycleWeeks = normalizeWeeks(weeks)
  const normalizedTargetKg = getPlanningTargetKg(normalizedGoal, targetKg)
  const regularDayCalories = round(tdee)
  const fastingDayCalories = sex === 'female' ? 500 : 600

  if (normalizedGoal === 'gain') {
    return {
      goal: normalizedGoal,
      weeks: cycleWeeks,
      targetKg: normalizedTargetKg,
      supported: false,
      unsupportedReason: '如果你现在的目标是增肌，5+2 往往不是最省心的起点。它更适合减脂，或者用来帮自己把进食节奏收一收。',
      alternatives: [
        '先把每天该有的盈余吃稳，比急着限制进食模式更重要。',
        '如果你只是想少吃点零食，先试 10 到 12 小时进食窗，通常会比 5+2 轻松很多。',
        '训练量大的时候，先守住训练前后那几餐的主食和蛋白，别让两天低摄入拖慢恢复。',
      ],
    }
  }

  const weeklyAverageCalories = round((regularDayCalories * 5 + fastingDayCalories * 2) / 7)
  const projectedChangeKg = roundToOneDecimal(
    ((regularDayCalories - weeklyAverageCalories) * cycleWeeks * 7) / 7700
  )

  return {
    goal: normalizedGoal,
    weeks: cycleWeeks,
    targetKg: normalizedTargetKg,
    supported: true,
    headline: '把一周里最难的“收一收”集中到两天，剩下五天就能更像平时那样吃。',
    regularDayCalories,
    fastingDayCalories,
    weeklyAverageCalories,
    projectedChangeKg,
    goalFit: describeProjectedGap(projectedChangeKg, normalizedTargetKg),
    weeklyPattern: [
      {
        day: '周一',
        kind: '轻断食日',
        targetCalories: fastingDayCalories,
        focus: '休息 / 轻步行 / 压力别太大的日子',
        note: '先把蛋白质和蔬菜吃到位，这一天尽量别硬塞高强度训练。',
      },
      {
        day: '周二',
        kind: '常规日',
        targetCalories: regularDayCalories,
        focus: '力量训练 / 正常社交',
        note: '回到接近平时的吃法就好，不用因为昨天吃少了今天猛补。',
      },
      {
        day: '周三',
        kind: '常规日',
        targetCalories: regularDayCalories,
        focus: '训练安排得比较完整的一天',
        note: '主食尽量放在训练前后，别变成整天顺手吃一点。',
      },
      {
        day: '周四',
        kind: '轻断食日',
        targetCalories: fastingDayCalories,
        focus: '休息 / 轻有氧 / 节奏慢一点的一天',
        note: '和周一错开，尽量别让两天低摄入挤在一起。',
      },
      {
        day: '周五',
        kind: '常规日',
        targetCalories: regularDayCalories,
        focus: '下班后训练 / 可能会外食的一天',
        note: '如果在外面吃，先顾好蛋白，再去想主食要吃多少。',
      },
      {
        day: '周六',
        kind: '常规日',
        targetCalories: regularDayCalories,
        focus: '训练量大一些 / 走动也更多的一天',
        note: '周末最容易超的，往往不是正餐，而是饮料、甜点和顺手的小零食。',
      },
      {
        day: '周日',
        kind: '常规日',
        targetCalories: regularDayCalories,
        focus: '主动恢复',
        note: '按正常餐次慢慢收回来，给下周留一点余地。',
      },
    ],
    fastingDayChecklist: [
      '轻断食日不是完全不吃，经典入门版通常会留大约 500 kcal（女性）/ 600 kcal（男性）。',
      '热量不多的时候，优先把它留给高蛋白、蔬菜、汤类这些更顶饱的食物。',
      '训练尽量放在常规日，轻断食日别再叠高强度和大容量，不然很容易撑不住。',
    ],
    guardrails: [
      '两天轻断食日尽量非连续安排，最好放在工作和恢复压力都没那么大的日子。',
      '如果你正处在妊娠/哺乳期，有进食障碍史，或正在用胰岛素、容易低血糖，就别把 5+2 当成默认起点。',
      '一旦开始补偿性暴食、经常头晕，或者训练恢复越来越差，就先停下来，回到更稳定的热量安排。',
    ],
  }
}

export function buildSixteenEightFastingPlan({
  goal = 'cut',
  weeks = 8,
  tdee = 2200,
  weightKg = 70,
  targetKg = 3,
  sex = 'male',
}) {
  // 16:8 模块不把“进食窗口”当成魔法，
  // 而是先确定当天目标热量，再把热量和蛋白分配到窗口里的 2~3 餐。
  const normalizedGoal = normalizeGoal(goal)
  const cycleWeeks = normalizeWeeks(weeks)
  const normalizedTargetKg = getPlanningTargetKg(normalizedGoal, targetKg)
  const target = buildGoalTarget({
    goal: normalizedGoal,
    sex,
    weeks: cycleWeeks,
    targetKg: normalizedTargetKg,
    tdee,
  })
  const macroPlan = buildMacroPlan({
    weightKg,
    targetCalories: target.target,
    mode: normalizedGoal === 'gain' ? 'lean-gain' : 'cut',
  })
  const mealCalories = distributeTotal(
    target.target,
    normalizedGoal === 'gain' ? [0.28, 0.34, 0.38] : [0.3, 0.35, 0.35]
  )
  const mealProtein = distributeTotal(macroPlan.protein, [0.3, 0.35, 0.35])

  return {
    goal: normalizedGoal,
    weeks: cycleWeeks,
    targetKg: normalizedTargetKg,
    targetCalories: target.target,
    dailyAdjustment: target.dailyAdjustment,
    headline: normalizedGoal === 'gain'
      ? '可以借 16:8 帮自己把节奏理顺，但别让 8 小时窗口害你吃不够。'
      : '先把热量和蛋白守住，再用 16:8 帮自己少一点无意识地吃。',
    macroPlan,
    windowRecommendation: normalizedGoal === 'gain'
      ? '如果你总觉得吃不够，先从中窗做稳，不用急着把自己卡进很死的 16:8。'
      : '如果作息允许，早一点结束进食通常更好；但真做起来不顺，就先从中窗开始。',
    windowOptions: [
      {
        key: 'early',
        label: '早窗 09:00 - 17:00',
        fit: '早起、午前或午间训练、晚间应酬少的人',
        evidenceHint: '从现在的研究看，早一点收口，通常会更占一点代谢上的便宜。',
      },
      {
        key: 'middle',
        label: '中窗 10:30 - 18:30',
        fit: '通勤规律、想兼顾执行难度和稳定性的多数人',
        evidenceHint: '多数人从这里开始会轻松一些，也更容易把总量守住。',
      },
      {
        key: 'late',
        label: '晚窗 12:00 - 20:00',
        fit: '下班后训练或晚饭社交较多的人',
        evidenceHint: '更方便社交和晚间训练，但通常不会比早窗更占优势。',
      },
    ],
    mealCadence: [
      {
        label: '第 1 餐',
        timeBlock: '开窗后 0 - 1 小时',
        calories: mealCalories[0],
        protein: mealProtein[0],
        focus: '用一顿像样的正餐开窗，别让甜饮和零食抢了位置。',
      },
      {
        label: '第 2 餐',
        timeBlock: '窗口中段主餐',
        calories: mealCalories[1],
        protein: mealProtein[1],
        focus: '把大部分蛋白和主食放在这里，通常最稳，也最不容易饿。',
      },
      {
        label: '第 3 餐',
        timeBlock: '关窗前 60 - 90 分钟',
        calories: mealCalories[2],
        protein: mealProtein[2],
        focus: normalizedGoal === 'gain'
          ? '把今天还差的热量和蛋白补齐，但别为了赶窗口把自己吃到难受。'
          : '最后一餐也要吃完整，但别把一整天的热量都压到这一顿里。',
      },
    ],
    cautions: [
      '16:8 不是额外的减脂魔法，最后起作用的，还是总热量和蛋白质有没有到位。',
      normalizedGoal === 'gain'
        ? '如果你连续几天都吃不够热量，先把窗口放宽到 10 小时，再谈要不要回到 8 小时。'
        : '如果饥饿感、睡眠或训练质量越来越差，先把窗口放宽到 10 小时，通常会比硬扛更好。',
      '蛋白质尽量分到 2 到 3 餐里，不然最后一餐很容易吃得太赶、也太累。',
    ],
    trainingNote: normalizedGoal === 'gain'
      ? '短期研究提示，在热量盈余和高蛋白到位的情况下，16:8 也不是不能增肌；只是训练量和精力感受，未必像普通吃法那样轻松。'
      : '如果你平时还在训练，16:8 更适合帮你收住零食和夜宵，不太适合拿来替代本来就该做的热量管理。',
  }
}
