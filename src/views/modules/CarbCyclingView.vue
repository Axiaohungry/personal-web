<script setup>
import { computed } from 'vue'

import ModuleWorkbenchLayout from '@/components/modules/ModuleWorkbenchLayout.vue'
import { moduleSources } from '@/data/moduleSources.js'
import { useEmbeddedModuleState } from '@/hooks/useEmbeddedModuleState.js'
import { buildCarbCyclingPlan } from '@/utils/modulePlans.js'

// 碳循环页本身不重复实现营养计算。
// 它只是读取共享上下文，再把 buildCarbCyclingPlan 的结果翻译成卡片、表格和解释文案。
const { state, titleSuffix } = useEmbeddedModuleState()

const plan = computed(() => buildCarbCyclingPlan({
  goal: state.goal,
  weeks: state.weeks,
  targetKg: state.targetKg,
  tdee: state.tdee,
  weightKg: state.weightKg,
  sex: state.sex,
}))

const sexLabel = computed(() => (state.sex === 'female' ? '女性' : '男性'))

const dayColumns = [
  { title: '日类型', dataIndex: 'label', key: 'label' },
  { title: '目标热量', dataIndex: 'targetCalories', key: 'targetCalories' },
  {
    title: '蛋白质',
    key: 'protein',
    customRender: ({ record }) => `${record.macroPlan.protein} g`,
  },
  {
    title: '碳水',
    key: 'carbs',
    customRender: ({ record }) => `${record.macroPlan.carbs} g`,
  },
  {
    title: '脂肪',
    key: 'fat',
    customRender: ({ record }) => `${record.macroPlan.fat} g`,
  },
  { title: '训练重点', dataIndex: 'trainingFocus', key: 'trainingFocus' },
]

const weeklyColumns = [
  { title: '日期', dataIndex: 'day', key: 'day' },
  { title: '碳水等级', dataIndex: 'type', key: 'type' },
  { title: '训练重点', dataIndex: 'focus', key: 'focus' },
  { title: '执行提示', dataIndex: 'note', key: 'note' },
]

const rationaleRows = computed(() => [
  // 这些解释块对应页面里的“为什么这样安排”，
  // 目的是把公式结果再翻译成普通用户能理解的执行逻辑。
  {
    title: '为什么高碳日低脂',
    content: '高碳日的目标是把更多热量空间让给碳水，优先服务高强度和高容量训练。脂肪保留基础下限即可，避免把碳水挤掉。',
  },
  {
    title: '为什么低碳日高脂',
    content: '低碳日减少的是主食和训练窗口碳水，但仍需要脂肪维持激素合成、饱腹感和长期执行的可持续性，所以脂肪下限会上调。',
  },
  {
    title: '为什么男女下限不同',
    content: '女性在长期低能量可用性、过低脂肪摄入和恢复风险上通常更敏感，因此在同样的目标下会给更保守的脂肪下限和热量压缩节奏。',
  },
])
</script>

<template>
  <ModuleWorkbenchLayout
    eyebrow="Carb Cycling"
    :title="`碳循环 · ${titleSuffix}`"
    :intro="`${plan.headline}。当前按 ${sexLabel}、${state.weeks} 周周期、目标 ${state.targetKg} kg、TDEE ${state.tdee} kcal、体重 ${state.weightKg} kg 生成策略。`"
    note="这里把碳循环当成营养周期化，而不是单纯高低碳切换。核心目标是：训练日保表现，休息日控总量，同时守住恢复和可执行性。"
  >
    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="8">
        <a-card title="当前策略摘要" :bordered="false">
          <a-space direction="vertical" size="middle" style="width: 100%">
            <a-statistic title="当前 TDEE" :value="state.tdee" suffix="kcal" />
            <a-statistic title="周期时长" :value="state.weeks" suffix="周" />
            <a-statistic :title="state.goal === 'cut' ? '目标减脂' : '目标增肌'" :value="state.targetKg" suffix="kg" />
            <a-statistic title="周均热量" :value="plan.weeklyAverageCalories" suffix="kcal" />
            <a-alert
              type="info"
              show-icon
              :message="`${sexLabel}默认采用更${state.sex === 'female' ? '保守' : '标准'}的脂肪下限与能量压缩节奏。`"
            />
          </a-space>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="16">
        <a-card title="核心解释" :bordered="false">
          <a-collapse>
            <a-collapse-panel
              v-for="item in rationaleRows"
              :key="item.title"
              :header="item.title"
            >
              <p class="module-copy">{{ item.content }}</p>
            </a-collapse-panel>
          </a-collapse>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="日类型与三大营养素" :bordered="false">
      <a-table
        :columns="dayColumns"
        :data-source="plan.days"
        :pagination="false"
        row-key="key"
        size="middle"
        :scroll="{ x: 860 }"
      />
    </a-card>

    <a-card title="一周排布建议" :bordered="false">
      <a-table
        :columns="weeklyColumns"
        :data-source="plan.weeklyPattern"
        :pagination="false"
        row-key="day"
        size="middle"
        :scroll="{ x: 760 }"
      />
    </a-card>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="12">
        <a-card title="执行提醒" :bordered="false">
          <a-list :data-source="[
            '如果训练表现连续下降，优先增加高碳日和中碳日的主食，而不是继续压低低碳日。',
            '如果休息日饥饿感失控，先补体积和纤维，再看是否需要上调脂肪下限。',
            '高碳日不是放开吃，而是让主食围绕训练窗口服务训练质量。'
          ]">
            <template #renderItem="{ item }">
              <a-list-item>{{ item }}</a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="引用来源" :bordered="false">
          <a-space direction="vertical" size="middle" style="width: 100%">
            <div v-for="source in moduleSources.carbCycling" :key="source.url" class="source-card">
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
