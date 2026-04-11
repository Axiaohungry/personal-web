<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import FutureModules from '@/components/FutureModules.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import TdeeBreakdown from '@/components/TdeeBreakdown.vue'
import TdeeForm from '@/components/TdeeForm.vue'
import TdeeSummary from '@/components/TdeeSummary.vue'
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

const modules = [
  {
    title: '碳循环',
    summary: '把高碳、中碳、低碳安排进训练节奏里，兼顾表现和热量控制。',
    routePath: '/fitness/modules/carb-cycling',
  },
  {
    title: '碳水渐降',
    summary: '按阶段慢慢下调，不靠极端低碳硬撑减脂。',
    routePath: '/fitness/modules/carb-taper',
  },
  {
    title: '5+2 轻断食',
    summary: '如果你不想天天算得很紧，5 天正常吃、2 天轻一点，往往更容易坚持。',
    routePath: '/fitness/modules/five-two-fasting',
  },
  {
    title: '16+8 轻断食',
    summary: '把吃饭时间收得整齐一点，有时候比一味靠意志力更省心。',
    routePath: '/fitness/modules/sixteen-eight-fasting',
  },
  {
    title: '食物库',
    summary: '用更直观的方式看常见食物和外部食品数据。',
    routePath: '/fitness/modules/food-library',
  },
  {
    title: '增肌底层热量逻辑',
    summary: '从 BMR、TDEE、体脂和增肌目标出发，拆出可重载的热量决策入口。',
    routePath: '/fitness/modules/lean-gain-calorie-logic',
  },
  {
    title: '谭成义焚诀训练体系',
    summary: '把原则、热身、分部位训练、风险修正和新手四周计划收成一套更容易进入的训练地图。',
    routePath: '/fitness/modules/fenjue-training-system',
  },
  {
    title: '补剂库',
    summary: '把补剂、优先级、剂量和证据放到一页里看清楚。',
    routePath: '/fitness/modules/supplement-library',
  },
].map((module) => ({
  ...module,
  href: router.resolve({ path: module.routePath }).href,
}))

const activeModulePath = ref(modules[0].routePath)
const currentScenarioKey = computed(() => (planningContext.value.goal === 'gain' ? 'lean-gain' : 'cut'))

function describeScenarioPace(key, scenarioPlan) {
  if (key === 'maintain') {
    return '先稳住当前体重，把波动压在最小范围里。'
  }

  const actionLabel = key === 'cut' ? '减脂' : '增肌'
  return `按 ${planningContext.value.weeks} 周、${planningContext.value.targetKg} kg 的目标，给出 ${actionLabel}节奏：${scenarioPlan.dailyAdjustment} kcal/天`
}

const scenarios = computed(() => {
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

        <div class="motion-rise motion-rise--3">
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
