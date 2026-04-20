function isValidNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function round(value) {
  return Math.round(value)
}

function calculateBmr({ sex, age, heightCm, weightKg, bodyFatPct }) {
  const hasValidBodyFat = isValidNumber(bodyFatPct) && bodyFatPct > 0 && bodyFatPct < 100

  if (hasValidBodyFat) {
    // 已知体脂率时，优先走瘦体重公式。
    // 这样能把个体差异更多地落在真实体成分上，而不是只靠性别项粗略区分。
    const leanMassKg = weightKg * (1 - bodyFatPct / 100)
    return round(370 + 21.6 * leanMassKg)
  }

  // 未填写体脂率时，退回到更通用的 Mifflin-St Jeor。
  // 这时性别项会显式参与计算。
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === 'female' ? round(base - 161) : round(base + 5)
}

function calculateStepCalories({ sex, heightCm, stepsPerDay, weightKg }) {
  // 用“身高 * 步长系数”估算单步长度，再换算日行走距离和大致消耗。
  // 这里保留了男女不同的步长系数。
  const stepLengthM = sex === 'female' ? heightCm * 0.413 / 100 : heightCm * 0.415 / 100
  const distanceKm = (stepsPerDay * stepLengthM) / 1000
  return round(distanceKm * weightKg * 0.53)
}

function calculateOccupationCalories(occupation) {
  // 职业活动强度直接映射成固定热量补偿，目的是让输入模型保持直观稳定。
  const map = {
    sedentary: 0,
    light: 120,
    moderate: 220,
    high: 350,
  }
  return map[occupation] ?? 0
}

function calculateTrainingCalories({ weightKg, met, sessionsPerWeek, sessionMinutes }) {
  // 力量和有氧最终都走这一套通用计算：
  // 先按 MET 估算周总消耗，再折算成日均值，方便与 BMR / 步数 / 职业活动直接相加。
  if (!isValidNumber(sessionsPerWeek) || !isValidNumber(sessionMinutes) || sessionsPerWeek <= 0 || sessionMinutes <= 0) {
    return 0
  }
  const weeklyTotal = (met * 3.5 * weightKg / 200) * sessionMinutes * sessionsPerWeek
  return round(weeklyTotal / 7)
}

export function calculateTdee(input) {
  // TDEE 是一个“分项累加模型”：
  // 基础代谢 + 步数活动 + 职业活动 + 力量训练日均 + 有氧训练日均。
  const bmr = calculateBmr(input)
  const stepCalories = calculateStepCalories(input)
  const occupationCalories = calculateOccupationCalories(input.occupation)
  const resistanceDailyCalories = calculateTrainingCalories({
    weightKg: input.weightKg,
    met: 5.5,
    sessionsPerWeek: input.strengthSessionsPerWeek,
    sessionMinutes: input.strengthSessionMinutes,
  })
  const cardioDailyCalories = calculateTrainingCalories({
    weightKg: input.weightKg,
    met: 7,
    sessionsPerWeek: input.cardioSessionsPerWeek,
    sessionMinutes: input.cardioSessionMinutes,
  })

  return {
    bmr,
    stepCalories,
    occupationCalories,
    resistanceDailyCalories,
    cardioDailyCalories,
    tdee: round(
      bmr +
      stepCalories +
      occupationCalories +
      resistanceDailyCalories +
      cardioDailyCalories
    ),
  }
}

export function explainTdeeModel({ sex, bodyFatPct }) {
  // 这个函数不再重复计算热量，而是专门把“当前版本用了哪套规则”翻译成用户能看懂的说明文案。
  const normalizedSex = sex === 'female' ? 'female' : 'male'
  const sexLabel = normalizedSex === 'female' ? '女性' : '男性'
  const hasValidBodyFat = isValidNumber(bodyFatPct) && bodyFatPct > 0 && bodyFatPct < 100

  return {
    sexLabel,
    bmrMethod: hasValidBodyFat ? 'Katch-McArdle' : 'Mifflin-St Jeor',
    bmrExplanation: hasValidBodyFat
      ? '当前已填写体脂率，所以基础代谢优先按瘦体重估算。这个公式本身不再额外引入性别项，因此男女差异会明显缩小。'
      : normalizedSex === 'female'
        ? '当前未填写体脂率，所以基础代谢使用女性版 Mifflin-St Jeor：在同体重、身高、年龄下使用 -161 的性别项。'
        : '当前未填写体脂率，所以基础代谢使用男性版 Mifflin-St Jeor：在同体重、身高、年龄下使用 +5 的性别项。',
    stepExplanation: normalizedSex === 'female'
      ? '步数活动里使用了女性步长系数 0.413 × 身高。'
      : '步数活动里使用了男性步长系数 0.415 × 身高。',
    trainingExplanation: '力量训练和有氧训练消耗目前不按性别单独调整，因为当前版本没有足够强的个体化证据支持在这里再额外加性别乘数。',
  }
}
