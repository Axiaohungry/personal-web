import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

import { buildLeanGainCalorieLogicPlan } from '../../src/utils/leanGainCalorieLogic.js'
import { buildEmbeddedModuleContext, buildEmbeddedModuleQuery } from '../../src/utils/embeddedModuleContext.js'
import { createEmbeddedModuleInitialState } from '../../src/hooks/useEmbeddedModuleState.js'

test('vite entry loads the root main bootstrap', async () => {
  const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8')
  assert.ok(html.includes('<script type="module" src="/src/main.js"></script>'))
})

test('router exposes the lean-gain module as a lazy-loaded dedicated view', async () => {
  const routerFile = await readFile(new URL('../../src/router/index.js', import.meta.url), 'utf8')

  assert.match(
    routerFile,
    /path:\s*'\/fitness\/modules\/lean-gain-calorie-logic'[\s\S]*?component:\s*\(\)\s*=>\s*import\(['"]@\/views\/modules\/LeanGainCalorieLogicView\.vue['"]\)/
  )
  assert.doesNotMatch(routerFile, /\bdefineComponent\s*\(/)
  assert.doesNotMatch(routerFile, /useEmbeddedModuleState/)
})

test('lean-gain module page file exists', async () => {
  await access(new URL('../../src/views/modules/LeanGainCalorieLogicView.vue', import.meta.url))
})

test('embedded module serialization preserves the shared context contract and missing body-fat state', async () => {
  const fitnessView = await readFile(new URL('../../src/views/FitnessView.vue', import.meta.url), 'utf8')

  assert.match(fitnessView, /routePath:\s*['"]\/fitness\/modules\/lean-gain-calorie-logic['"]/)

  const sharedContext = buildEmbeddedModuleContext({
    context: {
      sex: 'female',
      age: 31,
      heightCm: 168,
      bodyFatPct: undefined,
      bmr: 1425,
      tdee: 2080,
      weightKg: 58.2,
      currentCalories: 2210,
    },
    goal: 'gain',
    weeks: 10,
    targetKg: 2.5,
  })

  assert.equal(sharedContext.goal, 'gain')
  assert.equal(sharedContext.weeks, 10)
  assert.equal(sharedContext.targetKg, 2.5)
  assert.equal(sharedContext.currentCalories, 2210)

  const query = buildEmbeddedModuleQuery({
    context: sharedContext,
    goal: 'gain',
    weeks: 10,
    targetKg: 2.5,
  })

  assert.equal(query.get('sex'), 'female')
  assert.equal(query.get('age'), '31')
  assert.equal(query.get('heightCm'), '168')
  assert.equal(query.get('bodyFatPct'), '')
  assert.equal(query.get('bmr'), '1425')
  assert.equal(query.get('tdee'), '2080')
  assert.equal(query.get('weightKg'), '58.2')
  assert.equal(query.get('goal'), 'gain')
  assert.equal(query.get('weeks'), '10')
  assert.equal(query.get('targetKg'), '2.5')
  assert.equal(query.get('currentCalories'), '2210')
})

test('embedded module serialization preserves an explicit zero body-fat value', () => {
  const query = buildEmbeddedModuleQuery({
    context: {
      bodyFatPct: 0,
      tdee: 2100,
      currentCalories: 2100,
    },
  })

  assert.equal(query.get('bodyFatPct'), '0')
  assert.equal(query.get('currentCalories'), '2100')
})

test('embedded module state keeps the existing Chinese goal labels for other modules', async () => {
  const hookFile = await readFile(new URL('../../src/hooks/useEmbeddedModuleState.js', import.meta.url), 'utf8')

  assert.match(hookFile, /const titleSuffix = computed\(\(\) =>/)
  assert.doesNotMatch(hookFile, /cutting/)
  assert.doesNotMatch(hookFile, /lean gain/)
})

test('lean-gain module page keeps neutral copy and avoids re-appending a just-saved weekly average', async () => {
  const leanGainView = await readFile(new URL('../../src/views/modules/LeanGainCalorieLogicView.vue', import.meta.url), 'utf8')

  assert.match(leanGainView, /title="精益增肌热量决策"/)
  assert.doesNotMatch(leanGainView, /for \$\{titleSuffix\}/)
  assert.doesNotMatch(leanGainView, /{{ state\.goal === 'gain' \? 'Gain' : 'Cut' }}/)
  assert.match(leanGainView, /weeklyAverageWeight\.value = null/)
})

test('empty embedded context defaults keep lean-gain in reminder state instead of producing actionable guidance', () => {
  const initialState = createEmbeddedModuleInitialState()
  const plan = buildLeanGainCalorieLogicPlan(initialState)

  assert.equal(initialState.bodyFatPct, null)
  assert.equal(initialState.bmr, null)
  assert.equal(initialState.currentCalories, null)
  assert.equal(plan.gateState, 'reminder')
  assert.equal(plan.phase, null)
  assert.equal(plan.targetCalories, undefined)
})
