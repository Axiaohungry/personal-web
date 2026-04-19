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

test('normalizeFitnessAssistantPayload falls back to Chinese-first refusal copy for malformed payloads', async () => {
  const { normalizeFitnessAssistantPayload } = await import('../../server/fitnessAssistantGemini.js')

  const normalized = normalizeFitnessAssistantPayload({
    status: 'ok',
    summary: 'Missing the rest of the response contract.',
  })

  assert.equal(normalized.status, 'out_of_scope')
  assert.equal(normalized.answerTitle, '我只能回答健身相关问题')
  assert.equal(normalized.summary, '我可以回答训练、饮食、恢复、补剂和健康习惯。')
  assert.deepEqual(normalized.relatedModules[0], {
    label: '谭成义焚诀训练体系',
    href: '/fitness/modules/fenjue-training-system',
  })
})
