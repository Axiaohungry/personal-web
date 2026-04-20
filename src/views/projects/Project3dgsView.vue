<script setup>
import { computed, onMounted, ref } from 'vue'

import SiteHeader from '@/components/SiteHeader.vue'
import Project3dgsLineChart from '@/components/projects/Project3dgsLineChart.vue'
import Project3dgsViewer from '@/components/projects/Project3dgsViewer.vue'
import { navigationItems } from '@/data/navigation.js'
import { profile } from '@/data/profile.js'

// 3DGS 项目页负责把实验资源、视角预设、图表和说明组织成一个可切换的研究展示界面。
// 真正的渲染细节在 Project3dgsViewer 里，这里主要维护“当前看哪组结果、用什么模式看”。
const PRESET_LABEL_MAP = {
  oblique: '斜视',
  topdown: '顶视',
}

const PRESET_NOTE_MAP = {
  oblique: '斜视更容易先建立对场景和热分布的整体印象。',
  topdown: '顶视更像我整理结果时常用的角度，适合直接回到差别本身。',
}

const GROUP_PRESENTATION_MAP = {
  full_zscore: {
    buttonTitle: '最佳结果',
    buttonNote: '完整版本',
    description: '这是我最满意的一组，整体更稳，细节也更接近真实热分布。',
  },
  full: {
    buttonTitle: '基线对照',
    buttonNote: '未做标准化',
    description: '关键信息都保留了，但少了一步整理，结果会更容易发散。',
  },
  sem_only: {
    buttonTitle: '语义版本',
    buttonNote: '只看材质',
    description: '只留下语义和材质线索后，模型还能抓住一部分冷热关系，但层次会明显变薄。',
  },
  shadow_only: {
    buttonTitle: '光照版本',
    buttonNote: '只看明暗',
    description: '只依赖光照和遮挡时，模型还能保留趋势，但细节会更粗一些。',
  },
  shuffled: {
    buttonTitle: '打乱对照',
    buttonNote: '破坏对应',
    description: '当空间对应被打乱后，结果很快失去秩序，也更能说明这些线索为什么不能随便替换。',
  },
}

const SCOPE_LABEL_MAP = {
  full_masked: '完整区域',
}

const headlineMetrics = [
  { label: 'RMSE', value: '-8.41%' },
  { label: 'PSNR', value: '+0.763 dB' },
  { label: 'SSIM', value: '0.65251 -> 0.71619' },
]

const methodCards = [
  {
    title: '几何基底',
    body: '我先用 RGB 倾斜影像把场景重建出来，再把热信息放回这套稳定的三维骨架里。',
  },
  {
    title: '物理先验',
    body: '法向、高度、坡度、光照遮挡和材质语义这些线索，会一起帮助模型判断哪里该更热、哪里该更冷。',
  },
  {
    title: '温度学习',
    body: '最后由 ThermalAttrNet 学习每个高斯基元的温度属性，让热场能在三维空间里连续地表达出来。',
  },
]

const paperHighlights = [
  {
    title: '真实场景',
    body: '我没有挑一个干净、规整的演示场景，而是直接拿学校图书馆周边来做。建筑、道路和植被交错在一起，空间关系复杂，这样的结果对我来说更有说服力。',
  },
  {
    title: '不只看热图',
    body: '我不想让模型只是去背一张顶视热图，所以把几何起伏、明暗关系、材质差别和受光方向一起交给它，让它沿着场景结构去理解温度变化。',
  },
  {
    title: '反复核对',
    body: '我不会只看最后那一张结果表，而是会换不同边界、不同误差口径，再回头看训练过程里的变化。对我来说，结论能不能在这些来回切换里站住，比单项数字更重要。',
  },
]

const ablationRows = [
  { id: 'full_zscore', label: '最佳模型', chartLabel: '最佳', mae: 0.10394, rmse: 0.12678, psnr: 17.93915, ssim: 0.71619 },
  { id: 'full', label: '全要素基线', chartLabel: '基线', mae: 0.10577, rmse: 0.13842, psnr: 17.17635, ssim: 0.65251 },
  { id: 'sem_only', label: '仅语义先验', chartLabel: '语义', mae: 0.10812, rmse: 0.13999, psnr: 17.07782, ssim: 0.61423 },
  { id: 'shadow_only', label: '仅光照先验', chartLabel: '光照', mae: 0.11861, rmse: 0.15141, psnr: 16.39681, ssim: 0.58603 },
  { id: 'shuffled', label: '空间一致性破坏', chartLabel: '打乱', mae: 0.13641, rmse: 0.16674, psnr: 15.55935, ssim: 0.49622 },
]

const metricCharts = [
  { title: 'MAE', metricKey: 'mae', accent: '#b4552d', betterDirection: 'lower' },
  { title: 'RMSE', metricKey: 'rmse', accent: '#8f6f43', betterDirection: 'lower' },
  { title: 'PSNR', metricKey: 'psnr', accent: '#1f7b68', betterDirection: 'higher' },
  { title: 'SSIM', metricKey: 'ssim', accent: '#446b5d', betterDirection: 'higher' },
]

const limitations = [
  '这套结果主要依赖顶视热红外作为真值，所以建筑立面的热分布还不够扎实，更接近结合几何与先验后的推断。',
  '跨模态配准误差、材料热物性的差异，以及光照变化的简化处理，仍然会在局部留下偏差。',
]

const defaultManifest = {
  defaultMode: 'thermal',
  defaultGroup: 'full_zscore',
  defaultScope: 'full_masked',
  rgbAssets: {
    full_masked: '/3dgs/rgb/full_masked.splat',
  },
  groups: [
    {
      id: 'full_zscore',
      label: '最佳模型',
      alias: 'full_zscore',
      description: '完整引入多源先验并做标准化处理，是当前结果最稳定的一组。',
      assets: {
        full_masked: '/3dgs/thermal/full_zscore/full_masked.splat',
      },
    },
    {
      id: 'full',
      label: '全要素基线',
      alias: 'full',
      description: '保留全部先验输入，但不做标准化，用来观察归一化带来的收益。',
      assets: {
        full_masked: '/3dgs/thermal/full/full_masked.splat',
      },
    },
    {
      id: 'sem_only',
      label: '仅语义先验',
      alias: 'sem_only',
      description: '只保留语义与材质相关先验，用来观察语义信息单独发挥作用时的表现。',
      assets: {
        full_masked: '/3dgs/thermal/sem_only/full_masked.splat',
      },
    },
    {
      id: 'shadow_only',
      label: '仅光照先验',
      alias: 'shadow_only',
      description: '只保留光照与遮挡相关先验，用来观察光照信息单独贡献的边界。',
      assets: {
        full_masked: '/3dgs/thermal/shadow_only/full_masked.splat',
      },
    },
    {
      id: 'shuffled',
      label: '空间一致性破坏',
      alias: 'shuffled',
      description: '打乱先验与空间位置的对应关系，用来验证空间一致性对结果的重要性。',
      assets: {
        full_masked: '/3dgs/thermal/shuffled/full_masked.splat',
      },
    },
  ],
  presets: {
    oblique: {
      label: '斜视',
      note: '斜视更容易先建立对场景和热分布的整体印象。',
      position: [1.4, 0.9, 1.2],
      target: [0.0, 0.0, 0.0],
      up: [0.0, 1.0, 0.0],
    },
    topdown: {
      label: '顶视',
      note: '顶视更像我整理结果时常用的角度，适合直接回到差别本身。',
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
const selectedChartMetricKey = ref('rmse')
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
const chartMetricOptions = [
  { label: 'RMSE', value: 'rmse' },
  { label: 'MAE', value: 'mae' },
  { label: 'PSNR', value: 'psnr' },
  { label: 'SSIM', value: 'ssim' },
]

function formatScopeLabel(scope) {
  if (!scope) return ''
  return SCOPE_LABEL_MAP[scope] ?? scope.replaceAll('_', ' ').toUpperCase()
}

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
const presentedGroups = computed(() =>
  manifest.value.groups.map((group) => {
    const presentation = GROUP_PRESENTATION_MAP[group.id] ?? {}

    return {
      ...group,
      buttonTitle: presentation.buttonTitle ?? group.label,
      buttonNote: presentation.buttonNote ?? group.alias,
      description: presentation.description ?? group.description ?? '',
    }
  })
)
const activeGroup = computed(
  () => presentedGroups.value.find((group) => group.id === selectedGroupId.value) ?? presentedGroups.value[0]
)
const activePreset = computed(
  () => manifest.value.presets[selectedPresetId.value] ?? manifest.value.presets.oblique
)
const activeMetricChart = computed(
  () => metricCharts.find((chart) => chart.metricKey === selectedChartMetricKey.value) ?? metricCharts[1]
)
const activeModeLabel = computed(
  () => modeOptions.find((option) => option.value === selectedMode.value)?.label ?? selectedMode.value
)
const activeThermalDisplayModeLabel = computed(
  () =>
    thermalDisplayModeOptions.find((option) => option.value === selectedThermalDisplayMode.value)?.label ??
    selectedThermalDisplayMode.value
)
const activeScopeLabel = computed(() => formatScopeLabel(selectedScopeId.value))
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
  selectedChartMetricKey.value = 'rmse'
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
    manifestMessage.value = '配置文件暂时没有读到，页面先按默认内容展示。'
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
            我想把二维热红外里零散的温度信息，重新放回真实的三维空间里理解。
            这个页面保留了这项工作最值得看的几层内容: 模型本身、热场与 RGB 的切换，以及不同实验版本之间的差别，让它不只停留在论文里。
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
            :message="manifestMessage || '页面默认落在最能代表这项工作的 5 组结果上。'"
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
              如果是第一次看这页，我会更建议先从斜视开始，它更容易建立对场景起伏和热分布的直觉；
              顶视则更像我平时整理结果时会用的角度，适合直接回到差别本身。手机上也可以直接操作，切换不同版本时，页面会尽量把视角留在原处，方便连续比较。
            </p>
            <p v-if="viewerLoading" class="project-3dgs-viewer-note__status">模型切换中</p>
            <p v-else-if="viewerMessage" class="project-3dgs-viewer-note__status project-3dgs-viewer-note__status--warn">
              {{ viewerMessage }}
            </p>
          </div>
        </div>

        <aside class="project-3dgs-panel">
          <a-card class="ant-surface-card project-3dgs-panel__card" :bordered="false">
            <template #title>
              <div class="project-3dgs-panel__title-row">
                <span>查看方式</span>
                <a-button type="text" size="small" @click="resetSelections">回到默认</a-button>
              </div>
            </template>

            <div class="project-3dgs-panel__group">
              <p class="eyebrow">查看内容</p>
              <a-segmented
                class="project-3dgs-segmented"
                :value="selectedMode"
                :options="modeOptions"
                @change="selectedMode = $event"
              />
            </div>

            <div v-if="thermalDisplayModeVisible" class="project-3dgs-panel__group">
              <p class="eyebrow">热场呈现</p>
              <a-segmented
                class="project-3dgs-segmented"
                :value="selectedThermalDisplayMode"
                :options="thermalDisplayModeOptions"
                @change="selectedThermalDisplayMode = $event"
              />
              <p class="project-3dgs-panel__note">
                {{
                  selectedThermalDisplayMode === 'postprocess'
                    ? '这一版的颜色更克制，也更接近我想呈现的热分布层次。'
                    : '这一版保留了原始伪彩效果，方便和早期结果直接对照。'
                }}
              </p>
            </div>

            <div class="project-3dgs-panel__paired">
              <div v-if="ablationVisible" class="project-3dgs-panel__group project-3dgs-panel__group--paired">
                <p class="eyebrow">实验版本</p>
                <div class="project-3dgs-group-list">
                  <button
                    v-for="group in presentedGroups"
                    :key="group.id"
                    type="button"
                    class="project-3dgs-group-button project-3dgs-group-button--compact"
                    :class="{ 'is-active': selectedGroupId === group.id }"
                    @click="selectedGroupId = group.id"
                  >
                    <span class="project-3dgs-group-button__label">{{ group.buttonTitle }}</span>
                    <span class="project-3dgs-group-button__note">{{ group.buttonNote }}</span>
                  </button>
                </div>
                <p class="project-3dgs-panel__note">{{ activeGroup?.description }}</p>
              </div>

              <div class="project-3dgs-panel__stack">
                <div class="project-3dgs-panel__group project-3dgs-panel__group--paired project-3dgs-panel__group--no-divider">
                  <p class="eyebrow">观看视角</p>
                  <a-segmented
                    class="project-3dgs-segmented"
                    :value="selectedPresetId"
                    :options="presetOptions"
                    @change="selectedPresetId = $event"
                  />
                  <p class="project-3dgs-panel__note">{{ activePreset?.note }}</p>
                </div>

                <div class="project-3dgs-panel__group project-3dgs-panel__group--summary project-3dgs-panel__group--no-divider">
                  <p class="eyebrow">正在查看</p>
                  <p class="project-3dgs-panel__summary-line">
                    <strong>{{ activeModeLabel }}</strong>
                    <span v-if="ablationVisible"> / {{ activeGroup?.label }}</span>
                  </p>
                  <p v-if="thermalDisplayModeVisible" class="project-3dgs-panel__summary-line">
                    <strong>{{ activeThermalDisplayModeLabel }}</strong>
                    <span> / 色彩呈现</span>
                  </p>
                  <p class="project-3dgs-panel__summary-line">
                    <strong>{{ activePreset?.label }}</strong>
                    <span> / {{ activeScopeLabel }}</span>
                  </p>
                  <p v-if="cameraState" class="project-3dgs-panel__summary-copy">
                    继续切换不同版本时，视角会尽量停在同一位置。
                  </p>
                </div>
              </div>
            </div>

            <div v-if="scopeVisible" class="project-3dgs-panel__group">
              <p class="eyebrow">查看范围</p>
              <a-segmented
                class="project-3dgs-segmented"
                :value="selectedScopeId"
                :options="scopeOptions.map((scope) => ({ label: formatScopeLabel(scope), value: scope }))"
                @change="selectedScopeId = $event"
              />
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

      <section class="project-3dgs-paper-notes shell-surface motion-rise motion-rise--3">
        <div class="project-3dgs-paper-notes__header">
          <p class="eyebrow">Project Notes</p>
          <h2>如果只看图和表，还会漏掉三件事</h2>
          <p>
            它们未必会直接落进指标表里，但更能解释这项工作为什么让我觉得值得做下去。
          </p>
        </div>

        <a-row :gutter="[18, 18]">
          <a-col
            v-for="card in paperHighlights"
            :key="card.title"
            :xs="24"
            :md="8"
          >
            <a-card class="ant-surface-card project-3dgs-paper-note-card" :bordered="false">
              <p class="eyebrow">Note</p>
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
              <span>结果对比</span>
              <span>我最后保留下来的正式结果</span>
            </div>
          </template>

          <div class="project-3dgs-result-list">
            <article
              v-for="record in ablationRows"
              :key="`${record.id}-mobile`"
              class="project-3dgs-result-item"
            >
              <div class="project-3dgs-table-label">
                <strong>{{ record.label }}</strong>
                <span>{{ record.id }}</span>
              </div>

              <dl class="project-3dgs-result-item__metrics">
                <div
                  v-for="metric in metricCharts"
                  :key="`${record.id}-${metric.metricKey}`"
                >
                  <dt>{{ metric.title }}</dt>
                  <dd>{{ record[metric.metricKey].toFixed(5) }}</dd>
                </div>
              </dl>
            </article>
          </div>

          <a-table
            class="project-3dgs-result-table"
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

        <a-card v-if="ablationVisible" class="ant-surface-card project-3dgs-chart-card" :bordered="false">
          <template #title>
            <div class="project-3dgs-section-title">
              <span>单项对比</span>
              <span>拆开看会更清楚</span>
            </div>
          </template>

          <div class="project-3dgs-chart-card__content">
            <p class="project-3dgs-chart-card__intro">
              把指标拆开来看，更容易感受到每一组的差别落在什么地方，也能更快判断哪一组更稳。
            </p>

            <a-segmented
              class="project-3dgs-chart-card__segmented"
              :value="selectedChartMetricKey"
              :options="chartMetricOptions"
              @change="selectedChartMetricKey = $event"
            />

            <Project3dgsLineChart
              :title="activeMetricChart.title"
              :metric-key="activeMetricChart.metricKey"
              :rows="ablationRows"
              :accent="activeMetricChart.accent"
              :better-direction="activeMetricChart.betterDirection"
            />
          </div>
        </a-card>

        <a-card class="ant-surface-card project-3dgs-limit-card" :bordered="false">
          <template #title>
            <div class="project-3dgs-section-title">
              <span>局限说明</span>
              <span>这项工作还不够好的地方</span>
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
  overflow-x: clip;
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

.project-3dgs-hero > *,
.project-3dgs-workbench > *,
.project-3dgs-bottom > * {
  min-width: 0;
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
  min-width: 0;
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

.project-3dgs-panel__paired {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.88fr);
  gap: 0.6rem;
  align-items: start;
}

.project-3dgs-panel__stack {
  display: grid;
  gap: 0.45rem;
  min-width: 0;
}

.project-3dgs-panel__group:first-of-type {
  padding-top: 0;
  border-top: 0;
}

.project-3dgs-panel__group--paired {
  min-width: 0;
}

.project-3dgs-panel__group--no-divider {
  border-top: 0;
  padding-top: 0;
}

.project-3dgs-panel__group--paired .project-3dgs-group-list {
  gap: 0.4rem;
}

.project-3dgs-panel__group--paired .project-3dgs-group-button {
  padding: 0.64rem 0.72rem;
}

.project-3dgs-group-button--compact {
  display: grid;
  align-content: start;
  min-height: 3.55rem;
  gap: 0.08rem;
}

.project-3dgs-panel__group--summary {
  padding-bottom: 0;
}

.project-3dgs-segmented {
  width: 100%;
  max-width: 100%;
  padding: 4px;
}

.project-3dgs-segmented :deep(.ant-segmented-group) {
  display: flex;
  flex-wrap: wrap;
  min-width: 0;
}

.project-3dgs-segmented :deep(.ant-segmented-item) {
  flex: 1 1 6rem;
  min-width: 0;
}

.project-3dgs-segmented :deep(.ant-segmented-item-label) {
  white-space: normal;
  text-align: center;
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

.project-3dgs-group-button__note {
  color: var(--muted);
  font-size: 0.84rem;
}

.project-3dgs-group-button--compact .project-3dgs-group-button__label {
  font-size: 0.92rem;
  line-height: 1.2;
}

.project-3dgs-group-button--compact .project-3dgs-group-button__note {
  font-size: 0.75rem;
  line-height: 1.15;
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
.project-3dgs-paper-notes,
.project-3dgs-bottom {
  display: grid;
  gap: 1rem;
}

.project-3dgs-method-card {
  height: 100%;
}

.project-3dgs-paper-notes {
  padding: clamp(1rem, 2.6vw, 1.4rem);
}

.project-3dgs-paper-notes__header {
  display: grid;
  gap: 0.55rem;
  max-width: 44rem;
}

.project-3dgs-paper-notes__header h2 {
  margin: 0;
  font-size: clamp(1.35rem, 2.8vw, 2rem);
}

.project-3dgs-paper-notes__header p:last-child {
  margin: 0;
  color: var(--muted);
  line-height: 1.72;
}

.project-3dgs-paper-note-card {
  height: 100%;
}

.project-3dgs-method-card h2 {
  margin: 0;
  font-size: 1.2rem;
}

.project-3dgs-method-card p,
.project-3dgs-paper-note-card p {
  margin: 0.75rem 0 0;
  color: var(--muted);
  line-height: 1.7;
}

.project-3dgs-paper-note-card h2 {
  margin: 0;
  font-size: 1.16rem;
}

.project-3dgs-bottom {
  grid-template-areas:
    'result chart'
    'result limit';
  grid-template-columns: minmax(0, 1.42fr) minmax(16rem, 0.88fr);
  align-items: start;
}

.project-3dgs-result-card {
  grid-area: result;
}

.project-3dgs-limit-card {
  grid-area: limit;
}

.project-3dgs-chart-card {
  grid-area: chart;
}

.project-3dgs-chart-card__content {
  display: grid;
  gap: 0.95rem;
}

.project-3dgs-chart-card__intro {
  margin: 0;
  color: var(--muted);
  line-height: 1.72;
}

.project-3dgs-chart-card__segmented {
  width: 100%;
}

.project-3dgs-chart-card__segmented :deep(.ant-segmented-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
  min-width: 0;
}

.project-3dgs-chart-card__segmented :deep(.ant-segmented-item) {
  flex: 1 1 4.6rem;
  min-width: 0;
}

.project-3dgs-chart-card__segmented :deep(.ant-segmented-item-label) {
  text-align: center;
}

.project-3dgs-result-list {
  display: none;
}

.project-3dgs-result-item {
  display: grid;
  gap: 0.85rem;
  padding: 0.95rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
}

.project-3dgs-result-item__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem 0.6rem;
  margin: 0;
}

.project-3dgs-result-item__metrics div {
  display: grid;
  gap: 0.12rem;
}

.project-3dgs-result-item__metrics dt {
  color: var(--muted);
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.project-3dgs-result-item__metrics dd {
  margin: 0;
  font-size: 0.94rem;
  font-variant-numeric: tabular-nums;
}

.project-3dgs-result-table :deep(.ant-table-wrapper) {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}

.project-3dgs-result-table :deep(.ant-table) {
  min-width: 42rem;
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

  .project-3dgs-bottom {
    grid-template-areas:
      'result'
      'chart'
      'limit';
  }

  .project-3dgs-metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .project-3dgs-panel__paired {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
}

@media (max-width: 720px) {
  .project-3dgs-hero,
  .project-3dgs-workbench,
  .project-3dgs-bottom {
    padding: 1rem;
  }

  .project-3dgs-metric-grid {
    grid-template-columns: 1fr;
  }

  .project-3dgs-viewer-frame {
    min-height: clamp(18rem, 52vh, 26rem);
  }

  .project-3dgs-panel__title-row,
  .project-3dgs-section-title {
    flex-direction: column;
    align-items: flex-start;
  }

  .project-3dgs-panel__group {
    gap: 0.55rem;
    padding: 0.8rem 0;
  }

  .project-3dgs-panel__group--paired .project-3dgs-group-button {
    padding: 0.6rem 0.7rem;
  }

  .project-3dgs-group-button--compact {
    min-height: 3.2rem;
  }

  .project-3dgs-panel__card :deep(.ant-card-head),
  .project-3dgs-result-card :deep(.ant-card-head),
  .project-3dgs-chart-card :deep(.ant-card-head),
  .project-3dgs-limit-card :deep(.ant-card-head) {
    padding-inline: 1rem;
  }

  .project-3dgs-panel__card :deep(.ant-card-body),
  .project-3dgs-result-card :deep(.ant-card-body),
  .project-3dgs-chart-card :deep(.ant-card-body),
  .project-3dgs-limit-card :deep(.ant-card-body) {
    padding: 1rem;
  }

  .project-3dgs-result-list {
    display: grid;
    gap: 0.75rem;
  }

  .project-3dgs-result-table {
    display: none;
  }
}
</style>
