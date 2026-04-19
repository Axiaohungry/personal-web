<script setup>
import { computed, reactive, ref } from 'vue'

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
  '帮我把这周的计划说清楚',
  '给我一个更稳妥的饮食建议',
  '我想调整训练和恢复节奏',
  '把当前目标压缩成执行步骤',
]

const loading = ref(false)
const error = ref('')
const result = ref(null)
const question = ref('')

const contextSummary = computed(() => {
  const calories = Number(props.context.currentCalories ?? props.context.tdee)
  const currentCalories = Number.isFinite(calories) ? `${calories} kcal` : 'not set'
  return [
    `goal: ${props.goal === 'gain' ? 'gain' : 'cut'}`,
    `weeks: ${props.weeks}`,
    `target: ${props.targetKg} kg`,
    `calories: ${currentCalories}`,
  ]
})

const contextPayload = computed(() => ({
  goal: props.goal,
  weeks: props.weeks,
  targetKg: props.targetKg,
  context: props.context,
}))

const hasResult = computed(() => Boolean(result.value?.status))

function setQuickPrompt(prompt) {
  question.value = prompt
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

async function submitQuestion() {
  const prompt = normalizeText(question.value)
  if (!prompt || loading.value) return

  const requestContext = {
    ...contextPayload.value,
    question: prompt,
  }

  loading.value = true
  error.value = ''

  try {
    const response = await fetch(
      `/api/fitness/assistant?q=${encodeURIComponent(prompt)}&context=${encodeURIComponent(JSON.stringify(requestContext))}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Request failed.')
    }

    const payload = await response.json()
    result.value = payload
  } catch {
    result.value = null
    error.value = 'Assistant request failed. Please try again.'
  } finally {
    loading.value = false
  }
}

function handleSubmit() {
  void submitQuestion()
}

function resetTransientState() {
  error.value = ''
}
</script>

<template>
  <section class="fitness-panel fitness-assistant-panel shell-surface motion-rise motion-rise--3">
    <div class="fitness-panel__header fitness-assistant-panel__header">
      <div>
        <p class="fitness-panel__eyebrow">Assistant</p>
        <h2 class="fitness-panel__title">Fitness assistant</h2>
        <p class="fitness-panel__note fitness-assistant-panel__scope-note">
          Structured guidance for training, nutrition, recovery, and module routing. Not a chat toy.
        </p>
      </div>
    </div>

    <div class="fitness-assistant-panel__context" aria-label="Current fitness context">
      <span v-for="item in contextSummary" :key="item" class="fitness-assistant-panel__context-item">
        {{ item }}
      </span>
    </div>

    <form class="fitness-assistant-panel__form" @submit.prevent="handleSubmit">
      <label class="fitness-assistant-panel__field">
        <span class="fitness-assistant-panel__label">Prompt</span>
        <a-input
          v-model:value="question"
          class="fitness-assistant-panel__input"
          placeholder="Ask for a practical plan, review, or adjustment"
          :disabled="loading"
          @input="resetTransientState"
        />
      </label>

      <div class="fitness-assistant-panel__actions">
        <a-button type="primary" html-type="submit" :loading="loading" :disabled="!question.trim()">
          Submit
        </a-button>
        <p class="fitness-assistant-panel__hint">
          Uses the same-origin assistant endpoint and returns a compact fitness answer.
        </p>
      </div>
    </form>

    <div class="fitness-assistant-panel__chips" aria-label="Quick prompts">
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
      v-if="error"
      class="fitness-assistant-panel__alert"
      type="error"
      show-icon
      :message="error"
    />

    <template v-if="hasResult">
      <a-alert
        v-if="result.status === 'out_of_scope'"
        class="fitness-assistant-panel__alert"
        type="warning"
        show-icon
        message="Out of scope"
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
        message="Medical boundary"
      >
        <template #description>
          <p class="fitness-assistant-panel__state-copy">{{ result.summary }}</p>
          <ul class="fitness-assistant-panel__list">
            <li v-for="item in result.cautions" :key="item">{{ item }}</li>
          </ul>
        </template>
      </a-alert>

      <a-card v-else class="fitness-assistant-panel__result ant-surface-card" :bordered="false">
        <div class="fitness-assistant-panel__result-header">
          <div>
            <p class="fitness-panel__eyebrow">Response</p>
            <h3 class="fitness-assistant-panel__result-title">{{ result.answerTitle }}</h3>
          </div>
        </div>

        <p class="fitness-assistant-panel__summary">{{ result.summary }}</p>

        <div class="fitness-assistant-panel__result-grid">
          <section class="fitness-assistant-panel__result-block">
            <h4 class="fitness-assistant-panel__subheading">Actions</h4>
            <ul class="fitness-assistant-panel__list">
              <li v-for="item in result.actions" :key="item">{{ item }}</li>
            </ul>
          </section>

          <section class="fitness-assistant-panel__result-block">
            <h4 class="fitness-assistant-panel__subheading">Cautions</h4>
            <ul class="fitness-assistant-panel__list">
              <li v-for="item in result.cautions" :key="item">{{ item }}</li>
            </ul>
          </section>
        </div>

        <section class="fitness-assistant-panel__result-block">
          <h4 class="fitness-assistant-panel__subheading">Related modules</h4>
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
    </template>
  </section>
</template>
