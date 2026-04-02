import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildCarbCyclingPlan,
  buildCarbTaperPlan,
  buildFiveTwoFastingPlan,
  buildSixteenEightFastingPlan,
} from '../../src/utils/modulePlans.js'
import { foodLibraryGroups } from '../../src/data/foodLibraryCatalog.js'
import { aisGroupA, aisGroupB } from '../../src/data/supplementCatalog.js'

test('buildCarbCyclingPlan returns cut day targets derived from TDEE', () => {
  const plan = buildCarbCyclingPlan({
    goal: 'cut',
    weeks: 8,
    tdee: 2500,
    weightKg: 80,
    targetKg: 4,
    sex: 'male',
  })

  assert.equal(plan.goal, 'cut')
  assert.equal(plan.weeks, 8)
  assert.equal(plan.targetKg, 4)
  assert.equal(plan.dailyAdjustment, 550)
  assert.equal(plan.days[0].targetCalories, 2115)
  assert.equal(plan.days[1].targetCalories, 1975)
  assert.equal(plan.days[2].targetCalories, 1840)
  assert.equal(plan.days[0].macroPlan.protein, 144)
  assert.ok(plan.days[0].macroPlan.fat < plan.days[2].macroPlan.fat)
  assert.ok(plan.days[0].macroPlan.carbs > plan.days[2].macroPlan.carbs)
  assert.equal(plan.weeklyPattern.length, 7)
})

test('buildCarbCyclingPlan returns gain day targets derived from TDEE', () => {
  const plan = buildCarbCyclingPlan({
    goal: 'gain',
    weeks: 6,
    tdee: 2500,
    weightKg: 80,
    targetKg: 3,
    sex: 'male',
  })

  assert.equal(plan.goal, 'gain')
  assert.equal(plan.targetKg, 3)
  assert.equal(plan.dailyAdjustment, 393)
  assert.ok(plan.days[0].targetCalories > 2500)
  assert.ok(plan.days[1].targetCalories > 2500)
  assert.ok(plan.days[2].targetCalories > 2500)
  assert.ok(plan.days[0].targetCalories > plan.days[1].targetCalories)
  assert.ok(plan.days[1].targetCalories > plan.days[2].targetCalories)
  assert.equal(plan.days[0].macroPlan.protein, 128)
  assert.ok(plan.days[0].macroPlan.fat < plan.days[2].macroPlan.fat)
  assert.equal(
    plan.weeklyAverageCalories,
    Math.round((plan.days[0].targetCalories * 3 + plan.days[1].targetCalories * 2 + plan.days[2].targetCalories * 2) / 7)
  )
})

test('buildCarbTaperPlan returns staged cut progression', () => {
  const plan = buildCarbTaperPlan({
    goal: 'cut',
    weeks: 9,
    tdee: 2500,
    weightKg: 80,
    targetKg: 4,
    sex: 'male',
  })

  assert.equal(plan.goal, 'cut')
  assert.equal(plan.targetKg, 4)
  assert.equal(plan.stages.length, 3)
  assert.ok(plan.stages[0].targetCalories < 2500)
  assert.ok(plan.stages[1].targetCalories < plan.stages[0].targetCalories)
  assert.ok(plan.stages[2].targetCalories < plan.stages[1].targetCalories)
  assert.equal(plan.stages[0].macroPlan.protein, 144)
  assert.deepEqual(
    plan.stages.map((stage) => stage.carbRange),
    ['3.6 g/kg', '3.0 g/kg', '2.3 g/kg']
  )
  assert.equal(plan.checkpointRules.length, 3)
})

test('female plans keep a slightly higher fat floor and lower protein than male cut defaults', () => {
  const femalePlan = buildCarbCyclingPlan({
    goal: 'cut',
    weeks: 8,
    tdee: 2100,
    weightKg: 60,
    targetKg: 3,
    sex: 'female',
  })

  const malePlan = buildCarbCyclingPlan({
    goal: 'cut',
    weeks: 8,
    tdee: 2100,
    weightKg: 60,
    targetKg: 3,
    sex: 'male',
  })

  assert.equal(femalePlan.days[0].macroPlan.protein, 102)
  assert.equal(malePlan.days[0].macroPlan.protein, 108)
  assert.ok(femalePlan.days[2].macroPlan.fat > malePlan.days[2].macroPlan.fat)
})

test('buildFiveTwoFastingPlan returns a classic weekly cut rhythm anchored to maintenance days', () => {
  const plan = buildFiveTwoFastingPlan({
    goal: 'cut',
    weeks: 8,
    tdee: 2500,
    weightKg: 80,
    targetKg: 4,
    sex: 'male',
  })

  assert.equal(plan.goal, 'cut')
  assert.equal(plan.supported, true)
  assert.equal(plan.regularDayCalories, 2500)
  assert.equal(plan.fastingDayCalories, 600)
  assert.equal(plan.weeklyAverageCalories, 1957)
  assert.equal(plan.projectedChangeKg, 3.9)
  assert.equal(plan.weeklyPattern.length, 7)
  assert.equal(plan.weeklyPattern.filter((day) => day.kind === '轻断食日').length, 2)
  assert.ok(plan.guardrails.some((item) => item.includes('非连续')))
})

test('buildFiveTwoFastingPlan flags lean-gain usage as unsupported by default', () => {
  const plan = buildFiveTwoFastingPlan({
    goal: 'gain',
    weeks: 8,
    tdee: 2500,
    weightKg: 80,
    targetKg: 3,
    sex: 'male',
  })

  assert.equal(plan.goal, 'gain')
  assert.equal(plan.supported, false)
  assert.ok(plan.unsupportedReason.includes('增肌'))
})

test('buildSixteenEightFastingPlan keeps 16:8 tied to calorie targets instead of treating the window as magic', () => {
  const plan = buildSixteenEightFastingPlan({
    goal: 'cut',
    weeks: 8,
    tdee: 2500,
    weightKg: 80,
    targetKg: 4,
    sex: 'male',
  })

  assert.equal(plan.goal, 'cut')
  assert.equal(plan.targetCalories, 2000)
  assert.equal(plan.macroPlan.protein, 176)
  assert.equal(plan.windowOptions.length, 3)
  assert.equal(plan.windowOptions[0].key, 'early')
  assert.equal(plan.mealCadence.length, 3)
  assert.equal(plan.mealCadence.reduce((sum, item) => sum + item.protein, 0), plan.macroPlan.protein)
  assert.ok(plan.cautions.some((item) => item.includes('总热量')))
})

test('food library keeps all local entries normalized to 100g', () => {
  const itemNames = foodLibraryGroups.flatMap((group) => group.items.map((item) => item.name))
  assert.ok(itemNames.length > 0)
  assert.ok(itemNames.every((name) => name.includes('100g')))
})

test('AIS group labels are fully localized in Chinese', () => {
  assert.deepEqual(
    aisGroupA.map((group) => group.category),
    ['A 类运动食品', 'A 类医学补剂', 'A 类表现补剂']
  )
  assert.deepEqual(
    aisGroupB.map((group) => group.category),
    ['B 类多酚', 'B 类抗氧化补充', 'B 类口感刺激物', 'B 类其他补剂']
  )
})
