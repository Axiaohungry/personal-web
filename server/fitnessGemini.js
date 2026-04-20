const GEMINI_API_ROOT = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'

// 这里负责两类“结构化搜索”：
// - 食物营养搜索；
// - 补剂信息搜索。
// 核心目标不是让模型自由回答，而是逼它稳定返回可落进表格的 JSON。
const FOOD_SYSTEM_INSTRUCTION = [
  'You format food lookup results for a Chinese fitness workbench.',
  'Return only JSON.',
  'Use Chinese field values.',
  'Every row must describe nutrients for exactly 100g edible portion.',
  'Keep scene short, practical, and fitness-oriented.',
].join(' ')

const SUPPLEMENT_SYSTEM_INSTRUCTION = [
  'You format supplement lookup results for a Chinese fitness workbench.',
  'Return only JSON.',
  'Use Chinese field values.',
  'List common supplement ingredients, not brands.',
  'Keep dose and use case concise and non-medical.',
].join(' ')

function createHttpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function normalizeQuery(query) {
  const value = String(query || '').trim()

  if (!value) {
    throw createHttpError(400, 'Search query is required.')
  }

  if (value.length > 80) {
    throw createHttpError(400, 'Search query is too long.')
  }

  return value
}

function buildFoodPrompt(query) {
  return [
    `用户查询: ${query}`,
    '返回 1 到 8 个最相关的常见食物结果。',
    '严格输出 JSON 对象，格式为 {"items":[{"name":"","calories":0,"carbs":0,"protein":0,"fat":0,"scene":""}]}。',
    '热量单位是 kcal，三大营养素单位是 g。',
    '不要输出解释、Markdown、注释或额外字段。',
  ].join('\n')
}

function buildSupplementPrompt(query) {
  return [
    `用户查询: ${query}`,
    '返回 1 到 8 个最相关的常见补剂结果。',
    '严格输出 JSON 对象，格式为 {"items":[{"name":"","dose":"","bestFor":""}]}。',
    'dose 写常见剂量，bestFor 写适用场景。',
    '不要输出解释、Markdown、注释或额外字段。',
  ].join('\n')
}

function buildRequestBody(kind, query) {
  const isFood = kind === 'food'

  // food / supplement 的请求体结构几乎一致，只在系统提示词和用户提示词上切换。
  // 收口到一个构造器里后，后续如果要统一调模型参数，只改这里即可。
  return {
    systemInstruction: {
      parts: [
        {
          text: isFood ? FOOD_SYSTEM_INSTRUCTION : SUPPLEMENT_SYSTEM_INSTRUCTION,
        },
      ],
    },
    contents: [
      {
        parts: [
          {
            text: isFood ? buildFoodPrompt(query) : buildSupplementPrompt(query),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  }
}

function extractCandidateText(payload) {
  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || '')
    .join('')
    .trim()

  if (text) {
    return text
  }

  const blockReason = payload?.promptFeedback?.blockReason
  if (blockReason) {
    throw createHttpError(502, `Gemini blocked the request: ${blockReason}.`)
  }

  throw createHttpError(502, 'Gemini returned an empty response.')
}

function extractJsonPayload(text) {
  const trimmed = text.trim()
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const candidate = fencedMatch?.[1]?.trim() || trimmed

  try {
    return JSON.parse(candidate)
  } catch (firstError) {
    // 模型偶尔会把 JSON 包在代码块里，或者前后夹带一小段说明。
    // 这里做一次“尽量提纯”的兜底，避免前端因为轻微格式噪声直接拿不到结果。
    const objectStart = candidate.search(/[\[{]/)
    const objectEnd = Math.max(candidate.lastIndexOf('}'), candidate.lastIndexOf(']'))

    if (objectStart >= 0 && objectEnd > objectStart) {
      try {
        return JSON.parse(candidate.slice(objectStart, objectEnd + 1))
      } catch {
        // fall through to the canonical error below
      }
    }

    throw createHttpError(502, `Gemini returned invalid JSON: ${firstError.message}`)
  }
}

function roundToSingleDecimal(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return null
  return Math.round(numericValue * 10) / 10
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function ensure100gName(name) {
  const cleanName = cleanText(name)
  if (!cleanName) return ''
  if (/\b100\s*g\b/i.test(cleanName)) return cleanName
  return `${cleanName} 100g`
}

function toItems(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

function normalizeFoodRows(payload) {
  // 页面表格需要的是稳定、可比较的数据结构，所以这里强制规整成 100g 口径。
  return toItems(payload)
    .map((item) => ({
      name: ensure100gName(item?.name || item?.food),
      calories: roundToSingleDecimal(item?.calories ?? item?.kcal),
      carbs: roundToSingleDecimal(item?.carbs),
      protein: roundToSingleDecimal(item?.protein),
      fat: roundToSingleDecimal(item?.fat),
      scene: cleanText(item?.scene || item?.useCase || item?.bestFor),
    }))
    .filter((item) => {
      return (
        item.name &&
        item.scene &&
        item.calories !== null &&
        item.carbs !== null &&
        item.protein !== null &&
        item.fat !== null
      )
    })
    .slice(0, 8)
}

function normalizeSupplementRows(payload) {
  return toItems(payload)
    .map((item) => ({
      name: cleanText(item?.name || item?.supplement),
      dose: cleanText(item?.dose || item?.commonDose),
      bestFor: cleanText(item?.bestFor || item?.scenario || item?.useCase),
    }))
    .filter((item) => item.name && item.dose && item.bestFor)
    .slice(0, 8)
}

async function requestGemini(kind, query, options = {}) {
  const normalizedQuery = normalizeQuery(query)
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY
  const model = options.model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL
  const fetchImpl = options.fetchImpl || fetch

  if (!apiKey) {
    throw createHttpError(500, 'Missing GEMINI_API_KEY configuration.')
  }

  const response = await fetchImpl(`${GEMINI_API_ROOT}/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(buildRequestBody(kind, normalizedQuery)),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw createHttpError(502, `Gemini request failed: ${response.status} ${errorText}`.trim())
  }

  const payload = await response.json()
  return extractJsonPayload(extractCandidateText(payload))
}

export async function fetchFoodResults(query, options = {}) {
  const payload = await requestGemini('food', query, options)
  return normalizeFoodRows(payload)
}

export async function fetchSupplementResults(query, options = {}) {
  const payload = await requestGemini('supplement', query, options)
  return normalizeSupplementRows(payload)
}

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

export async function handleNodeSearchRequest(req, res, kind, options = {}) {
  if (req.method && req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }

  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const query = url.searchParams.get('q') || ''
    // 这里保持 handler 尽量薄：只负责解析请求、调用对应能力、把结果序列化回去。
    // 具体的字段清洗和模型交互都放在上面的纯函数里，方便单测覆盖。
    const items =
      kind === 'food'
        ? await fetchFoodResults(query, options)
        : await fetchSupplementResults(query, options)

    return sendJson(res, 200, { items })
  } catch (error) {
    return sendJson(res, error.statusCode || 500, { error: error.message })
  }
}
