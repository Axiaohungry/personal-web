function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function isGemmaModel(model) {
  // 这里只做非常保守的前缀判断，避免把普通 Gemini 模型误分流到 Gemma 配置。
  return /^gemma-/i.test(cleanText(model))
}

function supportsStructuredOutputWithTools(model) {
  // 当前工具 + 结构化输出的能力以 Gemini 3 系列为主，先按模型前缀做安全开关。
  return /^gemini-3/i.test(cleanText(model))
}

export function buildJsonGenerationConfig(model, { schema, temperature = 0.2, usesTools = false } = {}) {
  const config = {
    temperature,
  }

  if (isGemmaModel(model)) {
    // Gemma 4 走 Gemini API 时支持 thinkingLevel，但不在 Gemini 结构化输出支持表里。
    // 这里不带 responseJsonSchema，让 Gemma 先自由生成，再交给本地解析/校验兜底。
    config.thinkingConfig = {
      thinkingLevel: 'high',
    }
    return config
  }

  if (usesTools && !supportsStructuredOutputWithTools(model)) {
    // 带 Google Search 这类工具时，如果模型不明确支持 schema，就宁可退回普通 JSON 模式，
    // 避免请求直接被 API 拒绝，或者模型在工具结果和 schema 之间表现不稳定。
    return config
  }

  // Gemini 系列继续使用官方结构化输出，让 API 层尽量保证返回的是可解析 JSON。
  config.responseMimeType = 'application/json'

  if (schema) {
    config.responseJsonSchema = schema
  }

  return config
}
