<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import ProjectMappingPanel from '@/components/study/ProjectMappingPanel.vue'
import StudyArticleSection from '@/components/study/StudyArticleSection.vue'
import StudySectionNav from '@/components/study/StudySectionNav.vue'
import StudyWorkbenchLayout from '@/components/study/StudyWorkbenchLayout.vue'
import { frontendStudyCategories, frontendStudySections } from '@/data/study/frontendStudy.js'

const route = useRoute()

const detailRouteMap = {
  'study-frontend-fundamentals': {
    key: 'fundamentals',
    eyebrow: 'Frontend Fundamentals',
    title: '把概念、面试表达和项目映射放进同一个复习页',
    intro:
      '这一页把底层概念、常见表达方式和真实项目连接起来，方便在复习、面试和落地之间切换。',
    note:
      '先把解释链条讲顺，再把它落到真的做过的页面、组件和交互里，知识点才会稳定。',
  },
  'study-frontend-interview': {
    key: 'interview',
    eyebrow: 'Frontend Interview',
    title: '把常见问法整理成可以稳定输出的答题骨架',
    intro:
      '这一页聚焦高频问法和追问准备，让回答不只停留在“知道概念”，而是能讲清取舍、验证和业务关联。',
    note:
      '回答时尽量先给结论，再补背景、权衡和项目例子，这样信息密度更高，也更稳。',
  },
  'study-frontend-coding': {
    key: 'coding',
    eyebrow: 'Frontend Coding',
    title: '把知识点重新压回手感，形成能复现的练习路径',
    intro:
      '通过组件练习、基础题感和 API 设计训练，把前端知识重新变成能写出来、能解释出来的实现能力。',
    note:
      '练习目标不是刷数量，而是让状态管理、数据转换和异步控制都能在手上过一遍。',
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

const activeSections = computed(
  () => frontendStudySections[activeDetail.value.key] ?? frontendStudySections.fundamentals
)

const navItems = computed(() =>
  frontendStudyCategories.map((category, index) => ({
    key: category.key,
    title: category.title,
    label: category.label,
    href: category.href,
    meta: `0${index + 1}`,
  }))
)

const conceptSections = computed(() => {
  if (activeDetail.value.key !== 'fundamentals') {
    return []
  }

  return activeSections.value.flatMap((section) =>
    section.conceptBlocks.map((block) => ({
      key: `${section.key}-${block.title}`,
      eyebrow: section.title,
      title: block.title,
      summary: '先把底层机制说清，再把它对页面、状态和交互的影响串起来。',
      bullets: block.points,
    }))
  )
})

const interviewTakeawaySections = computed(() =>
  activeSections.value.map((section) => ({
    key: `${section.key}-takeaways`,
    eyebrow: activeDetail.value.key === 'fundamentals' ? `${section.title} interview` : section.title,
    title:
      activeDetail.value.key === 'fundamentals'
        ? `${section.title}：面试表达`
        : section.title,
    summary:
      activeDetail.value.key === 'fundamentals'
        ? '这些要点更偏向“怎么讲”，帮助把概念转换成稳定的表达。'
        : '围绕高频问题和追问准备，确保回答结构稳定、可展开。',
    bullets: section.interviewTakeaways ?? section.guidance ?? section.prompts ?? [],
  }))
)

const projectMappingEntries = computed(() => {
  if (activeDetail.value.key !== 'fundamentals') {
    return []
  }

  return activeSections.value.map((section) => ({
    label: section.title,
    title: `${section.title} 的项目映射`,
    description: section.projectExamples.join(' '),
    tags: ['Concept', 'Interview', 'Project'],
  }))
})

const codingPracticeSections = computed(() =>
  activeSections.value.map((section) => ({
    key: `${section.key}-items`,
    eyebrow: 'Coding drills',
    title: section.title,
    summary: '每个练习块都尽量对应一种真实前端工作里的能力切片。',
    bullets: section.items ?? [],
  }))
)
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
          { label: 'Track', value: activeCategory.label },
          { label: 'Sections', value: String(activeSections.length) },
        ]"
      >
        <template #nav>
          <StudySectionNav
            title="Frontend study map"
            :items="navItems"
            :active-key="activeCategory.key"
          />
        </template>

        <template v-if="activeDetail.key === 'fundamentals'">
          <StudyArticleSection
            v-for="section in conceptSections"
            :key="section.key"
            :eyebrow="section.eyebrow"
            :title="section.title"
            :summary="section.summary"
            :bullets="section.bullets"
          />

          <StudyArticleSection
            v-for="section in interviewTakeawaySections"
            :key="section.key"
            :eyebrow="section.eyebrow"
            :title="section.title"
            :summary="section.summary"
            :bullets="section.bullets"
          />

          <ProjectMappingPanel
            title="项目映射"
            summary="把每个基础模块都落回真实项目场景，避免知识点只停留在抽象层。"
            :items="projectMappingEntries"
          />
        </template>

        <template v-else-if="activeDetail.key === 'interview'">
          <StudyArticleSection
            v-for="section in interviewTakeawaySections"
            :key="section.key"
            :eyebrow="section.eyebrow"
            :title="section.title"
            :summary="section.summary"
            :bullets="section.bullets"
          />
        </template>

        <template v-else>
          <StudyArticleSection
            v-for="section in codingPracticeSections"
            :key="section.key"
            :eyebrow="section.eyebrow"
            :title="section.title"
            :summary="section.summary"
            :bullets="section.bullets"
          />
        </template>
      </StudyWorkbenchLayout>
    </div>
  </main>
</template>
