<script setup>
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
