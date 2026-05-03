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
        title="前端、产品方法和 NASM 复习，都在这里。"
        intro="三个方向：前端基础、产品方法和 NASM。每个方向都可以按章节或主题继续往下看。"
        note="选一个方向进去就行。手机和电脑上看到的入口一样。"
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
