import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'

test('classifyAssistantQuestion rejects unrelated prompts and medical prompts', async () => {
  const { classifyAssistantQuestion } = await import('../../server/fitnessAssistantGemini.js')
  const planningPrompt = '\u628a\u5f53\u524d\u76ee\u6807\u538b\u6210\u6267\u884c\u6b65\u9aa4'

  assert.equal(classifyAssistantQuestion('How do I fix a printer jam?').status, 'out_of_scope')
  assert.equal(
    classifyAssistantQuestion('Should I take antibiotics for my fever?').status,
    'medical_boundary'
  )
  assert.deepEqual(classifyAssistantQuestion('How do I start a beginner lifting plan?'), {
    status: 'ok',
  })
  assert.deepEqual(
    classifyAssistantQuestion(planningPrompt, {
      goal: 'cut',
      weeks: 8,
      targetKg: 3,
    }),
    {
      status: 'ok',
    }
  )
  assert.deepEqual(
    classifyAssistantQuestion(planningPrompt, {
      goal: 'gain',
      weeks: 12,
      targetKg: 4,
    }),
    {
      status: 'ok',
    }
  )
})

test('normalizeAssistantPayload keeps the assistant answer contract stable', async () => {
  const { normalizeAssistantPayload } = await import('../../server/fitnessAssistantGemini.js')

  const normalized = normalizeAssistantPayload({
    status: 'ok',
    answerTitle: 'Start with a simple weekly plan',
    summary: 'Use a consistent target and review symptoms before increasing load.',
    actions: ['Pick one training schedule.', 'Track meals and recovery.'],
    cautions: ['Do not treat this as medical advice.'],
    relatedModules: [
      {
        label: '增肌底层热量逻辑',
        href: '/fitness/modules/lean-gain-calorie-logic',
      },
      {
        label: '食物库',
        href: '/fitness/modules/food-library',
      },
    ],
    internalNotes: 'drop this field',
  })

  assert.equal(normalized.status, 'ok')
  assert.equal(normalized.answerTitle, 'Start with a simple weekly plan')
  assert.equal(normalized.summary, 'Use a consistent target and review symptoms before increasing load.')
  assert.deepEqual(normalized.actions, ['Pick one training schedule.', 'Track meals and recovery.'])
  assert.deepEqual(normalized.cautions, ['Do not treat this as medical advice.'])
  assert.ok(Array.isArray(normalized.relatedModules))
  assert.equal(normalized.relatedModules.length, 2)
  assert.deepEqual(
    normalized.relatedModules.map((module) => module.href),
    ['/fitness/modules/lean-gain-calorie-logic', '/fitness/modules/food-library']
  )

  const canonicalLabelsByHref = {
    '/fitness/modules/lean-gain-calorie-logic': '增肌底层热量逻辑',
    '/fitness/modules/food-library': '食物库',
  }

  for (const module of normalized.relatedModules) {
    assert.equal(module.label, canonicalLabelsByHref[module.href])
  }
})

test('normalizeAssistantPayload returns a refusal shape for malformed assistant payloads', async () => {
  const { normalizeAssistantPayload } = await import('../../server/fitnessAssistantGemini.js')

  const normalized = normalizeAssistantPayload({
    status: 'ok',
    summary: 'Missing the rest of the response contract.',
  })

  assert.equal(normalized.status, 'out_of_scope')
  assert.equal(typeof normalized.answerTitle, 'string')
  assert.ok(normalized.answerTitle.length > 0)
  assert.ok(Array.isArray(normalized.actions))
  assert.ok(Array.isArray(normalized.cautions))
  assert.ok(Array.isArray(normalized.relatedModules))
})

test('normalizeAssistantPayload rejects invalid model statuses without fabricating ok', async () => {
  const { normalizeAssistantPayload } = await import('../../server/fitnessAssistantGemini.js')

  const normalized = normalizeAssistantPayload({
    status: 'maybe',
    answerTitle: 'Looks valid at a glance',
    summary: 'But the status is not approved.',
    actions: ['Do one thing.'],
    cautions: ['Do another thing.'],
    relatedModules: [],
  })

  assert.equal(normalized.status, 'out_of_scope')
  assert.notEqual(normalized.status, 'ok')
})

test('normalizeAssistantPayload refuses off-domain ok payloads even for fitness questions', async () => {
  const { normalizeAssistantPayload } = await import('../../server/fitnessAssistantGemini.js')

  const normalized = normalizeAssistantPayload(
    {
      status: 'ok',
      answerTitle: 'Build a small Node API',
      summary: 'Use Express, connect to a database, and keep your routes organized.',
      actions: ['Create a repository.', 'Add SQL migrations.'],
      cautions: ['Avoid shipping secrets in code.'],
      relatedModules: [
        {
          label: 'Random notes',
          href: '/fitness/modules/food-library',
        },
      ],
    },
    { question: 'How do I build a beginner lifting plan?' }
  )

  assert.equal(normalized.status, 'out_of_scope')
  assert.notEqual(normalized.status, 'ok')
})

test('handleNodeFitnessAssistantRequest returns a stable error for Gemini failures', async () => {
  const { handleNodeFitnessAssistantRequest } = await import('../../server/fitnessAssistantGemini.js')

  const response = {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value
    },
    end(payload = '') {
      this.body = payload
      return this
    },
  }

  await handleNodeFitnessAssistantRequest(
    {
      method: 'GET',
      url: '/fitness/assistant?q=How%20do%20I%20set%20up%20a%20beginner%20lifting%20plan%3F',
    },
    response,
    {
      apiKey: 'test-key',
      fetchImpl: async () => {
        throw new Error('network down')
      },
    }
  )

  const payload = JSON.parse(response.body)
  assert.deepEqual(payload, { error: 'Unable to answer right now.' })
  assert.equal(response.statusCode, 500)
  assert.equal(response.headers['Content-Type'], 'application/json; charset=utf-8')
})

test('handleNodeFitnessAssistantRequest accepts POST JSON bodies and prefers body question data', async () => {
  const { handleNodeFitnessAssistantRequest } = await import('../../server/fitnessAssistantGemini.js')

  const response = {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value
    },
    end(payload = '') {
      this.body = payload
      return this
    },
  }

  await handleNodeFitnessAssistantRequest(
    {
      method: 'POST',
      url: '/fitness/assistant?q=How%20do%20I%20start%20a%20beginner%20lifting%20plan%3F',
      body: JSON.stringify({
        question: 'How do I fix a printer jam?',
        context: {
          goal: 'cut',
          weeks: 8,
          targetKg: 3,
          tdee: 2100,
        },
      }),
    },
    response,
    {
      apiKey: 'test-key',
      fetchImpl: async () => {
        throw new Error('should not reach Gemini for out-of-scope prompts')
      },
    }
  )

  const payload = JSON.parse(response.body)
  assert.equal(response.statusCode, 200)
  assert.equal(response.headers['Content-Type'], 'application/json; charset=utf-8')
  assert.equal(payload.status, 'out_of_scope')
  assert.ok(payload.summary.length > 0)
})

test('handleNodeFitnessAssistantRequest reads POST JSON from a stream when req.body is absent', async () => {
  const { handleNodeFitnessAssistantRequest } = await import('../../server/fitnessAssistantGemini.js')

  const response = {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value
    },
    end(payload = '') {
      this.body = payload
      return this
    },
  }

  const request = new EventEmitter()
  request.method = 'POST'
  request.url = '/fitness/assistant'

  const promise = handleNodeFitnessAssistantRequest(request, response, {
    apiKey: 'test-key',
    fetchImpl: async () => {
      throw new Error('should not reach Gemini for out-of-scope prompts')
    },
  })

  process.nextTick(() => {
    request.emit(
      'data',
      Buffer.from(
        JSON.stringify({
          question: 'How do I fix a printer jam?',
          context: {
            goal: 'cut',
            weeks: 8,
            targetKg: 3,
            tdee: 2100,
          },
        })
      )
    )
    request.emit('end')
  })

  await promise

  const payload = JSON.parse(response.body)
  assert.equal(response.statusCode, 200)
  assert.equal(payload.status, 'out_of_scope')
  assert.ok(payload.summary.length > 0)
})
