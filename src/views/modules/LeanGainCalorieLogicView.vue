<script setup>
import { computed, ref, watch } from 'vue'

import ModuleWorkbenchLayout from '@/components/modules/ModuleWorkbenchLayout.vue'
import { useEmbeddedModuleState } from '@/hooks/useEmbeddedModuleState.js'
import { buildLeanGainCalorieLogicPlan } from '@/utils/leanGainCalorieLogic.js'
import { createLeanGainLogicStorageApi } from '@/utils/leanGainLogicStorage.js'

const decisionCopy = {
  hold: 'Hold current calories',
  'reduce-carbs': 'Trim carbs next week',
  'observe-only': 'Keep collecting data',
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
  { label: 'Novice', value: 'Novice' },
  { label: 'Advanced', value: 'Advanced' },
]

const safetyReminders = [
  'Use weekly average body weight, not a single morning weigh-in, before changing intake.',
  'If training performance, recovery, or appetite worsens for 2 to 3 weeks, re-check your TDEE inputs first.',
  'This module is for nutrition planning only. Medical conditions, pregnancy, or eating-disorder history need professional support.',
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
    return 'Keep logging weekly averages. The adjustment logic becomes more confident once enough weeks accumulate.'
  }

  return `Latest weekly gain: ${plan.value.weeklyGainPct.toFixed(2)}%. Current threshold: ${plan.value.weeklyGainThresholdPct.toFixed(2)}%.`
})

const historyEntries = computed(() => history.value.map((entry, index) => ({
  key: `${entry.savedAt ?? 'entry'}-${index}`,
  savedAt: entry.savedAt,
  expLevel: entry.expLevel ?? 'Novice',
  weeklyAverageWeight: normalizePositiveNumber(entry.weeklyAverageWeight),
  phaseLabel: entry.phaseLabel ?? 'Pending phase',
  targetCalories: entry.targetCalories ?? null,
  adjustmentDecision: entry.adjustmentDecision ?? 'observe-only',
  adjustmentReason: entry.adjustmentReason ?? 'No decision recorded yet.',
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
      message: "Enter this week's average body weight before recording a judgment.",
    }
    return
  }

  if (plan.value.gateState !== 'ready') {
    feedback.value = {
      type: 'warning',
      message: 'Complete body-fat, TDEE, and body-weight inputs first. The module should only log formal judgments when a plan can be calculated.',
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
    message: 'Weekly judgment saved. You can keep stacking weekly averages to spot when intake really needs to move.',
  }
}
</script>

<template>
  <ModuleWorkbenchLayout
    eyebrow="Lean Gain Logic"
    title="Lean-gain calorie logic"
    intro="Turn baseline intake, body-fat phase, and weekly weight trend into one calm decision flow. This page is meant to feel like the weekly check-in a coach would do before changing calories."
    note="Body-fat percentage decides the phase. Weekly average body weight decides whether the current phase should stay in place or start trimming carbs. Keep the inputs honest and this becomes much more reliable than reacting to daily scale noise."
  >
    <section class="module-grid">
      <section class="module-section">
        <h2>Shared context</h2>
        <p class="module-copy">
          The workbench keeps profile and intake inputs in sync so this module starts from the same body-composition baseline each time.
        </p>

        <div class="lean-gain-stats">
          <div class="lean-gain-stat">
            <span class="lean-gain-stat__label">Sex</span>
            <strong>{{ state.sex === 'female' ? 'Female' : 'Male' }}</strong>
          </div>
          <div class="lean-gain-stat">
            <span class="lean-gain-stat__label">Age</span>
            <strong>{{ state.age }}</strong>
          </div>
          <div class="lean-gain-stat">
            <span class="lean-gain-stat__label">Height</span>
            <strong>{{ state.heightCm }} cm</strong>
          </div>
          <div class="lean-gain-stat">
            <span class="lean-gain-stat__label">Weight</span>
            <strong>{{ state.weightKg }} kg</strong>
          </div>
          <div class="lean-gain-stat">
            <span class="lean-gain-stat__label">Body fat</span>
            <strong>{{ formatContextMetric(state.bodyFatPct, '%') }}</strong>
          </div>
          <div class="lean-gain-stat">
            <span class="lean-gain-stat__label">BMR</span>
            <strong>{{ formatContextMetric(state.bmr, ' kcal') }}</strong>
          </div>
          <div class="lean-gain-stat">
            <span class="lean-gain-stat__label">TDEE</span>
            <strong>{{ state.tdee }} kcal</strong>
          </div>
        </div>
      </section>

      <section class="module-section">
        <h2>Weekly calibration</h2>
        <p class="module-copy">
          Pick the training experience that matches the current phase, enter this week's average body weight, then store the judgment so next week has real context.
        </p>

        <div class="lean-gain-controls">
          <label class="lean-gain-field">
            <span class="lean-gain-field__label">Experience level</span>
            <a-segmented
              :value="expLevel"
              :options="experienceOptions"
              @change="(value) => (expLevel = value)"
            />
          </label>

          <label class="lean-gain-field">
            <span class="lean-gain-field__label">Weekly average weight</span>
            <a-input-number
              v-model:value="weeklyAverageWeight"
              :min="30"
              :max="250"
              :step="0.1"
              addon-after="kg"
            />
          </label>

          <a-button type="primary" @click="recordWeeklyJudgment">
            Record weekly judgment
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
        <li>Go back to the fitness workbench and fill in body-fat percentage first.</li>
        <li>Until body fat is available, this page avoids phase labels, calorie targets, and macro calculations.</li>
        <li>Once body fat is present, the weekly check-in flow below becomes fully active.</li>
      </ul>
    </section>

    <section v-else-if="plan.gateState === 'incomplete'" class="module-section">
      <h2>{{ plan.title }}</h2>
      <p>{{ plan.description }}</p>
      <ul class="module-list">
        <li>Keep body weight and TDEE current in the main workbench.</li>
        <li>This module only records formal judgments when baseline intake is already trustworthy.</li>
      </ul>
    </section>

    <template v-else>
      <section class="module-grid">
        <section class="module-section">
          <div class="lean-gain-section-head">
            <div>
              <h2>Current stage</h2>
              <p class="module-copy">
                {{ plan.phaseLabel }}: {{ plan.phaseStrategy }}
              </p>
            </div>
            <a-tag color="green">{{ currentStage?.label || plan.phaseLabel }}</a-tag>
          </div>

          <div class="lean-gain-stats lean-gain-stats--focus">
            <div class="lean-gain-stat">
              <span class="lean-gain-stat__label">Target calories</span>
              <strong>{{ plan.targetCalories }} kcal</strong>
            </div>
            <div class="lean-gain-stat">
              <span class="lean-gain-stat__label">Protein</span>
              <strong>{{ plan.proteinGrams }} g</strong>
            </div>
            <div class="lean-gain-stat">
              <span class="lean-gain-stat__label">Carbs</span>
              <strong>{{ plan.carbGrams }} g</strong>
            </div>
            <div class="lean-gain-stat">
              <span class="lean-gain-stat__label">Fat</span>
              <strong>{{ plan.fatGrams }} g</strong>
            </div>
          </div>
        </section>

        <section class="module-section">
          <h2>Adjustment decision</h2>
          <p class="module-copy">
            {{ formatDecision(plan.adjustmentDecision) }}
          </p>
          <p>{{ plan.adjustmentReason }}</p>
          <p v-if="trendNote" class="lean-gain-note">{{ trendNote }}</p>
        </section>
      </section>

      <section class="module-section">
        <h2>Phase map</h2>
        <p class="module-copy">
          Each phase keeps the same protein anchor, then changes calorie level and fat factor. The highlighted card is the one the current body-fat phase points to.
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
                <p>{{ stage.isCurrent ? 'Current phase' : 'Reference phase' }}</p>
              </div>
              <a-tag :color="stage.isCurrent ? 'green' : 'default'">
                {{ stage.isCurrent ? 'Current' : 'Standby' }}
              </a-tag>
            </div>

            <dl class="lean-gain-stage__metrics">
              <div>
                <dt>Calories</dt>
                <dd>{{ stage.targetCalories }} kcal</dd>
              </div>
              <div>
                <dt>Protein</dt>
                <dd>{{ stage.proteinGrams }} g</dd>
              </div>
              <div>
                <dt>Carbs</dt>
                <dd>{{ stage.carbGrams }} g</dd>
              </div>
              <div>
                <dt>Fat</dt>
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
        <h2>History</h2>
        <p class="module-copy">
          Saving the weekly judgment keeps a short decision trail so you can see whether intake changes were based on trend, not mood.
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
        <a-empty v-else description="No weekly judgments yet." />
      </section>

      <section class="module-section">
        <h2>Safety reminders</h2>
        <p class="module-copy">
          The best use of this module is deliberate and boring: execute for a week, collect the average, then adjust only when the trend truly supports it.
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
  gap: 0.9rem;
}

.lean-gain-field {
  display: grid;
  gap: 0.45rem;
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
  justify-content: space-between;
  gap: 0.8rem;
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

@media (max-width: 720px) {
  .lean-gain-controls,
  .lean-gain-section-head,
  .lean-gain-history__top {
    flex-direction: column;
    align-items: stretch;
  }

  .lean-gain-field :deep(.ant-input-number),
  .lean-gain-controls :deep(.ant-segmented) {
    width: 100%;
  }
}
</style>
