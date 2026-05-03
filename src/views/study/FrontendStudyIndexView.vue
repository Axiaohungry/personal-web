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
        label: '顺序',
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
        eyebrow="前端系统学习"
        title="基础、表达、编码训练，三条复习路线。"
        intro="基础总览看原理和项目，面试表达练回答，编码训练写代码。"
        note="如果时间有限，先从基础总览开始；如果准备面试，就优先看面试表达和编码训练。"
        :metrics="[
          { label: '分类', value: String(categoryCards.length) },
          { label: '重点', value: '系统复习' },
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
