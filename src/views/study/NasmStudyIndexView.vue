<script setup>
import { computed } from 'vue'

import StudyTopicCard from '@/components/study/StudyTopicCard.vue'
import StudyWorkbenchLayout from '@/components/study/StudyWorkbenchLayout.vue'
import { nasmCatalog } from '@/data/study/nasmCatalog.js'

const chapterCards = computed(() =>
  nasmCatalog.map((chapter) => ({
    ...chapter,
    label: `第 ${String(chapter.order).padStart(2, '0')} 章`,
    meta: [
      {
        label: '知识点',
        value: String(chapter.knowledgeSectionCount),
      },
      {
        label: '测验题',
        value: String(chapter.quizQuestionCount),
      },
    ],
  }))
)
</script>

<template>
  <main class="site-page">
    <div class="page-shell">
      <StudyWorkbenchLayout
        eyebrow="NASM 分章学习"
        title="按章节复习 NASM-CPT 核心知识点和测验题"
        intro="每张卡片对应一个独立章节，进入后先看核心知识点，再切换到本章随机测验。"
        note="一个页面只展示一个章节，避免在长内容里来回跳，适合做分章节复习。"
        :metrics="[
          { label: '章节', value: String(chapterCards.length) },
          { label: '模式', value: '知识点 + 测验' },
        ]"
      >
        <StudyTopicCard
          v-for="chapter in chapterCards"
          :key="chapter.key"
          :label="chapter.label"
          :title="chapter.title"
          :summary="chapter.summary"
          :href="chapter.href"
          :meta="chapter.meta"
        />
      </StudyWorkbenchLayout>
    </div>
  </main>
</template>
