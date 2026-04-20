<script setup>
// 统一内容分区外壳：
// 每个首页分区都通过这个组件复用标题、眉题和简介的结构，
// 具体内容则由 slot 注入。
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
