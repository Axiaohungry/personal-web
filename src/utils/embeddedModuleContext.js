function toQueryValue(value, fallback = '') {
  if (value === null || value === undefined) {
    return fallback
  }

  return String(value)
}

export function buildEmbeddedModuleContext({ context = {}, goal = 'cut', weeks = 8, targetKg = 3 } = {}) {
  return {
    ...context,
    goal,
    weeks,
    targetKg,
  }
}

export function buildEmbeddedModuleQuery(input = {}) {
  const sharedContext = buildEmbeddedModuleContext(input)

  return new URLSearchParams({
    goal: toQueryValue(sharedContext.goal, 'cut'),
    sex: toQueryValue(sharedContext.sex, 'male'),
    age: toQueryValue(sharedContext.age, '24'),
    heightCm: toQueryValue(sharedContext.heightCm, '175'),
    bodyFatPct: toQueryValue(sharedContext.bodyFatPct, ''),
    bmr: toQueryValue(sharedContext.bmr, '1700'),
    weeks: toQueryValue(sharedContext.weeks, '8'),
    targetKg: toQueryValue(sharedContext.targetKg, '3'),
    tdee: toQueryValue(sharedContext.tdee, '0'),
    weightKg: toQueryValue(sharedContext.weightKg, '0'),
    currentCalories: toQueryValue(sharedContext.currentCalories, toQueryValue(sharedContext.tdee, '0')),
    embed: '1',
  })
}
