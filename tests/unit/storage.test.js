import test from 'node:test'
import assert from 'node:assert/strict'

import { createStorageApi } from '../../src/utils/storage.js'

test('storage api saves latest form data and keeps only recent history', () => {
  const memory = new Map()
  const fakeStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  }

  const api = createStorageApi(fakeStorage)
  api.saveLatest({ weightKg: 80 })
  api.pushHistory({ tdee: 2501 }, 2)
  api.pushHistory({ tdee: 2450 }, 2)
  api.pushHistory({ tdee: 2400 }, 2)

  assert.deepEqual(api.loadLatest(), { weightKg: 80 })
  assert.deepEqual(api.loadHistory(), [{ tdee: 2400 }, { tdee: 2450 }])
})
