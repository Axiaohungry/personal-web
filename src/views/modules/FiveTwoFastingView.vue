<script setup>
import { computed } from 'vue'

import ModuleWorkbenchLayout from '@/components/modules/ModuleWorkbenchLayout.vue'
import { moduleSources } from '@/data/moduleSources.js'
import { useEmbeddedModuleState } from '@/hooks/useEmbeddedModuleState.js'
import { buildFiveTwoFastingPlan } from '@/utils/modulePlans.js'

// 5+2 页把周节奏计划化：
// 先判断当前目标是否适合 5+2，再决定展示完整执行表还是只展示边界提醒。
const { state, titleSuffix } = useEmbeddedModuleState()

const plan = computed(() => buildFiveTwoFastingPlan({
  goal: state.goal,
  weeks: state.weeks,
  targetKg: state.targetKg,
  tdee: state.tdee,
  weightKg: state.weightKg,
  sex: state.sex,
}))

const weeklyColumns = [
  { title: '日期', dataIndex: 'day', key: 'day' },
  { title: '日类型', dataIndex: 'kind', key: 'kind' },
  { title: '目标热量', dataIndex: 'targetCalories', key: 'targetCalories' },
  { title: '建议安排', dataIndex: 'focus', key: 'focus' },
  { title: '执行提示', dataIndex: 'note', key: 'note' },
]

const evidenceRows = computed(() => [
  {
    title: '先别把它想得太神',
    content: '这组研究最先告诉我们的，其实不是“5+2 更厉害”，而是它不一定比普通控热量更神奇。它真正的价值，更像是给一部分人一个更容易守住的周节奏。',
  },
  {
    title: '那为什么还值得看看',
    content: '因为对有些人来说，天天都吃得很克制反而更累。5+2 把“收一收”的压力集中在两天，剩下五天更接近日常，反而更有机会把这件事做久一点。',
  },
  {
    title: '为什么这页还写了很多边界',
    content: '因为轻断食不是谁都适合。这里把不建议直接上手的情况写清楚，不是想吓人，而是想帮你少走一点弯路。',
  },
])
</script>

<template>
  <ModuleWorkbenchLayout
    eyebrow="5+2 Fasting"
    :title="`5+2 轻断食 · ${titleSuffix}`"
    :intro="plan.supported
      ? `如果你不想每天都把热量卡得很紧，5+2 会是更像“周节奏”的做法：五天照常吃，两天轻一点。按你现在的 TDEE ${state.tdee} kcal 来看，周均大约是 ${plan.weeklyAverageCalories} kcal / 天，${state.weeks} 周大概会看到 ${plan.projectedChangeKg} kg 左右的变化。`
      : '你现在选的是增肌目标，所以这页更适合拿来理解轻断食的边界，而不是马上照着执行。'"
    :note="plan.supported
      ? '把它当成一种更省心的安排方式就好，不用把它想成什么代谢捷径。真正决定结果的，还是你能不能舒服地坚持下去。'
      : '如果当前目标是精益增肌，先把热量、蛋白和恢复稳住，通常会比限制进食模式更重要。'"
  >
    <a-alert
      v-if="!plan.supported"
      type="warning"
      show-icon
      :message="plan.unsupportedReason"
    />

    <a-row v-if="plan.supported" :gutter="[16, 16]">
      <a-col :xs="24" :lg="8">
        <a-card title="先看这套节奏像不像你" :bordered="false">
          <a-space direction="vertical" size="middle" style="width: 100%">
            <a-statistic title="常规日热量" :value="plan.regularDayCalories" suffix="kcal" />
            <a-statistic title="轻断食日热量" :value="plan.fastingDayCalories" suffix="kcal" />
            <a-statistic title="周均热量" :value="plan.weeklyAverageCalories" suffix="kcal / 天" />
            <a-statistic title="本周期估算变化" :value="plan.projectedChangeKg" suffix="kg" />
            <a-alert type="info" show-icon :message="plan.goalFit" />
          </a-space>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="16">
        <a-card title="这些研究更像在提醒什么" :bordered="false">
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

    <a-card v-if="plan.supported" title="这一周可以怎么排" :bordered="false">
      <a-table
        :columns="weeklyColumns"
        :data-source="plan.weeklyPattern"
        :pagination="false"
        row-key="day"
        size="middle"
        :scroll="{ x: 860 }"
      />
    </a-card>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="12">
        <a-card :title="plan.supported ? '轻断食日，怎么吃会更舒服' : '如果你现在想增肌，更建议这样做'" :bordered="false">
          <a-list
            bordered
            :data-source="plan.supported ? plan.fastingDayChecklist : plan.alternatives"
          >
            <template #renderItem="{ item }">
              <a-list-item>{{ item }}</a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card :title="plan.supported ? '哪些情况下先别急着上 5+2' : '为什么这页还是保留在这里'" :bordered="false">
          <a-list
            :data-source="plan.supported ? plan.guardrails : [
              '5+2 的主要证据，还是集中在减重和代谢改善这类场景里，不是精益增肌的常规起点。',
              '把这页留在这里，是想把“它能做什么”和“它不太适合谁”都说清楚，而不是只留一个概念名词。'
            ]"
          >
            <template #renderItem="{ item }">
              <a-list-item>{{ item }}</a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="引用来源" :bordered="false">
      <a-space direction="vertical" size="middle" style="width: 100%">
        <div v-for="source in moduleSources.fiveTwoFasting" :key="source.url" class="source-card">
          <a-typography-title :level="5">{{ source.title }}</a-typography-title>
          <p>{{ source.organization }}</p>
          <p>{{ source.note }}</p>
          <a :href="source.url" target="_blank" rel="noreferrer">打开来源</a>
        </div>
      </a-space>
    </a-card>
  </ModuleWorkbenchLayout>
</template>
