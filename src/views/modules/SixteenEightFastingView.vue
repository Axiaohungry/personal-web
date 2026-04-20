<script setup>
import { computed } from 'vue'

import ModuleWorkbenchLayout from '@/components/modules/ModuleWorkbenchLayout.vue'
import { moduleSources } from '@/data/moduleSources.js'
import { useEmbeddedModuleState } from '@/hooks/useEmbeddedModuleState.js'
import { buildSixteenEightFastingPlan } from '@/utils/modulePlans.js'

// 16:8 页不是在算“神奇效果”，而是在把目标热量重新分配到进食窗口里。
// 页面拿到 plan 后，重点展示的是窗口模板、餐次分配和执行边界。
const { state, titleSuffix } = useEmbeddedModuleState()

const plan = computed(() => buildSixteenEightFastingPlan({
  goal: state.goal,
  weeks: state.weeks,
  targetKg: state.targetKg,
  tdee: state.tdee,
  weightKg: state.weightKg,
  sex: state.sex,
}))

const windowColumns = [
  { title: '窗口模板', dataIndex: 'label', key: 'label' },
  { title: '更适合谁', dataIndex: 'fit', key: 'fit' },
  { title: '证据提示', dataIndex: 'evidenceHint', key: 'evidenceHint' },
]

const mealColumns = [
  { title: '餐次', dataIndex: 'label', key: 'label' },
  { title: '时间建议', dataIndex: 'timeBlock', key: 'timeBlock' },
  { title: '热量', dataIndex: 'calories', key: 'calories' },
  { title: '蛋白质', dataIndex: 'protein', key: 'protein' },
  { title: '执行重点', dataIndex: 'focus', key: 'focus' },
]

const evidenceRows = computed(() => [
  {
    title: '为什么我一直在说先看热量',
    content: '因为研究里已经反复提醒过了：就算把吃饭时间收进 8 小时，如果总热量没变，它也不会自动让结果更漂亮。16:8 更像帮你把节奏理顺，而不是绕过热量管理。',
  },
  {
    title: '为什么不只给你一个固定时间',
    content: '因为更早结束进食，通常在研究里会更占一点优势；但真的落到日常，通勤、训练、社交都会影响你能不能坚持。所以这里不只讲“哪个更好看”，也讲“哪个更像你的生活”。',
  },
  {
    title: '如果你平时还在训练，这页该怎么用',
    content: state.goal === 'gain'
      ? '短期研究说明，16:8 不是完全不能配合增肌；但训练量、精力和进食压力都可能跟着变大。所以更重要的问题不是“能不能做”，而是“做了以后你会不会很累”。'
      : '如果你在意训练表现，16:8 更适合拿来减少夜间零食和无意识加餐，而不是拿来替代原本该做的热量和三大营养素安排。',
  },
])
</script>

<template>
  <ModuleWorkbenchLayout
    eyebrow="16:8 Fasting"
    :title="`16+8 轻断食 · ${titleSuffix}`"
    :intro="`16:8 不一定会让你瘦得更快，但它常常能帮你把吃饭节奏收得更整齐一点。按你现在 ${state.weeks} 周、目标 ${state.targetKg} kg、TDEE ${state.tdee} kcal 的设定来看，今天更值得盯住的，还是 ${plan.targetCalories} kcal 和 ${plan.macroPlan.protein} g 蛋白。`"
    :note="plan.trainingNote"
  >
    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="8">
        <a-card title="先看今天真正要守住的点" :bordered="false">
          <a-space direction="vertical" size="middle" style="width: 100%">
            <a-statistic title="目标热量" :value="plan.targetCalories" suffix="kcal" />
            <a-statistic title="蛋白质" :value="plan.macroPlan.protein" suffix="g" />
            <a-statistic title="脂肪" :value="plan.macroPlan.fat" suffix="g" />
            <a-statistic title="碳水" :value="plan.macroPlan.carbs" suffix="g" />
            <a-alert type="info" show-icon :message="plan.windowRecommendation" />
          </a-space>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="16">
        <a-card title="这些研究真正想提醒你的" :bordered="false">
          <a-collapse>
            <a-collapse-panel
              v-for="item in evidenceRows"
              :key="item.title"
              :header="item.title"
            >
              <p class="module-copy">{{ item.content }}</p>
            </a-collapse-panel>
          </a-collapse>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="哪种时间窗口更像你的日常" :bordered="false">
      <a-table
        :columns="windowColumns"
        :data-source="plan.windowOptions"
        :pagination="false"
        row-key="key"
        size="middle"
        :scroll="{ x: 760 }"
      />
    </a-card>

    <a-card title="8 小时里，三餐怎么排会更从容" :bordered="false">
      <a-table
        :columns="mealColumns"
        :data-source="plan.mealCadence"
        :pagination="false"
        row-key="label"
        size="middle"
        :scroll="{ x: 860 }"
      />
    </a-card>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="12">
        <a-card title="如果做得很别扭，先这样调整" :bordered="false">
          <a-list bordered :data-source="plan.cautions">
            <template #renderItem="{ item }">
              <a-list-item>{{ item }}</a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="引用来源" :bordered="false">
          <a-space direction="vertical" size="middle" style="width: 100%">
            <div v-for="source in moduleSources.sixteenEightFasting" :key="source.url" class="source-card">
              <a-typography-title :level="5">{{ source.title }}</a-typography-title>
              <p>{{ source.organization }}</p>
              <p>{{ source.note }}</p>
              <a :href="source.url" target="_blank" rel="noreferrer">打开来源</a>
            </div>
          </a-space>
        </a-card>
      </a-col>
    </a-row>
  </ModuleWorkbenchLayout>
</template>
