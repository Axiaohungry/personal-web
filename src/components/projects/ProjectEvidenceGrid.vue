<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

function getEvidenceText(item) {
  return item.detail || item.caption || ''
}

function getEvidenceMeta(item) {
  if (item.note) {
    return item.note
  }

  if (item.src) {
    return item.src
  }

  return ''
}
</script>

<template>
  <div class="project-case-evidence-grid">
    <a-card v-for="(item, index) in props.items" :key="item.title || index" class="project-case-evidence-card ant-surface-card">
      <p v-if="item.label" class="project-case-evidence-card__label">
        {{ item.label }}
      </p>

      <h3 class="project-case-evidence-card__title">
        {{ item.title }}
      </h3>

      <p v-if="getEvidenceText(item)" class="project-case-evidence-card__detail">
        {{ getEvidenceText(item) }}
      </p>

      <p v-if="getEvidenceMeta(item)" class="project-case-evidence-card__meta">
        {{ getEvidenceMeta(item) }}
      </p>
    </a-card>
  </div>
</template>
