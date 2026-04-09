import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

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

test('fitness workbench still passes the lean-gain shared context fields into the iframe contract', async () => {
  const fitnessView = await readFile(new URL('../../src/views/FitnessView.vue', import.meta.url), 'utf8')
  const futureModules = await readFile(new URL('../../src/components/FutureModules.vue', import.meta.url), 'utf8')

  assert.match(fitnessView, /routePath:\s*['"]\/fitness\/modules\/lean-gain-calorie-logic['"]/)

  for (const field of ['sex', 'age', 'heightCm', 'bodyFatPct', 'bmr', 'tdee', 'weightKg', 'goal', 'weeks', 'targetKg']) {
    assert.match(fitnessView, new RegExp(`${field}\\s*:`))
    assert.match(futureModules, new RegExp(`${field}\\s*:`))
  }
})

test('embedded module state keeps the existing Chinese goal labels for other modules', async () => {
  const hookFile = await readFile(new URL('../../src/hooks/useEmbeddedModuleState.js', import.meta.url), 'utf8')

  assert.match(hookFile, /titleSuffix\s*=\s*computed\(\(\)\s*=>\s*\(state\.goal\s*===\s*'cut'\s*\?\s*'减脂'\s*:\s*'增肌'\)\)/)
})

test('lean-gain module page keeps neutral copy and avoids re-appending a just-saved weekly average', async () => {
  const leanGainView = await readFile(new URL('../../src/views/modules/LeanGainCalorieLogicView.vue', import.meta.url), 'utf8')

  assert.match(leanGainView, /title="Lean-gain calorie logic"/)
  assert.doesNotMatch(leanGainView, /for \$\{titleSuffix\}/)
  assert.doesNotMatch(leanGainView, /{{ state\.goal === 'gain' \? 'Gain' : 'Cut' }}/)
  assert.match(leanGainView, /weeklyAverageWeight\.value = null/)
})
