<script setup>
import { computed } from 'vue'

import StudyTopicCard from '@/components/study/StudyTopicCard.vue'
import StudyWorkbenchLayout from '@/components/study/StudyWorkbenchLayout.vue'
import { studyTopics } from '@/data/study/studyTopics.js'

const topicCards = computed(() =>
  studyTopics.map((topic) => ({
    ...topic,
    meta: [
      {
        label: '主题',
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
        eyebrow="今天学习了吗？"
        title="把前端、产品方法和 NASM 复习放进同一套学习工作台。"
        intro="这里保留三条顶层主线：前端基础、产品方法和 NASM。每条主线都可以继续进入对应模块，按章节、主题或场景推进。"
        note="先选择一个方向，再进入对应页面学习、复习或自测。移动端和桌面端都保持同一套入口结构。"
        :metrics="[
          { label: '主题', value: String(topicCards.length) },
          { label: '模式', value: '分模块学习' },
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
