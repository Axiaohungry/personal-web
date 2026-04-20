import {
  attachUpstreamDebugInfo,
  buildDebugErrorPayload,
  extractUpstreamErrorMessage,
} from './geminiErrorDebug.js'
import { parseGeminiJsonText } from './geminiJson.js'
import { buildJsonGenerationConfig } from './geminiModelConfig.js'

const GEMINI_API_ROOT = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'

// 这里负责两类“结构化搜索”：
// - 食物营养搜索；
// - 补剂信息搜索。
// 核心目标不是让模型自由回答，而是逼它稳定返回可落进表格的 JSON。
const FOOD_SYSTEM_INSTRUCTION = [
  'You format food lookup results for a Chinese fitness workbench.',
  'Return only JSON.',
  'The response must start with { and end with }.',
  'Do not wrap JSON in Markdown fences.',
  'All string values must be Simplified Chinese.',
  'Use Chinese field values.',
  'Every row must describe nutrients for exactly 100g edible portion.',
  'Keep scene short, practical, and fitness-oriented.',
].join(' ')

const SUPPLEMENT_SYSTEM_INSTRUCTION = [
  'You format supplement lookup results for a Chinese fitness workbench.',
  'Return only JSON.',
  'The response must start with { and end with }.',
  'Do not wrap JSON in Markdown fences.',
  'All string values must be Simplified Chinese.',
  'Use Chinese field values.',
  'List common supplement ingredients, not brands.',
  'Keep dose and use case concise and non-medical.',
].join(' ')

function buildFoodResponseJsonSchema() {
  // 这个 schema 只约束前端真正消费的字段，避免把模型逼到返回无关元信息。
  return {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            calories: { type: 'number' },
            carbs: { type: 'number' },
            protein: { type: 'number' },
            fat: { type: 'number' },
            scene: { type: 'string' },
          },
          required: ['name', 'calories', 'carbs', 'protein', 'fat', 'scene'],
        },
      },
    },
    required: ['items'],
  }
}

function buildSupplementResponseJsonSchema() {
  // 补剂库只需要“补剂 / 常见剂量 / 适用场景”，这里刻意不开放更多自由字段。
  return {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            dose: { type: 'string' },
            bestFor: { type: 'string' },
          },
          required: ['name', 'dose', 'bestFor'],
        },
      },
    },
    required: ['items'],
  }
}

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
    '所有字符串字段必须使用简体中文，不要返回英文食物名或英文使用场景。',
    '热量单位是 kcal，三大营养素单位是 g。',
    '不要输出解释、Markdown、注释或额外字段。',
  ].join('\n')
}

function buildSupplementPrompt(query) {
  return [
    `用户查询: ${query}`,
    '返回 1 到 8 个最相关的常见补剂结果。',
    '严格输出 JSON 对象，格式为 {"items":[{"name":"","dose":"","bestFor":""}]}。',
    '所有字符串字段必须使用简体中文，不要返回英文补剂名或英文适用场景。',
    'dose 写常见剂量，bestFor 写适用场景。',
    '不要输出解释、Markdown、注释或额外字段。',
  ].join('\n')
}

function buildRequestBody(kind, query, model = DEFAULT_GEMINI_MODEL) {
  const isFood = kind === 'food'
  const schema = isFood ? buildFoodResponseJsonSchema() : buildSupplementResponseJsonSchema()

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
    // Gemini 模型走结构化输出；Gemma 模型走 thinking + 提示词约束，避免不支持 schema 时 400/502。
    generationConfig: buildJsonGenerationConfig(model, { schema, temperature: 0.2 }),
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

function normalizeLooseKey(value) {
  // Markdown 兜底解析会把 key 做扁平化，统一处理 best_for / best-for / best for 这类写法。
  return cleanText(value)
    .toLowerCase()
    .replace(/[_\s-]+/g, '')
}

function cleanMarkdownLine(line) {
  // 去掉常见项目符号和首尾空白，保留真正的键值文本。
  return cleanText(line).replace(/^[-*•]\s*/, '').trim()
}

function isIgnoredMarkdownLine(line) {
  // 这些是模型常见的“包装说明”，对表格内容没有价值，直接跳过。
  const normalized = normalizeLooseKey(line)
  return (
    !normalized ||
    normalized.startsWith('userquery') ||
    normalized === 'results' ||
    normalized === 'result' ||
    normalized === 'json' ||
    normalized === 'items'
  )
}

function splitMarkdownKeyValue(line) {
  // 同时兼容英文冒号和中文冒号，便于解析 Gemma 漂移成列表说明的情况。
  const match = cleanMarkdownLine(line).match(/^([^:：]+)[:：]\s*(.+)$/)
  if (!match) return null

  return {
    key: normalizeLooseKey(match[1]),
    value: cleanText(match[2]),
  }
}

function parseSupplementMarkdownPayload(text) {
  const items = []
  let current = {}

  function flushCurrent() {
    // 只在三列核心字段都齐全时才接收，避免把半截说明误当成补剂结果。
    if (current.name && current.dose && current.bestFor) {
      items.push(current)
    }
    current = {}
  }

  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = cleanMarkdownLine(rawLine)
    if (isIgnoredMarkdownLine(line)) continue

    const pair = splitMarkdownKeyValue(line)

    if (pair) {
      if (['name', 'supplement', 'item', 'ingredient'].includes(pair.key)) {
        // 一旦遇到新的补剂名，就把上一个条目先入列。
        flushCurrent()
        current.name = pair.value
        continue
      }

      if (['dose', 'dosage', 'commondose', 'commondosage'].includes(pair.key)) {
        current.dose = pair.value
        continue
      }

      if (['bestfor', 'usecase', 'scenario', 'suitablefor', 'fitfor'].includes(pair.key)) {
        current.bestFor = pair.value
        continue
      }

      continue
    }

    if (!current.name) {
      current.name = line
    }
  }

  flushCurrent()
  return items.length ? { items } : null
}

function parseFoodMarkdownPayload(text) {
  const items = []
  let current = {}

  function flushCurrent() {
    // 食物表要求五列都完整，且营养值必须至少能提取出数字。
    const hasMacroValues =
      cleanText(current.calories) &&
      cleanText(current.carbs) &&
      cleanText(current.protein) &&
      cleanText(current.fat)

    if (
      current.name &&
      current.scene &&
      hasMacroValues
    ) {
      items.push(current)
    }
    current = {}
  }

  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = cleanMarkdownLine(rawLine)
    if (isIgnoredMarkdownLine(line)) continue

    const pair = splitMarkdownKeyValue(line)
    if (!pair) {
      // 某些模型会把第一行直接写成食物名而不是 Food: xxx，这里给一个窄范围容错。
      if (!current.name) current.name = line
      continue
    }

    if (['name', 'food', 'item'].includes(pair.key)) {
      // 碰到新食物时先收口上一条，避免多条结果串在一起。
      flushCurrent()
      current.name = pair.value
      continue
    }

    if (['calories', 'kcal', 'energy'].includes(pair.key)) current.calories = pair.value
    if (['carbs', 'carbohydrate', 'carbohydrates'].includes(pair.key)) current.carbs = pair.value
    if (['protein'].includes(pair.key)) current.protein = pair.value
    if (['fat', 'fats'].includes(pair.key)) current.fat = pair.value
    if (['scene', 'usecase', 'bestfor', 'scenario'].includes(pair.key)) current.scene = pair.value
  }

  flushCurrent()
  return items.length ? { items } : null
}

function extractJsonPayload(text, kind) {
  // 默认仍然以严格 JSON 为主；只有 JSON 彻底失败时，才进入食物/补剂专属 Markdown 兜底。
  try {
    return parseGeminiJsonText(text)
  } catch (error) {
    // 这样可以修复 Gemma 偶发的“项目列表回答”，又不会放宽训练助手和新闻接口的协议边界。
    const markdownPayload =
      kind === 'supplement' ? parseSupplementMarkdownPayload(text) : parseFoodMarkdownPayload(text)

    if (markdownPayload) {
      return markdownPayload
    }

    throw error
  }
}

function roundToSingleDecimal(value) {
  // 兼容 "89 kcal" / "22.8 g" 这类带单位写法，只抽取第一个数值部分参与计算。
  const normalizedValue =
    typeof value === 'string' ? value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)?.[0] : value
  const numericValue = Number(normalizedValue)
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
  // Gemma 常见别名会落在 dosage / use_case 等字段上，这里统一收口到前端固定列名。
  return toItems(payload)
    .map((item) => ({
      name: cleanText(item?.name || item?.supplement),
      dose: cleanText(item?.dose || item?.dosage || item?.commonDose || item?.common_dose),
      bestFor: cleanText(
        item?.bestFor || item?.best_for || item?.scenario || item?.useCase || item?.use_case
      ),
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

  let response

  try {
    response = await fetchImpl(`${GEMINI_API_ROOT}/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(buildRequestBody(kind, normalizedQuery, model)),
    })
  } catch {
    // 请求还没拿到 Gemini 响应时，也保留模型名，方便本地判断网络、代理或区域问题。
    throw attachUpstreamDebugInfo(createHttpError(502, 'Gemini request failed.'), {
      upstreamError: 'Network request failed before a Gemini response was received.',
      model,
    })
  }

  if (!response.ok) {
    const errorText = await response.text()
    // 上游已返回错误时只提取可读信息；是否对外展示由 buildDebugErrorPayload 决定。
    throw attachUpstreamDebugInfo(
      createHttpError(502, 'Gemini request failed.'),
      {
        upstreamStatus: response.status,
        upstreamError: extractUpstreamErrorMessage(errorText),
        model,
      }
    )
  }

  const payload = await response.json()
  return extractJsonPayload(extractCandidateText(payload), kind)
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
    // 这里统一收口响应结构，避免各入口自己决定是否暴露 Gemini 的原始错误。
    return sendJson(
      res,
      error.statusCode || 500,
      buildDebugErrorPayload(error, 'Gemini request failed.', options)
    )
  }
}
