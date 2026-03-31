<script setup>
import { computed, onMounted, ref } from 'vue'

import SiteHeader from '@/components/SiteHeader.vue'
import Project3dgsViewer from '@/components/projects/Project3dgsViewer.vue'
import { navigationItems } from '@/data/navigation.js'
import { profile } from '@/data/profile.js'

const PRESET_LABEL_MAP = {
  oblique: '斜视',
  topdown: '顶视',
}

const PRESET_NOTE_MAP = {
  oblique: '用于从倾斜观察角度对比不同实验组的整体热场结构。',
  topdown: '用于从顶视角度对齐论文核心对比视角。',
}

const headlineMetrics = [
  { label: 'RMSE', value: '-8.41%' },
  { label: 'PSNR', value: '+0.763 dB' },
  { label: 'SSIM', value: '0.65251 -> 0.71619' },
]

const methodCards = [
  {
    title: '几何基底',
    body: '基于 RGB 倾斜摄影构建 3DGS 场景几何，让热场学习先建立在稳定的三维结构上。',
  },
  {
    title: '物理先验',
    body: '将法向、相对高度、坡度、光照遮挡、语义材质与向光度编码为 11 维输入，减少纯黑盒拟合。',
  },
  {
    title: '温度学习',
    body: '通过 ThermalAttrNet 和可微渲染监督学习高斯基元温度属性，并在三维空间中保持热场连续性。',
  },
]

const ablationRows = [
  { id: 'full_zscore', label: '最佳模型', mae: 0.10394, rmse: 0.12678, psnr: 17.93915, ssim: 0.71619 },
  { id: 'full', label: '全要素基线', mae: 0.10577, rmse: 0.13842, psnr: 17.17635, ssim: 0.65251 },
  { id: 'sem_only', label: '仅语义先验', mae: 0.10812, rmse: 0.13999, psnr: 17.07782, ssim: 0.61423 },
  { id: 'shadow_only', label: '仅光照先验', mae: 0.11861, rmse: 0.15141, psnr: 16.39681, ssim: 0.58603 },
  { id: 'shuffled', label: '空间一致性破坏', mae: 0.13641, rmse: 0.16674, psnr: 15.55935, ssim: 0.49622 },
]

const limitations = [
  '顶视热红外真值对建筑立面监督有限，因此立面热分布更多体现的是模型在几何与先验约束下的空间泛化能力。',
  '跨模态配准残差、材质热物性差异和离散化光照先验，仍然会在局部带来误差。',
]

const defaultManifest = {
  defaultMode: 'thermal',
  defaultGroup: 'full_zscore',
  defaultScope: 'full_masked',
  rgbAssets: {
    full_masked: '/3dgs/rgb/full_masked.ply',
  },
  groups: [
    {
      id: 'full_zscore',
      label: '最佳模型',
      alias: 'full_zscore',
      description: '全要素输入并进行标准化。',
      assets: {
        full_masked: '/3dgs/thermal/full_zscore/full_masked.ply',
      },
    },
    {
      id: 'full',
      label: '全要素基线',
      alias: 'full',
      description: '全要素输入但不做标准化。',
      assets: {
        full_masked: '/3dgs/thermal/full/full_masked.ply',
      },
    },
    {
      id: 'sem_only',
      label: '仅语义先验',
      alias: 'sem_only',
      description: '仅保留语义材质相关先验。',
      assets: {
        full_masked: '/3dgs/thermal/sem_only/full_masked.ply',
      },
    },
    {
      id: 'shadow_only',
      label: '仅光照先验',
      alias: 'shadow_only',
      description: '仅保留光照与遮挡相关先验。',
      assets: {
        full_masked: '/3dgs/thermal/shadow_only/full_masked.ply',
      },
    },
    {
      id: 'shuffled',
      label: '空间一致性破坏',
      alias: 'shuffled',
      description: '打乱物理先验与空间位置对应关系。',
      assets: {
        full_masked: '/3dgs/thermal/shuffled/full_masked.ply',
      },
    },
  ],
  presets: {
    oblique: {
      label: '斜视',
      note: '参考 view_rgb_3dgs.py 的 orbit 默认视角，用于比较不同实验组在同一观察角度下的差异。',
      position: [1.4, 0.9, 1.2],
      target: [0.0, 0.0, 0.0],
      up: [0.0, 1.0, 0.0],
    },
    topdown: {
      label: '顶视',
      note: '参考 view_phase5_roi_splat.py 的 train-style 顶视逻辑，用于对齐论文中的核心比较视角。',
      position: [0.0, 2.4, 0.0],
      target: [0.0, 0.0, 0.0],
      up: [0.0, 0.0, -1.0],
    },
  },
}

const manifest = ref(structuredClone(defaultManifest))
const manifestReady = ref(false)
const manifestMessage = ref('')
const selectedMode = ref(defaultManifest.defaultMode)
const selectedGroupId = ref(defaultManifest.defaultGroup)
const selectedScopeId = ref(defaultManifest.defaultScope)
const selectedPresetId = ref('oblique')
const selectedThermalDisplayMode = ref('postprocess')
const viewerMessage = ref('')
const viewerLoading = ref(false)
const cameraState = ref(null)

const modeOptions = [
  { label: '热场', value: 'thermal' },
  { label: 'RGB', value: 'rgb' },
]

const thermalDisplayModeOptions = [
  { label: '对齐版', value: 'postprocess' },
  { label: '原始版', value: 'baked' },
]

const scopeOptions = computed(() => {
  const scopes = new Set()
  Object.keys(manifest.value.rgbAssets || {}).forEach((scope) => scopes.add(scope))
  manifest.value.groups.forEach((group) => {
    Object.keys(group.assets || {}).forEach((scope) => scopes.add(scope))
  })
  return Array.from(scopes)
})

const presetOptions = computed(() =>
  Object.entries(manifest.value.presets).map(([value, preset]) => ({
    label: preset.label || PRESET_LABEL_MAP[value] || value,
    value,
  }))
)

const scopeVisible = computed(() => scopeOptions.value.length > 1)
const thermalDisplayModeVisible = computed(() => selectedMode.value === 'thermal')
const ablationVisible = computed(() => selectedMode.value === 'thermal')
const activeGroup = computed(
  () => manifest.value.groups.find((group) => group.id === selectedGroupId.value) ?? manifest.value.groups[0]
)
const activePreset = computed(
  () => manifest.value.presets[selectedPresetId.value] ?? manifest.value.presets.oblique
)
const assetUrl = computed(() => {
  if (selectedMode.value === 'rgb') {
    return manifest.value.rgbAssets?.[selectedScopeId.value] ?? ''
  }
  return activeGroup.value?.assets?.[selectedScopeId.value] ?? ''
})

function normalizeManifest(raw) {
  const groups = Array.isArray(raw?.groups) && raw.groups.length ? raw.groups : defaultManifest.groups
  const presets =
    raw?.presets && typeof raw.presets === 'object' && Object.keys(raw.presets).length
      ? raw.presets
      : defaultManifest.presets
  const rgbAssets = raw?.rgbAssets && typeof raw.rgbAssets === 'object' ? raw.rgbAssets : defaultManifest.rgbAssets

  const normalizedPresets = Object.fromEntries(
    Object.entries(presets).map(([presetId, presetValue]) => {
      const fallbackPreset = defaultManifest.presets[presetId] || {}
      const normalizedPreset = {
        ...fallbackPreset,
        ...(presetValue || {}),
      }

      if (!normalizedPreset.label) {
        normalizedPreset.label = PRESET_LABEL_MAP[presetId] || presetId
      }

      if (!normalizedPreset.note) {
        normalizedPreset.note = PRESET_NOTE_MAP[presetId] || ''
      }

      return [presetId, normalizedPreset]
    })
  )

  const availableScopes = Array.from(
    new Set([
      ...Object.keys(rgbAssets),
      ...groups.flatMap((group) => Object.keys(group.assets || {})),
    ])
  )

  return {
    defaultMode: raw?.defaultMode === 'rgb' ? 'rgb' : 'thermal',
    defaultGroup: groups.some((group) => group.id === raw?.defaultGroup)
      ? raw.defaultGroup
      : defaultManifest.defaultGroup,
    defaultScope: availableScopes.includes(raw?.defaultScope)
      ? raw.defaultScope
      : availableScopes[0] ?? defaultManifest.defaultScope,
    rgbAssets,
    groups,
    presets: normalizedPresets,
  }
}

function resetSelections() {
  selectedMode.value = manifest.value.defaultMode
  selectedGroupId.value = manifest.value.defaultGroup
  selectedScopeId.value = manifest.value.defaultScope
  selectedPresetId.value = 'oblique'
  selectedThermalDisplayMode.value = 'postprocess'
}

function ensureSelectionsValid() {
  if (!manifest.value.groups.some((group) => group.id === selectedGroupId.value)) {
    selectedGroupId.value = manifest.value.defaultGroup
  }

  if (!scopeOptions.value.includes(selectedScopeId.value)) {
    selectedScopeId.value = manifest.value.defaultScope
  }

  if (!Object.keys(manifest.value.presets).includes(selectedPresetId.value)) {
    selectedPresetId.value = 'oblique'
  }
}

async function loadManifest() {
  manifestMessage.value = ''

  try {
    const response = await fetch('/3dgs/scene-metadata.json', { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`manifest status ${response.status}`)
    }

    manifest.value = normalizeManifest(await response.json())
  } catch (error) {
    manifest.value = structuredClone(defaultManifest)
    manifestMessage.value = '暂未读取到 /3dgs/scene-metadata.json，页面先使用内置默认配置。'
  } finally {
    ensureSelectionsValid()
    manifestReady.value = true
  }
}

function handleViewerError(message) {
  viewerMessage.value = message
}

function handleViewerLoadingChange(value) {
  viewerLoading.value = value
}

function handleCameraChange(snapshot) {
  cameraState.value = snapshot
}

onMounted(loadManifest)
</script>

<template>
  <main class="project-3dgs-page site-page">
    <div class="page-shell project-3dgs-page__shell">
      <SiteHeader
        :site-name="profile.name"
        :location="profile.location"
        :navigation-items="navigationItems"
      />

      <section class="project-3dgs-hero shell-surface motion-rise">
        <div class="project-3dgs-hero__content">
          <p class="eyebrow">3DGS Project</p>
          <h1 class="project-3dgs-hero__title">基于 3DGS 的三维热场重建</h1>
          <p class="project-3dgs-hero__summary">
            把二维热红外难以完整表达的建筑立面、树冠和阴影热差，重新放回三维空间里观察。这个页面只保留最必要的交互:
            拖动模型、切换 RGB / 热场、切换消融实验，并在同一视角下直接比较结果差异。
          </p>
          <div class="project-3dgs-hero__tags">
            <a-tag color="orange">3DGS</a-tag>
            <a-tag color="green">三维热场重建</a-tag>
            <a-tag color="blue">消融实验对比</a-tag>
          </div>
        </div>

        <div class="project-3dgs-hero__aside">
          <div class="project-3dgs-metric-grid">
            <article
              v-for="metric in headlineMetrics"
              :key="metric.label"
              class="project-3dgs-metric"
            >
              <p>{{ metric.label }}</p>
              <strong>{{ metric.value }}</strong>
            </article>
          </div>

          <a-alert
            type="info"
            show-icon
            :message="manifestMessage || '页面默认对齐论文主评测口径，并优先展示最值得比较的 5 个实验组。'"
          />
        </div>
      </section>

      <section class="project-3dgs-workbench shell-surface motion-rise motion-rise--2">
        <div class="project-3dgs-workbench__viewer">
          <div class="project-3dgs-viewer-frame">
            <Project3dgsViewer
              :asset-url="assetUrl"
              :mode="selectedMode"
              :thermal-display-mode="selectedThermalDisplayMode"
              :preset="activePreset"
              @camera-change="handleCameraChange"
              @error="handleViewerError"
              @loading-change="handleViewerLoadingChange"
            />
          </div>

          <div class="project-3dgs-viewer-note">
            <p class="eyebrow">Viewer Note</p>
            <p>
              默认视角参考你前面的两个 Python viewer 脚本:
              `view_rgb_3dgs.py` 负责斜视 orbit 观察，`view_phase5_roi_splat.py` 负责更接近论文展示的顶视比较逻辑。
              切换实验组时保持当前视角，不重新对齐。
            </p>
            <p v-if="viewerLoading" class="project-3dgs-viewer-note__status">当前状态: 正在切换资源</p>
            <p v-else-if="viewerMessage" class="project-3dgs-viewer-note__status project-3dgs-viewer-note__status--warn">
              当前状态: {{ viewerMessage }}
            </p>
          </div>
        </div>

        <aside class="project-3dgs-panel">
          <a-card class="ant-surface-card project-3dgs-panel__card" :bordered="false">
            <template #title>
              <div class="project-3dgs-panel__title-row">
                <span>交互控制</span>
                <a-button type="text" size="small" @click="resetSelections">重置</a-button>
              </div>
            </template>

            <div  class="project-3dgs-panel__group">
              <p class="eyebrow">显示模式</p>
              <a-segmented
                class="project-3dgs-segmented"
                :value="selectedMode"
                :options="modeOptions"
                @change="selectedMode = $event"
              />
            </div>

            <div v-if="thermalDisplayModeVisible" class="project-3dgs-panel__group">
              <p class="eyebrow">热场显示</p>
              <a-segmented
                class="project-3dgs-segmented"
                :value="selectedThermalDisplayMode"
                :options="thermalDisplayModeOptions"
                @change="selectedThermalDisplayMode = $event"
              />
              <p class="project-3dgs-panel__note">
                {{
                  selectedThermalDisplayMode === 'postprocess'
                    ? '对齐版会先完成灰度热场混合，再对最终图像执行 JET 后处理。'
                    : '原始版直接显示资源里烘焙过的伪彩高斯颜色，便于和旧效果对比。'
                }}
              </p>
            </div>

            <div v-if="ablationVisible" class="project-3dgs-panel__group">
              <p class="eyebrow">消融实验</p>
              <div class="project-3dgs-group-list">
                <button
                  v-for="group in manifest.groups"
                  :key="group.id"
                  type="button"
                  class="project-3dgs-group-button"
                  :class="{ 'is-active': selectedGroupId === group.id }"
                  @click="selectedGroupId = group.id"
                >
                  <span class="project-3dgs-group-button__label">{{ group.label }}</span>
                  <span class="project-3dgs-group-button__alias">{{ group.alias }}</span>
                </button>
              </div>
              <p class="project-3dgs-panel__note">{{ activeGroup?.description }}</p>
            </div>

            <div class="project-3dgs-panel__group">
              <p class="eyebrow">视角预设</p>
              <a-segmented
                class="project-3dgs-segmented"
                :value="selectedPresetId"
                :options="presetOptions"
                @change="selectedPresetId = $event"
              />
              <p class="project-3dgs-panel__note">{{ activePreset?.note }}</p>
            </div>

            <div v-if="scopeVisible" class="project-3dgs-panel__group">
              <p class="eyebrow">场景范围</p>
              <a-segmented
                class="project-3dgs-segmented"
                :value="selectedScopeId"
                :options="scopeOptions.map((scope) => ({ label: scope.toUpperCase(), value: scope }))"
                @change="selectedScopeId = $event"
              />
            </div>

            <div class="project-3dgs-panel__group project-3dgs-panel__group--summary">
              <p class="eyebrow">当前选择</p>
              <p class="project-3dgs-panel__summary-line">
                <strong>{{ selectedMode }}</strong>
                <span v-if="ablationVisible"> / {{ activeGroup?.label }}</span>
              </p>
              <p v-if="thermalDisplayModeVisible" class="project-3dgs-panel__summary-line">
                <strong>{{ selectedThermalDisplayMode === 'postprocess' ? '对齐版' : '原始版' }}</strong>
                <span> / 热场视觉链路</span>
              </p>
              <p class="project-3dgs-panel__summary-line">
                <strong>{{ activePreset?.label }}</strong>
                <span> / {{ selectedScopeId.toUpperCase() }}</span>
              </p>
              <p v-if="cameraState" class="project-3dgs-panel__summary-copy">
                当前视角已锁定在同一相机上下文，可直接切换实验组比较。
              </p>
            </div>
          </a-card>
        </aside>
      </section>

      <section class="project-3dgs-methods motion-rise motion-rise--3">
        <a-row :gutter="[18, 18]">
          <a-col
            v-for="card in methodCards"
            :key="card.title"
            :xs="24"
            :md="8"
          >
            <a-card class="ant-surface-card project-3dgs-method-card" :bordered="false">
              <p class="eyebrow">Method</p>
              <h2>{{ card.title }}</h2>
              <p>{{ card.body }}</p>
            </a-card>
          </a-col>
        </a-row>
      </section>

      <section class="project-3dgs-bottom motion-rise motion-rise--3">
        <a-card v-if="ablationVisible" class="ant-surface-card project-3dgs-result-card" :bordered="false">
          <template #title>
            <div class="project-3dgs-section-title">
              <span>消融实验结果</span>
              <span>主评测口径下的论文摘录</span>
            </div>
          </template>

          <a-table
            :data-source="ablationRows"
            :pagination="false"
            :row-key="(record) => record.id"
            size="middle"
            :scroll="{ x: 760 }"
          >
            <a-table-column key="label" title="方法" data-index="label" />
            <a-table-column key="mae" title="MAE" data-index="mae" />
            <a-table-column key="rmse" title="RMSE" data-index="rmse" />
            <a-table-column key="psnr" title="PSNR" data-index="psnr" />
            <a-table-column key="ssim" title="SSIM" data-index="ssim" />

            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'label'">
                <div class="project-3dgs-table-label">
                  <strong>{{ record.label }}</strong>
                  <span>{{ record.id }}</span>
                </div>
              </template>
              <template v-else>
                <span>{{ record[column.key].toFixed(5) }}</span>
              </template>
            </template>
          </a-table>
        </a-card>

        <a-card class="ant-surface-card project-3dgs-limit-card" :bordered="false">
          <template #title>
            <div class="project-3dgs-section-title">
              <span>局限说明</span>
              <span>页面保留论文中已明确写出的边界</span>
            </div>
          </template>

          <a-list :data-source="limitations">
            <template #renderItem="{ item }">
              <a-list-item>{{ item }}</a-list-item>
            </template>
          </a-list>
        </a-card>
      </section>
    </div>
  </main>
</template>

<style scoped>
.project-3dgs-page {
  position: relative;
  isolation: isolate;
  overflow-x: clip;
}

.project-3dgs-page::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 12% 8%, rgba(180, 85, 45, 0.11), transparent 16%),
    radial-gradient(circle at 84% 16%, rgba(31, 123, 104, 0.1), transparent 18%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 62%);
  pointer-events: none;
}

.project-3dgs-page__shell {
  gap: 1rem;
}

.project-3dgs-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(18rem, 0.9fr);
  gap: 1rem 1.25rem;
  padding: clamp(1.2rem, 3vw, 1.9rem);
}

.project-3dgs-hero__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 6vw, 4.7rem);
  line-height: 0.98;
  letter-spacing: -0.05em;
}

.project-3dgs-hero__summary {
  max-width: 42rem;
  margin: 1rem 0 0;
  color: var(--muted);
  line-height: 1.75;
}

.project-3dgs-hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 1rem;
}

.project-3dgs-hero__aside {
  display: grid;
  gap: 0.85rem;
  align-self: end;
}

.project-3dgs-metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.project-3dgs-metric {
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
}

.project-3dgs-metric p {
  margin: 0;
  color: var(--muted);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.project-3dgs-metric strong {
  display: block;
  margin-top: 0.34rem;
  font-size: 1.15rem;
}

.project-3dgs-workbench {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(18rem, 0.92fr);
  gap: 1rem;
  padding: clamp(1rem, 2.8vw, 1.6rem);
}

.project-3dgs-workbench__viewer {
  display: grid;
  gap: 0.8rem;
  min-width: 0;
}

.project-3dgs-viewer-frame {
  min-height: clamp(24rem, 64vh, 43rem);
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at top left, rgba(180, 85, 45, 0.08), transparent 24%),
    radial-gradient(circle at bottom right, rgba(31, 123, 104, 0.08), transparent 28%),
    var(--panel);
}

.project-3dgs-viewer-note {
  padding: 0.85rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
}

.project-3dgs-viewer-note p {
  margin: 0;
  color: var(--muted);
  line-height: 1.65;
}

.project-3dgs-viewer-note__status {
  margin-top: 0.55rem;
}

.project-3dgs-viewer-note__status--warn {
  color: var(--accent-strong);
}

.project-3dgs-panel__card {
  height: 100%;
}

.project-3dgs-panel__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.project-3dgs-panel__group {
  display: grid;
  gap: 0.65rem;
  padding: 0.9rem 0;
  border-top: 1px solid var(--line);
}

.project-3dgs-panel__group:first-of-type {
  padding-top: 0;
  border-top: 0;
}

.project-3dgs-panel__group--summary {
  padding-bottom: 0;
}

.project-3dgs-segmented {
  width: 100%;
}

.project-3dgs-group-list {
  display: grid;
  gap: 0.55rem;
}

.project-3dgs-group-button {
  display: grid;
  gap: 0.2rem;
  width: 100%;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--panel-soft);
  color: var(--text);
  text-align: left;
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out-quint),
    border-color var(--duration-fast) var(--ease-out-quart),
    background-color var(--duration-base) var(--ease-out-quart);
}

.project-3dgs-group-button:hover,
.project-3dgs-group-button:focus-visible {
  transform: translateY(-1px);
  border-color: var(--accent-soft);
}

.project-3dgs-group-button.is-active {
  border-color: color-mix(in srgb, var(--accent) 68%, var(--line));
  background: linear-gradient(135deg, var(--accent-soft), var(--panel-soft));
}

.project-3dgs-group-button__label {
  font-weight: 600;
}

.project-3dgs-group-button__alias {
  color: var(--muted);
  font-size: 0.84rem;
}

.project-3dgs-panel__note,
.project-3dgs-panel__summary-copy {
  margin: 0;
  color: var(--muted);
  line-height: 1.65;
}

.project-3dgs-panel__summary-line {
  margin: 0;
}

.project-3dgs-panel__summary-line strong {
  color: var(--text);
}

.project-3dgs-methods,
.project-3dgs-bottom {
  display: grid;
  gap: 1rem;
}

.project-3dgs-method-card {
  height: 100%;
}

.project-3dgs-method-card h2 {
  margin: 0;
  font-size: 1.2rem;
}

.project-3dgs-method-card p {
  margin: 0.75rem 0 0;
  color: var(--muted);
  line-height: 1.7;
}

.project-3dgs-bottom {
  grid-template-columns: minmax(0, 1.42fr) minmax(16rem, 0.88fr);
  align-items: start;
}

.project-3dgs-section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.project-3dgs-section-title span:last-child {
  color: var(--muted);
  font-size: 0.9rem;
}

.project-3dgs-table-label {
  display: grid;
  gap: 0.12rem;
}

.project-3dgs-table-label span {
  color: var(--muted);
  font-size: 0.82rem;
}

.project-3dgs-limit-card :deep(.ant-list-item) {
  padding-inline: 0;
  color: var(--muted);
  border-bottom-color: var(--line);
}

@media (max-width: 1080px) {
  .project-3dgs-hero,
  .project-3dgs-workbench,
  .project-3dgs-bottom {
    grid-template-columns: 1fr;
  }

  .project-3dgs-metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .project-3dgs-hero,
  .project-3dgs-workbench {
    padding: 1rem;
  }

  .project-3dgs-metric-grid {
    grid-template-columns: 1fr;
  }

  .project-3dgs-section-title {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
