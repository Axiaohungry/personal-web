<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import FutureModules from '@/components/FutureModules.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import TdeeBreakdown from '@/components/TdeeBreakdown.vue'
import TdeeForm from '@/components/TdeeForm.vue'
import TdeeSummary from '@/components/TdeeSummary.vue'
import { buildFitnessModuleCards } from '@/data/fitnessModules.js'
import { navigationItems } from '@/data/navigation.js'
import { profile } from '@/data/profile.js'
import { buildMacroPlan, buildScenarioPlans } from '@/utils/macros.js'
import { createStorageApi } from '@/utils/storage.js'
import { calculateTdee, explainTdeeModel } from '@/utils/tdee.js'

const defaultForm = {
  sex: 'male',
  age: 24,
  heightCm: 175,
  weightKg: 75,
  bodyFatPct: 15,
  stepsPerDay: 8000,
  occupation: 'light',
  strengthSessionsPerWeek: 4,
  strengthSessionMinutes: 60,
  cardioSessionsPerWeek: 2,
  cardioSessionMinutes: 30,
}

const storage = createStorageApi()
const router = useRouter()
const moduleGoal = ref('cut')
const moduleWeeks = ref(8)
const moduleTargetKg = ref(3)

const planningContext = computed(() => ({
  goal: moduleGoal.value,
  weeks: moduleWeeks.value,
  targetKg: moduleTargetKg.value,
}))

function coerceNumber(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function normalizeLatest(latest) {
  const safeLatest = latest && typeof latest === 'object' ? latest : {}

  // localStorage 里的历史数据来自用户长期输入，字段完整性不一定稳定。
  // 这里统一做一次“按表单结构回填默认值”，让下面的计算逻辑始终吃到完整对象。
  return {
    sex: safeLatest.sex || defaultForm.sex,
    age: coerceNumber(safeLatest.age, defaultForm.age),
    heightCm: coerceNumber(safeLatest.heightCm, defaultForm.heightCm),
    weightKg: coerceNumber(safeLatest.weightKg, defaultForm.weightKg),
    bodyFatPct: coerceNumber(safeLatest.bodyFatPct, defaultForm.bodyFatPct),
    stepsPerDay: coerceNumber(safeLatest.stepsPerDay, defaultForm.stepsPerDay),
    occupation: safeLatest.occupation || defaultForm.occupation,
    strengthSessionsPerWeek: coerceNumber(safeLatest.strengthSessionsPerWeek, defaultForm.strengthSessionsPerWeek),
    strengthSessionMinutes: coerceNumber(safeLatest.strengthSessionMinutes, defaultForm.strengthSessionMinutes),
    cardioSessionsPerWeek: coerceNumber(safeLatest.cardioSessionsPerWeek, defaultForm.cardioSessionsPerWeek),
    cardioSessionMinutes: coerceNumber(safeLatest.cardioSessionMinutes, defaultForm.cardioSessionMinutes),
  }
}

const form = reactive(normalizeLatest(storage.loadLatest()))
const history = ref(storage.loadHistory())

watch(
  form,
  (value) => {
    storage.saveLatest({ ...value })
  },
  { deep: true }
)

const calculation = computed(() => calculateTdee(form))
const tdeeExplanation = computed(() => explainTdeeModel(form))

// 工作台和服务端助手共享同一份模块注册表。
// 这里不再手写模块数组，只负责把 routePath 解析成当前站点环境下的 href。
const modules = buildFitnessModuleCards((routePath) => router.resolve({ path: routePath }).href)

const activeModulePath = ref(modules[0]?.routePath || '')
const currentScenarioKey = computed(() => (planningContext.value.goal === 'gain' ? 'lean-gain' : 'cut'))

function describeScenarioPace(key, scenarioPlan) {
  if (key === 'maintain') {
    return '先稳住当前体重，把波动压在最小范围里。'
  }

  const actionLabel = key === 'cut' ? '减脂' : '增肌'
  return `按 ${planningContext.value.weeks} 周、${planningContext.value.targetKg} kg 的目标，给出 ${actionLabel}节奏：${scenarioPlan.dailyAdjustment} kcal/天`
}

const scenarios = computed(() => {
  // 主工作台只负责先给出“维持 / 减脂 / 增肌”三个入口级方案，
  // 具体怎么落地，再交给下面的模块页继续细化。
  const scenarioPlans = buildScenarioPlans({
    sex: form.sex,
    weeks: moduleWeeks.value,
    targetKg: moduleTargetKg.value,
    tdee: calculation.value.tdee,
  })

  return [
    {
      key: 'maintain',
      label: '维持',
      target: scenarioPlans.maintain.target,
      range: null,
      pace: describeScenarioPace('maintain', scenarioPlans.maintain),
      macros: buildMacroPlan({
        weightKg: form.weightKg,
        targetCalories: scenarioPlans.maintain.target,
        mode: 'maintain',
      }),
    },
    {
      key: 'cut',
      label: '减脂',
      target: scenarioPlans.cut.target,
      range: `${scenarioPlans.cut.min} - ${scenarioPlans.cut.max} kcal`,
      pace: describeScenarioPace('cut', scenarioPlans.cut),
      macros: buildMacroPlan({
        weightKg: form.weightKg,
        targetCalories: scenarioPlans.cut.target,
        mode: 'cut',
      }),
    },
    {
      key: 'lean-gain',
      label: '增肌',
      target: scenarioPlans['lean-gain'].target,
      range: `${scenarioPlans['lean-gain'].min} - ${scenarioPlans['lean-gain'].max} kcal`,
      pace: describeScenarioPace('lean-gain', scenarioPlans['lean-gain']),
      macros: buildMacroPlan({
        weightKg: form.weightKg,
        targetCalories: scenarioPlans['lean-gain'].target,
        mode: 'lean-gain',
      }),
    },
  ]
})

function recordCurrent() {
  // 这里存的是主工作台摘要，不是完整档案。
  // 这样历史记录足够轻，能用于趋势对比，又不会把整个表单快照不断堆进存储里。
  history.value = storage.pushHistory({
    savedAt: Date.now(),
    tdee: calculation.value.tdee,
    weightKg: form.weightKg,
    stepsPerDay: form.stepsPerDay,
  })
}

function handleSelectModule(path) {
  activeModulePath.value = path
}

const moduleContext = computed(() => ({
  // 这份上下文会传给 iframe 内的模块页和训练助手。
  // 保持字段集中，能避免模块页各自重新推导一遍同样的数据。
  goal: planningContext.value.goal,
  sex: form.sex,
  age: form.age,
  heightCm: form.heightCm,
  bodyFatPct: form.bodyFatPct,
  bmr: calculation.value.bmr,
  weeks: planningContext.value.weeks,
  targetKg: planningContext.value.targetKg,
  tdee: calculation.value.tdee,
  weightKg: form.weightKg,
  currentCalories: scenarios.value.find((item) => item.key === currentScenarioKey.value)?.target ?? calculation.value.tdee,
}))
</script>

<template>
  <main class="fitness-page site-page">
    <div class="page-shell">
      <SiteHeader
        :site-name="profile.name"
        :location="profile.location"
        :navigation-items="navigationItems"
      />

      <section class="fitness-hero shell-surface motion-rise">
        <div class="fitness-hero__content">
          <p class="fitness-hero__eyebrow">Fitness Workbench</p>
          <h1 class="fitness-hero__title">先把每天大概该吃多少弄清楚，再决定后面的策略怎么走。</h1>
          <p class="fitness-hero__summary">
            这里先根据身体数据、步数和训练量，给你一个更接近现实的热量起点。下面那几块模块，会在这个基础上继续把策略、食物和补剂拆得更细。
          </p>
          <div class="fitness-hero__tags">
            <a-tag color="orange">公开可用工具</a-tag>
            <a-tag color="green">适合长期记录</a-tag>
            <a-tag color="blue">按输入持续更新</a-tag>
          </div>
        </div>

        <div class="fitness-hero__aside">
          <a-alert
            type="warning"
            show-icon
            message="这里给的是饮食和训练上的参考，不是医疗建议。"
            description="更适合拿来做起点：先执行一段时间，再根据体重变化、训练表现和恢复情况微调。"
          />
        </div>
      </section>

      <section class="fitness-page__body-shell shell-surface motion-rise motion-rise--2">
        <div class="fitness-grid">
          <TdeeForm :form="form" @record="recordCurrent" />
          <TdeeBreakdown :calculation="calculation" :explanation="tdeeExplanation" />
        </div>

        <TdeeSummary
          :scenarios="scenarios"
          :history="history"
          :planning="planningContext"
          :active-key="currentScenarioKey"
        />

        <div class="motion-rise motion-rise--4">
          <FutureModules
            :modules="modules"
            :active-path="activeModulePath"
            :goal="moduleGoal"
            :weeks="moduleWeeks"
            :target-kg="moduleTargetKg"
            :context="moduleContext"
            @select="handleSelectModule"
            @update:goal="moduleGoal = $event"
            @update:weeks="moduleWeeks = $event"
            @update:target-kg="moduleTargetKg = $event"
          />
        </div>
      </section>
    </div>
  </main>
</template>
