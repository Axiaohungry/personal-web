<script setup>
import { ref } from 'vue'

defineProps({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
})

const expanded = ref(false)

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
      <p class="study-qa-card__a-text">{{ answer }}</p>
    </div>
  </article>
</template>
