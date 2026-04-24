<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import EmptyStudyPlaceholder from '@/components/study/EmptyStudyPlaceholder.vue'
import QuizQuestionList from '@/components/study/QuizQuestionList.vue'
import StudyArticleSection from '@/components/study/StudyArticleSection.vue'
import StudySectionNav from '@/components/study/StudySectionNav.vue'
import StudyWorkbenchLayout from '@/components/study/StudyWorkbenchLayout.vue'
import { nasmChapters } from '@/data/study/generated/nasmChapters.js'

const route = useRoute()
const activePane = ref('knowledge')

const chapter = computed(() =>
  nasmChapters.find((entry) => entry.slug === route.params.chapterSlug) ?? null
)

const chapterOrder = computed(() => {
  if (!chapter.value) {
    return ''
  }

  return String(nasmChapters.findIndex((entry) => entry.slug === chapter.value.slug) + 1).padStart(
    2,
    '0'
  )
})

const navItems = computed(() => [
  {
    key: 'knowledge',
    label: '章节知识点',
    meta: chapter.value ? String(chapter.value.knowledgeSections.length) : '0',
  },
  {
    key: 'quiz',
    label: '章节测验',
    meta: chapter.value ? String(chapter.value.quizQuestions.length) : '0',
  },
])

watch(
  () => route.params.chapterSlug,
  () => {
    activePane.value = 'knowledge'
  },
  { immediate: true }
)

const chapterMetrics = computed(() => {
  if (!chapter.value) {
    return []
  }

  return [
    {
      label: 'Chapter',
      value: chapterOrder.value,
    },
    {
      label: 'Knowledge',
      value: String(chapter.value.knowledgeSections.length),
    },
    {
      label: 'Quiz',
      value: String(chapter.value.quizQuestions.length),
    },
  ]
})
</script>

<template>
  <main class="site-page">
    <div class="page-shell">
      <StudyWorkbenchLayout
        :eyebrow="chapter ? 'NASM Chapter' : 'NASM Study'"
        :title="chapter ? chapter.title : 'Chapter not found'"
        :intro="
          chapter
            ? chapter.summary
            : 'The requested NASM chapter could not be matched to the current catalog.'
        "
        :note="
          chapter
            ? 'Stay inside one chapter at a time: review the key ideas first, then switch to the quiz for a bounded recall pass.'
            : 'Return to the NASM catalog and choose a chapter card from the available list.'
        "
        :metrics="chapterMetrics"
      >
        <template v-if="chapter" #nav>
          <StudySectionNav
            title="Chapter mode"
            :items="navItems"
            :active-key="activePane"
            @select="activePane = $event"
          />
        </template>

        <template v-if="chapter">
          <template v-if="activePane === 'knowledge'">
            <StudyArticleSection
              v-for="section in chapter.knowledgeSections"
              :key="section.key"
              :eyebrow="section.key"
              :title="section.title"
              :summary="section.summary"
              :bullets="section.bullets"
            />
          </template>

          <template v-else>
            <QuizQuestionList
              :chapter-key="chapter.slug"
              :questions="chapter.quizQuestions"
            >
              <template #empty>
                <EmptyStudyPlaceholder
                  title="No quiz items yet"
                  summary="This chapter is present in the catalog, but the quiz payload is still empty."
                  hint="Return to the knowledge tab for now or refresh the NASM data pipeline."
                />
              </template>
            </QuizQuestionList>
          </template>
        </template>

        <EmptyStudyPlaceholder
          v-else
          title="Chapter not found"
          summary="The chapter slug in this URL does not exist in the current NASM chapter catalog."
          hint="Open /study/nasm to pick a valid chapter."
        />
      </StudyWorkbenchLayout>
    </div>
  </main>
</template>
