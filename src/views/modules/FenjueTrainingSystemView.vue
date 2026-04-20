<script setup>
import { computed, ref, watch } from 'vue'

import ModuleWorkbenchLayout from '@/components/modules/ModuleWorkbenchLayout.vue'
import {
  fenjuePrimarySections,
  fenjueTrainingSystem,
  getFenjueNutritionFocus,
} from '@/data/fenjueTrainingSystem.js'
import { useEmbeddedModuleState } from '@/hooks/useEmbeddedModuleState.js'

// 焚诀训练体系页不是动态计算器，而是一张“内容导航地图”。
// 它根据当前目标自动聚焦饮食恢复部分，但整体内容主要来自结构化训练资料。
const { state } = useEmbeddedModuleState()

const primarySection = ref('overview')
const trainingSection = ref('warmup')
const riskSection = ref('shoulder')
const nutritionSection = ref(getFenjueNutritionFocus(state.goal))
const beginnerSection = ref('weekly-structure')

watch(
  () => state.goal,
  (goal) => {
    if (primarySection.value === 'nutrition-recovery') {
      nutritionSection.value = getFenjueNutritionFocus(goal)
    }
  }
)

const goalLabel = computed(() => (state.goal === 'gain' ? '增肌' : '减脂'))

const contextStats = computed(() => [
  { label: '当前目标', value: goalLabel.value },
  { label: '周期', value: `${state.weeks} 周` },
  { label: '体重', value: `${state.weightKg} kg` },
  { label: 'TDEE', value: `${state.tdee} kcal` },
])

const currentTrainingSection = computed(
  () => fenjueTrainingSystem.trainingMap.sections.find((item) => item.key === trainingSection.value)
)

const currentRiskSection = computed(
  () => fenjueTrainingSystem.riskCorrection.sections.find((item) => item.key === riskSection.value)
)

const currentNutritionSection = computed(
  () => fenjueTrainingSystem.nutritionRecovery.sections.find((item) => item.key === nutritionSection.value)
)

const currentBeginnerSection = computed(
  () => fenjueTrainingSystem.beginnerPlan.sections.find((item) => item.key === beginnerSection.value)
)

const trainingActionColumns = [
  { title: '动作', dataIndex: 'movement', key: 'movement' },
  { title: '定位', dataIndex: 'role', key: 'role', width: 132 },
  { title: '建议', dataIndex: 'prescription', key: 'prescription', width: 188 },
  { title: '执行要点', dataIndex: 'cue', key: 'cue' },
  { title: '更容易练错的点', dataIndex: 'mistakeHint', key: 'mistakeHint' },
]

const beginnerWorkoutColumns = [
  { title: '动作', dataIndex: 'movement', key: 'movement' },
  { title: '组数', dataIndex: 'sets', key: 'sets', width: 92 },
  { title: '次数', dataIndex: 'reps', key: 'reps', width: 130 },
  { title: '间歇', dataIndex: 'rest', key: 'rest', width: 100 },
  { title: '执行重点', dataIndex: 'cue', key: 'cue' },
]
</script>

<template>
  <ModuleWorkbenchLayout
    eyebrow="Training System"
    title="谭成义焚诀训练体系"
    :intro="`把原则、热身、分部位训练、风险修正、饮食恢复和新手四周计划收成一套更容易进入的训练地图。当前工作台目标是${goalLabel}，饮食恢复会优先聚焦对应部分。`"
    note="这是一页训练体系入口，不是新的热量计算器。它更适合拿来建立训练顺序、判断边界和快速找到当前最该看的部分。"
  >
    <section class="module-grid">
      <section class="module-section">
        <h2>当前上下文</h2>
        <p class="module-copy">
          页面会借用工作台里已经算好的目标、周期、体重和 TDEE，只做内容聚焦，不重新生成一套训练处方。
        </p>
        <div class="fenjue-stats">
          <article v-for="item in contextStats" :key="item.label" class="fenjue-stat">
            <span class="fenjue-stat__label">{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </article>
        </div>
      </section>

      <section class="module-section">
        <h2>怎么用这页</h2>
        <p class="module-copy">
          如果你是第一次接触这套体系，先从体系总览开始；如果你今天马上要训练，就从训练地图进；如果已经有不适或代偿，先看风险修正。
        </p>
        <ul class="module-list">
          <li v-for="item in fenjueTrainingSystem.overview.quickStart" :key="item">{{ item }}</li>
        </ul>
      </section>
    </section>

    <section class="module-section">
      <div class="fenjue-section-head">
        <div>
          <h2>训练地图</h2>
          <p class="module-copy">
            先清楚自己处在哪个入口，再去读对应内容，会比从头硬啃整套长文更快进入状态。
          </p>
        </div>
      </div>

      <div class="fenjue-pill-row" role="tablist" aria-label="焚诀一级区块">
        <button
          v-for="item in fenjuePrimarySections"
          :key="item.key"
          type="button"
          class="fenjue-pill"
          :class="{ 'fenjue-pill--active': item.key === primarySection }"
          @click="primarySection = item.key"
        >
          {{ item.label }}
        </button>
      </div>
    </section>

    <template v-if="primarySection === 'overview'">
      <section class="module-section">
        <h2>{{ fenjueTrainingSystem.overview.title }}</h2>
        <p>{{ fenjueTrainingSystem.overview.intro }}</p>
        <div class="fenjue-card-grid">
          <article v-for="item in fenjueTrainingSystem.overview.principles" :key="item.title" class="fenjue-card">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </article>
        </div>
      </section>

      <section class="module-section">
        <h2>体系闭环</h2>
        <p class="module-copy">
          焚诀体系不是只讲训练动作，它把训练、饮食、恢复、心态当成同一条链路来管理。
        </p>
        <div class="fenjue-loop-grid">
          <article v-for="item in fenjueTrainingSystem.overview.closedLoop" :key="item.key" class="fenjue-loop-card">
            <span class="fenjue-loop-card__eyebrow">{{ item.title }}</span>
            <p>{{ item.description }}</p>
          </article>
        </div>
      </section>

      <section class="module-section">
        <h2>分化节奏</h2>
        <p class="module-copy">
          分化不是越复杂越好，而是要匹配你当前的训练基础、恢复能力和动作掌握程度。
        </p>
        <div class="fenjue-card-grid fenjue-card-grid--wide">
          <article v-for="item in fenjueTrainingSystem.overview.rhythms" :key="item.title" class="fenjue-card">
            <h3>{{ item.title }}</h3>
            <p><strong>适合阶段：</strong>{{ item.fit }}</p>
            <p><strong>建议节奏：</strong>{{ item.cadence }}</p>
            <p>{{ item.note }}</p>
          </article>
        </div>
      </section>
    </template>

    <template v-else-if="primarySection === 'training-map'">
      <section class="module-section">
        <h2>训练地图</h2>
        <p class="module-copy">
          训练地图按“热身激活 + 胸、背、肩、手臂、腿、臀、核心”组织。先找到今天要练的部位，再对照动作、建议、执行要点和常错点去看，会更容易直接进入训练。
        </p>
        <div class="fenjue-pill-row" role="tablist" aria-label="训练地图子区块">
          <button
            v-for="item in fenjueTrainingSystem.trainingMap.sections"
            :key="item.key"
            type="button"
            class="fenjue-pill fenjue-pill--soft"
            :class="{ 'fenjue-pill--active': item.key === trainingSection }"
            @click="trainingSection = item.key"
          >
            {{ item.label }}
          </button>
        </div>

        <template v-if="currentTrainingSection">
          <h3 class="fenjue-subtitle">{{ currentTrainingSection.label }}</h3>
          <p>{{ currentTrainingSection.intro }}</p>

          <div v-if="currentTrainingSection.flow" class="fenjue-card-grid fenjue-card-grid--wide">
            <article v-for="item in currentTrainingSection.flow" :key="item.title" class="fenjue-card">
              <h3>{{ item.title }}</h3>
              <p>{{ item.copy }}</p>
            </article>
          </div>

          <div v-if="currentTrainingSection.groups" class="fenjue-card-grid fenjue-card-grid--wide">
            <article v-for="item in currentTrainingSection.groups" :key="item.title" class="fenjue-card">
              <h3>{{ item.title }}</h3>
              <p>{{ item.summary }}</p>
              <ul class="module-list">
                <li v-for="point in item.bullets" :key="point">{{ point }}</li>
              </ul>
            </article>
          </div>

          <div v-if="currentTrainingSection.actionGroups" class="fenjue-action-groups">
            <article
              v-for="group in currentTrainingSection.actionGroups"
              :key="group.key"
              class="module-section fenjue-inner-section"
            >
              <h3>{{ group.title }}</h3>
              <p class="module-copy">{{ group.summary }}</p>
              <a-table
                :columns="trainingActionColumns"
                :data-source="group.items"
                :pagination="false"
                :scroll="{ x: 1120 }"
                :row-key="(record) => `${group.key}-${record.movement}-${record.role}`"
              />
            </article>
          </div>

          <ul v-if="currentTrainingSection.cues" class="module-list">
            <li v-for="item in currentTrainingSection.cues" :key="item">{{ item }}</li>
          </ul>
        </template>
      </section>
    </template>

    <template v-else-if="primarySection === 'risk-correction'">
      <section class="module-section">
        <h2>风险修正</h2>
        <p class="module-copy">
          这一块不是为了放大焦虑，而是帮助你更快判断问题根源，知道该先修什么、练的时候怎么避坑。
        </p>
        <div class="fenjue-pill-row" role="tablist" aria-label="风险修正子区块">
          <button
            v-for="item in fenjueTrainingSystem.riskCorrection.sections"
            :key="item.key"
            type="button"
            class="fenjue-pill fenjue-pill--soft"
            :class="{ 'fenjue-pill--active': item.key === riskSection }"
            @click="riskSection = item.key"
          >
            {{ item.label }}
          </button>
        </div>

        <template v-if="currentRiskSection">
          <h3 class="fenjue-subtitle">{{ currentRiskSection.label }}</h3>
          <p>{{ currentRiskSection.intro }}</p>

          <div class="fenjue-card-grid fenjue-card-grid--risk">
            <article class="fenjue-card">
              <h3>常见根源</h3>
              <ul class="module-list">
                <li v-for="item in currentRiskSection.causes" :key="item">{{ item }}</li>
              </ul>
            </article>
            <article class="fenjue-card">
              <h3>修正顺序</h3>
              <ul class="module-list">
                <li v-for="item in currentRiskSection.fixes" :key="item">{{ item }}</li>
              </ul>
            </article>
            <article class="fenjue-card">
              <h3>日常维护</h3>
              <ul class="module-list">
                <li v-for="item in currentRiskSection.habits" :key="item">{{ item }}</li>
              </ul>
            </article>
          </div>
        </template>
      </section>
    </template>

    <template v-else-if="primarySection === 'nutrition-recovery'">
      <section class="module-section">
        <h2>饮食恢复</h2>
        <p class="module-copy">
          当前工作台目标是{{ goalLabel }}，所以这里会优先把焦点放到对应策略；如果你想看别的场景，也可以直接切过去。
        </p>
        <div class="fenjue-pill-row" role="tablist" aria-label="饮食恢复子区块">
          <button
            v-for="item in fenjueTrainingSystem.nutritionRecovery.sections"
            :key="item.key"
            type="button"
            class="fenjue-pill fenjue-pill--soft"
            :class="{ 'fenjue-pill--active': item.key === nutritionSection }"
            @click="nutritionSection = item.key"
          >
            {{ item.label }}
          </button>
        </div>

        <template v-if="currentNutritionSection">
          <h3 class="fenjue-subtitle">{{ currentNutritionSection.label }}</h3>
          <p>{{ currentNutritionSection.intro }}</p>
          <section class="module-grid">
            <article class="module-section fenjue-inner-section">
              <h3>核心原则</h3>
              <ul class="module-list">
                <li v-for="item in currentNutritionSection.principles" :key="item">{{ item }}</li>
              </ul>
            </article>
            <article class="module-section fenjue-inner-section">
              <h3>执行边界</h3>
              <ul class="module-list">
                <li v-for="item in currentNutritionSection.guardrails" :key="item">{{ item }}</li>
              </ul>
            </article>
          </section>
        </template>
      </section>
    </template>

    <template v-else-if="primarySection === 'beginner-plan'">
      <section class="module-section">
        <h2>新手四周</h2>
        <p class="module-copy">
          这部分直接来自附录，是最适合立刻拿去执行的一套版本。重点不是“练满”，而是“按流程把动作质量和发力感建立起来”。
        </p>
        <div class="fenjue-pill-row" role="tablist" aria-label="新手四周子区块">
          <button
            v-for="item in fenjueTrainingSystem.beginnerPlan.sections"
            :key="item.key"
            type="button"
            class="fenjue-pill fenjue-pill--soft"
            :class="{ 'fenjue-pill--active': item.key === beginnerSection }"
            @click="beginnerSection = item.key"
          >
            {{ item.label }}
          </button>
        </div>

        <template v-if="currentBeginnerSection?.schedule">
          <h3 class="fenjue-subtitle">{{ currentBeginnerSection.label }}</h3>
          <p>{{ currentBeginnerSection.intro }}</p>
          <table class="module-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>重点</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in currentBeginnerSection.schedule" :key="item.day">
                <td>{{ item.day }}</td>
                <td>{{ item.focus }}</td>
                <td>{{ item.detail }}</td>
              </tr>
            </tbody>
          </table>
          <ul class="module-list">
            <li v-for="item in currentBeginnerSection.rules" :key="item">{{ item }}</li>
          </ul>
        </template>

        <template v-else-if="currentBeginnerSection?.workout">
          <h3 class="fenjue-subtitle">{{ currentBeginnerSection.label }}</h3>
          <p>{{ currentBeginnerSection.intro }}</p>
          <section class="module-grid">
            <article class="module-section fenjue-inner-section">
              <h3>热身激活</h3>
              <ul class="module-list">
                <li v-for="item in currentBeginnerSection.warmup" :key="item">{{ item }}</li>
              </ul>
            </article>
            <article class="module-section fenjue-inner-section">
              <h3>拉伸放松</h3>
              <ul class="module-list">
                <li v-for="item in currentBeginnerSection.cooldown" :key="item">{{ item }}</li>
              </ul>
            </article>
          </section>
          <a-table
            :columns="beginnerWorkoutColumns"
            :data-source="currentBeginnerSection.workout"
            :pagination="false"
            row-key="movement"
            :scroll="{ x: 860 }"
          />
        </template>

        <template v-else-if="currentBeginnerSection?.weeks">
          <h3 class="fenjue-subtitle">{{ currentBeginnerSection.label }}</h3>
          <p>{{ currentBeginnerSection.intro }}</p>
          <div class="fenjue-card-grid fenjue-card-grid--wide">
            <article v-for="item in currentBeginnerSection.weeks" :key="item.title" class="fenjue-card">
              <h3>{{ item.title }}</h3>
              <p><strong>{{ item.focus }}</strong></p>
              <p>{{ item.detail }}</p>
            </article>
          </div>
        </template>
      </section>
    </template>

    <section class="module-section">
      <h2>{{ fenjueTrainingSystem.closing.title }}</h2>
      <p class="module-copy">
        {{ fenjueTrainingSystem.closing.note }}
      </p>
      <div class="module-pill-row">
        <span v-for="item in fenjueTrainingSystem.closing.pills" :key="item" class="module-pill">{{ item }}</span>
      </div>
    </section>
  </ModuleWorkbenchLayout>
</template>

<style scoped>
.fenjue-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 0.8rem;
}

.fenjue-stat {
  padding: 0.9rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
}

.fenjue-stat__label {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--muted);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fenjue-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.fenjue-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 0.95rem;
}

.fenjue-pill {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  background: var(--panel-soft);
  color: var(--text);
  font: inherit;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;
}

.fenjue-pill:hover,
.fenjue-pill:focus-visible {
  border-color: color-mix(in srgb, var(--accent) 52%, var(--line));
  box-shadow: 0 12px 24px rgba(63, 98, 18, 0.08);
  transform: translateY(-1px);
  outline: none;
}

.fenjue-pill--soft {
  background: color-mix(in srgb, var(--panel-soft) 82%, var(--panel) 18%);
}

.fenjue-pill--active {
  border-color: color-mix(in srgb, var(--accent) 60%, var(--line));
  background: color-mix(in srgb, var(--accent) 14%, var(--panel) 86%);
}

.fenjue-subtitle {
  margin-top: 1.1rem;
}

.fenjue-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.9rem;
  margin-top: 1rem;
}

.fenjue-card-grid--wide {
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
}

.fenjue-card-grid--risk {
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
}

.fenjue-card,
.fenjue-loop-card {
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
}

.fenjue-card h3,
.fenjue-loop-card__eyebrow {
  margin: 0;
}

.fenjue-card p,
.fenjue-loop-card p {
  margin: 0.65rem 0 0;
}

.fenjue-loop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.9rem;
  margin-top: 1rem;
}

.fenjue-loop-card__eyebrow {
  display: block;
  color: var(--accent);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fenjue-inner-section {
  min-width: 0;
  overflow: hidden;
  background: color-mix(in srgb, var(--panel) 78%, var(--panel-soft) 22%);
  box-shadow: none;
}

.fenjue-action-groups {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

@media (max-width: 720px) {
  .fenjue-section-head {
    flex-direction: column;
  }
}
</style>
