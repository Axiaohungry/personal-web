import test from 'node:test'
import assert from 'node:assert/strict'

test('classifyAssistantQuestion rejects unrelated prompts and medical prompts', async () => {
  const { classifyAssistantQuestion } = await import('../../server/fitnessAssistantGemini.js')

  assert.equal(classifyAssistantQuestion('How do I fix a printer jam?').status, 'out_of_scope')
  assert.equal(
    classifyAssistantQuestion('Should I take antibiotics for my fever?').status,
    'medical_boundary'
  )
  assert.deepEqual(classifyAssistantQuestion('How do I start a beginner lifting plan?'), {
    status: 'ok',
  })
})

test('normalizeFitnessAssistantPayload keeps the assistant answer contract stable', async () => {
  const { normalizeFitnessAssistantPayload } = await import('../../server/fitnessAssistantGemini.js')

  const normalized = normalizeFitnessAssistantPayload({
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

  assert.deepEqual(normalized, {
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
  })
})

test('normalizeFitnessAssistantPayload returns null for malformed assistant payloads', async () => {
  const { normalizeFitnessAssistantPayload } = await import('../../server/fitnessAssistantGemini.js')

  const normalized = normalizeFitnessAssistantPayload({
    status: 'ok',
    summary: 'Missing the rest of the response contract.',
  })

  assert.equal(normalized, null)
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
