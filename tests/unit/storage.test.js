import test from 'node:test'
import assert from 'node:assert/strict'

import { createStorageApi } from '../../src/utils/storage.js'
import { createLeanGainLogicStorageApi } from '../../src/utils/leanGainLogicStorage.js'
import * as storage from '../../src/utils/storage.js'

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

test('lean-gain storage api isolates dedicated keys from the generic fitness store', () => {
  const memory = new Map()
  const fakeStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  }

  const api = createLeanGainLogicStorageApi(fakeStorage)

  api.savePrefs({ expLevel: 'Novice', lastWeeklyAverageWeight: 71.2 })
  memory.set('fitness.latest', JSON.stringify({ weightKg: 71 }))
  memory.set('fitness.history', JSON.stringify([{ weightKg: 70 }]))

  assert.deepEqual(api.loadPrefs(), {
    expLevel: 'Novice',
    lastWeeklyAverageWeight: 71.2,
  })
  assert.deepEqual(api.loadHistory(), [])
  assert.deepEqual(JSON.parse(memory.get('fitness.latest')), { weightKg: 71 })
  assert.deepEqual(JSON.parse(memory.get('fitness.history')), [{ weightKg: 70 }])
  assert.equal(memory.has('leanGainLogicPrefs'), true)
})

test('lean-gain storage api saves prefs separately and trims history when a limit is provided', () => {
  const memory = new Map()
  const fakeStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  }

  const api = createLeanGainLogicStorageApi(fakeStorage)

  api.savePrefs({ expLevel: 'Novice', lastWeeklyAverageWeight: 71.2 })
  api.pushHistory({ savedAt: '1', weeklyAverageWeight: 70.1, phase: 2 }, 3)
  api.pushHistory({ savedAt: '2', weeklyAverageWeight: 70.3, phase: 2 }, 3)
  api.pushHistory({ savedAt: '3', weeklyAverageWeight: 70.5, phase: 2 }, 3)
  api.pushHistory({ savedAt: '4', weeklyAverageWeight: 70.7, phase: 3 }, 3)
  api.pushHistory({ savedAt: '5', weeklyAverageWeight: 70.9, phase: 3 }, 3)
  api.pushHistory({ savedAt: '6', weeklyAverageWeight: 71.1, phase: 4 }, 3)

  assert.deepEqual(api.loadPrefs(), {
    expLevel: 'Novice',
    lastWeeklyAverageWeight: 71.2,
  })
  assert.deepEqual(api.loadHistory(), [
    { savedAt: '6', weeklyAverageWeight: 71.1, phase: 4 },
    { savedAt: '5', weeklyAverageWeight: 70.9, phase: 3 },
    { savedAt: '4', weeklyAverageWeight: 70.7, phase: 3 },
  ])
})
