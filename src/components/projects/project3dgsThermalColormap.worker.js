import { remapPackedThermalArray } from './project3dgsThermalColormap.js'

self.onmessage = (event) => {
  const buffer = event?.data?.buffer
  const numSplats = event?.data?.numSplats ?? 0

  if (!(buffer instanceof ArrayBuffer)) {
    self.postMessage({ buffer: null })
    return
  }

  const packedArray = new Uint32Array(buffer)
  remapPackedThermalArray(packedArray, numSplats)
  self.postMessage({ buffer }, [buffer])
}
