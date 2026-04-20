<script setup>
// TDEE 总结卡的作用是把父组件生成的三套场景方案可视化，
// 同时展示最近几次记录，帮助用户从“单次计算”进入“持续校准”。
defineProps({
  scenarios: {
    type: Array,
    required: true,
  },
  history: {
    type: Array,
    default: () => [],
  },
  planning: {
    type: Object,
    required: true,
  },
  activeKey: {
    type: String,
    default: 'cut',
  },
})
</script>

<template>
  <section class="fitness-summary motion-rise motion-rise--2">
    <div class="fitness-summary__header">
      <div>
        <p class="fitness-panel__eyebrow">Plan</p>
        <h2 class="fitness-panel__title">起步建议</h2>
      </div>
      <p class="fitness-panel__note fitness-summary__note">
        当前先按 {{ planning.goal === 'cut' ? '减脂' : '增肌' }} {{ planning.targetKg }} kg / {{ planning.weeks }} 周来推演。
        先从下面 3 套热量方案里选一个更像你的起点，再根据体重变化和训练状态慢慢微调。
      </p>
    </div>

    <a-row :gutter="[18, 18]" class="scenario-grid">
      <a-col
        v-for="scenario in scenarios"
        :key="scenario.key"
        :xs="24"
        :md="8"
      >
        <a-card class="scenario-card ant-surface-card" :bordered="false">
          <a-space align="center" size="small">
            <p class="scenario-card__label">{{ scenario.label }}</p>
            <a-tag v-if="scenario.key === activeKey" color="orange">当前目标</a-tag>
          </a-space>
          <h3 class="scenario-card__target">{{ scenario.target }} kcal</h3>
          <p class="scenario-card__range">
            {{ scenario.range || '以维持体重与训练表现为优先' }}
          </p>
          <p class="scenario-card__range">{{ scenario.pace }}</p>
          <a-space wrap class="chip-list">
            <a-tag>蛋白质 {{ scenario.macros.protein }}g</a-tag>
            <a-tag>脂肪 {{ scenario.macros.fat }}g</a-tag>
            <a-tag>碳水 {{ scenario.macros.carbs }}g</a-tag>
          </a-space>
        </a-card>
      </a-col>
    </a-row>

    <a-card class="history-block ant-surface-card" :bordered="false">
      <div class="history-block__header">
        <div>
          <p class="fitness-panel__eyebrow">History</p>
          <h3 class="history-block__title">最近记录</h3>
        </div>
      </div>

      <a-list v-if="history.length" class="history-list" :data-source="history">
        <template #renderItem="{ item }">
          <a-list-item class="history-list__item">
            <div class="history-list__row">
              <strong>{{ item.tdee }} kcal</strong>
              <span>体重 {{ item.weightKg }} kg / 步数 {{ item.stepsPerDay }}</span>
            </div>
          </a-list-item>
        </template>
      </a-list>

      <p v-else class="fitness-panel__note">点击“记录本次结果”后，这里会保留最近几次计算。</p>
    </a-card>
  </section>
</template>
