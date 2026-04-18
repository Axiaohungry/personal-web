import test from 'node:test'
import assert from 'node:assert/strict'

test('classifyAssistantQuestion rejects unrelated prompts and medical prompts', async () => {
  const { classifyAssistantQuestion } = await import('../../server/fitnessAssistantGemini.js')

  assert.equal(classifyAssistantQuestion('How do I fix a printer jam?').status, 'out_of_scope')
  assert.equal(
    classifyAssistantQuestion('Should I take antibiotics for my fever?').status,
    'medical_boundary'
  )
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
        label: 'Lean gain calorie logic',
        href: '/fitness/modules/lean-gain-calorie-logic',
      },
      {
        label: 'Food library',
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
        label: 'Lean gain calorie logic',
        href: '/fitness/modules/lean-gain-calorie-logic',
      },
      {
        label: 'Food library',
        href: '/fitness/modules/food-library',
      },
    ],
  })
})
