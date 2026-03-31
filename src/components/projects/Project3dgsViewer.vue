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
  loading.value = nextValue
  emit('loading-change', nextValue)
}

function setError(message) {
  error.value = message
  emit('error', message)
}

function clearError() {
  if (!error.value) return
  error.value = ''
  emit('error', '')
}

function emitCameraSnapshot() {
  if (!camera || !controls) return

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

  camera.position.fromArray(snapshot.position)
  controls.target.fromArray(snapshot.target)
  camera.lookAt(controls.target)
  controls.update()
  emitCameraSnapshot()
}

function applyPreset(preset, { distanceScale = PRESET_DISTANCE_SCALE } = {}) {
  if (!preset || !camera || !controls) return

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
  return (
    props.mode === 'thermal' &&
    props.thermalDisplayMode === 'postprocess' &&
    typeof url === 'string' &&
    url.includes('/thermal/')
  )
}

function ensureThermalJetTexture() {
  if (thermalJetTexture) {
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
    thermalRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    })
    thermalRenderTarget.texture.minFilter = THREE.LinearFilter
    thermalRenderTarget.texture.magFilter = THREE.LinearFilter
  }

  if (!thermalPostMaterial) {
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
    const prepared = await prepareThermalPackedColors(mesh.packedSplats, { shouldAbort })

    if (!prepared) {
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

  disposeAssetHandle(activeAssetHandle)
  activeAssetHandle = null

  if (!url) {
    setLoading(false)
    setError('3DGS 资源路径尚未配置。')
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
      return
    }

    if (version !== loadVersion) {
      disposeAssetHandle(nextHandle)
      return
    }

    scene.add(nextHandle.object3D)
    activeAssetHandle = nextHandle

    if (snapshot) {
      restoreCameraSnapshot(snapshot)
    } else if (props.preset) {
      applyPreset(props.preset)
    } else {
      fitCameraToObject(nextHandle.object3D)
    }

    emit('ready', { assetUrl: url })
  } catch (loadError) {
    console.error('[Project3dgsViewer] Failed to load asset.', loadError)
    setError(loadError instanceof Error ? loadError.message : '3DGS 资源加载失败。')
  } finally {
    if (version === loadVersion) {
      setLoading(false)
    }
  }
}

function renderThermalPostprocess() {
  ensureThermalPostprocessResources()

  if (!renderer || !scene || !camera || !thermalRenderTarget || !thermalPostMaterial || !thermalPostQuad) {
    renderer?.render(scene, camera)
    return
  }

  thermalPostMaterial.uniforms.tDiffuse.value = thermalRenderTarget.texture

  renderer.setRenderTarget(thermalRenderTarget)
  renderer.clear()
  renderer.render(scene, camera)

  renderer.setRenderTarget(null)
  renderer.clear()
  thermalPostQuad.render(renderer)
}

function renderLoop() {
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

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(safeWidth, safeHeight, false)
  camera.aspect = safeWidth / safeHeight
  camera.updateProjectionMatrix()
  resizeThermalPostprocess()
}

function destroyRenderer() {
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

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    })
  } catch (rendererError) {
    setError('当前浏览器环境无法初始化 WebGL 渲染器。')
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

  if (!viewerInputsChanged) return
  await loadAsset(nextAssetUrl, { restoreView: true })
})

watch(
  () => props.preset,
  (nextPreset) => {
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
        <span>切换实验组时会尽量保持当前视角。</span>
      </div>

      <div
        v-else-if="!assetUrl"
        class="project-3dgs-viewer__overlay project-3dgs-viewer__overlay--placeholder"
      >
        <strong>等待资源</strong>
        <span>当前还没有可加载的 3DGS 资源路径。</span>
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
          ? '如果资源文件还未放入 public/3dgs，先保留当前页面骨架即可。'
          : '请检查传入的资源路径和 Spark 适配层是否匹配当前安装版本。'
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
</style>
