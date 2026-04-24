<script setup>
import { computed } from 'vue'

import StudyTopicCard from '@/components/study/StudyTopicCard.vue'
import StudyWorkbenchLayout from '@/components/study/StudyWorkbenchLayout.vue'
import { nasmCatalog } from '@/data/study/nasmCatalog.js'

const chapterCards = computed(() =>
  nasmCatalog.map((chapter) => ({
    ...chapter,
    label: `Chapter ${String(chapter.order).padStart(2, '0')}`,
    meta: [
      {
        label: 'Knowledge',
        value: String(chapter.knowledgeSectionCount),
      },
      {
        label: 'Quiz',
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
        eyebrow="NASM Study"
        title="NASM catalog for chapter-by-chapter review"
        intro="Browse each chapter as a compact study module with chapter knowledge points and a focused quiz. The goal is quick review without losing the feeling of a structured workbook."
        note="Each card opens a dedicated chapter detail view, so learners can stay inside one chapter at a time instead of bouncing across a long mixed page."
        :metrics="[
          { label: 'Chapters', value: String(chapterCards.length) },
          { label: 'Mode', value: 'Knowledge + quiz' },
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
