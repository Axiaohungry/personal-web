import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveRequestTarget } from '../../server/httpServer.js'

test('resolveRequestTarget routes fitness API endpoints explicitly', () => {
  assert.deepEqual(resolveRequestTarget('/api/fitness/food-search'), {
    kind: 'api',
    apiKind: 'food',
  })

  assert.deepEqual(resolveRequestTarget('/api/fitness/supplement-search'), {
    kind: 'api',
    apiKind: 'supplement',
  })
})

test('resolveRequestTarget serves static assets by relative dist path', () => {
  assert.deepEqual(resolveRequestTarget('/assets/index.js'), {
    kind: 'asset',
    relativePath: 'assets/index.js',
  })
})

test('resolveRequestTarget falls back SPA routes to index.html', () => {
  assert.deepEqual(resolveRequestTarget('/'), {
    kind: 'spa',
  })

  assert.deepEqual(resolveRequestTarget('/fitness/modules/food-library'), {
    kind: 'spa',
  })
})

test('resolveRequestTarget rejects path traversal attempts', () => {
  assert.deepEqual(resolveRequestTarget('/../../etc/passwd'), {
    kind: 'invalid',
  })

  assert.deepEqual(resolveRequestTarget('/assets/%2e%2e/%2e%2e/secret.txt'), {
    kind: 'invalid',
  })
})
