import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  decodeBakedJetKeyToGrayByte,
  encodeGrayByteToJetKey,
  getJetRgbAtByte,
  remapPackedThermalArray,
  remapPackedThermalWordToGrayscale,
} from '../../src/components/projects/project3dgsThermalColormap.js'

test('OpenCV JET lookup keeps exact anchor colors and round-trips its own palette', () => {
  assert.deepEqual(getJetRgbAtByte(0), [0, 0, 128])
  assert.deepEqual(getJetRgbAtByte(64), [0, 128, 255])
  assert.deepEqual(getJetRgbAtByte(128), [130, 255, 126])
  assert.deepEqual(getJetRgbAtByte(192), [255, 124, 0])
  assert.deepEqual(getJetRgbAtByte(255), [128, 0, 0])

  for (let grayByte = 0; grayByte <= 255; grayByte += 1) {
    assert.equal(decodeBakedJetKeyToGrayByte(encodeGrayByteToJetKey(grayByte)), grayByte)
  }
})

test('thermal packed splat remap preserves alpha while collapsing baked JET into grayscale', () => {
  const grayByte = 128
  const alphaByte = 0xab
  const thermalWord = (alphaByte << 24) | encodeGrayByteToJetKey(grayByte)
  const grayscaleWord = remapPackedThermalWordToGrayscale(thermalWord)

  const grayR = grayscaleWord & 0xff
  const grayG = (grayscaleWord >>> 8) & 0xff
  const grayB = (grayscaleWord >>> 16) & 0xff
  const alpha = (grayscaleWord >>> 24) & 0xff

  assert.equal(alpha, alphaByte)
  assert.equal(grayR, grayByte)
  assert.equal(grayG, grayByte)
  assert.equal(grayB, grayByte)
})

test('thermal packed splat array remap updates every splat word in place', () => {
  const packedArray = new Uint32Array([
    (0xaa << 24) | encodeGrayByteToJetKey(32),
    1,
    2,
    3,
    (0xbb << 24) | encodeGrayByteToJetKey(192),
    4,
    5,
    6,
  ])

  assert.equal(remapPackedThermalArray(packedArray, 2), true)

  assert.equal((packedArray[0] >>> 24) & 0xff, 0xaa)
  assert.equal(packedArray[0] & 0xff, 32)
  assert.equal((packedArray[4] >>> 24) & 0xff, 0xbb)
  assert.equal(packedArray[4] & 0xff, 192)
  assert.equal(packedArray[1], 1)
  assert.equal(packedArray[5], 4)
})

test('3dgs page passes the selected render mode into the viewer thermal pipeline', async () => {
  const pageFile = await readFile(
    new URL('../../src/views/projects/Project3dgsView.vue', import.meta.url),
    'utf8'
  )
  const viewerFile = await readFile(
    new URL('../../src/components/projects/Project3dgsViewer.vue', import.meta.url),
    'utf8'
  )

  assert.match(pageFile, /:mode="selectedMode"/)
  assert.match(pageFile, /:thermal-display-mode="selectedThermalDisplayMode"/)
  assert.match(pageFile, /const thermalDisplayModeOptions = \[/)
  assert.match(pageFile, /selectedThermalDisplayMode = ref\('postprocess'\)/)
  assert.match(viewerFile, /mode:\s*\{/)
  assert.match(viewerFile, /thermalDisplayMode:\s*\{/)
  assert.match(viewerFile, /props\.thermalDisplayMode === 'postprocess'/)
  assert.match(viewerFile, /watch\(\s*\(\) => \[props\.assetUrl, props\.mode, props\.thermalDisplayMode\]/)
  assert.match(viewerFile, /float gray01 = clamp\(source\.r, 0\.0, 1\.0\);/)
  assert.match(viewerFile, /gl_FragColor = vec4\(jetRgb, 1\.0\);/)
  assert.match(viewerFile, /renderThermalPostprocess/)
  assert.match(viewerFile, /prepareThermalPackedColors/)
})
