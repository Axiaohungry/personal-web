import test from 'node:test'
import assert from 'node:assert/strict'

import { navigationItems } from '../../src/data/navigation.js'

test('shared navigation exposes the required href contract', () => {
  assert.deepEqual(
    navigationItems.map((item) => item.href),
    ['/', '/#experience', '/#projects', '/#skills', '/fitness/', '/#contact']
  )
})
