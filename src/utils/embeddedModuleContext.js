function toQueryValue(value, fallback = '') {
  if (value === null || value === undefined) {
    return fallback
  }

  return String(value)
}

export function buildEmbeddedModuleContext({ context = {}, goal = 'cut', weeks = 8, targetKg = 3 } = {}) {
  // 父页面会不断更新 goal / weeks / targetKg，但模块内部还需要保留共享的人体数据与热量上下文。
  // 这里把“共享基础信息”和“当前推演目标”合并成一份轻量上下文，作为 iframe 和助手的统一输入。
  return {
    ...context,
    goal,
    weeks,
    targetKg,
  }
}

export function buildEmbeddedModuleQuery(input = {}) {
  const sharedContext = buildEmbeddedModuleContext(input)

  // 这里序列化的是“模块页首屏必须知道的最小上下文”。
  // 即使 iframe 还没收到 postMessage，模块页也能先用 query 渲染出基础内容。
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
