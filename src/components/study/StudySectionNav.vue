<script setup>
const props = defineProps({
  title: {
    type: String,
    default: '章节导航',
  },
  items: {
    type: Array,
    default: () => [],
  },
  activeKey: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select'])

function handleSelect(key) {
  emit('select', key)
}
</script>

<template>
  <nav class="study-section-nav" aria-label="Study section navigation">
    <div class="study-section-nav__header">
      <p class="study-section-nav__title">{{ props.title }}</p>
      <slot name="actions" />
    </div>

    <div class="study-section-nav__items">
      <template v-for="item in props.items" :key="item.key">
        <a
          v-if="item.href"
          class="study-section-nav__item"
          :class="{ 'is-active': item.key === props.activeKey }"
          :href="item.href"
        >
          <span class="study-section-nav__item-label">{{ item.label || item.title }}</span>
          <span v-if="item.meta" class="study-section-nav__item-meta">{{ item.meta }}</span>
        </a>

        <button
          v-else
          type="button"
          class="study-section-nav__item"
          :class="{ 'is-active': item.key === props.activeKey }"
          @click="handleSelect(item.key)"
        >
          <span class="study-section-nav__item-label">{{ item.label || item.title }}</span>
          <span v-if="item.meta" class="study-section-nav__item-meta">{{ item.meta }}</span>
        </button>
      </template>
    </div>
  </nav>
</template>
