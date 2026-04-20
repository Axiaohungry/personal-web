const OPENCV_JET_RGB_HEX =
  '00008000008400008800008c00009000009400009800009c0000a00000a40000a80000ac0000b00000b40000b80000bc0000c00000c40000c80000cc0000d00000d40000d80000dc0000e00000e40000e80000ec0000f00000f40000f80000fc0000ff0004ff0008ff000cff0010ff0014ff0018ff001cff0020ff0024ff0028ff002cff0030ff0034ff0038ff003cff0040ff0044ff0048ff004cff0050ff0054ff0058ff005cff0060ff0064ff0068ff006cff0070ff0074ff0078ff007cff0080ff0084ff0088ff008cff0090ff0094ff0098ff009cff00a0ff00a4ff00a8ff00acff00b0ff00b4ff00b8ff00bcff00c0ff00c4ff00c8ff00ccff00d0ff00d4ff00d8ff00dcff00e0ff00e4ff00e8ff00ecff00f0ff00f4ff00f8ff00fcff02fffe06fffa0afff60efff212ffee16ffea1affe61effe222ffde26ffda2affd62effd232ffce36ffca3affc63effc242ffbe46ffba4affb64effb252ffae56ffaa5affa65effa262ff9e66ff9a6aff966eff9272ff8e76ff8a7aff867eff8282ff7e86ff7a8aff768eff7292ff6e96ff6a9aff669eff62a2ff5ea6ff5aaaff56aeff52b2ff4eb6ff4abaff46beff42c2ff3ec6ff3acaff36ceff32d2ff2ed6ff2adaff26deff22e2ff1ee6ff1aeaff16eeff12f2ff0ef6ff0afaff06feff01fffc00fff800fff400fff000ffec00ffe800ffe400ffe000ffdc00ffd800ffd400ffd000ffcc00ffc800ffc400ffc000ffbc00ffb800ffb400ffb000ffac00ffa800ffa400ffa000ff9c00ff9800ff9400ff9000ff8c00ff8800ff8400ff8000ff7c00ff7800ff7400ff7000ff6c00ff6800ff6400ff6000ff5c00ff5800ff5400ff5000ff4c00ff4800ff4400ff4000ff3c00ff3800ff3400ff3000ff2c00ff2800ff2400ff2000ff1c00ff1800ff1400ff1000ff0c00ff0800ff0400ff0000fc0000f80000f40000f00000ec0000e80000e40000e00000dc0000d80000d40000d00000cc0000c80000c40000c00000bc0000b80000b40000b00000ac0000a80000a40000a000009c00009800009400009000008c0000880000840000800000'

export const JET_COLORMAP_SIZE = 256

function decodeHexToBytes(hex) {
  // OpenCV JET 色带以十六进制字符串形式内置在文件里，
  // 这里把它解码成 Uint8Array，方便后续直接上传到 GPU 或做像素映射。
  const bytes = new Uint8Array(hex.length / 2)

  for (let index = 0; index < bytes.length; index += 1) {
    const offset = index * 2
    bytes[index] = Number.parseInt(hex.slice(offset, offset + 2), 16)
  }

  return bytes
}

export const JET_COLORMAP_RGB_BYTES = decodeHexToBytes(OPENCV_JET_RGB_HEX)
export const JET_COLORMAP_RGBA_BYTES = (() => {
  // WebGL 纹理通常更适合直接使用 RGBA，所以这里再补一层 alpha=255 的展开版本。
  const rgba = new Uint8Array(JET_COLORMAP_SIZE * 4)

  for (let grayByte = 0; grayByte < JET_COLORMAP_SIZE; grayByte += 1) {
    const rgbOffset = grayByte * 3
    const rgbaOffset = grayByte * 4

    rgba[rgbaOffset] = JET_COLORMAP_RGB_BYTES[rgbOffset]
    rgba[rgbaOffset + 1] = JET_COLORMAP_RGB_BYTES[rgbOffset + 1]
    rgba[rgbaOffset + 2] = JET_COLORMAP_RGB_BYTES[rgbOffset + 2]
    rgba[rgbaOffset + 3] = 255
  }

  return rgba
})()

const JET_COLOR_KEY_TO_GRAY_BYTE = new Map()
const JET_DECODE_CACHE = new Map()

function clampGrayByte(grayByte) {
  return Math.max(0, Math.min(255, grayByte | 0))
}

function getJetOffset(grayByte) {
  return clampGrayByte(grayByte) * 3
}

export function encodeRgbToJetKey(r, g, b) {
  return (r & 0xff) | ((g & 0xff) << 8) | ((b & 0xff) << 16)
}

export function getJetRgbAtByte(grayByte) {
  const offset = getJetOffset(grayByte)
  return [
    JET_COLORMAP_RGB_BYTES[offset],
    JET_COLORMAP_RGB_BYTES[offset + 1],
    JET_COLORMAP_RGB_BYTES[offset + 2],
  ]
}

export function encodeGrayByteToJetKey(grayByte) {
  const [r, g, b] = getJetRgbAtByte(grayByte)
  return encodeRgbToJetKey(r, g, b)
}

for (let grayByte = 0; grayByte < JET_COLORMAP_SIZE; grayByte += 1) {
  JET_COLOR_KEY_TO_GRAY_BYTE.set(encodeGrayByteToJetKey(grayByte), grayByte)
}

export function decodeBakedJetKeyToGrayByte(colorKey) {
  const exactGrayByte = JET_COLOR_KEY_TO_GRAY_BYTE.get(colorKey)
  if (exactGrayByte !== undefined) {
    return exactGrayByte
  }

  const cachedGrayByte = JET_DECODE_CACHE.get(colorKey)
  if (cachedGrayByte !== undefined) {
    return cachedGrayByte
  }

  const r = colorKey & 0xff
  const g = (colorKey >>> 8) & 0xff
  const b = (colorKey >>> 16) & 0xff

  let bestGrayByte = 0
  let bestDistance = Number.POSITIVE_INFINITY

  for (let grayByte = 0; grayByte < JET_COLORMAP_SIZE; grayByte += 1) {
    const offset = grayByte * 3
    const dr = r - JET_COLORMAP_RGB_BYTES[offset]
    const dg = g - JET_COLORMAP_RGB_BYTES[offset + 1]
    const db = b - JET_COLORMAP_RGB_BYTES[offset + 2]
    const distance = dr * dr + dg * dg + db * db

    if (distance < bestDistance) {
      bestDistance = distance
      bestGrayByte = grayByte
    }
  }

  JET_DECODE_CACHE.set(colorKey, bestGrayByte)
  return bestGrayByte
}

export function remapPackedThermalWordToGrayscale(word0) {
  const grayByte = decodeBakedJetKeyToGrayByte(word0 & 0x00ffffff)
  return (word0 & 0xff000000) | grayByte | (grayByte << 8) | (grayByte << 16)
}

function yieldToMainThread() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export function remapPackedThermalArray(packedArray, numSplats) {
  if (!packedArray || !numSplats) {
    return false
  }

  for (let index = 0; index < numSplats; index += 1) {
    const wordIndex = index * 4
    packedArray[wordIndex] = remapPackedThermalWordToGrayscale(packedArray[wordIndex])
  }

  return true
}

async function tryPrepareThermalPackedColorsInWorker(packedArray, numSplats, { shouldAbort = null } = {}) {
  if (typeof Worker !== 'function') {
    return null
  }

  const sourceBuffer = packedArray.buffer
  if (!(sourceBuffer instanceof ArrayBuffer) || sourceBuffer.byteLength === 0) {
    return null
  }

  const workerBuffer = sourceBuffer.slice(0)

  return new Promise((resolve) => {
    const worker = new Worker(new URL('./project3dgsThermalColormap.worker.js', import.meta.url), {
      type: 'module',
    })

    let settled = false
    let abortTimer = null

    function cleanup() {
      if (abortTimer) {
        clearInterval(abortTimer)
        abortTimer = null
      }

      worker.onmessage = null
      worker.onerror = null
      worker.terminate()
    }

    function finish(nextValue) {
      if (settled) return
      settled = true
      cleanup()
      resolve(nextValue)
    }

    worker.onmessage = (event) => {
      const nextBuffer = event?.data?.buffer
      if (!(nextBuffer instanceof ArrayBuffer)) {
        finish(null)
        return
      }

      finish(new Uint32Array(nextBuffer))
    }

    worker.onerror = () => {
      finish(null)
    }

    if (shouldAbort) {
      abortTimer = setInterval(() => {
        if (shouldAbort()) {
          finish(null)
        }
      }, 50)
    }

    worker.postMessage(
      {
        buffer: workerBuffer,
        numSplats,
      },
      [workerBuffer]
    )
  })
}

export async function prepareThermalPackedColors(
  packedSplats,
  { chunkSize = 250000, shouldAbort = null } = {}
) {
  const packedArray = packedSplats?.packedArray
  const numSplats = packedSplats?.numSplats ?? 0

  if (!packedArray || !numSplats) {
    return false
  }

  const workerResult = await tryPrepareThermalPackedColorsInWorker(packedArray, numSplats, { shouldAbort })
  if (workerResult) {
    packedSplats.packedArray = workerResult
    packedSplats.needsUpdate = true
    return true
  }

  for (let index = 0; index < numSplats; index += 1) {
    if (shouldAbort?.()) {
      return false
    }

    const wordIndex = index * 4
    packedArray[wordIndex] = remapPackedThermalWordToGrayscale(packedArray[wordIndex])

    if ((index + 1) % chunkSize === 0) {
      await yieldToMainThread()
    }
  }

  packedSplats.needsUpdate = true
  return true
}
