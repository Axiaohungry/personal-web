<script setup>
import { computed, reactive, watch } from 'vue'
import { evaluateStaticCondition, extractConditionOptionValues } from '../utils/staticCondition.js'

const props = defineProps({
  page: {
    type: Object,
    default: null,
  },
})

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function toText(value) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return ''
}

function normalizeField(field) {
  if (typeof field === 'string') {
    return {
      key: field,
      label: field,
      required: false,
      controlType: 'input',
      span: 24,
    }
  }

  return {
    key: '',
    label: toText(field?.label),
    required: Boolean(field?.required),
    controlType: toText(field?.controlType) || 'input',
    span: clampSpan(field?.span),
    placeholder: toText(field?.placeholder),
    addonAfter: toText(field?.addonAfter),
    addonBefore: toText(field?.addonBefore),
    dictCode: toText(field?.dictCode),
    writeField: toText(field?.writeField),
    precision: numberOrUndefined(field?.precision),
    rows: numberOrUndefined(field?.rows),
    maxlength: numberOrUndefined(field?.maxlength),
    allowClear: Boolean(field?.allowClear),
    showSearch: Boolean(field?.showSearch),
    showCount: Boolean(field?.showCount),
    labelInValue: Boolean(field?.labelInValue),
    disabled: toText(field?.disabled),
    vIf: toText(field?.vIf),
    layout: toText(field?.layout),
    labelAlign: toText(field?.labelAlign),
  }
}

function clampSpan(value) {
  const span = Number(value)
  if (!Number.isFinite(span)) return 24
  return Math.min(Math.max(Math.round(span), 1), 24)
}

function numberOrUndefined(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function normalizeSections(page) {
  const originalSections = toArray(page?.rebuildSections)
    .map((section, sectionIndex) => ({
      name: toText(section?.name),
      titleClass: toText(section?.titleClass) || 'title-css4',
      fields: toArray(section?.fields)
        .map((field, fieldIndex) => {
          const normalized = normalizeField(field)
          return {
            ...normalized,
            key: `${sectionIndex}-${fieldIndex}-${normalized.label}`,
          }
        })
        .filter((field) => field.label),
    }))
    .filter((section) => section.name && section.fields.length)

  if (originalSections.length) return originalSections

  const fallbackFields = toArray(page?.preview?.fields).map(normalizeField).filter((field) => field.label)
  return fallbackFields.length
    ? [{ name: '表单信息', titleClass: 'title-css4', fields: fallbackFields }]
    : []
}

const sections = computed(() => normalizeSections(props.page))
const fieldValues = reactive({})

const allConditions = computed(() => {
  return sections.value.flatMap((section) => section.fields.map((field) => field.vIf).filter(Boolean))
})

const fieldValuesByWriteField = computed(() => {
  const values = {}

  sections.value.forEach((section) => {
    section.fields.forEach((field) => {
      if (!field.writeField) return
      values[field.writeField] = fieldValues[field.key]
    })
  })

  return values
})

const visibleSections = computed(() => {
  return sections.value
    .map((section) => ({
      ...section,
      fields: section.fields.filter((field) => evaluateStaticCondition(field.vIf, fieldValuesByWriteField.value)),
    }))
    .filter((section) => section.fields.length)
})

watch(
  () => props.page?.id,
  () => {
    Object.keys(fieldValues).forEach((key) => {
      delete fieldValues[key]
    })
  }
)

function fieldStyle(field) {
  return {
    '--field-span': clampSpan(field.span),
  }
}

function placeholderFor(field) {
  if (field.placeholder) return field.placeholder
  const type = field.controlType
  if (type === 'select') return '请选择'
  if (type === 'table-select') return '请选择或输入'
  if (type === 'date') return '请选择日期'
  if (type === 'number') return '请输入'
  if (type === 'textarea') return '请输入'
  return '请输入'
}

function isRequiredEmpty(field) {
  return field.required && (fieldValues[field.key] === undefined || fieldValues[field.key] === '' || fieldValues[field.key] === null)
}

function statusFor(field) {
  return isRequiredEmpty(field) ? 'error' : ''
}

function isFieldDisabled(field) {
  return Boolean(field.disabled)
}

function isVerticalField(field) {
  return field.layout === 'vertical' || field.labelAlign === 'top'
}

function dictOptionsFor(field) {
  const conditionValues = extractConditionOptionValues(field.writeField, allConditions.value)
  const optionValues = conditionValues.length ? conditionValues : []

  if (field.dictCode) {
    while (optionValues.length < 3) {
      optionValues.push(`${field.dictCode}-${optionValues.length + 1}`)
    }

    return optionValues.map((value, index) => ({
      label: `选项${index + 1}`,
      value,
    }))
  }

  if (field.controlType === 'radio') {
    return [
      { label: '是', value: 'yes' },
      { label: '否', value: 'no' },
    ]
  }

  return [
    { label: '选项一', value: 'option-1' },
    { label: '选项二', value: 'option-2' },
  ]
}
</script>

<template>
  <div class="matter-form-preview">
    <div v-if="!page" class="matter-form-preview__empty">
      <p class="matter-form-preview__eyebrow">静态重建预览</p>
      <h2 class="matter-form-preview__title">暂无事项页面</h2>
    </div>

    <article v-else class="matter-form-preview__scroll">
      <div class="matter-form-preview__form cici-form-css">
        <header class="matter-form-preview__header">
          <h2 class="matter-form-preview__title">{{ page.title }}</h2>
          <span class="matter-form-preview__code">{{ page.formCode }}</span>
        </header>

        <section
          v-for="section in visibleSections"
          :key="section.name"
          class="matter-form-preview__section"
        >
          <div
            class="matter-form-preview__section-title matter-form-preview__section-title--title-css4"
            :class="`matter-form-preview__section-title--${section.titleClass}`"
          >
            <span>{{ section.name }}</span>
          </div>

          <div class="matter-form-preview__row">
            <div
              v-for="field in section.fields"
              :key="`${section.name}-${field.label}`"
              class="matter-form-preview__field"
              :class="{
                'matter-form-preview__field--textarea': field.controlType === 'textarea',
                'matter-form-preview__field--vertical': isVerticalField(field),
                'matter-form-preview__field--left-label': field.labelAlign === 'left',
                'matter-form-preview__field--disabled': isFieldDisabled(field),
              }"
              :style="fieldStyle(field)"
            >
              <label
                class="matter-form-preview__label"
                :class="{ 'matter-form-preview__label--required': field.required }"
              >
                {{ field.label }}
              </label>

              <div
                class="matter-form-preview__control"
                :class="[
                  `matter-form-preview__control--${field.controlType}`,
                  { 'matter-form-preview__control--error': isRequiredEmpty(field) },
                ]"
              >
                <template v-if="field.controlType === 'radio'">
                  <a-radio-group
                    v-model:value="fieldValues[field.key]"
                    class="matter-form-preview__radio-group"
                    :options="dictOptionsFor(field)"
                    :disabled="isFieldDisabled(field)"
                  >
                  </a-radio-group>
                </template>

                <template v-else-if="field.controlType === 'select'">
                  <a-select
                    v-model:value="fieldValues[field.key]"
                    class="matter-form-preview__ant-control"
                    allow-clear
                    :show-search="field.showSearch"
                    option-filter-prop="label"
                    :placeholder="placeholderFor(field)"
                    :options="dictOptionsFor(field)"
                    :status="statusFor(field)"
                    :label-in-value="field.labelInValue"
                    :disabled="isFieldDisabled(field)"
                  />
                  <span class="matter-form-preview__select-arrow"></span>
                </template>

                <template v-else-if="field.controlType === 'table-select'">
                  <a-input
                    v-model:value="fieldValues[field.key]"
                    class="matter-form-preview__ant-control"
                    :allow-clear="field.allowClear || true"
                    :placeholder="placeholderFor(field)"
                    :status="statusFor(field)"
                    :disabled="isFieldDisabled(field)"
                  >
                    <template #addonAfter>选择</template>
                  </a-input>
                </template>

                <template v-else-if="field.controlType === 'date'">
                  <a-date-picker
                    v-model:value="fieldValues[field.key]"
                    class="matter-form-preview__ant-control"
                    :placeholder="placeholderFor(field)"
                    :status="statusFor(field)"
                    :disabled="isFieldDisabled(field)"
                  />
                  <span class="matter-form-preview__calendar-icon"></span>
                </template>

                <template v-else-if="field.controlType === 'number'">
                  <a-input-number
                    v-model:value="fieldValues[field.key]"
                    class="matter-form-preview__ant-control"
                    :placeholder="placeholderFor(field)"
                    :status="statusFor(field)"
                    :precision="field.precision"
                    :addon-before="field.addonBefore"
                    :addon-after="field.addonAfter"
                    :disabled="isFieldDisabled(field)"
                  />
                  <span class="matter-form-preview__number-handler"></span>
                </template>

                <template v-else-if="field.controlType === 'textarea'">
                  <a-textarea
                    v-model:value="fieldValues[field.key]"
                    class="matter-form-preview__ant-control"
                    :placeholder="placeholderFor(field)"
                    :status="statusFor(field)"
                    :show-count="field.showCount"
                    :maxlength="field.maxlength"
                    :rows="field.rows || 4"
                    :disabled="isFieldDisabled(field)"
                  />
                </template>

                <a-input
                  v-else
                  v-model:value="fieldValues[field.key]"
                  class="matter-form-preview__ant-control"
                  :allow-clear="field.allowClear || true"
                  :placeholder="placeholderFor(field)"
                  :status="statusFor(field)"
                  :disabled="isFieldDisabled(field)"
                />
              </div>
              <p v-if="isRequiredEmpty(field)" class="matter-form-preview__error">该项为必填</p>
            </div>
          </div>
        </section>
      </div>
    </article>
  </div>
</template>

<style scoped>
.matter-form-preview {
  min-width: 0;
}

.matter-form-preview__empty {
  display: grid;
  min-height: 18rem;
  align-content: center;
  padding: 1rem;
}

.matter-form-preview__scroll {
  overflow: auto;
  border: 1px solid #e5e5e5;
  background: #fff;
}

.matter-form-preview__form {
  display: grid;
  gap: 10px;
  min-width: 900px;
  padding: 12px 14px 18px;
  color: rgba(0, 0, 0, 0.88);
  background: #fff;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    'Noto Sans',
    'Noto Sans SC',
    sans-serif;
}

.matter-form-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 6px 0 2px;
}

.matter-form-preview__eyebrow {
  margin: 0 0 0.32rem;
  color: var(--accent);
  font-size: 0.74rem;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.matter-form-preview__title {
  margin: 0;
  color: rgba(0, 0, 0, 0.88);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.35;
}

.matter-form-preview__code {
  flex: 0 0 auto;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}

.matter-form-preview__section {
  display: grid;
  gap: 8px;
}

.matter-form-preview__section-title {
  width: 100%;
  height: 35px;
  line-height: 35px;
  font-size: 20px;
  font-weight: bold;
  color: #688be4;
}

.matter-form-preview__section-title span {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.matter-form-preview__row {
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  gap: 0 8px;
}

.matter-form-preview__field {
  display: grid;
  grid-template-columns: 198px minmax(0, 1fr);
  grid-column: span var(--field-span);
  min-width: 0;
  margin-bottom: 22px;
  align-items: start;
}

.matter-form-preview__field--textarea {
  grid-template-columns: 198px minmax(0, 1fr);
}

.matter-form-preview__field--vertical {
  grid-template-columns: 1fr;
}

.matter-form-preview__field--vertical .matter-form-preview__label {
  padding: 0 0 6px;
  text-align: left;
}

.matter-form-preview__field--left-label .matter-form-preview__label {
  text-align: left;
}

.matter-form-preview__field--disabled {
  opacity: 0.86;
}

.matter-form-preview__label {
  min-width: 0;
  padding: 4px 8px 0 0;
  color: rgba(0, 0, 0, 0.88);
  font-size: 14px;
  line-height: 22px;
  text-align: right;
  overflow-wrap: anywhere;
}

.matter-form-preview__label--required::before {
  display: inline-block;
  margin-inline-end: 4px;
  color: #ff4d4f;
  font-family: SimSun, sans-serif;
  line-height: 1;
  content: '*';
}

.matter-form-preview__control {
  position: relative;
  min-width: 0;
  min-height: 32px;
  background: transparent;
}

.matter-form-preview__ant-control {
  width: 100%;
}

.matter-form-preview__control--textarea {
  min-height: 88px;
}

.matter-form-preview__radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  min-height: 32px;
  padding-top: 4px;
}

.matter-form-preview__radio-option {
  color: rgba(0, 0, 0, 0.88);
  font-size: 14px;
}

.matter-form-preview__control--error .matter-form-preview__radio-group {
  padding: 4px 8px;
  border: 1px solid #ff4d4f;
  border-radius: 6px;
}

.matter-form-preview__select-arrow {
  position: absolute;
  top: 50%;
  right: 11px;
  width: 8px;
  height: 8px;
  border-right: 1px solid rgba(0, 0, 0, 0.45);
  border-bottom: 1px solid rgba(0, 0, 0, 0.45);
  transform: translateY(-60%) rotate(45deg);
  pointer-events: none;
}

.matter-form-preview__calendar-icon {
  position: absolute;
  top: 8px;
  right: 9px;
  width: 15px;
  height: 15px;
  border: 1px solid rgba(0, 0, 0, 0.45);
  border-radius: 2px;
  pointer-events: none;
}

.matter-form-preview__calendar-icon::before {
  position: absolute;
  top: 3px;
  left: 0;
  width: 100%;
  border-top: 1px solid rgba(0, 0, 0, 0.45);
  content: '';
}

.matter-form-preview__number-handler {
  position: absolute;
  top: 0;
  right: 0;
  width: 22px;
  height: 100%;
  border-left: 1px solid #d9d9d9;
  background:
    linear-gradient(135deg, transparent 45%, rgba(0, 0, 0, 0.32) 47%, rgba(0, 0, 0, 0.32) 55%, transparent 57%) center 8px / 7px 7px no-repeat,
    linear-gradient(315deg, transparent 45%, rgba(0, 0, 0, 0.32) 47%, rgba(0, 0, 0, 0.32) 55%, transparent 57%) center 18px / 7px 7px no-repeat;
  pointer-events: none;
}

.matter-form-preview__error {
  grid-column: 2;
  margin: 2px 0 0;
  color: #ff4d4f;
  font-size: 12px;
  line-height: 1.35;
}

.matter-form-preview__field--vertical .matter-form-preview__error {
  grid-column: 1;
}

@media (max-width: 980px) {
  .matter-form-preview__scroll {
    margin-inline: -0.35rem;
  }
}
</style>
