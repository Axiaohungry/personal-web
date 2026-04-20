<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark'

import {
  JET_COLORMAP_RGBA_BYTES,
  prepareThermalPackedColors,
} from './project3dgsThermalColormap.js'
import { resolveSparkAssetFileType } from './project3dgsSparkAsset.js'

// 3DGS 查看器是项目里最重的前端交互组件之一。
// 它负责：
// 1. 初始化 Three.js / Spark 渲染环境；
// 2. 加载不同格式的 3DGS 资源；
// 3. 在 RGB 与热场模式之间切换；
// 4. 维护镜头状态、尺寸监听和资源释放。
const props = defineProps({
  assetUrl: {
    type: String,
    default: '',
  },
  mode: {
    type: String,
    default: 'rgb',
  },
  thermalDisplayMode: {
    type: String,
    default: 'postprocess',
  },
  preset: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['camera-change', 'error', 'loading-change', 'ready'])

const canvasHost = ref(null)
const loading = ref(false)
const error = ref('')
const hasAttemptedLoad = ref(false)

let renderer = null
let sparkRenderer = null
let scene = null
let camera = null
let controls = null
let thermalRenderTarget = null
let thermalPostMaterial = null
let thermalPostQuad = null
let thermalJetTexture = null
let resizeObserver = null
let rafId = 0
let activeAssetHandle = null
let loadVersion = 0
const PRESET_DISTANCE_SCALE = 3

function setLoading(nextValue) {
  // 本地 loading 状态和向父组件派发的 loading-change 事件必须保持同步，
  // 这样外层页面既能自己显示提示，也能做额外联动。
  loading.value = nextValue
  emit('loading-change', nextValue)
}

function setError(message) {
  error.value = message
  emit('error', message)
}

function clearError() {
  // 只有真的存在错误时才派发清空事件，避免重复触发父层监听。
  if (!error.value) return
  error.value = ''
  emit('error', '')
}

function emitCameraSnapshot() {
  if (!camera || !controls) return

  // 外层页面用这个快照保存当前镜头位置，切换资源后再尽量恢复用户刚才的观察角度。
  emit('camera-change', {
    position: camera.position.toArray(),
    target: controls.target.toArray(),
  })
}

function captureCameraSnapshot() {
  if (!camera || !controls) return null

  return {
    position: camera.position.toArray(),
    target: controls.target.toArray(),
  }
}

function restoreCameraSnapshot(snapshot) {
  if (!snapshot || !camera || !controls) return

  // 恢复镜头时要同时恢复相机位置和 controls.target，
  // 否则 OrbitControls 内部状态会和画面不一致。
  camera.position.fromArray(snapshot.position)
  controls.target.fromArray(snapshot.target)
  camera.lookAt(controls.target)
  controls.update()
  emitCameraSnapshot()
}

function applyPreset(preset, { distanceScale = PRESET_DISTANCE_SCALE } = {}) {
  if (!preset || !camera || !controls) return

  // 预设既可以给完整 position/target，也可以额外给 up 向量；
  // 如果有 distanceScale，还会在当前观察方向上做一次距离缩放。
  if (Array.isArray(preset.position) && preset.position.length === 3) {
    camera.position.fromArray(preset.position)
  }

  if (Array.isArray(preset.up) && preset.up.length === 3) {
    camera.up.fromArray(preset.up)
    camera.up.normalize()
  }

  if (Array.isArray(preset.target) && preset.target.length === 3) {
    controls.target.fromArray(preset.target)
  }

  if (distanceScale > 0 && distanceScale !== 1) {
    // 这里不是简单把坐标乘一个倍数，
    // 而是沿着“target -> camera”的方向矢量做缩放，保证视线方向不变。
    const offset = camera.position.clone().sub(controls.target)
    if (offset.lengthSq() > 1e-8) {
      camera.position.copy(controls.target).add(offset.multiplyScalar(distanceScale))
    }
  }

  camera.lookAt(controls.target)
  controls.update()
  emitCameraSnapshot()
}

function fitCameraToObject(object3D) {
  if (!object3D || !camera || !controls) return

  const box = new THREE.Box3().setFromObject(object3D)
  // 如果模型边界盒为空，说明对象还没准备好，直接退出，不强行重设镜头。
  if (box.isEmpty()) return

  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const radius = Math.max(size.x, size.y, size.z, 0.01)
  const distance = radius * 1.8

  controls.target.copy(center)
  camera.position.set(center.x + distance, center.y + distance * 0.6, center.z + distance)
  camera.near = Math.max(radius / 100, 0.01)
  camera.far = Math.max(radius * 25, 50)
  camera.updateProjectionMatrix()
  controls.update()
  emitCameraSnapshot()
}

function disposeAssetHandle(handle) {
  if (!handle) return

  // 先从场景树移除，再调用资产自己的 dispose，避免保留悬挂引用。
  if (scene && handle.object3D) {
    scene.remove(handle.object3D)
  }

  try {
    handle.dispose?.()
  } catch (disposeError) {
    // Keep disposal failures non-fatal so asset switching remains recoverable.
    console.warn('[Project3dgsViewer] Failed to dispose active asset.', disposeError)
  }
}

function usesThermalPostprocess(url) {
  // 只有同时满足三件事才启用热场后处理：
  // 1. 当前模式是 thermal；
  // 2. 当前展示方式要求 postprocess；
  // 3. 资源路径本身确实属于 thermal 组。
  return (
    props.mode === 'thermal' &&
    props.thermalDisplayMode === 'postprocess' &&
    typeof url === 'string' &&
    url.includes('/thermal/')
  )
}

function ensureThermalJetTexture() {
  if (thermalJetTexture) {
    // 纹理属于可复用 GPU 资源，重复渲染时直接复用，不重复创建。
    return thermalJetTexture
  }

  thermalJetTexture = new THREE.DataTexture(
    JET_COLORMAP_RGBA_BYTES,
    JET_COLORMAP_RGBA_BYTES.length / 4,
    1,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  )
  thermalJetTexture.colorSpace = THREE.NoColorSpace
  thermalJetTexture.minFilter = THREE.NearestFilter
  thermalJetTexture.magFilter = THREE.NearestFilter
  thermalJetTexture.wrapS = THREE.ClampToEdgeWrapping
  thermalJetTexture.wrapT = THREE.ClampToEdgeWrapping
  thermalJetTexture.generateMipmaps = false
  thermalJetTexture.needsUpdate = true

  return thermalJetTexture
}

function ensureThermalPostprocessResources() {
  if (!renderer) return

  if (!thermalRenderTarget) {
    // render target 只在首次进入热场流程时初始化，尺寸变化另走 resizeThermalPostprocess。
    thermalRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    })
    thermalRenderTarget.texture.minFilter = THREE.LinearFilter
    thermalRenderTarget.texture.magFilter = THREE.LinearFilter
  }

  if (!thermalPostMaterial) {
    // 这个 shader 的职责很单一：
    // 输入灰度热图，查 JET 纹理表，再输出伪彩色热场。
    thermalPostMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tJet: { value: ensureThermalJetTexture() },
      },
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tJet;

        varying vec2 vUv;

        void main() {
          vec4 source = texture2D(tDiffuse, vUv);
          float gray01 = clamp(source.r, 0.0, 1.0);
          float jetIndex = floor(gray01 * 255.0 + 0.5);
          vec2 jetUv = vec2((jetIndex + 0.5) / 256.0, 0.5);
          vec3 jetRgb = texture2D(tJet, jetUv).rgb;

          gl_FragColor = vec4(jetRgb, 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false,
    })
  }

  if (!thermalPostQuad) {
    thermalPostQuad = new FullScreenQuad(thermalPostMaterial)
  }
}

function resizeThermalPostprocess() {
  if (!thermalRenderTarget || !canvasHost.value) return

  const { clientWidth, clientHeight } = canvasHost.value
  thermalRenderTarget.setSize(Math.max(clientWidth, 1), Math.max(clientHeight, 1))
}

function disposeThermalPostprocess() {
  thermalPostQuad?.dispose?.()
  thermalPostQuad = null

  thermalPostMaterial?.dispose()
  thermalPostMaterial = null

  thermalRenderTarget?.dispose()
  thermalRenderTarget = null

  thermalJetTexture?.dispose()
  thermalJetTexture = null
}

async function resolveSparkAssetHandle(url, { thermalPostprocess = false, shouldAbort = null } = {}) {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} fetching URL: ${url}`)
  }

  const fileBytes = new Uint8Array(await response.arrayBuffer())
  if (shouldAbort?.()) {
    // 如果在下载或解析过程中用户已经切到另一份资源，就中止当前结果落地。
    return null
  }

  const fileType = resolveSparkAssetFileType(url)
  const mesh = new SplatMesh({
    fileBytes,
    fileType: fileType ?? undefined,
    fileName: url,
  })
  await mesh.initialized

  if (thermalPostprocess) {
    // 热场模式下要先把 baked JET 颜色映射重写成后处理需要的灰度通道。
    const prepared = await prepareThermalPackedColors(mesh.packedSplats, { shouldAbort })

    if (!prepared) {
      // 如果准备过程被中止，及时释放 mesh，避免留下半初始化对象。
      mesh.dispose()
      return null
    }
  }

  return {
    object3D: mesh,
    thermalPostprocess,
    dispose() {
      mesh.dispose()
    },
  }
}

async function loadAsset(url, { restoreView = true } = {}) {
  const version = ++loadVersion
  const snapshot = restoreView && activeAssetHandle ? captureCameraSnapshot() : null
  hasAttemptedLoad.value = true

  // 每次切换资源前都先释放旧资源，保证显存和场景树不会不断叠加。
  disposeAssetHandle(activeAssetHandle)
  activeAssetHandle = null

  if (!url) {
    // 空 URL 不算异常，但需要明确告诉用户当前只是“资源未提供”。
    setLoading(false)
    setError('对应的 3DGS 文件还没有放进来。')
    return
  }

  clearError()
  setLoading(true)

  try {
    const nextHandle = await resolveSparkAssetHandle(url, {
      thermalPostprocess: usesThermalPostprocess(url),
      shouldAbort: () => version !== loadVersion,
    })

    if (!nextHandle) {
      // nextHandle 为空通常表示 shouldAbort 命中，不应把它当作错误提示给用户。
      return
    }

    if (version !== loadVersion) {
      // 即使资源已经加载完，只要它不是最新一次请求，也必须立即丢弃，防止旧结果覆盖新场景。
      disposeAssetHandle(nextHandle)
      return
    }

    scene.add(nextHandle.object3D)
    activeAssetHandle = nextHandle

    if (snapshot) {
      // 同一路径组之间切换时优先保留用户当前视角，便于前后结果直接对照。
      restoreCameraSnapshot(snapshot)
    } else if (props.preset) {
      // 首次进入时如果页面提供了预设镜头，就优先应用预设。
      applyPreset(props.preset)
    } else {
      // 再没有预设时，才自动 fit 到模型包围盒。
      fitCameraToObject(nextHandle.object3D)
    }

    emit('ready', { assetUrl: url })
  } catch (loadError) {
    console.error('[Project3dgsViewer] Failed to load asset.', loadError)
    setError(loadError instanceof Error ? loadError.message : '这一版模型暂时没有加载出来。')
  } finally {
    if (version === loadVersion) {
      // 只有“当前仍是最后一次请求”时，才有资格结束 loading。
      setLoading(false)
    }
  }
}

function renderThermalPostprocess() {
  ensureThermalPostprocessResources()

  if (!renderer || !scene || !camera || !thermalRenderTarget || !thermalPostMaterial || !thermalPostQuad) {
    // 后处理资源不完整时，退回普通渲染，保证查看器至少还能工作。
    renderer?.render(scene, camera)
    return
  }

  thermalPostMaterial.uniforms.tDiffuse.value = thermalRenderTarget.texture

  renderer.setRenderTarget(thermalRenderTarget)
  // 第一遍先把场景渲到离屏纹理里。
  renderer.clear()
  renderer.render(scene, camera)

  renderer.setRenderTarget(null)
  // 第二遍再用全屏 Quad 把灰度结果查表成 JET 伪彩色。
  renderer.clear()
  thermalPostQuad.render(renderer)
}

function renderLoop() {
  // 渲染循环始终只保留一条 requestAnimationFrame 链。
  // 根据当前模式决定走普通渲染还是热场后处理渲染。
  if (renderer && scene && camera) {
    controls?.update()

    if (props.mode === 'thermal' && activeAssetHandle?.thermalPostprocess) {
      renderThermalPostprocess()
    } else {
      renderer.render(scene, camera)
    }
  }

  rafId = window.requestAnimationFrame(renderLoop)
}

function resizeRenderer() {
  if (!renderer || !camera || !canvasHost.value) return

  const { clientWidth, clientHeight } = canvasHost.value
  const safeWidth = Math.max(clientWidth, 1)
  const safeHeight = Math.max(clientHeight, 1)

  // DPR 上限压到 2，是为了减少高分屏下不必要的显存和填充压力。
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(safeWidth, safeHeight, false)
  camera.aspect = safeWidth / safeHeight
  camera.updateProjectionMatrix()
  resizeThermalPostprocess()
}

function destroyRenderer() {
  // 销毁顺序尽量遵循“先停循环 / 监听，再释放场景对象与 GPU 资源，最后移除 DOM”。
  if (rafId) {
    window.cancelAnimationFrame(rafId)
    rafId = 0
  }

  resizeObserver?.disconnect()
  resizeObserver = null

  controls?.dispose()
  controls = null

  disposeAssetHandle(activeAssetHandle)
  activeAssetHandle = null

  if (sparkRenderer && scene) {
    scene.remove(sparkRenderer)
  }
  sparkRenderer = null

  disposeThermalPostprocess()
  renderer?.dispose()

  if (renderer?.domElement && renderer.domElement.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }

  renderer = null
  scene = null
  camera = null
}

async function initRenderer() {
  if (!canvasHost.value || renderer) return

  // 初始化阶段一次性创建 renderer / scene / camera / controls，
  // 后续资源切换只替换 asset，不重复创建整套渲染器。
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    })
  } catch (rendererError) {
    setError('这个浏览器暂时没法打开 3D 预览。')
    console.error('[Project3dgsViewer] WebGL initialization failed.', rendererError)
    return
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x000000, 0)

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(42, 1, 0.01, 500)
  camera.position.set(2.2, 1.2, 2.2)
  sparkRenderer = new SparkRenderer({ renderer })
  sparkRenderer.frustumCulled = false
  scene.add(sparkRenderer)
  ensureThermalPostprocessResources()

  const ambientLight = new THREE.HemisphereLight(0xf8efe1, 0x5c4b40, 1.15)
  scene.add(ambientLight)

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.75)
  keyLight.position.set(4, 6, 4)
  scene.add(keyLight)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.rotateSpeed = 0.85
  controls.zoomSpeed = 0.8
  controls.panSpeed = 0.7
  controls.addEventListener('change', emitCameraSnapshot)

  canvasHost.value.appendChild(renderer.domElement)

  resizeRenderer()
  resizeObserver = new ResizeObserver(() => resizeRenderer())
  resizeObserver.observe(canvasHost.value)

  renderLoop()
  await nextTick()

  if (props.preset) {
    applyPreset(props.preset)
  } else {
    emitCameraSnapshot()
  }
}

onMounted(async () => {
  await initRenderer()

  if (props.assetUrl) {
    // 初次挂载时不需要恢复旧视角，因为此时还没有历史镜头。
    await loadAsset(props.assetUrl, { restoreView: false })
  }
})

watch(() => [props.assetUrl, props.mode, props.thermalDisplayMode], async (
  [nextAssetUrl, nextMode, nextThermalDisplayMode],
  [previousAssetUrl, previousMode, previousThermalDisplayMode]
) => {
  if (!renderer) return

  const viewerInputsChanged =
    nextAssetUrl !== previousAssetUrl ||
    nextMode !== previousMode ||
    nextThermalDisplayMode !== previousThermalDisplayMode

  // 只有资源地址或显示模式真的变化时才重载，避免无意义地重建模型。
  if (!viewerInputsChanged) return
  await loadAsset(nextAssetUrl, { restoreView: true })
})

watch(
  () => props.preset,
  (nextPreset) => {
    // 正在加载资源时不抢着切预设，等资源稳定后再切镜头，能减少跳动感。
    if (!nextPreset || loading.value) return
    applyPreset(nextPreset)
  },
  { deep: true }
)

onBeforeUnmount(() => {
  destroyRenderer()
})
</script>

<template>
  <section class="project-3dgs-viewer">
    <div
      ref="canvasHost"
      class="project-3dgs-viewer__canvas"
      :class="{ 'project-3dgs-viewer__canvas--empty': !assetUrl }"
    >
      <div
        v-if="loading"
        class="project-3dgs-viewer__overlay"
      >
        <strong>正在加载模型</strong>
        <span>会尽量把镜头留在刚才的位置，方便连续对照。</span>
      </div>

      <div
        v-else-if="!assetUrl"
        class="project-3dgs-viewer__overlay project-3dgs-viewer__overlay--placeholder"
      >
        <strong>等待资源</strong>
        <span>对应的 3DGS 文件还没有放进来。</span>
      </div>
    </div>

    <a-alert
      v-if="error"
      class="project-3dgs-viewer__alert"
      type="warning"
      show-icon
      :message="error"
      :description="
        hasAttemptedLoad
          ? '如果文件还在整理中，先保留这个展示框就可以。'
          : '可以先检查文件地址，或确认当前加载方式和资源格式一致。'
      "
    />
  </section>
</template>

<style scoped>
.project-3dgs-viewer {
  display: grid;
  gap: 0.9rem;
  min-width: 0;
}

.project-3dgs-viewer__canvas {
  position: relative;
  min-height: clamp(23rem, 58vh, 40rem);
  overflow: hidden;
  overscroll-behavior: contain;
  border: 1px solid var(--line);
  border-radius: calc(var(--radius-lg) - 2px);
  background:
    radial-gradient(circle at 18% 20%, var(--accent-soft), transparent 18%),
    radial-gradient(circle at 82% 14%, var(--teal-soft), transparent 16%),
    linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 88%, transparent), color-mix(in srgb, var(--panel) 92%, transparent));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.project-3dgs-viewer__canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.project-3dgs-viewer__canvas--empty {
  min-height: clamp(18rem, 45vh, 28rem);
}

.project-3dgs-viewer__overlay {
  position: absolute;
  inset: auto 1rem 1rem 1rem;
  display: grid;
  gap: 0.22rem;
  max-width: min(24rem, calc(100% - 2rem));
  padding: 0.9rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--panel) 88%, transparent);
  backdrop-filter: blur(14px);
  box-shadow: var(--shadow-soft);
  color: var(--text);
}

.project-3dgs-viewer__overlay strong {
  font-size: 0.96rem;
}

.project-3dgs-viewer__overlay span {
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.55;
}

.project-3dgs-viewer__overlay--placeholder {
  inset: 1rem;
  align-content: center;
  justify-items: start;
  background:
    linear-gradient(140deg, color-mix(in srgb, var(--surface) 72%, transparent), color-mix(in srgb, var(--panel-soft) 90%, transparent));
}

.project-3dgs-viewer__alert {
  border-radius: var(--radius-md);
}

@media (max-width: 960px) {
  .project-3dgs-viewer__canvas {
    min-height: clamp(18rem, 46vh, 28rem);
  }

  .project-3dgs-viewer__overlay {
    inset: auto 0.8rem 0.8rem 0.8rem;
    padding: 0.8rem 0.9rem;
  }
}

@media (max-width: 720px) {
  .project-3dgs-viewer__canvas {
    min-height: clamp(16.5rem, 42vh, 22rem);
  }

  .project-3dgs-viewer__overlay {
    inset: auto 0.65rem 0.65rem 0.65rem;
    padding: 0.72rem 0.82rem;
  }

  .project-3dgs-viewer__overlay--placeholder {
    inset: 0.65rem;
  }
}
</style>
