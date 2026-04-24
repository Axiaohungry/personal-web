<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import EmptyStudyPlaceholder from '@/components/study/EmptyStudyPlaceholder.vue'
import StudyWorkbenchLayout from '@/components/study/StudyWorkbenchLayout.vue'
import { productStudyRoadmap, productStudySections } from '@/data/study/productStudy.js'

const route = useRoute()

const isRoadmapRoute = computed(
  () => route.name === 'study-product-roadmap' || route.path === '/study/product/roadmap'
)

const placeholderSection = computed(() => productStudySections[0] ?? null)
</script>

<template>
  <main class="site-page">
    <div class="page-shell">
      <StudyWorkbenchLayout
        eyebrow="Product Study"
        title="先把产品方法的结构搭好，再按真实经历慢慢补齐内容。"
        intro="这一段刻意保持轻量，只区分通用占位页和 roadmap 占位页，保证顶层路由已经稳定可用。"
        :note="
          isRoadmapRoute
            ? '这里先展示接下来准备补齐的方向，避免假装内容已经成熟。'
            : '这里先保留诚实的模块占位，等后续任务再补具体方法和案例。'
        "
        :metrics="[
          { label: 'State', value: isRoadmapRoute ? 'Roadmap placeholder' : 'Module placeholder' },
          { label: 'Sections', value: String(productStudySections.length) },
        ]"
      >
        <EmptyStudyPlaceholder
          v-if="isRoadmapRoute"
          :title="productStudyRoadmap.title"
          summary="当前先公开 roadmap，说明接下来准备补哪些内容，而不是提前伪造完整的产品方法论页面。"
          hint="后续会围绕问题拆解、方案判断、验证闭环和跨团队协作逐步补齐。"
        >
          <div class="study-topic-card study-surface">
            <p class="study-topic-card__label">Roadmap</p>
            <h2 class="study-topic-card__title">{{ productStudyRoadmap.title }}</h2>
            <ul class="study-article-section__list">
              <li v-for="item in productStudyRoadmap.items" :key="item">
                {{ item }}
              </li>
            </ul>
          </div>
        </EmptyStudyPlaceholder>

        <EmptyStudyPlaceholder
          v-else
          :title="placeholderSection?.title ?? '内容仍在整理中'"
          :summary="placeholderSection?.summary ?? ''"
          hint="如果只是先看结构，可继续打开 roadmap；如果要细化内容，等后续任务补齐真实案例。"
        />
      </StudyWorkbenchLayout>
    </div>
  </main>
</template>
