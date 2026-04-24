<script setup>
import { computed } from 'vue'

import StudyTopicCard from '@/components/study/StudyTopicCard.vue'
import StudyWorkbenchLayout from '@/components/study/StudyWorkbenchLayout.vue'
import { frontendStudyCategories } from '@/data/study/frontendStudy.js'

const categoryCards = computed(() =>
  frontendStudyCategories.map((category, index) => ({
    ...category,
    meta: [
      {
        label: 'Order',
        value: `0${index + 1}`,
      },
    ],
  }))
)
</script>

<template>
  <main class="site-page">
    <div class="page-shell">
      <StudyWorkbenchLayout
        eyebrow="Frontend Study"
        title="先把前端学习拆成三张稳定的入口卡，再逐步补齐每一层细节。"
        intro="当前只提供顶层分类页，让基础总览、面试表达和编码训练各自有稳定入口，方便后续继续补内容。"
        note="这一层不直接塞进长内容，重点是让学习地图和路由结构先稳定。"
        :metrics="[
          { label: 'Categories', value: String(categoryCards.length) },
          { label: 'Focus', value: 'Index first' },
        ]"
      >
        <StudyTopicCard
          v-for="category in categoryCards"
          :key="category.key"
          :label="category.label"
          :title="category.title"
          :summary="category.summary"
          :href="category.href"
          :meta="category.meta"
        />
      </StudyWorkbenchLayout>
    </div>
  </main>
</template>
