import { sendJson } from './fitnessGemini.js'
import {
  attachUpstreamDebugInfo,
  buildDebugErrorPayload,
  extractUpstreamErrorMessage,
} from './geminiErrorDebug.js'
import { parseGeminiJsonText } from './geminiJson.js'
import { buildJsonGenerationConfig } from './geminiModelConfig.js'

// 这个模块专门负责首页“AI 最新动态”：
// 1. 组织 Gemini 请求；
// 2. 约束返回结构必须是可落地的 JSON；
// 3. 校验来源与时效性，避免把旧闻当成最新动态；
// 4. 提供带 TTL 的缓存，并在首选模型失效时自动切到后备模型。
const GEMINI_API_ROOT = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const DEFAULT_AI_NEWS_TTL_MS = 20 * 60 * 1000
const DEFAULT_AI_NEWS_TARGET_STORY_COUNT = 3
const DEFAULT_AI_NEWS_MAX_AGE_DAYS = 30
const MAX_AI_NEWS_FUTURE_SKEW_MS = 24 * 60 * 60 * 1000

const AI_NEWS_SYSTEM_INSTRUCTION = [
  'You are an editorial assistant for a homepage AI news brief.',
  'Return only JSON.',
  'The response must start with { and end with }.',
  'Do not wrap JSON in Markdown fences.',
  'Use Chinese field values for story title, summary, whyItMatters, and sourceLabel.',
  'Use a source-oriented, factual tone.',
  'Do not add personal commentary, hype, or speculation.',
  'Ground every story in public reporting or an official announcement that can be cited.',
  'Do not rely on training-memory milestones when grounded search results indicate newer events.',
].join(' ')

function buildAiNewsResponseJsonSchema() {
  // 首页新闻卡片最终只消费这几个字段，因此 schema 只保留展示层真正需要的结构。
  return {
    type: 'object',
    properties: {
      updatedAt: { type: 'string' },
      stories: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            summary: { type: 'string' },
            whyItMatters: { type: 'string' },
            sourceLabel: { type: 'string' },
            sourceUrl: { type: 'string' },
            publishedAt: { type: 'string' },
          },
          required: ['title', 'summary', 'whyItMatters', 'sourceLabel', 'sourceUrl', 'publishedAt'],
        },
      },
    },
    required: ['updatedAt', 'stories'],
  }
}

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

function toTimestamp(value) {
  return isValidIsoDate(value) ? Date.parse(cleanText(value)) : Number.NaN
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

function isRecentEnoughStory(story, nowIso, maxAgeDays = DEFAULT_AI_NEWS_MAX_AGE_DAYS) {
  const nowTimestamp = toTimestamp(nowIso)
  const publishedTimestamp = toTimestamp(story?.publishedAt)

  if (!Number.isFinite(nowTimestamp) || !Number.isFinite(publishedTimestamp)) {
    return false
  }

  const ageMs = nowTimestamp - publishedTimestamp
  return ageMs <= maxAgeDays * 24 * 60 * 60 * 1000 && ageMs >= -MAX_AI_NEWS_FUTURE_SKEW_MS
}

function sortStoriesByPublishedAtDesc(stories) {
  return [...stories].sort((left, right) => toTimestamp(right.publishedAt) - toTimestamp(left.publishedAt))
}

function normalizeStory(story) {
  // 首页卡片要展示的字段有限，所以这里只把模型输出压缩成稳定的展示协议。
  const normalizedStory = {
    title: cleanText(story?.title || story?.headline),
    summary: cleanText(story?.summary || story?.description),
    whyItMatters: cleanText(story?.whyItMatters || story?.why_it_matters || story?.impact),
    sourceLabel: cleanText(story?.sourceLabel || story?.source_label || story?.source),
    sourceUrl: cleanText(story?.sourceUrl || story?.source_url || story?.url),
    publishedAt: cleanText(story?.publishedAt || story?.published_at || story?.date),
  }

  // 首页卡片需要完整来源；Gemma 输出别名时先归一化，再做可信度校验。
  if (!isValidStory(normalizedStory)) {
    return null
  }

  return normalizedStory
}

function toStories(payload) {
  // Gemma 和 Gemini 在新闻列表字段名上可能有漂移，先把常见别名统一进来。
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.stories)) return payload.stories
  if (Array.isArray(payload?.articles)) return payload.articles
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.news)) return payload.news
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
  // AI 新闻最容易混入解释文字、来源脚注和 Markdown，这里只负责提取 JSON 外壳；
  // 真正的来源校验和时效校验仍放在 normalizeStory / normalizeAiNewsPayload。
  return parseGeminiJsonText(text, 'Unable to refresh AI news right now.')
}

export function buildAiNewsRequestBody(nowIso, model = DEFAULT_GEMINI_MODEL) {
  const currentIso = isValidIsoDate(nowIso) ? cleanText(nowIso) : new Date().toISOString()

  // 这里明确要求模型：
  // 1. 使用搜索工具；
  // 2. 只返回 JSON；
  // 3. 只返回相对当前时间足够新的公开动态。
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
              `Only use stories published within the last ${DEFAULT_AI_NEWS_MAX_AGE_DAYS} days of the current timestamp.`,
              'Prefer stories from the last 7 days first, and only widen the window if needed to reach three grounded stories.',
              'Do not use famous historical milestones from prior years just because they are well known.',
              'Before finalizing, verify that every publishedAt value is recent relative to the current timestamp.',
              'Translate the story title, summary, whyItMatters, and sourceLabel into concise Chinese for display.',
              'Return only JSON with this shape:',
              '{"updatedAt":"ISO-8601 string","stories":[{"title":"","summary":"","whyItMatters":"","sourceLabel":"","sourceUrl":"","publishedAt":"ISO-8601 string"}]}',
              'The first character must be { and the last character must be }.',
              'Use only these top-level keys: updatedAt, stories.',
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
    // Gemini 模型继续用 responseJsonSchema 稳住结构；Gemma 或工具不兼容 schema 的模型，
    // 则退回到 thinking + 本地 JSON 容错，避免触发 400。
    generationConfig: buildJsonGenerationConfig(model, {
      schema: buildAiNewsResponseJsonSchema(),
      temperature: 0.2,
      usesTools: true,
    }),
  }
}

export function normalizeAiNewsPayload(payload, options = {}) {
  const nowIso = cleanText(options.nowIso)
  const updatedAt = cleanText(payload?.updatedAt || payload?.updated_at)
  const stories = sortStoriesByPublishedAtDesc(
    toStories(payload)
      .map(normalizeStory)
      .filter(Boolean)
      .filter((story) => (nowIso ? isRecentEnoughStory(story, nowIso) : true))
  ).slice(0, DEFAULT_AI_NEWS_TARGET_STORY_COUNT)

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
      // 只要没过期，就直接复用缓存，避免首页每次刷新都重复请求模型。
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
  const model =
    options.model ||
    process.env.GEMINI_AI_NEWS_MODEL ||
    process.env.GEMINI_MODEL ||
    DEFAULT_GEMINI_MODEL
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
    // 新闻简报有 stale cache 兜底；这里仍保留模型名，便于本地判断上游是否根本没响应。
    throw attachUpstreamDebugInfo(
      createRetryableHttpError(502, 'Gemini upstream unavailable.'),
      {
        upstreamError: 'Network request failed before a Gemini response was received.',
        model,
      }
    )
  }

  if (!response.ok) {
    const errorText = await response.text()
    // Gemini 返回非 2xx 时，先提取稳定的调试字段，再根据状态决定是否可重试。
    const upstreamDetails = {
      upstreamStatus: response.status,
      upstreamError: extractUpstreamErrorMessage(errorText),
      model,
    }

    if (response.status >= 500 || response.status === 429 || response.status === 408) {
      throw attachUpstreamDebugInfo(
        createRetryableHttpError(502, 'Gemini upstream unavailable.'),
        upstreamDetails
      )
    }

    throw attachUpstreamDebugInfo(
      createHttpError(502, 'Unable to refresh AI news right now.'),
      upstreamDetails
    )
  }

  const payload = await response.json()
  return extractJsonPayload(extractCandidateText(payload))
}

function createStableAiNewsError() {
  return createHttpError(502, 'Unable to refresh AI news right now.')
}

function createInsufficientFreshStoriesError(model, count) {
  return attachUpstreamDebugInfo(
    createRetryableHttpError(502, 'Unable to refresh AI news right now.'),
    {
      upstreamError: `Model returned only ${count} recent AI news stories.`,
      model,
    }
  )
}

function resolveAiNewsModelSequence(options = {}) {
  const preferredModel =
    cleanText(options.model) ||
    cleanText(process.env.GEMINI_AI_NEWS_MODEL) ||
    cleanText(process.env.GEMINI_MODEL) ||
    DEFAULT_GEMINI_MODEL

  return [...new Set([preferredModel, DEFAULT_GEMINI_MODEL].filter(Boolean))]
}

function canRetryWithAlternateModel(error) {
  if (cleanText(error?.message) === 'Missing GEMINI_API_KEY configuration.') {
    return false
  }

  return ![401, 403].includes(Number(error?.upstreamStatus))
}

function hasRecentStories(payload, nowIso) {
  return normalizeAiNewsPayload(payload, { nowIso }).stories.length > 0
}

export async function fetchAiNewsBrief(options = {}) {
  // 读取流程：
  // 1. 先看有没有仍然新鲜的缓存；
  // 2. 没有就按模型序列请求 Gemini；
  // 3. 如果首选模型只返回旧闻或临时失败，就自动切到更稳的后备模型；
  // 4. 所有尝试都失败时，只在旧缓存仍然足够新时才回退到 stale cache。
  const cache = options.cache || null
  const now = options.now || (() => Date.now())
  const nowIso = cleanText(options.nowIso) || new Date(now()).toISOString()

  const cachedValue = cache?.getFreshValue?.()
  if (cachedValue && hasRecentStories(cachedValue, nowIso)) {
    return cachedValue
  }

  let lastError = null
  const requestModels = resolveAiNewsModelSequence(options)

  for (let index = 0; index < requestModels.length; index += 1) {
    const requestModel = requestModels[index]
    const isLastModel = index === requestModels.length - 1

    try {
      const rawPayload = await fetchGeminiJson(buildAiNewsRequestBody(nowIso, requestModel), {
        ...options,
        model: requestModel,
      })
      const normalized = normalizeAiNewsPayload(rawPayload, { nowIso })

      if (!normalized.updatedAt) {
        normalized.updatedAt = nowIso
      }

      if (
        normalized.stories.length >= DEFAULT_AI_NEWS_TARGET_STORY_COUNT ||
        (isLastModel && normalized.stories.length > 0)
      ) {
        cache?.set?.(normalized, 'network')
        return normalized
      }

      lastError = createInsufficientFreshStoriesError(requestModel, normalized.stories.length)
    } catch (error) {
      lastError = error

      if (isLastModel || !canRetryWithAlternateModel(error)) {
        break
      }
    }
  }

  const staleValue = cache?.getStaleValue?.()

  if (staleValue && lastError?.retryable && hasRecentStories(staleValue, nowIso)) {
    return staleValue
  }

  // 没有可用新数据时，仍对外返回统一错误，但把底层调试信息保留给本地 handler。
  const stableError = attachUpstreamDebugInfo(createStableAiNewsError(), {
    upstreamStatus: lastError?.upstreamStatus,
    upstreamError: lastError?.upstreamError,
    model: lastError?.model,
  })
  stableError.cause = lastError
  throw stableError
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
    return sendJson(
      res,
      error.statusCode || 500,
      // 生产环境只给稳定文案；本地开发模式才把 Gemini 上游字段附到响应里。
      buildDebugErrorPayload(error, 'Unable to refresh AI news right now.', options)
    )
  }
}
