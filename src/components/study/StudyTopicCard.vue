<script setup>
defineProps({
  label: {
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
  href: {
    type: String,
    default: '',
  },
  meta: {
    type: Array,
    default: () => [],
  },
  tags: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <component
    :is="href ? 'router-link' : 'article'"
    v-bind="href ? { to: href } : {}"
    class="study-topic-card study-surface"
  >
    <p v-if="label" class="study-topic-card__label">{{ label }}</p>
    <h2 class="study-topic-card__title">{{ title }}</h2>
    <p v-if="summary" class="study-topic-card__summary">{{ summary }}</p>

    <dl v-if="meta.length" class="study-topic-card__meta">
      <div v-for="item in meta" :key="item.label" class="study-topic-card__meta-item">
        <dt>{{ item.label }}</dt>
        <dd>{{ item.value }}</dd>
      </div>
    </dl>

    <div v-if="tags.length" class="study-topic-card__tags">
      <span v-for="tag in tags" :key="tag" class="study-chip">{{ tag }}</span>
    </div>
  </component>
</template>
