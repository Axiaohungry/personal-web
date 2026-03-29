import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  createThemeStorageApi,
  normalizeThemeMode,
  resolveThemeMode,
} from '../../src/utils/storage.js'

test('theme mode helpers normalize unsupported values and resolve system preference', () => {
  assert.equal(normalizeThemeMode('light'), 'light')
  assert.equal(normalizeThemeMode('dark'), 'dark')
  assert.equal(normalizeThemeMode('unexpected'), 'system')

  assert.equal(resolveThemeMode('light', true), 'light')
  assert.equal(resolveThemeMode('dark', false), 'dark')
  assert.equal(resolveThemeMode('system', true), 'dark')
  assert.equal(resolveThemeMode('system', false), 'light')
})

test('theme storage api persists a sanitized mode and falls back to system', () => {
  const memory = new Map()
  const fakeStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  }

  const api = createThemeStorageApi(fakeStorage)

  assert.equal(api.loadMode(), 'system')

  api.saveMode('dark')
  assert.equal(api.loadMode(), 'dark')

  api.saveMode('invalid-value')
  assert.equal(api.loadMode(), 'system')
})

test('embedded fitness modules define an explicit theme sync contract', async () => {
  const appFile = await readFile(new URL('../../src/App.vue', import.meta.url), 'utf8')
  const futureModulesFile = await readFile(new URL('../../src/components/FutureModules.vue', import.meta.url), 'utf8')

  assert.ok(appFile.includes("'site-theme-context'"))
  assert.ok(appFile.includes("window.addEventListener('storage'"))
  assert.ok(futureModulesFile.includes("type: 'site-theme-context'"))
  assert.ok(futureModulesFile.includes('modules-toolbar__field-row'))
  assert.ok(futureModulesFile.includes('modules-toolbar__hint modules-toolbar__hint--inline'))
})
