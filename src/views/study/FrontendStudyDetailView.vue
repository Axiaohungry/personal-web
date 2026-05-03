<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import ProjectMappingPanel from '@/components/study/ProjectMappingPanel.vue'
import StudyArticleSection from '@/components/study/StudyArticleSection.vue'
import StudyCodeBlock from '@/components/study/StudyCodeBlock.vue'
import StudyQACard from '@/components/study/StudyQACard.vue'
import StudySectionNav from '@/components/study/StudySectionNav.vue'
import StudyWorkbenchLayout from '@/components/study/StudyWorkbenchLayout.vue'
import {
  frontendStudyCategories,
  frontendStudySections,
  loadFrontendStudyDetail,
} from '@/data/study/frontendStudy.js'

const route = useRoute()

const detailRouteMap = {
  'study-frontend-fundamentals': {
    key: 'fundamentals',
    eyebrow: '前端基础',
    title: '概念、面试说法和项目经验，一页搞定',
    intro:
      '底层概念、常见说法和做过的项目放在一起，复习和准备面试都能用。',
    note:
      '先把原理讲顺，再和做过的页面对上，记得才牢。',
  },
  'study-frontend-interview': {
    key: 'interview',
    eyebrow: '面试表达',
    title: '常见问法和回答套路，整理到位',
    intro:
      '高频问法和追问都在这里，目标是不只说"我知道"，还能讲清为什么。',
    note:
      '回答先给结论，再补背景和项目例子，信息更集中。',
  },
  'study-frontend-coding': {
    key: 'coding',
    eyebrow: '编码训练',
    title: '知识点落回代码，练出手感',
    intro:
      '组件练习、基础题和 API 设计，把知识变回写代码的能力。',
    note:
      '不是刷题数，是让状态管理、数据转换和异步控制都练过一遍。',
  },
}

const activeDetail = computed(
  () => detailRouteMap[route.name] ?? detailRouteMap['study-frontend-fundamentals']
)

const activeCategory = computed(
  () =>
    frontendStudyCategories.find((category) => category.key === activeDetail.value.key) ??
    frontendStudyCategories[0]
)

// 轻量摘要数据（静态 import，用于 fallback 和非详情区域）
const activeSections = computed(
  () => frontendStudySections[activeDetail.value.key] ?? frontendStudySections.fundamentals
)

// 完整详情数据（动态加载，含代码实例、面试 Q&A 等）
const richSections = ref(null)
const loadingDetail = ref(false)

watch(
  () => activeDetail.value.key,
  async (sectionKey) => {
    richSections.value = null
    loadingDetail.value = true
    try {
      richSections.value = await loadFrontendStudyDetail(sectionKey)
    } finally {
      loadingDetail.value = false
    }
  },
  { immediate: true }
)

const navItems = computed(() =>
  frontendStudyCategories.map((category, index) => ({
    key: category.key,
    title: category.title,
    label: category.label,
    href: category.href,
    meta: `第 ${index + 1} 组`,
  }))
)

// --- Fundamentals 数据 ---
const conceptSections = computed(() => {
  if (activeDetail.value.key !== 'fundamentals') {
    return []
  }
  // 优先使用 rich 数据（有代码实例和大白话解析），fallback 到摘要数据
  const source = richSections.value || activeSections.value
  return source.flatMap((section) =>
    (section.conceptBlocks || []).map((block) => ({
      key: `${section.key}-${block.title}`,
      eyebrow: section.dayRange || section.title,
      title: block.title,
      summary: block.plainExplanation || '先把底层机制说清，再把它对页面、状态和交互的影响串起来。',
      bullets: block.points,
      codeExample: block.codeExample || null,
    }))
  )
})

// 面试表达摘要 —— 只在 fundamentals 页显示，为概念模块补充"怎么在面试中表达"的要点。
const fundamentalsTakeawaySections = computed(() => {
  if (activeDetail.value.key !== 'fundamentals') {
    return []
  }
  const source = activeSections.value
  return source.map((section) => ({
    key: `${section.key}-takeaways`,
    eyebrow: `${section.title} 面试表达`,
    title: `${section.title}：面试表达`,
    summary: '这些要点更偏向"怎么讲"，帮助把概念转换成稳定的表达。',
    bullets: section.interviewTakeaways ?? [],
  }))
})

// 面试 Q&A 卡片数据（从 rich 数据中提取）
const interviewQAItems = computed(() => {
  if (activeDetail.value.key !== 'fundamentals' || !richSections.value) {
    return []
  }
  return richSections.value.flatMap((section) => section.interviewQA || [])
})

// --- Interview 数据 ---
const interviewPromptSections = computed(() => {
  if (activeDetail.value.key !== 'interview') {
    return []
  }
  // 优先 rich 数据
  const source = richSections.value || activeSections.value
  return source.map((section) => ({
    key: `${section.key}-prompts`,
    eyebrow: '高频问法',
    title: section.title,
    summary: '先把高频问题露出来，再按模块整理表达重点和回答顺序。',
    bullets: section.prompts ?? [],
  }))
})

const interviewGuidanceSections = computed(() => {
  if (activeDetail.value.key !== 'interview') {
    return []
  }
  const source = richSections.value || activeSections.value
  return source.map((section) => ({
    key: `${section.key}-guidance`,
    eyebrow: '回答框架',
    title: `${section.title}：回答框架`,
    summary: '这些提示帮助把问题背景、取舍和验证方式讲得更完整。',
    bullets: section.guidance ?? [],
  }))
})

const projectMappingEntries = computed(() => {
  if (activeDetail.value.key !== 'fundamentals') {
    return []
  }
  const source = richSections.value || activeSections.value
  return source.map((section) => ({
    label: section.title,
    title: `${section.title} 的项目映射`,
    description: (section.projectExamples || []).join(' '),
    tags: ['概念', '面试', '项目'],
  }))
})

// --- Coding 数据 ---
const codingPracticeSections = computed(() => {
  if (activeDetail.value.key !== 'coding') {
    return []
  }
  const source = richSections.value || activeSections.value
  return source.map((section) => ({
    key: `${section.key}-items`,
    eyebrow: '编码练习',
    title: section.title,
    summary: '每个练习块都尽量对应一种真实前端工作里的能力切片。',
    bullets: section.items ?? [],
    codeExamples: section.codeExamples || [],
  }))
})
</script>

<template>
  <main class="site-page">
    <div class="page-shell">
      <StudyWorkbenchLayout
        :eyebrow="activeDetail.eyebrow"
        :title="activeDetail.title"
        :intro="activeDetail.intro"
        :note="activeDetail.note"
        :metrics="[
          { label: '路径', value: activeCategory.label },
          { label: '章节', value: String(activeSections.length) },
        ]"
      >
        <template #nav>
          <StudySectionNav
            title="学习分区"
            :items="navItems"
            :active-key="activeCategory.key"
          />
        </template>

        <!-- Fundamentals: 概念 + 代码实例 + 面试表达 + Q&A + 项目映射 -->
        <template v-if="activeDetail.key === 'fundamentals'">
          <template v-for="section in conceptSections" :key="section.key">
            <StudyArticleSection
              :eyebrow="section.eyebrow"
              :title="section.title"
              :summary="section.summary"
              :bullets="section.bullets"
            />
            <StudyCodeBlock
              v-if="section.codeExample"
              :language="section.codeExample.language"
              :code="section.codeExample.code"
              :caption="section.codeExample.caption"
            />
          </template>

          <StudyArticleSection
            v-for="section in fundamentalsTakeawaySections"
            :key="section.key"
            :eyebrow="section.eyebrow"
            :title="section.title"
            :summary="section.summary"
            :bullets="section.bullets"
          />

          <!-- 面试 Q&A 折叠卡片 -->
          <section v-if="interviewQAItems.length" class="study-qa-section">
            <h3 class="study-qa-section__title">面试高频 Q&A</h3>
            <StudyQACard
              v-for="(item, index) in interviewQAItems"
              :key="index"
              :question="item.question"
              :answer="item.answer"
            />
          </section>

          <ProjectMappingPanel
            title="项目映射"
            summary="把每个基础模块都落回真实项目场景，避免知识点只停留在抽象层。"
            :items="projectMappingEntries"
          />
        </template>

        <!-- Interview: 提示 + 框架 -->
        <template v-else-if="activeDetail.key === 'interview'">
          <StudyArticleSection
            v-for="section in interviewPromptSections"
            :key="section.key"
            :eyebrow="section.eyebrow"
            :title="section.title"
            :summary="section.summary"
            :bullets="section.bullets"
          />

          <StudyArticleSection
            v-for="section in interviewGuidanceSections"
            :key="section.key"
            :eyebrow="section.eyebrow"
            :title="section.title"
            :summary="section.summary"
            :bullets="section.bullets"
          />
        </template>

        <!-- Coding: 练习列表 + 手写题代码 -->
        <template v-else>
          <template v-for="section in codingPracticeSections" :key="section.key">
            <StudyArticleSection
              :eyebrow="section.eyebrow"
              :title="section.title"
              :summary="section.summary"
              :bullets="section.bullets"
            />
            <StudyCodeBlock
              v-for="(example, idx) in section.codeExamples"
              :key="`${section.key}-code-${idx}`"
              :language="example.language"
              :code="example.code"
              :caption="example.caption"
            />
          </template>
        </template>
      </StudyWorkbenchLayout>
    </div>
  </main>
</template>
