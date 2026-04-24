<script setup>
import { computed } from 'vue'

import StudyTopicCard from '@/components/study/StudyTopicCard.vue'
import StudyWorkbenchLayout from '@/components/study/StudyWorkbenchLayout.vue'
import { studyTopics } from '@/data/study/studyTopics.js'

const topicCards = computed(() =>
  studyTopics.map((topic) => ({
    ...topic,
    href: topic.key === 'product' ? '/study/product/' : topic.href,
    meta: [
      {
        label: 'Topic',
        value: topic.key,
      },
    ],
  }))
)
</script>

<template>
  <main class="site-page">
    <div class="page-shell">
      <StudyWorkbenchLayout
        eyebrow="Study Workbench"
        title="把学习路径、复习入口和诚实的占位结构放进同一套工作台。"
        intro="这里先保留三条顶层主线：前端基础、产品方法和 NASM。页面尽量轻，只负责给出清晰入口和后续扩展的稳定壳层。"
        note="当前先打通顶层结构和入口页，后续再逐步补齐前端细分内容与 NASM 章节浏览。"
        :metrics="[
          { label: 'Topics', value: String(topicCards.length) },
          { label: 'Mode', value: 'Top-level routing' },
        ]"
      >
        <StudyTopicCard
          v-for="topic in topicCards"
          :key="topic.key"
          :label="topic.label"
          :title="topic.title"
          :summary="topic.summary"
          :href="topic.href"
          :meta="topic.meta"
        />
      </StudyWorkbenchLayout>
    </div>
  </main>
</template>
