import test from 'node:test'
import assert from 'node:assert/strict'

test('classifyFitnessAssistantPrompt rejects unrelated prompts and medical prompts', async () => {
  const { classifyFitnessAssistantPrompt } = await import('../../server/fitnessAssistantGemini.js')

  assert.equal(classifyFitnessAssistantPrompt('How do I fix a printer jam?').status, 'out_of_scope')
  assert.equal(
    classifyFitnessAssistantPrompt('Should I take antibiotics for my fever?').status,
    'medical_boundary'
  )
})

test('normalizeFitnessAssistantPayload keeps the assistant answer contract stable', async () => {
  const { normalizeFitnessAssistantPayload } = await import('../../server/fitnessAssistantGemini.js')

  const normalized = normalizeFitnessAssistantPayload({
    status: 'ready',
    answerTitle: 'Start with a simple weekly plan',
    summary: 'Use a consistent target and review symptoms before increasing load.',
    actions: ['Pick one training schedule.', 'Track meals and recovery.'],
    cautions: ['Do not treat this as medical advice.'],
    relatedModules: [
      {
        title: 'Lean gain calorie logic',
        href: '/fitness/modules/lean-gain-calorie-logic',
      },
      {
        title: 'Food library',
        href: '/fitness/modules/food-library',
      },
    ],
    internalNotes: 'drop this field',
  })

  assert.deepEqual(normalized, {
    status: 'ready',
    answerTitle: 'Start with a simple weekly plan',
    summary: 'Use a consistent target and review symptoms before increasing load.',
    actions: ['Pick one training schedule.', 'Track meals and recovery.'],
    cautions: ['Do not treat this as medical advice.'],
    relatedModules: [
      {
        title: 'Lean gain calorie logic',
        href: '/fitness/modules/lean-gain-calorie-logic',
      },
      {
        title: 'Food library',
        href: '/fitness/modules/food-library',
      },
    ],
  })
})
