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

function getEvidenceSource(item) {
  return item.src || ''
}
</script>

<template>
  <div class="project-case-evidence-grid">
    <a-card
      v-for="(item, index) in props.items"
      :key="item.title || index"
      class="project-case-evidence-card ant-surface-card"
    >
      <figure v-if="getEvidenceSource(item)" class="project-case-evidence-card__media">
        <img
          class="project-case-evidence-card__image"
          :src="getEvidenceSource(item)"
          :alt="item.alt || item.title"
        />
      </figure>

      <p v-if="item.label" class="project-case-evidence-card__label">
        {{ item.label }}
      </p>

      <h3 class="project-case-evidence-card__title">
        {{ item.title }}
      </h3>

      <p v-if="getEvidenceText(item)" class="project-case-evidence-card__detail">
        {{ getEvidenceText(item) }}
      </p>

      <p v-if="item.note" class="project-case-evidence-card__note">
        {{ item.note }}
      </p>
    </a-card>
  </div>
</template>
