<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: [String, Array],
    required: true,
  },
})

const expanded = ref(false)
const normalizedAnswerBlocks = computed(() => {
  if (Array.isArray(props.answer)) {
    return props.answer.map((block, index) => ({
      label: block.label || `要点 ${index + 1}`,
      text: block.text || '',
      bullets: Array.isArray(block.bullets) ? block.bullets : [],
    }))
  }

  return [
    {
      label: '回答',
      text: props.answer,
      bullets: [],
    },
  ]
})

function toggle() {
  expanded.value = !expanded.value
}
</script>

<template>
  <article class="study-qa-card study-surface">
    <button
      type="button"
      class="study-qa-card__question"
      :class="{ 'is-expanded': expanded }"
      :aria-expanded="expanded"
      @click="toggle"
    >
      <span class="study-qa-card__q-label">问</span>
      <span class="study-qa-card__q-text">{{ question }}</span>
      <span class="study-qa-card__toggle" aria-hidden="true">{{ expanded ? '−' : '+' }}</span>
    </button>

    <div v-if="expanded" class="study-qa-card__answer">
      <span class="study-qa-card__a-label">答</span>
      <div class="study-qa-card__answer-body">
        <section
          v-for="block in normalizedAnswerBlocks"
          :key="block.label"
          class="study-qa-card__answer-block"
        >
          <h4 class="study-qa-card__answer-label">{{ block.label }}</h4>
          <p v-if="block.text" class="study-qa-card__a-text">{{ block.text }}</p>
          <ul v-if="block.bullets.length" class="study-qa-card__answer-list">
            <li v-for="bullet in block.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </section>
      </div>
    </div>
  </article>
</template>
