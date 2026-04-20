function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function createJsonParseError(message, cause, sourceText) {
  // 保留一小段上游预览，方便本地排查模型输出为什么偏离预期。
  const error = new Error(message)
  error.statusCode = 502
  error.upstreamError = `${message}: ${cause?.message || 'unknown parse error'}`
  error.modelOutputPreview = cleanText(sourceText).slice(0, 500)
  return error
}

function stripMarkdownFence(text) {
  // 有些模型即使被要求只回 JSON，仍会额外包上一层 ```json 代码块。
  const trimmed = cleanText(text)
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  return cleanText(fencedMatch?.[1] || trimmed)
}

function removeTrailingCommas(text) {
  // 这里只做保守修复，避免把坏输出“修”成另一个错误结构。
  return cleanText(text).replace(/,\s*([}\]])/g, '$1')
}

function findBalancedJsonSlices(text) {
  // 某些 Gemma 响应会同时包含多个顶层 JSON 片段：
  // 前面是示例结构，后面才是真正的落地结果。
  // 这里先收集所有括号配平的顶层片段，后面再优先尝试更靠后的真实结果。
  const source = cleanText(text)
  const slices = []
  const stack = []
  let start = -1
  let inString = false
  let escaped = false

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{' || char === '[') {
      if (stack.length === 0) {
        start = index
      }
      stack.push(char)
      continue
    }

    if (char !== '}' && char !== ']') {
      continue
    }

    const opening = stack.pop()
    const matched = (opening === '{' && char === '}') || (opening === '[' && char === ']')

    if (!matched) {
      stack.length = 0
      start = -1
      continue
    }

    if (stack.length === 0 && start >= 0) {
      slices.push(source.slice(start, index + 1))
      start = -1
    }
  }

  return slices
}

function buildJsonCandidates(text) {
  // 先尝试配平后的 JSON 片段，并优先尝试更靠后的候选。
  // 这样可以避免误命中推理过程里提前出现的示例对象。
  const raw = cleanText(text).replace(/^\uFEFF/, '')
  const fenced = stripMarkdownFence(raw)
  const balancedCandidates = [
    ...findBalancedJsonSlices(fenced),
    ...findBalancedJsonSlices(raw),
  ].reverse()

  return [
    ...new Set([
      ...balancedCandidates,
      raw,
      fenced,
      removeTrailingCommas(fenced),
      ...balancedCandidates.map((candidate) => removeTrailingCommas(candidate)),
    ]),
  ].filter(Boolean)
}

export function parseGeminiJsonText(text, message = 'Gemini returned invalid JSON.') {
  const candidates = buildJsonCandidates(text)
  let firstError = null

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    } catch (error) {
      firstError ||= error
    }

    const repaired = removeTrailingCommas(candidate)
    if (repaired !== candidate) {
      try {
        return JSON.parse(repaired)
      } catch (error) {
        firstError ||= error
      }
    }
  }

  throw createJsonParseError(message, firstError, text)
}
