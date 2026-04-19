import { sendJson } from './fitnessGemini.js'

const GEMINI_API_ROOT = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'

const FITNESS_MODULES = {
  training: {
    label: '谭成义焚诀训练体系',
    href: '/fitness/modules/fenjue-training-system',
  },
  food: {
    label: '食物库',
    href: '/fitness/modules/food-library',
  },
  supplements: {
    label: '补剂库',
    href: '/fitness/modules/supplement-library',
  },
  leanGain: {
    label: '增肌底层热量逻辑',
    href: '/fitness/modules/lean-gain-calorie-logic',
  },
}

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
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function pickModulesByTopic(topic) {
  switch (topic) {
    case 'training':
      return [
        FITNESS_MODULES.training,
        FITNESS_MODULES.leanGain,
        FITNESS_MODULES.food,
        FITNESS_MODULES.supplements,
      ]
    case 'diet':
      return [
        FITNESS_MODULES.leanGain,
        FITNESS_MODULES.food,
        FITNESS_MODULES.supplements,
        FITNESS_MODULES.training,
      ]
    case 'recovery':
      return [
        FITNESS_MODULES.training,
        FITNESS_MODULES.supplements,
        FITNESS_MODULES.food,
        FITNESS_MODULES.leanGain,
      ]
    case 'supplements':
      return [
        FITNESS_MODULES.supplements,
        FITNESS_MODULES.food,
        FITNESS_MODULES.leanGain,
        FITNESS_MODULES.training,
      ]
    case 'habits':
      return [
        FITNESS_MODULES.training,
        FITNESS_MODULES.food,
        FITNESS_MODULES.leanGain,
        FITNESS_MODULES.supplements,
      ]
    default:
      return [
        FITNESS_MODULES.training,
        FITNESS_MODULES.food,
        FITNESS_MODULES.leanGain,
        FITNESS_MODULES.supplements,
      ]
  }
}

function canonicalModuleLabelForHref(href) {
  const normalizedHref = cleanText(href)

  switch (normalizedHref) {
    case '/fitness/modules/fenjue-training-system':
      return FITNESS_MODULES.training.label
    case '/fitness/modules/food-library':
      return FITNESS_MODULES.food.label
    case '/fitness/modules/supplement-library':
      return FITNESS_MODULES.supplements.label
    case '/fitness/modules/lean-gain-calorie-logic':
      return FITNESS_MODULES.leanGain.label
    default:
      return ''
  }
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
    'office',
    'workflow',
    'calendar',
    'inbox',
    'email',
    'meeting',
    'spreadsheet',
    'presentation',
    'document',
    'project management',
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
    'customer support',
    'sales',
    'marketing',
    '财务',
    '办公',
    '排期',
    '邮件',
    '代码',
    '编程',
    '数据库',
    '项目管理',
    '表格',
    '演示',
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
  return uniqueModules(modules.length ? modules : fallback).slice(0, 4)
}

function buildSafeRefusalPayload(status, question) {
  const topic = detectScopeTopic(question)
  const relatedModules = buildAssistantRelatedModules(question)

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

export function classifyAssistantQuestion(question) {
  const text = normalizeQuestion(question)

  if (!text) {
    return { status: 'out_of_scope' }
  }

  if (hasMedicalBoundary(text)) {
    return { status: 'medical_boundary' }
  }

  const topic = detectScopeTopic(text)
  if (topic !== 'general') {
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
    throw createHttpError(502, 'Gemini upstream unavailable.')
  }

  if (!response.ok) {
    throw createHttpError(502, 'Unable to answer right now.')
  }

  const payload = await response.json()
  return parseJsonPayload(extractCandidateText(payload))
}

async function fetchFitnessAssistantPayload(question, context, options = {}) {
  const classification = classifyAssistantQuestion(question)

  if (classification.status === 'out_of_scope' || classification.status === 'medical_boundary') {
    return buildSafeRefusalPayload(classification.status, question)
  }

  try {
    const rawPayload = await requestGeminiJson(question, context, options)
    return normalizeAssistantPayload(rawPayload, { question })
  } catch (error) {
    throw createHttpError(500, 'Unable to answer right now.')
  }
}

export async function handleNodeFitnessAssistantRequest(req, res, options = {}) {
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
    const question = url.searchParams.get('q') || ''
    const context = url.searchParams.get('context') || ''
    const payload = await fetchFitnessAssistantPayload(question, context, options)

    return sendJson(res, 200, payload)
  } catch (error) {
    return sendJson(res, error?.statusCode || 500, {
      error: 'Unable to answer right now.',
    })
  }
}
