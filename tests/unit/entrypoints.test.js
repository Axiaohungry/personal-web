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
})
