<script setup>
import { computed, inject, nextTick, ref, watch } from 'vue'

import { getGoalClampGuidance } from '@/utils/caloriePlanning.js'
import { buildEmbeddedModuleContext, buildEmbeddedModuleQuery } from '@/utils/embeddedModuleContext.js'

const props = defineProps({
  modules: {
    type: Array,
    default: () => [],
  },
  activePath: {
    type: String,
    default: '',
  },
  goal: {
    type: String,
    default: 'cut',
  },
  weeks: {
    type: Number,
    default: 8,
  },
  targetKg: {
    type: Number,
    default: 3,
  },
  context: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['select', 'update:goal', 'update:weeks', 'update:targetKg'])
const iframeRef = ref(null)
const themeMode = inject('theme-mode', {
  appearance: computed(() => 'light'),
  preferredMode: computed(() => 'system'),
})

const weekOptions = [4, 6, 8, 12].map((value) => ({
  label: `${value} 周`,
  value,
}))

const activeModule = computed(() => (
  props.modules.find((module) => module.routePath === props.activePath) || props.modules[0] || null
))

const sharedModuleContext = computed(() => buildEmbeddedModuleContext({
  context: props.context,
  goal: props.goal,
  weeks: props.weeks,
  targetKg: props.targetKg,
}))

const targetKgHint = computed(() => {
  const guidance = getGoalClampGuidance({
    goal: props.goal,
    sex: props.context.sex,
    weeks: props.weeks,
    tdee: props.context.tdee,
  })

  if (!guidance) {
    return '目标会结合当前 TDEE、周期和性别一起推算；一旦接近更稳妥的热量边界，建议就会慢慢放缓。'
  }

  return `按你现在的设置，目标变化超过 ${guidance.clampKg} kg 后，建议会先守住${guidance.guardrailLabel} ${guidance.clampCalories} kcal，这时候热量通常不会再明显${guidance.trendLabel}。`
})

const iframeSrc = computed(() => {
  if (!activeModule.value) return ''

  const search = buildEmbeddedModuleQuery({
    context: props.context,
    goal: props.goal,
    weeks: props.weeks,
    targetKg: props.targetKg,
  })

  return `${activeModule.value.href}?${search.toString()}`
})

function handleSelect(path) {
  emit('select', path)
}

async function postContext() {
  await nextTick()
  const frame = iframeRef.value
  if (!frame?.contentWindow) return

  frame.contentWindow.postMessage(
    {
      type: 'fitness-module-context',
      payload: sharedModuleContext.value,
    },
    window.location.origin
  )

  frame.contentWindow.postMessage(
    {
      type: 'site-theme-context',
      payload: {
        mode: themeMode.preferredMode.value === 'system'
          ? themeMode.appearance.value
          : themeMode.preferredMode.value,
        appearance: themeMode.appearance.value,
      },
    },
    window.location.origin
  )
}

watch(
  () => sharedModuleContext.value,
  () => postContext(),
  { deep: true }
)

watch(
  () => props.activePath,
  () => postContext()
)

watch(
  () => themeMode.appearance.value,
  () => postContext()
)
</script>

<template>
  <section class="fitness-panel modules-panel">
    <div class="fitness-panel__header modules-panel__header">
      <div>
        <p class="fitness-panel__eyebrow">Modules</p>
        <h2 class="fitness-panel__title">功能模块</h2>
      </div>
      <p class="fitness-panel__note modules-panel__note">
        上面先帮你找到一个更靠谱的起点，下面这些模块再把饮食策略、食物选择和补剂判断讲得更清楚。
      </p>
    </div>

    <div class="modules-toolbar">
      <div class="modules-toolbar__controls">
        <div class="modules-toolbar__control">
          <span class="modules-toolbar__label">目标</span>
          <a-segmented
            :value="props.goal"
            :options="[
              { label: '减脂', value: 'cut' },
              { label: '增肌', value: 'gain' }
            ]"
            @change="(value) => emit('update:goal', value)"
          />
        </div>

        <div class="modules-toolbar__control">
          <span class="modules-toolbar__label">周期</span>
          <a-select
            :value="props.weeks"
            :options="weekOptions"
            class="modules-toolbar__select"
            @change="(value) => emit('update:weeks', value)"
          />
        </div>

        <div class="modules-toolbar__control modules-toolbar__control--wide">
          <span class="modules-toolbar__label">目标变化 / kg</span>
          <div class="modules-toolbar__field-row">
            <a-input-number
              :value="props.targetKg"
              :min="1"
              :max="20"
              :step="0.5"
              class="modules-toolbar__number"
              @change="(value) => emit('update:targetKg', Number(value) || 1)"
            />
            <p class="modules-toolbar__hint modules-toolbar__hint--inline">{{ targetKgHint }}</p>
          </div>
        </div>
      </div>

      <a-alert
        class="modules-toolbar__alert"
        type="info"
        show-icon
        :message="`现在先按 ${props.goal === 'cut' ? '减脂' : '增肌'} ${props.targetKg} kg、${props.weeks} 周来推演，下面几块内容都会围绕同一个目标展开。`"
      />
    </div>

    <div class="modules-tabs" role="tablist" aria-label="Fitness workbench modules">
      <button
        v-for="module in props.modules"
        :key="module.routePath"
        type="button"
        class="module-tab"
        :class="{ 'module-tab--active': module.routePath === props.activePath }"
        role="tab"
        :aria-selected="module.routePath === props.activePath"
        :tabindex="module.routePath === props.activePath ? 0 : -1"
        @click="handleSelect(module.routePath)"
      >
        <span class="module-tab__title">{{ module.title }}</span>
        <span class="module-tab__summary">{{ module.summary }}</span>
      </button>
    </div>

    <div class="modules-frame">
      <div class="modules-frame__header">
        <div>
          <p class="modules-frame__eyebrow">Embedded Page</p>
          <h3 class="modules-frame__title">{{ activeModule?.title }}</h3>
        </div>
        <a-tag color="geekblue">TDEE {{ props.context.tdee }} kcal</a-tag>
      </div>

      <iframe
        ref="iframeRef"
        class="modules-frame__iframe"
        :src="iframeSrc"
        :title="`${activeModule?.title || '模块'} 工作台`"
        loading="lazy"
        @load="postContext"
      />
    </div>
  </section>
</template>

<style scoped>
.modules-panel__header {
  align-items: end;
}

.modules-panel__note {
  max-width: 28rem;
  margin: 0;
}

.modules-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.9fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.modules-toolbar__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.modules-toolbar__control {
  display: grid;
  gap: 0.45rem;
}

.modules-toolbar__control--wide {
  flex: 1 1 25rem;
  min-width: 20rem;
}

.modules-toolbar__field-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.modules-toolbar__hint {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--muted);
}

.modules-toolbar__hint--inline {
  flex: 1 1 16rem;
  max-width: 28rem;
}

.modules-toolbar__label,
.modules-frame__eyebrow {
  font-size: 0.82rem;
  color: var(--muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.modules-toolbar__select {
  min-width: 8rem;
}

.modules-toolbar__number {
  min-width: 8rem;
  flex: 0 0 auto;
}

.modules-toolbar__alert {
  align-self: end;
}

.modules-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.9rem;
}

.module-tab {
  display: grid;
  gap: 0.45rem;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
  color: var(--text);
  text-align: left;
  cursor: pointer;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.module-tab:hover,
.module-tab:focus-visible {
  border-color: var(--teal);
  box-shadow: 0 14px 28px rgba(15, 118, 110, 0.12);
  transform: translateY(-2px);
  outline: none;
}

.module-tab--active {
  border-color: var(--teal);
  background: linear-gradient(180deg, var(--teal-soft), var(--panel));
  box-shadow: 0 16px 32px rgba(15, 118, 110, 0.12);
}

.module-tab__title {
  font-size: 1.02rem;
  font-weight: 700;
}

.module-tab__summary {
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.45;
}

.modules-frame {
  margin-top: 1rem;
  border: 1px solid var(--line);
  border-radius: calc(var(--radius-lg) + 4px);
  overflow: hidden;
  background: var(--panel);
}

.modules-frame__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--line);
}

.modules-frame__title {
  margin: 0.2rem 0 0;
  font-size: 1.15rem;
}

.modules-frame__iframe {
  display: block;
  width: 100%;
  min-height: 1120px;
  border: 0;
  background: transparent;
}

@media (max-width: 960px) {
  .modules-toolbar,
  .modules-tabs {
    grid-template-columns: 1fr;
  }

  .modules-toolbar__field-row {
    align-items: flex-start;
  }
}

@media (max-width: 720px) {
  .modules-toolbar__controls,
  .modules-toolbar__control,
  .modules-toolbar__select,
  .modules-toolbar__number {
    width: 100%;
  }

  .modules-toolbar__control--wide {
    min-width: 0;
  }

  .modules-toolbar__field-row {
    flex-direction: column;
    align-items: stretch;
    gap: 0.55rem;
  }

  .modules-toolbar__hint--inline {
    max-width: none;
  }

  .modules-frame__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .modules-frame__iframe {
    min-height: 1320px;
  }
}
</style>
