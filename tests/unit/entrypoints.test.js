import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('vite entry loads the root main bootstrap', async () => {
  const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8')
  assert.ok(html.includes('<script type="module" src="/src/main.js"></script>'))
})

test('router defines both home and fitness views', async () => {
  const routerFile = await readFile(new URL('../../src/router/index.js', import.meta.url), 'utf8')
  assert.ok(routerFile.includes("path: '/'"))
  assert.ok(routerFile.includes("path: '/fitness'"))
  assert.ok(routerFile.includes("path: '/fitness/modules/five-two-fasting'"))
  assert.ok(routerFile.includes("path: '/fitness/modules/sixteen-eight-fasting'"))
  assert.ok(routerFile.includes("path: '/fitness/modules/lean-gain-calorie-logic'"))
})

test('fitness view exposes the lean gain module entry and shared context fields', async () => {
  const fitnessView = await readFile(new URL('../../src/views/FitnessView.vue', import.meta.url), 'utf8')
  const futureModules = await readFile(new URL('../../src/components/FutureModules.vue', import.meta.url), 'utf8')

  assert.ok(fitnessView.includes('增肌底层热量逻辑'))
  assert.ok(fitnessView.includes("routePath: '/fitness/modules/lean-gain-calorie-logic'"))
  assert.ok(fitnessView.includes('age: form.age'))
  assert.ok(fitnessView.includes('heightCm: form.heightCm'))
  assert.ok(fitnessView.includes('bodyFatPct: form.bodyFatPct'))
  assert.ok(fitnessView.includes('bmr: calculation.value.bmr'))

  assert.ok(futureModules.includes('age: String(props.context.age ?? 24)'))
  assert.ok(futureModules.includes('heightCm: String(props.context.heightCm ?? 175)'))
  assert.ok(futureModules.includes('bodyFatPct: String(props.context.bodyFatPct ?? 15)'))
  assert.ok(futureModules.includes('bmr: String(props.context.bmr ?? 1700)'))
})
