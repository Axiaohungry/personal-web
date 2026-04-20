<script setup>
// 右侧信号栏组件负责兼容不同案例页传进来的指标字段名，
// 把 label / value / note / subtext 统一整理成一个可重复渲染的卡片结构。
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

function getSignalLabel(item) {
  return item?.label ?? item?.title ?? item?.name ?? ''
}

function getSignalValue(item) {
  return item?.value ?? item?.metric ?? item?.stat ?? ''
}

function hasSignalValue(item) {
  const value = item?.value ?? item?.metric ?? item?.stat
  return value !== undefined && value !== null && value !== ''
}

function getSignalNote(item) {
  return item?.note ?? ''
}

function getSignalSubtext(item) {
  return item?.subtext ?? item?.detail ?? ''
}

function getSignalKey(item, index) {
  // 这里优先使用最稳定的业务文本作为 key，兜底再回退到索引。
  return item?.label ?? item?.title ?? item?.name ?? index
}
</script>

<template>
  <aside v-if="props.items.length" class="project-case-signal-rail">
    <div class="project-case-signal-rail__list">
      <article
        v-for="(item, index) in props.items"
        :key="getSignalKey(item, index)"
        class="project-case-signal-rail__item"
        :class="{ 'project-case-signal-rail__item--featured': item?.featured }"
      >
        <p v-if="getSignalLabel(item)" class="project-case-signal-rail__label">
          {{ getSignalLabel(item) }}
        </p>

        <p v-if="hasSignalValue(item)" class="project-case-signal-rail__value">
          {{ getSignalValue(item) }}
        </p>

        <p v-if="getSignalNote(item)" class="project-case-signal-rail__note">
          {{ getSignalNote(item) }}
        </p>

        <p v-if="getSignalSubtext(item)" class="project-case-signal-rail__subtext">
          {{ getSignalSubtext(item) }}
        </p>
      </article>
    </div>
  </aside>
</template>
