import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildUpstreamProxyUrl,
  resolveApiExecutionMode,
  resolveRequestTarget,
} from '../../server/httpServer.js'

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

  assert.deepEqual(resolveRequestTarget('/3dgs/scene-metadata.json'), {
    kind: 'asset',
    relativePath: '3dgs/scene-metadata.json',
  })

  assert.deepEqual(resolveRequestTarget('/3dgs/thermal/full_zscore/full_masked.ply'), {
    kind: 'asset',
    relativePath: '3dgs/thermal/full_zscore/full_masked.ply',
  })
})

test('resolveRequestTarget falls back SPA routes to index.html', () => {
  assert.deepEqual(resolveRequestTarget('/'), {
    kind: 'spa',
  })

  assert.deepEqual(resolveRequestTarget('/projects/fitness-coaching'), {
    kind: 'spa',
  })

  assert.deepEqual(resolveRequestTarget('/projects/approval-map-workflow'), {
    kind: 'spa',
  })

  assert.deepEqual(resolveRequestTarget('/fitness/modules/food-library'), {
    kind: 'spa',
  })

  assert.deepEqual(resolveRequestTarget('/fitness/modules/five-two-fasting'), {
    kind: 'spa',
  })

  assert.deepEqual(resolveRequestTarget('/fitness/modules/sixteen-eight-fasting'), {
    kind: 'spa',
  })

  assert.deepEqual(resolveRequestTarget('/fitness/modules/lean-gain-calorie-logic'), {
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

test('resolveApiExecutionMode prefers upstream proxy when configured', () => {
  assert.deepEqual(
    resolveApiExecutionMode({
      upstreamBaseUrl: 'https://personal-web-blue-six.vercel.app',
      apiKind: 'food',
      requestUrl: '/api/fitness/food-search?q=%E9%A6%99%E8%95%89',
    }),
    {
      mode: 'proxy',
      url: 'https://personal-web-blue-six.vercel.app/api/fitness/food-search?q=%E9%A6%99%E8%95%89',
    }
  )
})

test('resolveApiExecutionMode falls back to local execution without upstream', () => {
  assert.deepEqual(
    resolveApiExecutionMode({
      upstreamBaseUrl: '',
      apiKind: 'supplement',
      requestUrl: '/api/fitness/supplement-search?q=%E8%82%8C%E9%85%B8',
    }),
    {
      mode: 'local',
      apiKind: 'supplement',
    }
  )
})

test('buildUpstreamProxyUrl preserves query strings and trims trailing slash', () => {
  assert.equal(
    buildUpstreamProxyUrl('https://personal-web-blue-six.vercel.app/', '/api/fitness/food-search?q=oats'),
    'https://personal-web-blue-six.vercel.app/api/fitness/food-search?q=oats'
  )
})
