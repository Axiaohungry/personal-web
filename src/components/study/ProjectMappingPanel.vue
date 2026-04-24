<script setup>
defineProps({
  title: {
    type: String,
    default: '项目映射',
  },
  summary: {
    type: String,
    default: '',
  },
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section class="project-mapping-panel study-surface">
    <header class="project-mapping-panel__header">
      <h2 class="project-mapping-panel__title">{{ title }}</h2>
      <p v-if="summary" class="project-mapping-panel__summary">{{ summary }}</p>
    </header>

    <div class="project-mapping-panel__list">
      <article
        v-for="item in items"
        :key="item.title"
        class="project-mapping-panel__item"
      >
        <div class="project-mapping-panel__topic">
          <p class="project-mapping-panel__label">{{ item.label }}</p>
          <h3 class="project-mapping-panel__item-title">{{ item.title }}</h3>
        </div>

        <p v-if="item.description" class="project-mapping-panel__description">
          {{ item.description }}
        </p>

        <div v-if="item.tags?.length" class="project-mapping-panel__tags">
          <span v-for="tag in item.tags" :key="tag" class="study-chip">{{ tag }}</span>
        </div>
      </article>
    </div>
  </section>
</template>
