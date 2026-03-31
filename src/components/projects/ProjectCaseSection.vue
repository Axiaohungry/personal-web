<script setup>
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
})
</script>

<template>
  <section class="project-case-section content-section">
    <header class="project-case-section__header">
      <p v-if="props.eyebrow" class="eyebrow project-case-section__eyebrow">
        {{ props.eyebrow }}
      </p>
      <h2 class="project-case-section__title">
        {{ props.title }}
      </h2>
      <p v-if="props.intro" class="project-case-section__intro">
        {{ props.intro }}
      </p>
    </header>

    <div class="project-case-section__body">
      <slot />
    </div>
  </section>
</template>
