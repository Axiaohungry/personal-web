<script setup>
import { computed } from 'vue'

import ModuleWorkbenchLayout from '@/components/modules/ModuleWorkbenchLayout.vue'
import { moduleSources } from '@/data/moduleSources.js'
import { useEmbeddedModuleState } from '@/hooks/useEmbeddedModuleState.js'
import { buildCarbTaperPlan } from '@/utils/modulePlans.js'

// 碳水渐降页关心的是“阶段”而不是“某一天怎么吃”。
// 所以页面核心是根据共享状态生成三段计划，再把每段计划可视化出来。
const { state, titleSuffix } = useEmbeddedModuleState()

const plan = computed(() => buildCarbTaperPlan({
  goal: state.goal,
  weeks: state.weeks,
  targetKg: state.targetKg,
  tdee: state.tdee,
  weightKg: state.weightKg,
  sex: state.sex,
}))

const sexLabel = computed(() => (state.sex === 'female' ? '女性' : '男性'))

const stageColumns = [
  { title: '阶段', dataIndex: 'stage', key: 'stage' },
  { title: '周数', dataIndex: 'weeksLabel', key: 'weeksLabel' },
  { title: '目标热量', dataIndex: 'targetCalories', key: 'targetCalories' },
  { title: '碳水范围', dataIndex: 'carbRange', key: 'carbRange' },
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
  { title: '执行重点', dataIndex: 'focus', key: 'focus' },
]

const rationaleRows = computed(() => [
  {
    title: '为什么碳水渐降不是只写碳水',
    content: '真正执行时，三大营养素必须联动。蛋白决定保肌肉和恢复，脂肪决定激素与饱腹感，碳水决定训练表现与恢复速度，所以不能只盯碳水一列。',
  },
  {
    title: '为什么女性策略更保守',
    content: '女性在过快减脂、过低脂肪和长期低能量可用性下更容易出现恢复和月经周期相关风险，所以热量与脂肪下限会更稳一些。',
  },
  {
    title: '为什么增肌期也需要渐降模板',
    content: '增肌不是永远一路加碳。周期后半程做温和回撤，可以把胃口、消化压力和脂肪增长速度控制在更稳的范围内。',
  },
])
</script>

<template>
  <ModuleWorkbenchLayout
    eyebrow="Carb Taper"
    :title="`碳水渐降 · ${titleSuffix}`"
    :intro="`${plan.headline}。当前按 ${sexLabel}、${state.weeks} 周周期、目标 ${state.targetKg} kg 和 TDEE ${state.tdee} kcal 拆成 3 个阶段。`"
    note="碳水渐降不是把主食一路砍到底，而是按阶段下调，并且持续检查训练表现、体重变化和恢复状态。"
  >
    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="10">
        <a-card title="阶段摘要" :bordered="false">
          <a-space direction="vertical" size="middle" style="width: 100%">
            <a-statistic title="周期总长" :value="state.weeks" suffix="周" />
            <a-statistic :title="state.goal === 'cut' ? '目标减脂' : '目标增肌'" :value="state.targetKg" suffix="kg" />
            <a-statistic title="当前 TDEE" :value="state.tdee" suffix="kcal" />
            <a-alert
              type="warning"
              show-icon
              :message="`${sexLabel}默认使用更${state.sex === 'female' ? '保守' : '标准'}的脂肪下限与递减节奏。`"
            />
          </a-space>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="14">
        <a-card title="方法解释" :bordered="false">
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

    <a-card title="分阶段三大营养素模板" :bordered="false">
      <a-table
        :columns="stageColumns"
        :data-source="plan.stages"
        :pagination="false"
        row-key="stage"
        :scroll="{ x: 920 }"
      />
    </a-card>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="12">
        <a-card title="监控指标" :bordered="false">
          <a-list bordered :data-source="plan.checkpointRules">
            <template #renderItem="{ item }">
              <a-list-item>{{ item }}</a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="执行建议" :bordered="false">
          <a-list :data-source="[
            '每次只下调一个阶段，不要两周内连续压两次碳水和热量。',
            '如果训练掉得太快，优先把碳水拉回训练窗口，而不是继续砍总热量。',
            '平台期先复盘步数、睡眠、盐分和称重周期，再决定是否继续下调。'
          ]">
            <template #renderItem="{ item }">
              <a-list-item>{{ item }}</a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="引用来源" :bordered="false">
      <a-space direction="vertical" size="middle" style="width: 100%">
        <div v-for="source in moduleSources.carbTaper" :key="source.url" class="source-card">
          <a-typography-title :level="5">{{ source.title }}</a-typography-title>
          <p>{{ source.organization }}</p>
          <p>{{ source.note }}</p>
          <a :href="source.url" target="_blank" rel="noreferrer">打开来源</a>
        </div>
      </a-space>
    </a-card>
  </ModuleWorkbenchLayout>
</template>
