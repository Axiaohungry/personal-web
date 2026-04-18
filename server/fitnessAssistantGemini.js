import { sendJson } from './fitnessGemini.js'

const GEMINI_API_ROOT = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'

const FITNESS_MODULES = {
  training: {
    label: 'Fenjue training system',
    href: '/fitness/modules/fenjue-training-system',
  },
  food: {
    label: 'Food library',
    href: '/fitness/modules/food-library',
  },
  supplements: {
    label: 'Supplement library',
    href: '/fitness/modules/supplement-library',
  },
  leanGain: {
    label: 'Lean gain calorie logic',
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
  '药',
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

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return []
  return value.map(cleanText).filter(Boolean)
}

function normalizeRelatedModules(value, question) {
  const modules = Array.isArray(value)
    ? value
        .map((module) => ({
          label: cleanText(module?.label),
          href: cleanText(module?.href),
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
      answerTitle: 'I cannot help with diagnosis or treatment',
      summary:
        'I can help with training, diet, recovery, supplements, and general health habits, but not diagnosis, prescriptions, pharmacy questions, or lab-result interpretation.',
      actions: [
        'Ask a licensed clinician about diagnosis, treatment, or medication decisions.',
        'Use this assistant for training, nutrition, recovery, supplements, or health habits instead.',
      ],
      cautions: [
        'Do not use this assistant as a substitute for medical care.',
        'Seek urgent care immediately for severe or rapidly worsening symptoms.',
      ],
      relatedModules,
    }
  }

  return {
    status: 'out_of_scope',
    answerTitle: topic === 'general' ? 'I can only help with fitness topics' : 'I can only help with fitness guidance',
    summary:
      'I can help with training, diet, recovery, supplements, and general health habits.',
    actions: [
      'Ask about a workout plan, nutrition strategy, recovery routine, supplement choice, or healthy habit.',
      'If you want, narrow the question to a goal such as fat loss, muscle gain, or recovery.',
    ],
    cautions: [
      'I cannot answer unrelated non-fitness topics.',
      'I will refuse medical diagnosis, prescriptions, and lab-result interpretation.',
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
    return { status: 'out_of_scope', topic: 'general' }
  }

  if (hasMedicalBoundary(text)) {
    return { status: 'medical_boundary', topic: detectScopeTopic(text) }
  }

  const topic = detectScopeTopic(text)
  if (topic !== 'general') {
    return { status: 'in_scope', topic }
  }

  return { status: 'out_of_scope', topic }
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

export function normalizeFitnessAssistantPayload(payload, options = {}) {
  const question = typeof options === 'string' ? options : options?.question
  const status = normalizeStatus(payload?.status)

  if (status === 'ok' && isValidAssistantResponse(payload)) {
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

  if (isValidAssistantResponse(payload)) {
    return {
      status: 'ok',
      answerTitle: cleanText(payload.answerTitle),
      summary: cleanText(payload.summary),
      actions: normalizeStringArray(payload.actions).slice(0, 5),
      cautions: normalizeStringArray(payload.cautions).slice(0, 5),
      relatedModules: normalizeRelatedModules(payload.relatedModules, question),
    }
  }

  return buildSafeRefusalPayload('out_of_scope', question)
}

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
    const normalized = normalizeFitnessAssistantPayload(rawPayload, { question })

    if (normalized.status !== 'ok') {
      return buildSafeRefusalPayload(classification.status, question)
    }

    return normalized
  } catch {
    return buildSafeRefusalPayload('out_of_scope', question)
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
  } catch {
    return sendJson(res, 500, {
      status: 'out_of_scope',
      answerTitle: 'Fitness assistant unavailable',
      summary: 'Please try again later.',
      actions: [],
      cautions: [],
      relatedModules: buildAssistantRelatedModules(''),
    })
  }
}
