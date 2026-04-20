import { sendJson } from './fitnessGemini.js'

// 这个模块专门负责首页“AI 最新动态”：
// - 组织 Gemini 请求；
// - 约束返回格式必须是可落地的 JSON；
// - 对故事字段做可信度校验；
// - 提供带 TTL 的缓存，避免每次刷新都直打模型。
const GEMINI_API_ROOT = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const DEFAULT_AI_NEWS_TTL_MS = 20 * 60 * 1000

const AI_NEWS_SYSTEM_INSTRUCTION = [
  'You are an editorial assistant for a homepage AI news brief.',
  'Return only JSON.',
  'Use Chinese field values for story title, summary, whyItMatters, and sourceLabel.',
  'Use a source-oriented, factual tone.',
  'Do not add personal commentary, hype, or speculation.',
  'Ground every story in public reporting or an official announcement that can be cited.',
].join(' ')

function createHttpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function createRetryableHttpError(statusCode, message) {
  const error = createHttpError(statusCode, message)
  error.retryable = true
  return error
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isValidUrl(value) {
  const text = cleanText(value)
  if (!text) return false

  try {
    const parsed = new URL(text)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function isValidIsoDate(value) {
  const text = cleanText(value)
  return Boolean(text) && !Number.isNaN(Date.parse(text))
}

function isGroundedSourceLabel(value) {
  const label = cleanText(value).toLowerCase()

  if (!label) return false

  return ![
    'rumor',
    'rumours',
    'unverified',
    'speculation',
    'speculative',
    'leak',
    'leaks',
    'blog',
  ].some((needle) => label.includes(needle))
}

function isValidStory(story) {
  return Boolean(
    cleanText(story?.title) &&
      cleanText(story?.summary) &&
      cleanText(story?.whyItMatters) &&
      isGroundedSourceLabel(story?.sourceLabel) &&
      isValidUrl(story?.sourceUrl) &&
      isValidIsoDate(story?.publishedAt)
  )
}

function normalizeStory(story) {
  // 首页卡片要展示的字段有限，所以这里把模型输出压缩成稳定的展示协议。
  if (!isValidStory(story)) {
    return null
  }

  return {
    title: cleanText(story.title),
    summary: cleanText(story.summary),
    whyItMatters: cleanText(story.whyItMatters),
    sourceLabel: cleanText(story.sourceLabel),
    sourceUrl: cleanText(story.sourceUrl),
    publishedAt: cleanText(story.publishedAt),
  }
}

function toStories(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.stories)) return payload.stories
  return []
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
  const trimmed = cleanText(text)
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const candidate = cleanText(fencedMatch?.[1] || trimmed)

  try {
    return JSON.parse(candidate)
  } catch (firstError) {
    const objectStart = candidate.search(/[\[{]/)
    const objectEnd = Math.max(candidate.lastIndexOf('}'), candidate.lastIndexOf(']'))

    if (objectStart >= 0 && objectEnd > objectStart) {
      try {
        return JSON.parse(candidate.slice(objectStart, objectEnd + 1))
      } catch {
        // fall through to the canonical error below
      }
    }

    throw createHttpError(502, 'Unable to refresh AI news right now.')
  }
}

export function buildAiNewsRequestBody(nowIso) {
  const currentIso = isValidIsoDate(nowIso) ? cleanText(nowIso) : new Date().toISOString()

  // 这里明确要求模型：
  // 1. 使用搜索工具；
  // 2. 只返回 JSON；
  // 3. 输出适合首页展示的中文字段。
  return {
    systemInstruction: {
      parts: [
        {
          text: AI_NEWS_SYSTEM_INSTRUCTION,
        },
      ],
    },
    contents: [
      {
        parts: [
          {
            text: [
              `Current UTC timestamp: ${currentIso}`,
              'Write a short homepage AI news brief with the latest public AI developments.',
              'Use the Google Search tool to ground each story in a recent, publicly accessible source.',
              'Translate the story title, summary, whyItMatters, and sourceLabel into concise Chinese for display.',
              'Return only JSON with this shape:',
              '{"updatedAt":"ISO-8601 string","stories":[{"title":"","summary":"","whyItMatters":"","sourceLabel":"","sourceUrl":"","publishedAt":"ISO-8601 string"}]}',
              'Return exactly three stories when enough grounded sources are available.',
              'Do not use markdown fences, commentary, or explanatory prose outside the JSON object.',
              'Keep stories concise, factual, and suitable for a product homepage.',
              'Do not include unsupported claims or personal commentary.',
            ].join('\n'),
          },
        ],
      },
    ],
    tools: [
      {
        googleSearch: {},
      },
    ],
    generationConfig: {
      temperature: 0.2,
    },
  }
}

export function normalizeAiNewsPayload(payload) {
  const updatedAt = cleanText(payload?.updatedAt)
  const stories = toStories(payload)
    .map(normalizeStory)
    .filter(Boolean)
    .slice(0, 3)

  const normalized = {
    stories,
  }

  if (updatedAt) {
    normalized.updatedAt = updatedAt
  }

  return normalized
}

export function createAiNewsCache({ ttlMs = DEFAULT_AI_NEWS_TTL_MS, now = () => Date.now() } = {}) {
  let entry = null

  function buildSnapshot(value, source = 'network') {
    const createdAt = now()
    return {
      value,
      createdAt,
      expiresAt: createdAt + ttlMs,
      source,
    }
  }

  return {
    ttlMs,
    getFreshValue() {
      // 只要没过期，就直接复用缓存，避免首页每次进来都重复请求模型。
      if (!entry) return null
      return now() <= entry.expiresAt ? entry.value : null
    },
    getStaleValue() {
      return entry?.value ?? null
    },
    getSnapshot() {
      return entry
    },
    hasFreshValue() {
      if (!entry) return false
      return now() <= entry.expiresAt
    },
    set(value, source = 'network') {
      entry = buildSnapshot(value, source)
      return entry.value
    },
    clear() {
      entry = null
    },
  }
}

const sharedAiNewsCache = createAiNewsCache()

async function fetchGeminiJson(requestBody, options = {}) {
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
      body: JSON.stringify(requestBody),
    })
  } catch {
    throw createRetryableHttpError(502, 'Gemini upstream unavailable.')
  }

  if (!response.ok) {
    if (response.status >= 500 || response.status === 429 || response.status === 408) {
      throw createRetryableHttpError(502, 'Gemini upstream unavailable.')
    }

    throw createHttpError(502, 'Unable to refresh AI news right now.')
  }

  const payload = await response.json()
  return extractJsonPayload(extractCandidateText(payload))
}

function createStableAiNewsError() {
  return createHttpError(502, 'Unable to refresh AI news right now.')
}

export async function fetchAiNewsBrief(options = {}) {
  // 读取流程：
  // 1. 先看有没有新鲜缓存；
  // 2. 没有就请求 Gemini；
  // 3. 如果请求失败但本地还有可复用的旧数据，就优先回退到 stale cache。
  const cache = options.cache || null
  const now = options.now || (() => Date.now())
  const nowIso = cleanText(options.nowIso) || new Date(now()).toISOString()

  const cachedValue = cache?.getFreshValue?.()
  if (cachedValue) {
    return cachedValue
  }

  try {
    const rawPayload = await fetchGeminiJson(buildAiNewsRequestBody(nowIso), options)
    const normalized = normalizeAiNewsPayload(rawPayload)

    if (!normalized.updatedAt) {
      normalized.updatedAt = nowIso
    }

    cache?.set?.(normalized, 'network')

    return normalized
  } catch (error) {
    const staleValue = cache?.getStaleValue?.()

    if (staleValue && error?.retryable) {
      return staleValue
    }

    const stableError = createStableAiNewsError()
    stableError.cause = error
    throw stableError
  }
}

export async function handleNodeAiNewsRequest(req, res, options = {}) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }

  if ((req.method || 'GET') === 'HEAD') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end()
  }

  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const nowIso = url.searchParams.get('nowIso') || new Date().toISOString()
    const payload = await fetchAiNewsBrief({
      ...options,
      cache: options.cache || sharedAiNewsCache,
      nowIso,
    })

    return sendJson(res, 200, payload)
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      error: error.message,
    })
  }
}
