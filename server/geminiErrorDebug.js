function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function extractUpstreamErrorMessage(responseText) {
  const text = cleanText(responseText)
  if (!text) return ''

  try {
    // Gemini 错误响应通常是 JSON；本地调试只需要最关键的 message，而不是整段响应体。
    const payload = JSON.parse(text)
    return (
      cleanText(payload?.error?.message) ||
      cleanText(payload?.message) ||
      text.slice(0, 500)
    )
  } catch {
    return text.slice(0, 500)
  }
}

export function attachUpstreamDebugInfo(error, details = {}) {
  // 调试字段先挂在 Error 对象上，是否返回给客户端交给 handler 的开关统一控制。
  if (Number.isFinite(details.upstreamStatus)) {
    error.upstreamStatus = details.upstreamStatus
  }

  if (cleanText(details.upstreamError)) {
    error.upstreamError = cleanText(details.upstreamError)
  }

  if (cleanText(details.model)) {
    error.model = cleanText(details.model)
  }

  return error
}

export function buildDebugErrorPayload(error, fallbackMessage, options = {}) {
  // 线上始终返回稳定文案；只有本地开发显式开启 debug 时才带上游细节。
  const payload = {
    error: fallbackMessage,
  }

  if (!options.debugUpstreamErrors) {
    return payload
  }

  if (Number.isFinite(error?.upstreamStatus)) {
    payload.upstreamStatus = error.upstreamStatus
  }

  if (cleanText(error?.upstreamError)) {
    payload.upstreamError = cleanText(error.upstreamError)
  } else if (cleanText(error?.message) && error.message !== fallbackMessage) {
    payload.upstreamError = cleanText(error.message)
  }

  if (cleanText(error?.model)) {
    payload.model = cleanText(error.model)
  }

  return payload
}
