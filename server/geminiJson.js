function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function createJsonParseError(message, cause, sourceText) {
  // 这里不仅抛一个“JSON 失败”的错误，还保留上游预览片段，便于本地 debug 看见模型原始漂移形态。
  const error = new Error(message)
  error.statusCode = 502
  error.upstreamError = `${message}: ${cause?.message || 'unknown parse error'}`
  error.modelOutputPreview = cleanText(sourceText).slice(0, 500)
  return error
}

function stripMarkdownFence(text) {
  // 模型最常见的漂移之一是把 JSON 包进 ```json 代码块里，先做一层剥离。
  const trimmed = cleanText(text)
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  return cleanText(fencedMatch?.[1] || trimmed)
}

function removeTrailingCommas(text) {
  // Gemma 偶尔会在对象或数组最后多一个逗号；这里只做非常保守的 JSON 修复，
  // 不尝试“智能猜测”更多语法，避免把错误内容修成另一个错误结果。
  return cleanText(text).replace(/,\s*([}\]])/g, '$1')
}

function findBalancedJsonSlice(text) {
  // 如果模型在 JSON 前后夹了说明文字，这里尝试只截出第一段括号配平的 JSON 主体。
  const source = cleanText(text)
  const start = source.search(/[\[{]/)

  if (start < 0) return ''

  const stack = []
  let inString = false
  let escaped = false

  for (let index = start; index < source.length; index += 1) {
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
      stack.push(char)
      continue
    }

    if (char === '}' || char === ']') {
      const opening = stack.pop()
      const matched = (opening === '{' && char === '}') || (opening === '[' && char === ']')

      if (!matched) {
        return ''
      }

      if (stack.length === 0) {
        return source.slice(start, index + 1)
      }
    }
  }

  return ''
}

function buildJsonCandidates(text) {
  // 解析顺序从“最接近原始输出”到“轻量修复后输出”，尽量避免过度处理模型文本。
  const raw = cleanText(text).replace(/^\uFEFF/, '')
  const fenced = stripMarkdownFence(raw)
  const balanced = findBalancedJsonSlice(fenced) || findBalancedJsonSlice(raw)

  return [...new Set([raw, fenced, balanced, removeTrailingCommas(fenced), removeTrailingCommas(balanced)])].filter(
    Boolean
  )
}

export function parseGeminiJsonText(text, message = 'Gemini returned invalid JSON.') {
  const candidates = buildJsonCandidates(text)
  let firstError = null

  for (const candidate of candidates) {
    // 先直接尝试原候选，再尝试只去尾逗号的保守修复版本。
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

  // 所有候选都失败时，返回统一错误，并把首个真实解析异常保留下来。
  throw createJsonParseError(message, firstError, text)
}
