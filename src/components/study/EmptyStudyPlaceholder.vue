<script setup>
defineProps({
  title: {
    type: String,
    default: '内容还在整理中',
  },
  summary: {
    type: String,
    default: '这一节先保留清晰占位，后续会按真实学习笔记和项目映射逐步补齐。',
  },
  hint: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <section class="empty-study-placeholder ant-surface-card">
    <p class="empty-study-placeholder__eyebrow">Study In Progress</p>
    <h2 class="empty-study-placeholder__title">{{ title }}</h2>
    <p class="empty-study-placeholder__summary">{{ summary }}</p>
    <p v-if="hint" class="empty-study-placeholder__hint">{{ hint }}</p>
    <slot />
  </section>
</template>
