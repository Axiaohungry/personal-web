<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import EmptyStudyPlaceholder from '@/components/study/EmptyStudyPlaceholder.vue'
import QuizQuestionList from '@/components/study/QuizQuestionList.vue'
import StudyArticleSection from '@/components/study/StudyArticleSection.vue'
import StudySectionNav from '@/components/study/StudySectionNav.vue'
import StudyWorkbenchLayout from '@/components/study/StudyWorkbenchLayout.vue'
import { loadNasmChapterDetail } from '@/data/study/nasmCatalog.js'

const route = useRoute()
const activePane = ref('knowledge')
const chapter = ref(null)
const loading = ref(false)

// 按需加载章节详情，避免把全部 26 章数据一次性打进首屏 bundle。
watch(
  () => route.params.chapterSlug,
  async (slug) => {
    activePane.value = 'knowledge'
    chapter.value = null

    if (!slug) return

    loading.value = true
    try {
      chapter.value = await loadNasmChapterDetail(slug)
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)

const chapterOrder = computed(() => {
  if (!chapter.value) {
    return ''
  }
  const slug = chapter.value.slug
  const match = slug.match(/\d+/)
  return match ? match[0].padStart(2, '0') : ''
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

const chapterMetrics = computed(() => {
  if (!chapter.value) {
    return []
  }

  return [
    {
      label: '章节',
      value: chapterOrder.value,
    },
    {
      label: '知识点',
      value: String(chapter.value.knowledgeSections.length),
    },
    {
      label: '测验题',
      value: String(chapter.value.quizQuestions.length),
    },
  ]
})
</script>

<template>
  <main class="site-page">
    <div class="page-shell">
      <StudyWorkbenchLayout
        :eyebrow="chapter ? 'NASM 分章学习' : 'NASM 学习'"
        :title="loading ? '正在加载章节…' : chapter ? chapter.title : '未找到章节'"
        :intro="
          chapter
            ? chapter.summary
            : loading
              ? '章节数据按需加载中，请稍候。'
              : '当前地址里的 NASM 章节不存在，请回到章节目录重新选择。'
        "
        :note="
          chapter
            ? '先复习本章知识点，再切换到章节测验，用随机题序做一次边界清晰的回顾。'
            : loading
              ? ''
              : '返回 NASM 目录后，可以从现有章节卡片中重新进入。'
        "
        :metrics="chapterMetrics"
      >
        <template v-if="chapter" #nav>
          <StudySectionNav
            title="章节模式"
            :items="navItems"
            :active-key="activePane"
            @select="activePane = $event"
          />
        </template>

        <template v-if="loading">
          <EmptyStudyPlaceholder
            title="正在加载章节数据"
            summary="章节详情按需加载中，数据量较大时可能需要数秒。"
          />
        </template>

        <template v-else-if="chapter">
          <template v-if="activePane === 'knowledge'">
            <StudyArticleSection
              v-for="(section, index) in chapter.knowledgeSections"
              :key="section.key"
              :eyebrow="`第 ${index + 1} 组知识点`"
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
                  title="本章暂时没有测验题"
                  summary="当前章节已经在目录中，但测验题数据为空。"
                  hint="可以先回到知识点页复习，或重新导入 NASM 章节数据。"
                />
              </template>
            </QuizQuestionList>
          </template>
        </template>

        <EmptyStudyPlaceholder
          v-else
          title="未找到章节"
          summary="当前 URL 中的章节标识不存在于 NASM 章节目录。"
          hint="打开 /study/nasm 选择一个有效章节。"
        />
      </StudyWorkbenchLayout>
    </div>
  </main>
</template>

