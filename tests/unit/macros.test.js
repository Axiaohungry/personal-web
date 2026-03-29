import test from 'node:test'
import assert from 'node:assert/strict'

import { buildMacroPlan, buildScenarioPlans } from '../../src/utils/macros.js'
import { getGoalClampGuidance, getGoalClampTargetKg } from '../../src/utils/caloriePlanning.js'

test('buildMacroPlan returns the locked cut macro split', () => {
  const plan = buildMacroPlan({
    weightKg: 80,
    targetCalories: 2126,
    mode: 'cut',
  })

  assert.deepEqual(plan, {
    protein: 176,
    fat: 64,
    carbs: 212,
  })
})

test('buildScenarioPlans derives targets from TDEE, sex, cycle length, and targetKg', () => {
  const malePlans = buildScenarioPlans({
    sex: 'male',
    weeks: 8,
    targetKg: 3,
    tdee: 2501,
  })
  const femalePlans = buildScenarioPlans({
    sex: 'female',
    weeks: 8,
    targetKg: 3,
    tdee: 2501,
  })

  assert.deepEqual(malePlans, {
    maintain: { target: 2501 },
    cut: { min: 2001, max: 2251, target: 2088, dailyAdjustment: 413 },
    'lean-gain': { min: 2626, max: 2801, target: 2796, dailyAdjustment: 295 },
  })

  assert.deepEqual(femalePlans, {
    maintain: { target: 2501 },
    cut: { min: 2051, max: 2301, target: 2088, dailyAdjustment: 413 },
    'lean-gain': { min: 2601, max: 2726, target: 2726, dailyAdjustment: 295 },
  })
})

test('getGoalClampTargetKg returns the first 0.5 kg step that hits direct-suggestion guardrails', () => {
  assert.equal(
    getGoalClampTargetKg({
      goal: 'cut',
      sex: 'male',
      weeks: 12,
      tdee: 2500,
    }),
    5.5
  )

  assert.equal(
    getGoalClampTargetKg({
      goal: 'gain',
      sex: 'female',
      weeks: 8,
      tdee: 2500,
    }),
    2.5
  )
})

test('getGoalClampGuidance exposes both clamp threshold and live calorie guardrail', () => {
  assert.deepEqual(
    getGoalClampGuidance({
      goal: 'cut',
      sex: 'male',
      weeks: 12,
      tdee: 2500,
    }),
    {
      clampKg: 5.5,
      clampCalories: 2000,
      guardrailLabel: '减脂下限',
      trendLabel: '继续下降',
    }
  )

  assert.deepEqual(
    getGoalClampGuidance({
      goal: 'gain',
      sex: 'female',
      weeks: 8,
      tdee: 2500,
    }),
    {
      clampKg: 2.5,
      clampCalories: 2725,
      guardrailLabel: '增肌上限',
      trendLabel: '继续上升',
    }
  )
})
