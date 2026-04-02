<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  rows: {
    type: Array,
    default: () => [],
  },
  metricKey: {
    type: String,
    required: true,
  },
  accent: {
    type: String,
    default: '#b4552d',
  },
  betterDirection: {
    type: String,
    default: 'higher',
  },
  decimals: {
    type: Number,
    default: 5,
  },
})

const chartWidth = 320
const chartHeight = 188
const chartPadding = {
  top: 18,
  right: 16,
  bottom: 40,
  left: 16,
}

function formatMetricValue(value, decimals = props.decimals) {
  return Number(value).toFixed(decimals)
}

const points = computed(() => {
  const safeRows = Array.isArray(props.rows) ? props.rows : []
  if (!safeRows.length) {
    return []
  }

  const metricValues = safeRows.map((row) => Number(row[props.metricKey] ?? 0))
  const rawMin = Math.min(...metricValues)
  const rawMax = Math.max(...metricValues)
  const span = Math.max(rawMax - rawMin, rawMax === 0 ? 1 : Math.abs(rawMax) * 0.08, 0.00001)
  const minValue = rawMin - span * 0.18
  const maxValue = rawMax + span * 0.18
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom

  return safeRows.map((row, index) => {
    const value = Number(row[props.metricKey] ?? 0)
    const ratio = metricValues.length === 1 ? 0.5 : index / (metricValues.length - 1)
    const normalizedY = (value - minValue) / (maxValue - minValue || 1)

    return {
      id: row.id,
      label: row.chartLabel || row.label,
      title: row.label,
      value,
      x: chartPadding.left + innerWidth * ratio,
      y: chartPadding.top + innerHeight * (1 - normalizedY),
      anchor: index === 0 ? 'start' : index === safeRows.length - 1 ? 'end' : 'middle',
    }
  })
})

const chartMeta = computed(() => {
  if (!points.value.length) {
    return {
      minValue: 0,
      maxValue: 0,
      bestPoint: null,
      worstPoint: null,
    }
  }

  const sortedPoints = [...points.value].sort((left, right) => left.value - right.value)
  const lowerIsBetter = props.betterDirection === 'lower'
  const bestPoint = lowerIsBetter ? sortedPoints[0] : sortedPoints.at(-1)
  const worstPoint = lowerIsBetter ? sortedPoints.at(-1) : sortedPoints[0]

  return {
    minValue: Math.min(...points.value.map((point) => point.value)),
    maxValue: Math.max(...points.value.map((point) => point.value)),
    bestPoint,
    worstPoint,
  }
})

const linePath = computed(() => {
  if (!points.value.length) return ''

  return points.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')
})

const areaPath = computed(() => {
  if (!points.value.length) return ''

  const baselineY = chartHeight - chartPadding.bottom
  const startPoint = points.value[0]
  const endPoint = points.value.at(-1)

  return [
    `M ${startPoint.x.toFixed(2)} ${baselineY.toFixed(2)}`,
    ...points.value.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
    `L ${endPoint.x.toFixed(2)} ${baselineY.toFixed(2)}`,
    'Z',
  ].join(' ')
})

const accentRgb = computed(() => {
  const hex = props.accent.replace('#', '')
  if (hex.length !== 6) {
    return '180 85 45'
  }

  const channels = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16))
  return channels.join(' ')
})

const backgroundGuides = computed(() => {
  const guideCount = 4
  const baselineY = chartHeight - chartPadding.bottom
  const topY = chartPadding.top
  const innerHeight = baselineY - topY

  return Array.from({ length: guideCount }, (_, index) => {
    const ratio = guideCount === 1 ? 0 : index / (guideCount - 1)
    return topY + innerHeight * ratio
  })
})

const summaryLabel = computed(() => (props.betterDirection === 'lower' ? '越低越好' : '越高越好'))
</script>

<template>
  <article
    class="project-3dgs-line-chart"
    :style="{
      '--project-3dgs-line-chart-accent': accent,
      '--project-3dgs-line-chart-accent-rgb': accentRgb,
    }"
  >
    <header class="project-3dgs-line-chart__header">
      <div>
        <p class="project-3dgs-line-chart__eyebrow">{{ title }}</p>
        <h3 class="project-3dgs-line-chart__summary">{{ summaryLabel }}</h3>
      </div>

      <div class="project-3dgs-line-chart__range">
        <span>{{ formatMetricValue(chartMeta.minValue) }}</span>
        <span>{{ formatMetricValue(chartMeta.maxValue) }}</span>
      </div>
    </header>

    <svg
      class="project-3dgs-line-chart__svg"
      :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
      aria-hidden="true"
    >
      <g class="project-3dgs-line-chart__guides">
        <line
          v-for="guideY in backgroundGuides"
          :key="guideY"
          :x1="chartPadding.left"
          :x2="chartWidth - chartPadding.right"
          :y1="guideY"
          :y2="guideY"
        />
      </g>

      <path
        v-if="areaPath"
        class="project-3dgs-line-chart__area"
        :d="areaPath"
      />
      <path
        v-if="linePath"
        class="project-3dgs-line-chart__line"
        :d="linePath"
      />

      <g
        v-for="point in points"
        :key="point.id"
        class="project-3dgs-line-chart__point-group"
      >
        <circle
          class="project-3dgs-line-chart__point-shadow"
          :cx="point.x"
          :cy="point.y"
          r="5.5"
        />
        <circle
          class="project-3dgs-line-chart__point"
          :cx="point.x"
          :cy="point.y"
          r="3.5"
        />
        <text
          class="project-3dgs-line-chart__label"
          :x="point.x"
          :y="chartHeight - 10"
          :text-anchor="point.anchor"
        >
          {{ point.label }}
        </text>
      </g>
    </svg>

    <dl class="project-3dgs-line-chart__stats">
      <div>
        <dt>最佳</dt>
        <dd>
          <strong>{{ chartMeta.bestPoint?.title }}</strong>
          <span>{{ formatMetricValue(chartMeta.bestPoint?.value ?? 0) }}</span>
        </dd>
      </div>
      <div>
        <dt>对照</dt>
        <dd>
          <strong>{{ chartMeta.worstPoint?.title }}</strong>
          <span>{{ formatMetricValue(chartMeta.worstPoint?.value ?? 0) }}</span>
        </dd>
      </div>
    </dl>
  </article>
</template>

<style scoped>
.project-3dgs-line-chart {
  display: grid;
  gap: 0.85rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid color-mix(in srgb, var(--project-3dgs-line-chart-accent) 35%, var(--line));
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--project-3dgs-line-chart-accent) 6%, var(--panel-soft)), var(--panel));
}

.project-3dgs-line-chart__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.project-3dgs-line-chart__eyebrow {
  margin: 0;
  color: var(--project-3dgs-line-chart-accent);
  font-size: 0.74rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.project-3dgs-line-chart__summary {
  margin: 0.28rem 0 0;
  font-size: 1rem;
}

.project-3dgs-line-chart__range {
  display: grid;
  gap: 0.22rem;
  justify-items: end;
  color: var(--muted);
  font-size: 0.82rem;
}

.project-3dgs-line-chart__svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.project-3dgs-line-chart__guides line {
  stroke: color-mix(in srgb, var(--project-3dgs-line-chart-accent) 18%, var(--line));
  stroke-width: 1;
  stroke-dasharray: 3 5;
}

.project-3dgs-line-chart__area {
  fill: rgb(var(--project-3dgs-line-chart-accent-rgb) / 0.16);
}

.project-3dgs-line-chart__line {
  fill: none;
  stroke: var(--project-3dgs-line-chart-accent);
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.project-3dgs-line-chart__point-shadow {
  fill: rgb(var(--project-3dgs-line-chart-accent-rgb) / 0.18);
}

.project-3dgs-line-chart__point {
  fill: var(--surface);
  stroke: var(--project-3dgs-line-chart-accent);
  stroke-width: 2;
}

.project-3dgs-line-chart__label {
  fill: var(--muted);
  font-size: 10px;
}

.project-3dgs-line-chart__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
  margin: 0;
}

.project-3dgs-line-chart__stats div {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.project-3dgs-line-chart__stats dt {
  color: var(--muted);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.project-3dgs-line-chart__stats dd {
  display: grid;
  gap: 0.12rem;
  margin: 0;
}

.project-3dgs-line-chart__stats strong {
  font-size: 0.95rem;
}

.project-3dgs-line-chart__stats span {
  color: var(--muted);
  font-size: 0.85rem;
}

@media (max-width: 720px) {
  .project-3dgs-line-chart {
    padding: 0.9rem;
  }

  .project-3dgs-line-chart__header {
    display: grid;
  }

  .project-3dgs-line-chart__range {
    justify-items: start;
    grid-auto-flow: column;
    justify-content: space-between;
  }
}
</style>
