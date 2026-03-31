import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveSparkAssetFileType } from '../../src/components/projects/project3dgsSparkAsset.js'

test('resolveSparkAssetFileType pins known 3DGS asset extensions explicitly', () => {
  assert.equal(resolveSparkAssetFileType('/3dgs/thermal/full_zscore/full_masked.ply'), 'ply')
  assert.equal(resolveSparkAssetFileType('/3dgs/thermal/full_zscore/full_masked.splat'), 'splat')
  assert.equal(resolveSparkAssetFileType('/3dgs/thermal/full_zscore/full_masked.spz'), 'spz')
  assert.equal(resolveSparkAssetFileType('/3dgs/thermal/full_zscore/full_masked.ksplat'), 'ksplat')
  assert.equal(resolveSparkAssetFileType('/3dgs/thermal/full_zscore/full_masked.bin'), null)
})
