import { sendJson } from './fitnessGemini.js'
import {
  getFitnessModuleByRoutePath,
  pickFitnessModulesByAssistantTopic,
} from '../src/data/fitnessModules.js'

// 训练助手与食物/补剂搜索不同，它不只是查表，而是要：
// 1. 判断问题是否属于健身领域；
// 2. 拦截医疗边界；
// 3. 在安全范围内请求 Gemini；
// 4. 把结果规整成前端统一消费的 JSON 协议。
const GEMINI_API_ROOT = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'

const SCOPE_KEYWORDS = {
  training: [
    'training',
    'workout',
    'lift',
    'strength',
    'hypertrophy',
    'program',
    'sets',
    'reps',
    'squat',
    'bench',
    'deadlift',
    'cardio',
    'exercise',
    '训练',
    '健身',
    '力量',
    '增肌',
    '动作',
    '组数',
    '次数',
  ],
  diet: [
    'diet',
    'nutrition',
    'food',
    'meal',
    'calorie',
    'calories',
    'macro',
    'macros',
    'protein',
    'carb',
    'fat loss',
    'cut',
    'bulk',
    'lean gain',
    '饮食',
    '营养',
    '热量',
    '蛋白',
    '碳水',
    '脂肪',
    '减脂',
    '增肌',
    '餐',
  ],
  recovery: [
    'recovery',
    'rest',
    'sleep',
    'soreness',
    'fatigue',
    'deload',
    'stretch',
    'mobility',
    '恢复',
    '休息',
    '睡眠',
    '拉伸',
    '酸痛',
    '疲劳',
    '放松',
  ],
  supplements: [
    'supplement',
    'creatine',
    'caffeine',
    'beta alanine',
    'fish oil',
    'protein powder',
    'electrolyte',
    'vitamin',
    '补剂',
    '补充剂',
    '肌酸',
    '咖啡因',
    '蛋白粉',
    '鱼油',
    '电解质',
    '维生素',
  ],
  habits: [
    'habit',
    'hydration',
    'steps',
    'walking',
    'routine',
    'lifestyle',
    '习惯',
    '作息',
    '喝水',
    '步数',
    '走路',
    '日常',
    '生活方式',
  ],
}

const MEDICAL_KEYWORDS = [
  'medical',
  'diagnosis',
  'diagnose',
  'doctor',
  'hospital',
  'pharmacy',
  'prescription',
  'rx',
  'antibiotic',
  'drug',
  'medication',
  'lab result',
  'lab results',
  'blood test',
  'test result',
  'scan result',
  'symptom',
  'symptoms',
  'infection',
  'disease',
  'illness',
  'injury diagnosis',
  '处方',
  '药房',
  '药店',
  '药物',
  '抗生素',
  '诊断',
  '医生',
  '医院',
  '化验',
  '检查结果',
  '验血',
  '病症',
  '病情',
  '症状',
  '药品',
]

const FITNESS_SYSTEM_INSTRUCTION = [
  'You are a focused fitness assistant for a Chinese personal web app.',
  'Only answer training, diet, recovery, supplements, and general health-habit questions.',
  'If the prompt is unrelated, return status out_of_scope.',
  'If the prompt asks about diagnosis, symptoms, prescriptions, pharmacies, lab results, or medication decisions, return status medical_boundary.',
  'Return only JSON.',
  'Do not provide raw markdown, disclaimers outside JSON, or hidden chain-of-thought.',
  'Keep responses practical, concise, and safe.',
].join(' ')

function createHttpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeQuestion(question) {
  return cleanText(question)
}

function includesAny(text, needles) {
  const normalized = text.toLowerCase()
  return needles.some((needle) => normalized.includes(needle.toLowerCase()))
}

function normalizeStatus(value) {
  const status = cleanText(value)
  if (status === 'ok' || status === 'out_of_scope' || status === 'medical_boundary') {
    return status
  }
  return ''
}

function hasMedicalBoundary(text) {
  const normalized = text.toLowerCase()
  return MEDICAL_KEYWORDS.some((needle) => normalized.includes(needle.toLowerCase()))
}

function detectScopeTopic(question) {
  const text = normalizeQuestion(question)

  if (!text) return 'general'

  // 这里的匹配顺序有意从“最常见健身主题”往下走。
  // 一旦命中就立即返回，让一个问题只落进一个主主题，方便后面推荐相关模块。
  if (includesAny(text, SCOPE_KEYWORDS.training)) return 'training'
  if (includesAny(text, SCOPE_KEYWORDS.diet)) return 'diet'
  if (includesAny(text, SCOPE_KEYWORDS.recovery)) return 'recovery'
  if (includesAny(text, SCOPE_KEYWORDS.supplements)) return 'supplements'
  if (includesAny(text, SCOPE_KEYWORDS.habits)) return 'habits'

  return 'general'
}

function uniqueModules(modules) {
  const seen = new Set()
  return modules.filter((module) => {
    const label = cleanText(module?.label)
    const href = cleanText(module?.href)
    if (!label || !href) return false
    if (!href.startsWith('/fitness/modules/')) return false

    const key = `${label}|${href}`
    // 用 label + href 共同去重，避免模型返回同一路由但不同文案时重复展示。
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function pickModulesByTopic(topic) {
  // 助手和前端工作台共享同一份模块注册表，保证模块标题和 href 不会在两边写出两套版本。
  return pickFitnessModulesByAssistantTopic(topic).map((module) => ({
    label: module.title,
    href: module.routePath,
  }))
}

function canonicalModuleLabelForHref(href) {
  return getFitnessModuleByRoutePath(cleanText(href))?.title || ''
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return []
  return value.map(cleanText).filter(Boolean)
}

function looksClearlyOffDomainAnswer(payload) {
  const combinedText = [
    payload?.answerTitle,
    payload?.summary,
    ...(Array.isArray(payload?.actions) ? payload.actions : []),
    ...(Array.isArray(payload?.cautions) ? payload.cautions : []),
    ...(Array.isArray(payload?.relatedModules)
      ? payload.relatedModules.map((module) => module?.label)
      : []),
  ]
    .map(cleanText)
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (!combinedText) return false

  return [
    'programming',
    'code',
    'coding',
    'javascript',
    'typescript',
    'python',
    'api',
    'database',
    'sql',
    'git',
    'repository',
    'desktop',
    'printer',
    'browser',
    'software',
    'customer support',
    'sales',
    'marketing',
    '编程',
    '数据库',
    '代码',
    '程序',
    '打印机',
  ].some((needle) => combinedText.includes(needle.toLowerCase()))
}

function normalizeRelatedModules(value, question) {
  const modules = Array.isArray(value)
    ? value
        .map((module) => ({
          href: cleanText(module?.href),
          label: canonicalModuleLabelForHref(module?.href) || cleanText(module?.label),
        }))
        .filter((module) => module.label && module.href && module.href.startsWith('/fitness/modules/'))
    : []

  const fallback = buildAssistantRelatedModules(question)
  // 只要模型给出的 relatedModules 不可用，就回退到本地推荐结果，保证前端始终有稳定模块链接可渲染。
  return uniqueModules(modules.length ? modules : fallback).slice(0, 4)
}

function buildSafeRefusalPayload(status, question) {
  const topic = detectScopeTopic(question)
  const relatedModules = buildAssistantRelatedModules(question)

  // 拒答不是简单返回 error，而是给出稳定结构，
  // 这样前端不需要区分“正常回答”和“边界提示”两套完全不同的渲染协议。
  if (status === 'medical_boundary') {
    return {
      status,
      answerTitle: '我不能帮你判断诊断或用药',
      summary:
        '我可以回答训练、饮食、恢复、补剂和健康习惯，但不能做诊断、处方、药房问题或化验结果解读。',
      actions: [
        '请咨询有执照的医生或药师来处理诊断、治疗或用药决定。',
        '如果是训练、营养、恢复、补剂或习惯问题，我可以继续帮你。',
      ],
      cautions: [
        '不要把这个助手当作医疗建议的替代品。',
        '如果症状严重或快速加重，请尽快就医。',
      ],
      relatedModules,
    }
  }

  return {
    status: 'out_of_scope',
    answerTitle: topic === 'general' ? '我只能回答健身相关问题' : '我只能回答健身指导问题',
    summary:
      '我可以回答训练、饮食、恢复、补剂和健康习惯。',
    actions: [
      '你可以继续问训练计划、饮食策略、恢复安排、补剂选择或健康习惯。',
      '如果愿意，可以把问题收窄到减脂、增肌或恢复这类具体目标。',
    ],
    cautions: [
      '我不会回答与健身无关的话题。',
      '我会拒绝诊断、处方和化验结果解读。',
    ],
    relatedModules,
  }
}

function isValidAssistantResponse(payload) {
  return Boolean(
    cleanText(payload?.answerTitle) &&
      cleanText(payload?.summary) &&
      normalizeStringArray(payload?.actions).length > 0 &&
      normalizeStringArray(payload?.cautions).length > 0
  )
}

function parseJsonPayload(text) {
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

    throw createHttpError(502, `Gemini returned invalid JSON: ${firstError.message}`)
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

function buildResponseJsonSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      status: {
        type: 'string',
        enum: ['ok', 'out_of_scope', 'medical_boundary'],
      },
      answerTitle: { type: 'string' },
      summary: { type: 'string' },
      actions: {
        type: 'array',
        items: { type: 'string' },
      },
      cautions: {
        type: 'array',
        items: { type: 'string' },
      },
      relatedModules: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            label: { type: 'string' },
            href: { type: 'string' },
          },
          required: ['label', 'href'],
        },
      },
    },
    required: ['status', 'answerTitle', 'summary', 'actions', 'cautions', 'relatedModules'],
  }
}

function stringifyContext(context) {
  if (!context) return ''

  if (typeof context === 'string') {
    return cleanText(context).slice(0, 500)
  }

  if (typeof context === 'object') {
    try {
      return JSON.stringify(context).slice(0, 500)
    } catch {
      return ''
    }
  }

  return cleanText(String(context)).slice(0, 500)
}

function looksLikePlanningFollowUp(text) {
  const normalized = cleanText(text).toLowerCase()
  if (!normalized) return false

  // 这类词本身不一定是健身问题，但如果上下文里已经有 cut/gain 目标，
  // 就很可能是在追问“接下来怎么执行”。
  return [
    '\u6b65\u9aa4',
    '\u6267\u884c',
    '\u538b\u6210',
    '\u62c6\u6210',
    '\u6574\u7406',
    '\u89c4\u5212',
    '\u8ba1\u5212',
    '\u5b89\u6392',
    '\u4e0b\u4e00\u6b65',
    'follow-up',
    'follow up',
    'next step',
    'next steps',
  ].some((needle) => normalized.includes(needle.toLowerCase()))
}

function hasRecognizedFitnessGoalContext(context) {
  const normalized = stringifyContext(context).toLowerCase()
  if (!normalized) return false

  // 这里只认结构化上下文里的 goal，不靠模糊词猜。
  // 这样能避免把别的业务上下文误当成健身目标。
  return /"goal"s*:s*"(cut|gain|bulk|lean gain)"/i.test(normalized)
    || /goal:s*'(cut|gain|bulk|lean gain)'/i.test(normalized)
}

export function classifyAssistantQuestion(question, context = '') {
  const text = normalizeQuestion(question)
  const combinedText = [text, stringifyContext(context)].filter(Boolean).join(' ')

  // 这里先做本地快速分流：
  // 范围外或医疗边界的问题直接拒绝，只有明确属于健身领域时才去调用 Gemini。
  // 这样既省请求，也能把高风险问题挡在模型前面。
  if (!text) {
    return { status: 'out_of_scope' }
  }

  if (hasMedicalBoundary(combinedText)) {
    return { status: 'medical_boundary' }
  }

  const topic = detectScopeTopic(text)
  if (topic !== 'general') {
    return { status: 'ok' }
  }

  if (looksLikePlanningFollowUp(text) && hasRecognizedFitnessGoalContext(context)) {
    return { status: 'ok' }
  }

  return { status: 'out_of_scope' }
}

export function buildAssistantRelatedModules(question) {
  return uniqueModules(pickModulesByTopic(detectScopeTopic(question))).slice(0, 4)
}

export function buildFitnessAssistantRequestBody(question, context) {
  const cleanQuestion = normalizeQuestion(question)
  const cleanContext = stringifyContext(context)

  // 这里把“问题 + 上下文 + 严格 JSON 协议”一起发给模型，
  // 目的是尽量减少模型自由发挥，把输出压缩在前端能稳定消费的范围里。
  return {
    systemInstruction: {
      parts: [
        {
          text: FITNESS_SYSTEM_INSTRUCTION,
        },
      ],
    },
    contents: [
      {
        parts: [
          {
            text: [
              `Question: ${cleanQuestion}`,
              cleanContext ? `Context: ${cleanContext}` : 'Context: none',
              'Return only JSON with this shape:',
              '{"status":"ok|out_of_scope|medical_boundary","answerTitle":"","summary":"","actions":[""],"cautions":[""],"relatedModules":[{"label":"","href":""}]}',
              'If the question is unrelated, return status out_of_scope and do not answer the question.',
              'If the question is medical, return status medical_boundary and do not give diagnosis, prescription, or lab-result guidance.',
              'For in-scope questions, keep the response concise, practical, and fitness-oriented.',
            ].join('\n'),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseJsonSchema: buildResponseJsonSchema(),
    },
  }
}

export function normalizeAssistantPayload(payload, options = {}) {
  const question = typeof options === 'string' ? options : options?.question
  const status = normalizeStatus(payload?.status)

  if (status === 'ok' && isValidAssistantResponse(payload)) {
    // 即便模型返回了 status=ok，也要再做一轮本地校验，
    // 防止模型把编程 / 客服之类的站外内容误包装成“看起来合法”的 JSON。
    if (looksClearlyOffDomainAnswer(payload)) {
      return buildSafeRefusalPayload('out_of_scope', question)
    }

    const normalized = {
      status: 'ok',
      answerTitle: cleanText(payload.answerTitle),
      summary: cleanText(payload.summary),
      actions: normalizeStringArray(payload.actions).slice(0, 5),
      cautions: normalizeStringArray(payload.cautions).slice(0, 5),
      relatedModules: normalizeRelatedModules(payload.relatedModules, question),
    }

    return normalized
  }

  if (status === 'medical_boundary' || status === 'out_of_scope') {
    return buildSafeRefusalPayload(status, question)
  }

  return buildSafeRefusalPayload('out_of_scope', question)
}

export const normalizeFitnessAssistantPayload = normalizeAssistantPayload

async function requestGeminiJson(question, context, options = {}) {
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
      body: JSON.stringify(buildFitnessAssistantRequestBody(question, context)),
    })
  } catch {
    // 网络层失败和模型 5xx 都对外统一成稳定文案，避免前端暴露上游细节。
    throw createHttpError(502, 'Gemini upstream unavailable.')
  }

  if (!response.ok) {
    throw createHttpError(502, 'Unable to answer right now.')
  }

  const payload = await response.json()
  return parseJsonPayload(extractCandidateText(payload))
}

async function fetchFitnessAssistantPayload(question, context, options = {}) {
  const classification = classifyAssistantQuestion(question, context)

  if (classification.status === 'out_of_scope' || classification.status === 'medical_boundary') {
    // 本地能判断的边界问题直接返回，不浪费模型请求。
    return buildSafeRefusalPayload(classification.status, question)
  }

  try {
    const rawPayload = await requestGeminiJson(question, context, options)
    return normalizeAssistantPayload(rawPayload, { question })
  } catch (error) {
    throw createHttpError(500, 'Unable to answer right now.')
  }
}

async function readRequestJsonBody(req) {
  if (req && Object.prototype.hasOwnProperty.call(req, 'body')) {
    if (typeof req.body === 'string') {
      const trimmed = req.body.trim()
      if (!trimmed) return {}
      return JSON.parse(trimmed)
    }

    if (req.body && typeof req.body === 'object') {
      return req.body
    }

    return {}
  }

  if (typeof req?.on !== 'function') {
    return {}
  }

  const chunks = []
  await new Promise((resolve, reject) => {
    req.on('data', (chunk) => {
      chunks.push(chunk)
    })
    req.on('end', resolve)
    req.on('error', reject)
  })

  const rawBody = Buffer.concat(chunks).toString('utf8').trim()
  if (!rawBody) return {}
  return JSON.parse(rawBody)
}

export async function handleNodeFitnessAssistantRequest(req, res, options = {}) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }

  if ((req.method || 'GET') === 'HEAD') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end()
  }

  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const body = (req.method || 'GET') === 'POST' ? await readRequestJsonBody(req) : {}
    // POST body 优先级高于 query，便于前端显式传入结构化上下文。
    const question =
      typeof body?.question === 'string' && body.question.trim()
        ? body.question
        : url.searchParams.get('q') || ''
    const context =
      body && typeof body.context !== 'undefined'
        ? body.context
        : url.searchParams.get('context') || ''
    const payload = await fetchFitnessAssistantPayload(question, context, options)

    return sendJson(res, 200, payload)
  } catch (error) {
    return sendJson(res, error?.statusCode || 500, {
      error: 'Unable to answer right now.',
    })
  }
}
