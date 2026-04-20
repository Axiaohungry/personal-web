<script setup>
// 证据网格把案例里的图片/证据卡统一渲染成一个重复布局，
// 这样案例数据层只管提供标题、说明和资源地址即可。
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

function getEvidenceText(item) {
  // caption 优先作为短说明，detail 作为备用。
  return item.caption || item.detail || ''
}

function getEvidenceDetail(item) {
  if (item.caption && item.detail) {
    return item.detail
  }

  return ''
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
      :class="{ 'project-case-evidence-card--featured': item.featured }"
    >
      <figure v-if="getEvidenceSource(item)" class="project-case-evidence-media">
        <img
          class="project-case-evidence-media__image"
          :src="getEvidenceSource(item)"
          :alt="item.alt || item.title"
        />
      </figure>

      <div class="project-case-evidence-card__body">
        <p v-if="item.label" class="project-case-evidence-card__label">
          {{ item.label }}
        </p>

        <h3 class="project-case-evidence-card__title">
          {{ item.title }}
        </h3>

        <p v-if="getEvidenceText(item)" class="project-case-evidence-card__caption">
          {{ getEvidenceText(item) }}
        </p>

        <p v-if="getEvidenceDetail(item)" class="project-case-evidence-card__detail">
          {{ getEvidenceDetail(item) }}
        </p>

        <p v-if="item.note" class="project-case-evidence-card__note">
          {{ item.note }}
        </p>
      </div>
    </a-card>
  </div>
</template>
