import test from 'node:test'
import assert from 'node:assert/strict'

test('createRemoteLookup maps successful responses into keyed table rows', async () => {
  const { createRemoteLookup } = await import('../../src/hooks/useRemoteLookup.js')
  const lookup = createRemoteLookup({
    endpoint: '/api/fitness/food-search',
    keyPrefix: 'food-result',
    fetchImpl: async (url) => {
      assert.equal(url, '/api/fitness/food-search?q=%E9%A6%99%E8%95%89')

      return {
        ok: true,
        async json() {
          return {
            items: [
              { name: '香蕉', calories: 89 },
              { name: '燕麦', calories: 389 },
            ],
          }
        },
      }
    },
  })

  lookup.searchKeyword.value = '香蕉'
  await lookup.handleSearch()

  assert.equal(lookup.loading.value, false)
  assert.equal(lookup.remoteError.value, '')
  assert.deepEqual(
    lookup.remoteRows.value,
    [
      { key: 'food-result-0', name: '香蕉', calories: 89 },
      { key: 'food-result-1', name: '燕麦', calories: 389 },
    ]
  )
})

test('createRemoteLookup surfaces response errors and clears stale rows', async () => {
  const { createRemoteLookup } = await import('../../src/hooks/useRemoteLookup.js')
  const lookup = createRemoteLookup({
    endpoint: '/api/fitness/supplement-search',
    keyPrefix: 'supplement-result',
    fetchImpl: async () => ({
      ok: false,
      status: 502,
      async json() {
        return { error: '上游接口异常' }
      },
    }),
  })

  lookup.remoteRows.value = [{ key: 'supplement-result-0', name: '肌酸' }]
  lookup.searchKeyword.value = '肌酸'
  await lookup.handleSearch()

  assert.equal(lookup.loading.value, false)
  assert.deepEqual(lookup.remoteRows.value, [])
  assert.equal(lookup.remoteError.value, '上游接口异常')
})

test('createRemoteLookup ignores blank search keywords', async () => {
  const { createRemoteLookup } = await import('../../src/hooks/useRemoteLookup.js')
  let called = false
  const lookup = createRemoteLookup({
    endpoint: '/api/fitness/food-search',
    keyPrefix: 'food-result',
    fetchImpl: async () => {
      called = true
      throw new Error('should not be called')
    },
  })

  lookup.searchKeyword.value = '   '
  await lookup.handleSearch()

  assert.equal(called, false)
  assert.equal(lookup.loading.value, false)
  assert.deepEqual(lookup.remoteRows.value, [])
  assert.equal(lookup.remoteError.value, '')
})
