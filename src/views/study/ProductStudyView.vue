<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import ProjectMappingPanel from '@/components/study/ProjectMappingPanel.vue'
import StudyArticleSection from '@/components/study/StudyArticleSection.vue'
import StudySectionNav from '@/components/study/StudySectionNav.vue'
import StudyWorkbenchLayout from '@/components/study/StudyWorkbenchLayout.vue'
import {
  productInterviewQuestions,
  productPracticeChecklist,
  productProjectSections,
  productStudyRoadmap,
  productStudySections,
  productStudyTabs,
} from '@/data/study/productStudy.js'

const route = useRoute()

const activeTab = computed(() => (route.name === 'study-product-roadmap' ? 'roadmap' : 'system'))

const heroCopy = computed(() => {
  if (activeTab.value === 'roadmap') {
    return {
      eyebrow: '产品项目管理',
      title: '用项目推进场景训练产品判断、协同和复盘能力',
      intro:
        '这一页把时间压力、跨团队分歧、需求方坚持和上线不达预期这些高频场景整理成可复习的处理框架。',
      note:
        '学习时先看处理顺序，再拿健身工具里的小功能做练习，避免只背“多沟通”这种空话。',
      metrics: [
        { label: '场景', value: String(productProjectSections.length) },
        { label: '练习', value: String(productPracticeChecklist.length) },
      ],
    }
  }

  return {
    eyebrow: '产品方法论',
    title: '把产品方法、PRD、竞品分析和优先级判断整理成一条学习链路',
    intro:
      '这里从岗位认知开始，逐步进入需求分析、PRD、竞品分析、优先级和伪需求识别，目标是形成能学习、能复习、能面试表达的结构。',
    note:
      '这部分内容来自 docs/jd-study/08-product-methodology-project-management.md 的整理，并压缩成页面可浏览的学习模块。',
    metrics: [
      { label: '模块', value: String(productStudySections.length) },
      { label: '问答', value: String(productInterviewQuestions.length) },
    ],
  }
})
</script>

<template>
  <main class="site-page">
    <div class="page-shell">
      <StudyWorkbenchLayout
        :eyebrow="heroCopy.eyebrow"
        :title="heroCopy.title"
        :intro="heroCopy.intro"
        :note="heroCopy.note"
        :metrics="heroCopy.metrics"
      >
        <template #nav>
          <StudySectionNav
            title="学习分区"
            :items="productStudyTabs"
            :active-key="activeTab"
          />
        </template>

        <template v-if="activeTab === 'system'">
          <StudyArticleSection
            v-for="section in productStudySections"
            :key="section.key"
            :eyebrow="section.eyebrow"
            :title="section.title"
            :summary="section.summary"
            :bullets="section.bullets"
          />

          <ProjectMappingPanel
            title="面试高频问题"
            summary="把产品方法转成面试里能稳定输出的表达骨架。"
            :items="productInterviewQuestions"
          />
        </template>

        <template v-else>
          <StudyArticleSection
            v-for="section in productProjectSections"
            :key="section.key"
            :eyebrow="section.eyebrow"
            :title="section.title"
            :summary="section.summary"
            :bullets="section.bullets"
          />

          <StudyArticleSection
            eyebrow="学习路线"
            :title="productStudyRoadmap.title"
            summary="按这条路线练习，产品方法会从概念变成可执行的项目推进能力。"
            :bullets="productStudyRoadmap.items"
          />

          <StudyArticleSection
            eyebrow="练习任务"
            title="用一个健身工具小功能串完整条产品链路"
            summary="选择一个足够小的功能练习，能更快暴露你是否真的理解需求、方案、指标和复盘。"
            :bullets="productPracticeChecklist"
          />
        </template>
      </StudyWorkbenchLayout>
    </div>
  </main>
</template>
