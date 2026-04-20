<script setup>
// TDEE 输入表单本身不保存数据。
// 父组件把一个响应式 form 对象传进来，这里直接读写这个对象，
// 所以每次输入都会立即反映到父层计算结果上。
const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
})

defineEmits(['record'])

// 选项表在组件内部声明，避免模板里直接硬编码字符串数组。
const sexOptions = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
]

const occupationOptions = [
  { label: '久坐', value: 'sedentary' },
  { label: '轻活动', value: 'light' },
  { label: '中等活动', value: 'moderate' },
  { label: '高活动', value: 'high' },
]
</script>

<template>
  <section class="fitness-panel motion-rise motion-rise--2">
    <a-card class="ant-surface-card" :bordered="false">
      <template #title>
        <div class="fitness-panel__header">
          <div>
            <p class="fitness-panel__eyebrow">Inputs</p>
            <h2 class="fitness-panel__title">TDEE 计算器</h2>
          </div>
        </div>
      </template>

      <template #extra>
        <a-button type="primary" class="fitness-panel__record-button" @click="$emit('record')">
          记录本次结果
        </a-button>
      </template>

      <a-form layout="vertical" class="tdee-form">
        <a-row :gutter="[18, 18]">
          <a-col :xs="24" :md="12">
            <section class="form-section">
              <div class="form-section__header">
                <p class="form-section__eyebrow">Body</p>
                <h3 class="form-section__title">身体信息</h3>
              </div>

              <a-form-item label="性别">
                <a-select v-model:value="props.form.sex" :options="sexOptions" />
              </a-form-item>
              <a-form-item label="年龄">
                <a-input-number v-model:value="props.form.age" :min="0" :step="1" class="w-full" />
              </a-form-item>
              <a-form-item label="身高（cm）">
                <a-input-number v-model:value="props.form.heightCm" :min="0" :step="1" class="w-full" />
              </a-form-item>
              <a-form-item label="体重（kg）">
                <a-input-number v-model:value="props.form.weightKg" :min="0" :step="0.1" class="w-full" />
              </a-form-item>
              <a-form-item label="体脂率（%）">
                <a-input-number
                  v-model:value="props.form.bodyFatPct"
                  :min="0"
                  :max="100"
                  :step="0.1"
                  class="w-full"
                />
              </a-form-item>
            </section>
          </a-col>

          <a-col :xs="24" :md="12">
            <section class="form-section">
              <div class="form-section__header">
                <p class="form-section__eyebrow">Activity</p>
                <h3 class="form-section__title">日常活动</h3>
              </div>

              <a-form-item label="日均步数">
                <a-input-number v-model:value="props.form.stepsPerDay" :min="0" :step="100" class="w-full" />
              </a-form-item>
              <a-form-item label="职业活动强度">
                <a-select v-model:value="props.form.occupation" :options="occupationOptions" />
              </a-form-item>
            </section>

            <section class="form-section">
              <div class="form-section__header">
                <p class="form-section__eyebrow">Training</p>
                <h3 class="form-section__title">力量训练</h3>
              </div>

              <a-form-item label="每周次数">
                <a-input-number
                  v-model:value="props.form.strengthSessionsPerWeek"
                  :min="0"
                  :step="1"
                  class="w-full"
                />
              </a-form-item>
              <a-form-item label="单次时长（分钟）">
                <a-input-number
                  v-model:value="props.form.strengthSessionMinutes"
                  :min="0"
                  :step="5"
                  class="w-full"
                />
              </a-form-item>
            </section>

            <section class="form-section">
              <div class="form-section__header">
                <p class="form-section__eyebrow">Conditioning</p>
                <h3 class="form-section__title">有氧训练</h3>
              </div>

              <a-form-item label="每周次数">
                <a-input-number
                  v-model:value="props.form.cardioSessionsPerWeek"
                  :min="0"
                  :step="1"
                  class="w-full"
                />
              </a-form-item>
              <a-form-item label="单次时长（分钟）">
                <a-input-number
                  v-model:value="props.form.cardioSessionMinutes"
                  :min="0"
                  :step="5"
                  class="w-full"
                />
              </a-form-item>
            </section>
          </a-col>
        </a-row>
      </a-form>
    </a-card>
  </section>
</template>
