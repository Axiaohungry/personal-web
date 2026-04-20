import { remapPackedThermalArray } from './project3dgsThermalColormap.js'

// Worker 的职责很单纯：
// 接收 packed splat buffer，在后台线程完成热场颜色重映射，再把处理后的 buffer 传回主线程。
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
