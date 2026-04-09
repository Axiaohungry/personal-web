import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractObjectLiteral(source, marker) {
  const index = source.indexOf(marker)
  assert.notEqual(index, -1, `Expected to find marker: ${marker}`)

  const start = source.indexOf('{', index)
  assert.notEqual(start, -1, `Expected an object literal after marker: ${marker}`)

  let depth = 0

  for (let pointer = start; pointer < source.length; pointer += 1) {
    const character = source[pointer]

    if (character === '{') {
      depth += 1
    } else if (character === '}') {
      depth -= 1

      if (depth === 0) {
        return source.slice(start, pointer + 1)
      }
    }
  }

  throw new Error(`Unclosed object literal after marker: ${marker}`)
}

function extractTopLevelKeys(objectLiteral) {
  return [...objectLiteral.matchAll(/^\s*([A-Za-z0-9_$]+)\s*:/gm)].map((match) => match[1])
}

test('vite entry loads the root main bootstrap', async () => {
  const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8')
  assert.ok(html.includes('<script type="module" src="/src/main.js"></script>'))
})

test('router exposes the lean-gain module as a lazy-loaded view without inline route components', async () => {
  const routerFile = await readFile(new URL('../../src/router/index.js', import.meta.url), 'utf8')

  assert.ok(routerFile.includes("path: '/'"))
  assert.ok(routerFile.includes("path: '/fitness'"))
  assert.ok(routerFile.includes("path: '/fitness/modules/five-two-fasting'"))
  assert.ok(routerFile.includes("path: '/fitness/modules/sixteen-eight-fasting'"))

  assert.match(
    routerFile,
    /path:\s*'\/fitness\/modules\/lean-gain-calorie-logic'[\s\S]*?component:\s*\(\)\s*=>\s*import\(['"]@\/views\/modules\/LeanGainCalorieLogicView\.vue['"]\)/
  )
  assert.doesNotMatch(routerFile, /\bdefineComponent\s*\(/)
  assert.doesNotMatch(routerFile, /useEmbeddedModuleState/)
})

test('lean-gain module page has a dedicated view file', async () => {
  await access(new URL('../../src/views/modules/LeanGainCalorieLogicView.vue', import.meta.url))
})

test('fitness workbench passes the lean-gain route and shared planning context contract', async () => {
  const fitnessView = await readFile(new URL('../../src/views/FitnessView.vue', import.meta.url), 'utf8')
  const futureModules = await readFile(new URL('../../src/components/FutureModules.vue', import.meta.url), 'utf8')
  const requiredContextKeys = [
    'sex',
    'age',
    'heightCm',
    'bodyFatPct',
    'bmr',
    'tdee',
    'weightKg',
    'goal',
    'weeks',
    'targetKg',
  ]

  assert.match(
    fitnessView,
    new RegExp(`routePath:\\s*['"]${escapeRegExp('/fitness/modules/lean-gain-calorie-logic')}['"]`)
  )

  const moduleContextLiteral = extractObjectLiteral(fitnessView, 'const moduleContext = computed(() =>')
  const moduleContextKeys = extractTopLevelKeys(moduleContextLiteral)

  assert.deepEqual(
    requiredContextKeys.filter((key) => !moduleContextKeys.includes(key)),
    [],
    'FitnessView module context is missing required lean-gain fields'
  )

  const queryLiteral = extractObjectLiteral(futureModules, 'const search = new URLSearchParams(')
  const queryKeys = extractTopLevelKeys(queryLiteral)

  assert.deepEqual(
    requiredContextKeys.filter((key) => !queryKeys.includes(key)),
    [],
    'FutureModules iframe query params are missing required shared fields'
  )
})
