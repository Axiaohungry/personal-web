<script setup>
defineProps({
  sectionId: {
    type: String,
    default: '',
  },
  eyebrow: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    default: '',
  },
  bullets: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section :id="sectionId || undefined" class="study-article-section ant-surface-card">
    <header class="study-article-section__header">
      <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
      <h2 class="study-article-section__title">{{ title }}</h2>
      <p v-if="summary" class="study-article-section__summary">{{ summary }}</p>
    </header>

    <ul v-if="bullets.length" class="study-article-section__list">
      <li v-for="bullet in bullets" :key="bullet">
        {{ bullet }}
      </li>
    </ul>

    <div v-if="$slots.default" class="study-article-section__body">
      <slot />
    </div>
  </section>
</template>
