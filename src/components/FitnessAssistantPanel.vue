<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  context: {
    type: Object,
    default: () => ({}),
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
})

const quickPrompts = [
  '把这周的训练和饮食说清楚',
  '给我一个更稳妥的减脂建议',
  '我想调整恢复和补剂节奏',
  '把当前目标压成执行步骤',
]

const offDomainKeywords = [
  'printer',
  'password',
  'javascript',
  'typescript',
  'python',
  'database',
  'sql',
  'git',
  'browser',
  'wifi',
  'phone',
  'email',
  'invoice',
  'refund',
  'customer support',
  'tax',
  'resume',
  'printer jam',
  'code',
  '代码',
  '打印机',
  '密码',
  '报销',
  '发票',
  '浏览器',
]

const loading = ref(false)
const error = ref('')
const localNudge = ref('')
const result = ref(null)
const question = ref('')

const goalLabel = computed(() => (props.goal === 'gain' ? '增肌' : '减脂'))
const caloriesLabel = computed(() => {
  const calories = Number(props.context.currentCalories ?? props.context.tdee)
  return Number.isFinite(calories) ? `${calories} kcal` : '未提供'
})

const contextSummary = computed(() => [
  `目标：${goalLabel.value}`,
  `周期：${props.weeks} 周`,
  `目标变化：${props.targetKg} kg`,
  `当前热量：${caloriesLabel.value}`,
])

const hasResult = computed(() => Boolean(result.value?.status))

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isClearlyUnrelatedPrompt(prompt) {
  const text = normalizeText(prompt).toLowerCase()
  if (!text) return false
  return offDomainKeywords.some((keyword) => text.includes(keyword.toLowerCase()))
}

function setQuickPrompt(prompt) {
  question.value = prompt
  localNudge.value = ''
  error.value = ''
}

function resetTransientState() {
  error.value = ''
  localNudge.value = ''
}

function buildRequestBody(prompt) {
  return {
    question: prompt,
    context: {
      ...props.context,
      goal: props.goal,
      weeks: props.weeks,
      targetKg: props.targetKg,
    },
  }
}

async function submitQuestion() {
  const prompt = normalizeText(question.value)
  if (!prompt || loading.value) return

  result.value = null
  error.value = ''
  localNudge.value = ''

  if (isClearlyUnrelatedPrompt(prompt)) {
    localNudge.value = '这个问题更像站外内容。你可以把它收回到训练、饮食、恢复、补剂、体重管理或周期安排。'
    return
  }

  loading.value = true

  try {
    const response = await fetch('/api/fitness/assistant', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildRequestBody(prompt)),
    })

    if (!response.ok) {
      throw new Error('Request failed.')
    }

    result.value = await response.json()
  } catch {
    result.value = null
    error.value = '助手暂时不可用，请稍后再试。'
  } finally {
    loading.value = false
  }
}

function handleSubmit() {
  void submitQuestion()
}
</script>

<template>
  <section class="fitness-panel fitness-assistant-panel shell-surface motion-rise motion-rise--3">
    <div class="fitness-panel__header fitness-assistant-panel__header">
      <div>
        <p class="fitness-panel__eyebrow">训练与健康助手</p>
        <h2 class="fitness-panel__title">训练与健康助手</h2>
        <p class="fitness-panel__note fitness-assistant-panel__scope-note">
          面向训练、饮食、恢复、补剂和模块跳转的结构化建议。先给结论，再给执行路径。
        </p>
      </div>
    </div>

    <div class="fitness-assistant-panel__context" aria-label="当前目标摘要">
      <span v-for="item in contextSummary" :key="item" class="fitness-assistant-panel__context-item">
        {{ item }}
      </span>
    </div>

    <form class="fitness-assistant-panel__form" @submit.prevent="handleSubmit">
      <label class="fitness-assistant-panel__field">
        <span class="fitness-assistant-panel__label">问题</span>
        <a-input
          v-model:value="question"
          class="fitness-assistant-panel__input"
          placeholder="例如：这周应该怎么安排训练和饮食？"
          :disabled="loading"
          @input="resetTransientState"
        />
      </label>

      <div class="fitness-assistant-panel__actions">
        <a-button type="primary" html-type="submit" :loading="loading" :disabled="!question.trim()">
          发送
        </a-button>
        <p class="fitness-assistant-panel__hint">
          会通过同源接口提交到训练与健康助手，返回简洁、可执行的答案。
        </p>
      </div>
    </form>

    <div class="fitness-assistant-panel__chips" aria-label="快捷提问">
      <button
        v-for="prompt in quickPrompts"
        :key="prompt"
        type="button"
        class="fitness-assistant-panel__chip"
        :disabled="loading"
        @click="setQuickPrompt(prompt)"
      >
        {{ prompt }}
      </button>
    </div>

    <a-alert
      v-if="localNudge"
      class="fitness-assistant-panel__alert"
      type="info"
      show-icon
      message="本地提示"
      :description="localNudge"
    />

    <a-alert
      v-if="error"
      class="fitness-assistant-panel__alert"
      type="error"
      show-icon
      :message="error"
    />

    <template v-if="hasResult">
      <a-card
        v-if="result.status === 'ok'"
        class="fitness-assistant-panel__result ant-surface-card"
        :bordered="false"
      >
        <div class="fitness-assistant-panel__result-header">
          <div>
            <p class="fitness-panel__eyebrow">结果</p>
            <h3 class="fitness-assistant-panel__result-title">{{ result.answerTitle }}</h3>
          </div>
        </div>

        <p class="fitness-assistant-panel__summary">{{ result.summary }}</p>

        <div class="fitness-assistant-panel__result-grid">
          <section class="fitness-assistant-panel__result-block">
            <h4 class="fitness-assistant-panel__subheading">建议动作</h4>
            <ul class="fitness-assistant-panel__list">
              <li v-for="item in result.actions" :key="item">{{ item }}</li>
            </ul>
          </section>

          <section class="fitness-assistant-panel__result-block">
            <h4 class="fitness-assistant-panel__subheading">注意事项</h4>
            <ul class="fitness-assistant-panel__list">
              <li v-for="item in result.cautions" :key="item">{{ item }}</li>
            </ul>
          </section>
        </div>

        <section class="fitness-assistant-panel__result-block">
          <h4 class="fitness-assistant-panel__subheading">相关模块</h4>
          <div class="fitness-assistant-panel__module-links">
            <a
              v-for="module in result.relatedModules"
              :key="module.href"
              class="fitness-assistant-panel__module-link"
              :href="module.href"
            >
              {{ module.label }}
            </a>
          </div>
        </section>
      </a-card>

      <a-alert
        v-else-if="result.status === 'out_of_scope'"
        class="fitness-assistant-panel__alert"
        type="warning"
        show-icon
        message="范围外"
      >
        <template #description>
          <p class="fitness-assistant-panel__state-copy">{{ result.summary }}</p>
          <ul class="fitness-assistant-panel__list">
            <li v-for="item in result.actions" :key="item">{{ item }}</li>
          </ul>
        </template>
      </a-alert>

      <a-alert
        v-else-if="result.status === 'medical_boundary'"
        class="fitness-assistant-panel__alert"
        type="warning"
        show-icon
        message="医疗边界"
      >
        <template #description>
          <p class="fitness-assistant-panel__state-copy">{{ result.summary }}</p>
          <ul class="fitness-assistant-panel__list">
            <li v-for="item in result.cautions" :key="item">{{ item }}</li>
          </ul>
        </template>
      </a-alert>
    </template>
  </section>
</template>
