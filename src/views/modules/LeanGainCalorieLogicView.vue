<script setup>
import { computed, ref, watch } from 'vue'

import ModuleWorkbenchLayout from '@/components/modules/ModuleWorkbenchLayout.vue'
import { useEmbeddedModuleState } from '@/hooks/useEmbeddedModuleState.js'
import { buildLeanGainCalorieLogicPlan } from '@/utils/leanGainCalorieLogic.js'
import { createLeanGainLogicStorageApi } from '@/utils/leanGainLogicStorage.js'

const decisionCopy = {
  hold: '维持当前热量',
  'reduce-carbs': '下周下调碳水',
  'observe-only': '继续观察数据',
}

const experienceCopy = {
  Novice: '新手',
  Advanced: '进阶',
}

const legacyCopyMap = {
  'Phase 1': '第 1 阶段',
  'Phase 2': '第 2 阶段',
  'Phase 3': '第 3 阶段',
  'Phase 4': '第 4 阶段',
  'High body-fat recomposition': '高体脂重组',
  'Maintenance recomposition': '维持热量重组',
  'Golden lean-gain': '黄金精益增肌',
  'Active surplus': '主动盈余',
  'Need at least 3 weekly averages before changing carbs.': '至少记录 3 周周均体重后，再决定是否下调碳水。',
  'The last 3 weekly averages kept rising, so next week carbs drop 10%.': '最近 3 周的周均体重连续上升，下周建议把碳水下调 10%。',
  'Recent weekly averages are not rising 3 weeks in a row.': '最近 3 周的周均体重没有连续上升，当前摄入先保持不变。',
  'Need at least 2 weekly averages before checking rate of gain.': '至少记录 2 周周均体重后，才能判断增重速率是否超出阈值。',
  'Weekly gain is above the current threshold, so next week carbs drop 10%.': '当前周增重速度高于阈值，下周建议把碳水下调 10%。',
  'Weekly gain is within the current threshold.': '当前周增重速度仍在阈值内，先维持现在的摄入。',
  'Weekly trend still supports a carb reduction, but the calorie floor limits how far it can go.': '周趋势仍支持下调碳水，但热量下限限制了本次可下调的幅度。',
  'A carb reduction would push intake below the calorie floor, so the current target stays in place.': '如果继续下调碳水，摄入会低于热量下限，所以本周目标维持不变。',
}

const storage = createLeanGainLogicStorageApi()
const savedPrefs = storage.loadPrefs()
const { state } = useEmbeddedModuleState()

const expLevel = ref(savedPrefs.expLevel === 'Advanced' ? 'Advanced' : 'Novice')
const weeklyAverageWeight = ref(
  Number.isFinite(Number(savedPrefs.weeklyAverageWeight)) && Number(savedPrefs.weeklyAverageWeight) > 0
    ? Number(savedPrefs.weeklyAverageWeight)
    : null
)
const history = ref(storage.loadHistory())
const feedback = ref({
  type: 'info',
  message: '',
})

const experienceOptions = [
  { label: '新手', value: 'Novice' },
  { label: '进阶', value: 'Advanced' },
]

const safetyReminders = [
  '调整前请优先看周均体重，而不是某一天早晨的单次称重结果。',
  '如果训练表现、恢复状态或食欲连续 2 到 3 周变差，先回头检查 TDEE 输入是否合理。',
  '这个模块只用于营养规划。若有疾病、孕期或饮食失调病史，请优先寻求专业支持。',
]

function normalizePositiveNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : null
}

function formatDate(value) {
  if (!value) return '--'

  return new Date(value).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  })
}

function formatDecision(value) {
  return decisionCopy[value] ?? decisionCopy['observe-only']
}

function formatExperienceLevel(value) {
  return experienceCopy[value] ?? experienceCopy.Novice
}

function translateLegacyCopy(value, fallback = '') {
  if (!value) return fallback
  return legacyCopyMap[value] ?? value
}

function formatPhaseLabel(value) {
  return translateLegacyCopy(value, '待判定阶段')
}

function formatContextMetric(value, suffix = '') {
  return value === null || value === undefined ? '--' : `${value}${suffix}`
}

const draftWeight = computed(() => normalizePositiveNumber(weeklyAverageWeight.value))

const recordedWeeklyWeights = computed(() =>
  history.value
    .slice()
    .reverse()
    .map((entry) => normalizePositiveNumber(entry.weeklyAverageWeight))
    .filter((value) => value !== null)
)

const weeklyAverageWeights = computed(() => (
  draftWeight.value === null
    ? recordedWeeklyWeights.value
    : [...recordedWeeklyWeights.value, draftWeight.value]
))

const plan = computed(() => buildLeanGainCalorieLogicPlan({
  sex: state.sex,
  bodyFatPct: state.bodyFatPct,
  tdee: state.tdee,
  weightKg: state.weightKg,
  expLevel: expLevel.value,
  weeklyAverageWeights: weeklyAverageWeights.value,
}))

const currentStage = computed(() => plan.value.stages?.find((stage) => stage.isCurrent) ?? null)

const trendNote = computed(() => {
  if (plan.value.gateState !== 'ready') return ''
  if (plan.value.weeklyGainPct === null || plan.value.weeklyGainThresholdPct === null) {
    return '继续记录每周平均体重。周数足够后，这套调整逻辑会更可靠。'
  }

  return `最新周增重：${plan.value.weeklyGainPct.toFixed(2)}%。当前阈值：${plan.value.weeklyGainThresholdPct.toFixed(2)}%。`
})

const historyEntries = computed(() => history.value.map((entry, index) => ({
  key: `${entry.savedAt ?? 'entry'}-${index}`,
  savedAt: entry.savedAt,
  expLevel: formatExperienceLevel(entry.expLevel ?? 'Novice'),
  weeklyAverageWeight: normalizePositiveNumber(entry.weeklyAverageWeight),
  phaseLabel: formatPhaseLabel(entry.phaseLabel),
  targetCalories: entry.targetCalories ?? null,
  adjustmentDecision: entry.adjustmentDecision ?? 'observe-only',
  adjustmentReason: translateLegacyCopy(entry.adjustmentReason, '暂时还没有记录决策原因。'),
  proteinGrams: entry.proteinGrams ?? null,
  carbGrams: entry.carbGrams ?? null,
  fatGrams: entry.fatGrams ?? null,
})))

watch(
  [expLevel, weeklyAverageWeight],
  ([nextExpLevel, nextWeight]) => {
    storage.savePrefs({
      expLevel: nextExpLevel,
      weeklyAverageWeight: normalizePositiveNumber(nextWeight),
    })
  },
  { immediate: true }
)

function recordWeeklyJudgment() {
  if (draftWeight.value === null) {
    feedback.value = {
      type: 'warning',
      message: '请先输入本周周均体重，再保存本周判断。',
    }
    return
  }

  if (plan.value.gateState !== 'ready') {
    feedback.value = {
      type: 'warning',
      message: '请先补全体脂率、TDEE 和体重。只有能计算出计划时，这里才会记录正式判断。',
    }
    return
  }

  history.value = storage.pushHistory({
    savedAt: Date.now(),
    expLevel: expLevel.value,
    weeklyAverageWeight: draftWeight.value,
    phase: plan.value.phase,
    phaseLabel: plan.value.phaseLabel,
    targetCalories: plan.value.targetCalories,
    adjustmentDecision: plan.value.adjustmentDecision,
    adjustmentReason: plan.value.adjustmentReason,
    proteinGrams: plan.value.proteinGrams,
    carbGrams: plan.value.carbGrams,
    fatGrams: plan.value.fatGrams,
  })
  weeklyAverageWeight.value = null

  feedback.value = {
    type: 'success',
    message: '本周判断已保存。继续累积周均体重后，会更容易看清什么时候真的需要调整摄入。',
  }
}
</script>

<template>
  <ModuleWorkbenchLayout
    eyebrow="精益增肌逻辑"
    title="精益增肌热量决策"
    intro="把基础摄入、体脂阶段和每周体重趋势放进同一条清晰的决策链里。这一页更像是教练在决定是否调整热量前，会先带你做的一次周度复盘。"
    note="体脂率决定你处在哪个阶段，周均体重决定当前阶段是继续维持还是开始下调碳水。只要输入足够真实，它会比盯着每日体重波动更可靠。"
  >
    <section class="module-grid">
      <section class="module-section">
        <h2>共享基础信息</h2>
        <p class="module-copy">
          工作台会同步档案与摄入参数，让这个模块每次都从同一套体成分基线出发。
        </p>

        <div class="lean-gain-stats">
          <div class="lean-gain-stat">
            <span class="lean-gain-stat__label">性别</span>
            <strong>{{ state.sex === 'female' ? '女' : '男' }}</strong>
          </div>
          <div class="lean-gain-stat">
            <span class="lean-gain-stat__label">年龄</span>
            <strong>{{ state.age }}</strong>
          </div>
          <div class="lean-gain-stat">
            <span class="lean-gain-stat__label">身高</span>
            <strong>{{ state.heightCm }} cm</strong>
          </div>
          <div class="lean-gain-stat">
            <span class="lean-gain-stat__label">体重</span>
            <strong>{{ state.weightKg }} kg</strong>
          </div>
          <div class="lean-gain-stat">
            <span class="lean-gain-stat__label">体脂率</span>
            <strong>{{ formatContextMetric(state.bodyFatPct, '%') }}</strong>
          </div>
          <div class="lean-gain-stat">
            <span class="lean-gain-stat__label">基础代谢</span>
            <strong>{{ formatContextMetric(state.bmr, ' kcal') }}</strong>
          </div>
          <div class="lean-gain-stat">
            <span class="lean-gain-stat__label">日总消耗</span>
            <strong>{{ state.tdee }} kcal</strong>
          </div>
        </div>
      </section>

      <section class="module-section">
        <h2>每周校准</h2>
        <p class="module-copy">
          选择更符合当前情况的训练经验，输入本周周均体重，再保存这次判断，为下周的调整提供真实上下文。
        </p>

        <div class="lean-gain-controls">
          <label class="lean-gain-field">
            <span class="lean-gain-field__label">训练经验</span>
            <a-segmented
              :value="expLevel"
              :options="experienceOptions"
              @change="(value) => (expLevel = value)"
            />
          </label>

          <label class="lean-gain-field">
            <span class="lean-gain-field__label">本周周均体重</span>
            <a-input-number
              v-model:value="weeklyAverageWeight"
              :min="30"
              :max="250"
              :step="0.1"
              addon-after="kg"
            />
          </label>

          <a-button type="primary" @click="recordWeeklyJudgment">
            保存本周判断
          </a-button>
        </div>

        <a-alert
          v-if="feedback.message"
          class="lean-gain-feedback"
          show-icon
          :type="feedback.type"
          :message="feedback.message"
        />
      </section>
    </section>

    <section v-if="plan.gateState === 'reminder'" class="module-section">
      <h2>{{ plan.title }}</h2>
      <p>{{ plan.description }}</p>
      <ul class="module-list">
        <li>先回到健身工作台，把体脂率补完整。</li>
        <li>在体脂率缺失时，这一页不会给出阶段标签、热量目标或宏量营养计算。</li>
        <li>只要体脂率补齐，下面这套每周复盘流程就会完整启用。</li>
      </ul>
    </section>

    <section v-else-if="plan.gateState === 'incomplete'" class="module-section">
      <h2>{{ plan.title }}</h2>
      <p>{{ plan.description }}</p>
      <ul class="module-list">
        <li>请先在主工作台里把体重和 TDEE 更新到最新。</li>
        <li>只有基础摄入足够可信，这个模块才适合记录正式判断。</li>
      </ul>
    </section>

    <template v-else>
      <section class="module-grid">
        <section class="module-section">
          <div class="lean-gain-section-head">
            <div>
              <h2>当前阶段</h2>
              <p class="module-copy">
                {{ plan.phaseLabel }}: {{ plan.phaseStrategy }}
              </p>
            </div>
            <a-tag color="green">{{ currentStage?.label || plan.phaseLabel }}</a-tag>
          </div>

          <div class="lean-gain-stats lean-gain-stats--focus">
            <div class="lean-gain-stat">
              <span class="lean-gain-stat__label">目标热量</span>
              <strong>{{ plan.targetCalories }} kcal</strong>
            </div>
            <div class="lean-gain-stat">
              <span class="lean-gain-stat__label">蛋白质</span>
              <strong>{{ plan.proteinGrams }} g</strong>
            </div>
            <div class="lean-gain-stat">
              <span class="lean-gain-stat__label">碳水</span>
              <strong>{{ plan.carbGrams }} g</strong>
            </div>
            <div class="lean-gain-stat">
              <span class="lean-gain-stat__label">脂肪</span>
              <strong>{{ plan.fatGrams }} g</strong>
            </div>
          </div>
        </section>

        <section class="module-section">
          <h2>调整判断</h2>
          <p class="module-copy">
            {{ formatDecision(plan.adjustmentDecision) }}
          </p>
          <p>{{ plan.adjustmentReason }}</p>
          <p v-if="trendNote" class="lean-gain-note">{{ trendNote }}</p>
        </section>
      </section>

      <section class="module-section">
        <h2>阶段一览</h2>
        <p class="module-copy">
          每个阶段都固定同一条蛋白锚点，再调整热量水平和脂肪系数。高亮卡片就是当前体脂阶段对应的位置。
        </p>

        <div class="lean-gain-stages">
          <article
            v-for="stage in plan.stages"
            :key="stage.stage"
            class="lean-gain-stage"
            :class="{ 'lean-gain-stage--current': stage.isCurrent }"
          >
            <div class="lean-gain-stage__header">
              <div>
                <h3>{{ stage.label }}</h3>
                <p>{{ stage.isCurrent ? '当前阶段' : '参考阶段' }}</p>
              </div>
              <span
                class="lean-gain-stage__badge"
                :class="{ 'lean-gain-stage__badge--current': stage.isCurrent }"
              >
                {{ stage.isCurrent ? '当前' : '参考' }}
              </span>
            </div>

            <dl class="lean-gain-stage__metrics">
              <div>
                <dt>热量</dt>
                <dd>{{ stage.targetCalories }} kcal</dd>
              </div>
              <div>
                <dt>蛋白质</dt>
                <dd>{{ stage.proteinGrams }} g</dd>
              </div>
              <div>
                <dt>碳水</dt>
                <dd>{{ stage.carbGrams }} g</dd>
              </div>
              <div>
                <dt>脂肪</dt>
                <dd>{{ stage.fatGrams }} g</dd>
              </div>
            </dl>

            <p class="lean-gain-stage__decision">
              {{ formatDecision(stage.adjustmentDecision || 'hold') }}
            </p>
          </article>
        </div>
      </section>
    </template>

    <section class="module-grid">
      <section class="module-section">
        <h2>历史记录</h2>
        <p class="module-copy">
          保存每周判断后，这里会留下短期决策轨迹，方便你回看每次调整是不是基于趋势，而不是情绪。
        </p>

        <div v-if="historyEntries.length" class="lean-gain-history">
          <article
            v-for="entry in historyEntries"
            :key="entry.key"
            class="lean-gain-history__card"
          >
            <div class="lean-gain-history__top">
              <strong>{{ formatDate(entry.savedAt) }}</strong>
              <a-tag>{{ entry.phaseLabel }}</a-tag>
            </div>
            <p>
              {{ entry.expLevel }} /
              {{ entry.weeklyAverageWeight ?? '--' }} kg /
              {{ entry.targetCalories ?? '--' }} kcal
            </p>
            <p>{{ formatDecision(entry.adjustmentDecision) }}</p>
            <p>{{ entry.adjustmentReason }}</p>
          </article>
        </div>
        <a-empty v-else description="还没有每周记录" />
      </section>

      <section class="module-section">
        <h2>执行提醒</h2>
        <p class="module-copy">
          这个模块最适合用在克制而稳定的节奏里：先执行一周、收集周均值，再只在趋势真的支持时调整。
        </p>

        <ul class="module-list">
          <li v-for="item in safetyReminders" :key="item">{{ item }}</li>
        </ul>
      </section>
    </section>
  </ModuleWorkbenchLayout>
</template>

<style scoped>
.lean-gain-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 0.8rem;
}

.lean-gain-stats--focus {
  margin-top: 0.9rem;
}

.lean-gain-stat {
  padding: 0.85rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
}

.lean-gain-stat__label {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--muted);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.lean-gain-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: center;
  gap: 0.9rem;
}

.lean-gain-field {
  display: grid;
  gap: 0.45rem;
  flex: 1 1 13rem;
  min-width: 0;
  max-width: 16rem;
}

.lean-gain-field__label {
  color: var(--muted);
  font-size: 0.84rem;
}

.lean-gain-feedback {
  margin-top: 0.9rem;
}

.lean-gain-section-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}

.lean-gain-note {
  margin-top: 0.75rem;
  color: var(--muted);
}

.lean-gain-stages {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 0.9rem;
}

.lean-gain-stage {
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
}

.lean-gain-stage--current {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
  background: color-mix(in srgb, var(--panel-soft) 78%, var(--accent) 22%);
}

.lean-gain-stage__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.lean-gain-stage__badge {
  flex: 0 0 auto;
  inline-size: 3.2rem;
  block-size: 3.2rem;
  display: grid;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--line) 88%, var(--text) 12%);
  border-radius: 50%;
  background: color-mix(in srgb, var(--panel) 82%, var(--panel-soft) 18%);
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: 0.02em;
  text-align: center;
}

.lean-gain-stage__badge--current {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--line));
  background: color-mix(in srgb, var(--accent) 16%, var(--panel) 84%);
  color: var(--text);
}

.lean-gain-stage__header p,
.lean-gain-stage__decision {
  margin: 0.45rem 0 0;
  color: var(--muted);
}

.lean-gain-stage__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 1rem 0 0;
}

.lean-gain-stage__metrics dt {
  color: var(--muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.lean-gain-stage__metrics dd {
  margin: 0.3rem 0 0;
  font-weight: 700;
}

.lean-gain-history {
  display: grid;
  gap: 0.85rem;
}

.lean-gain-history__card {
  padding: 0.95rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
}

.lean-gain-history__card p {
  margin: 0.45rem 0 0;
}

.lean-gain-history__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.lean-gain-controls :deep(.ant-btn) {
  min-width: 12rem;
}

.lean-gain-field :deep(.ant-segmented),
.lean-gain-field :deep(.ant-input-number) {
  width: 100%;
}

@media (max-width: 720px) {
  .lean-gain-controls,
  .lean-gain-section-head,
  .lean-gain-history__top {
    flex-direction: column;
    align-items: stretch;
  }

  .lean-gain-field,
  .lean-gain-controls :deep(.ant-btn) {
    max-width: none;
  }
}
</style>
