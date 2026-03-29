<script setup>
defineProps({
  sectionId: {
    type: String,
    required: true,
  },
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
  <section :id="sectionId" class="content-section motion-rise">
    <div class="content-section__heading">
      <p v-if="eyebrow" class="content-section__eyebrow">{{ eyebrow }}</p>
      <h2 class="content-section__title">{{ title }}</h2>
      <p v-if="intro" class="content-section__intro">{{ intro }}</p>
    </div>
    <div class="content-section__body">
      <slot />
    </div>
  </section>
</template>
