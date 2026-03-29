<script setup>
import { computed } from 'vue'

const props = defineProps({
  calculation: {
    type: Object,
    required: true,
  },
  explanation: {
    type: Object,
    required: true,
  },
})

const rows = computed(() => [
  { label: '基础代谢', value: props.calculation.bmr },
  { label: '步数活动', value: props.calculation.stepCalories },
  { label: '职业活动', value: props.calculation.occupationCalories },
  { label: '力量训练（日均）', value: props.calculation.resistanceDailyCalories },
  { label: '有氧训练（日均）', value: props.calculation.cardioDailyCalories },
])
</script>

<template>
  <section class="fitness-panel motion-rise motion-rise--3">
    <a-card class="ant-surface-card" :bordered="false">
      <template #title>
        <div class="fitness-panel__header">
          <div>
            <p class="fitness-panel__eyebrow">Breakdown</p>
            <h2 class="fitness-panel__title">透明计算过程</h2>
          </div>
        </div>
      </template>

      <a-statistic
        class="fitness-panel__statistic"
        title="估算 TDEE"
        :value="calculation.tdee"
        suffix="kcal"
      />

      <a-list class="metric-list" :data-source="rows" item-layout="horizontal">
        <template #renderItem="{ item }">
          <a-list-item class="metric-list__item">
            <div class="metric-list__row">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }} kcal</strong>
            </div>
          </a-list-item>
        </template>
      </a-list>

      <a-alert
        class="fitness-panel__explanation-alert"
        type="info"
        show-icon
        :message="`${explanation.sexLabel}当前使用：${explanation.bmrMethod}`"
        :description="explanation.bmrExplanation"
      />

      <section class="fitness-panel__explanation-block">
        <h3 class="fitness-panel__subheading">性别影响了哪些环节</h3>
        <ul class="fitness-panel__explanation-list">
          <li>{{ explanation.bmrExplanation }}</li>
          <li>{{ explanation.stepExplanation }}</li>
          <li>{{ explanation.trainingExplanation }}</li>
        </ul>
      </section>

      <p class="fitness-panel__note">
        这是估算值。更好的用法是持续观察体重、围度、训练表现和恢复，再按反馈微调。
      </p>
    </a-card>
  </section>
</template>

<style scoped>
.fitness-panel__explanation-alert {
  margin-top: 1rem;
}

.fitness-panel__explanation-block {
  margin-top: 1rem;
}

.fitness-panel__subheading {
  margin: 0;
  font-size: 1rem;
}

.fitness-panel__explanation-list {
  margin: 0.85rem 0 0;
  padding-left: 1.2rem;
  color: var(--muted);
  line-height: 1.65;
}
</style>
