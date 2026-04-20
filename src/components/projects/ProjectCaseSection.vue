<script setup>
// 项目案例里的分区容器。
// 作用和首页的 ContentSection 类似，但样式与视觉语气更贴近案例页。
const props = defineProps({
  eyebrow: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: true,
  },
  intro: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: 'panel',
  },
})
</script>

<template>
  <section
    class="project-case-section project-case-stage motion-rise"
    :class="`project-case-stage--${props.variant}`"
  >
    <header class="project-case-stage__header project-case-section__header">
      <p v-if="props.eyebrow" class="eyebrow project-case-section__eyebrow">
        {{ props.eyebrow }}
      </p>
      <h2 class="project-case-section__title project-case-stage__title">
        {{ props.title }}
      </h2>
      <p v-if="props.intro" class="project-case-section__intro">
        {{ props.intro }}
      </p>
    </header>

    <div class="project-case-stage__body project-case-section__body">
      <slot />
    </div>
  </section>
</template>
