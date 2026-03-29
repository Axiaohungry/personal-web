function isValidNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function round(value) {
  return Math.round(value)
}

function calculateBmr({ sex, age, heightCm, weightKg, bodyFatPct }) {
  const hasValidBodyFat = isValidNumber(bodyFatPct) && bodyFatPct > 0 && bodyFatPct < 100

  if (hasValidBodyFat) {
    // Lean-mass formulas already absorb much of the sex difference through body composition.
    const leanMassKg = weightKg * (1 - bodyFatPct / 100)
    return round(370 + 21.6 * leanMassKg)
  }

  // Sex-specific fallback: Mifflin-St Jeor.
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === 'female' ? round(base - 161) : round(base + 5)
}

function calculateStepCalories({ sex, heightCm, stepsPerDay, weightKg }) {
  // Common height-based walking stride heuristic with a sex-specific coefficient.
  const stepLengthM = sex === 'female' ? heightCm * 0.413 / 100 : heightCm * 0.415 / 100
  const distanceKm = (stepsPerDay * stepLengthM) / 1000
  return round(distanceKm * weightKg * 0.53)
}

function calculateOccupationCalories(occupation) {
  const map = {
    sedentary: 0,
    light: 120,
    moderate: 220,
    high: 350,
  }
  return map[occupation] ?? 0
}

function calculateTrainingCalories({ weightKg, met, sessionsPerWeek, sessionMinutes }) {
  if (!isValidNumber(sessionsPerWeek) || !isValidNumber(sessionMinutes) || sessionsPerWeek <= 0 || sessionMinutes <= 0) {
    return 0
  }
  const weeklyTotal = (met * 3.5 * weightKg / 200) * sessionMinutes * sessionsPerWeek
  return round(weeklyTotal / 7)
}

export function calculateTdee(input) {
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
