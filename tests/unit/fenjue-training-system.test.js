import test from 'node:test'
import assert from 'node:assert/strict'

import {
  fenjuePrimarySections,
  fenjueTrainingSystem,
  getFenjueNutritionFocus,
} from '../../src/data/fenjueTrainingSystem.js'

test('fenjue module exposes five primary sections in a stable order', () => {
  assert.deepEqual(
    fenjuePrimarySections.map((item) => item.key),
    ['overview', 'training-map', 'risk-correction', 'nutrition-recovery', 'beginner-plan']
  )
})

test('fenjue nutrition focus follows the current workbench goal', () => {
  assert.equal(getFenjueNutritionFocus('gain'), 'gain')
  assert.equal(getFenjueNutritionFocus('cut'), 'cut')
  assert.equal(getFenjueNutritionFocus('anything-else'), 'cut')
})

test('fenjue risk correction keeps four problem buckets from the source system', () => {
  assert.deepEqual(
    fenjueTrainingSystem.riskCorrection.sections.map((item) => item.key),
    ['shoulder', 'lumbar', 'knee', 'posture']
  )
})

test('fenjue beginner plan preserves the four execution views', () => {
  assert.deepEqual(
    fenjueTrainingSystem.beginnerPlan.sections.map((item) => item.key),
    ['weekly-structure', 'upper-day', 'lower-day', 'week-progression']
  )
})

test('fenjue overview keeps the closed-loop framing from the PDF', () => {
  assert.equal(fenjueTrainingSystem.overview.principles.length >= 6, true)
  assert.deepEqual(
    fenjueTrainingSystem.overview.closedLoop.map((item) => item.key),
    ['training', 'nutrition', 'recovery', 'mindset']
  )
})

test('fenjue user-facing copy avoids exposing document-source wording', () => {
  const copy = [
    fenjueTrainingSystem.overview.intro,
    fenjueTrainingSystem.closing.title,
    fenjueTrainingSystem.closing.note,
    ...fenjueTrainingSystem.closing.pills,
  ].join(' ')

  assert.doesNotMatch(copy, /PDF/i)
  assert.doesNotMatch(copy, /资料来源/)
  assert.doesNotMatch(copy, /用户提供/)
})

test('fenjue training map keeps warmup plus seven body-part tabs', () => {
  assert.deepEqual(
    fenjueTrainingSystem.trainingMap.sections.map((item) => item.key),
    ['warmup', 'chest', 'back', 'shoulder', 'arms', 'legs', 'glutes', 'core']
  )
})

test('fenjue training map keeps detailed movements and mistake hints for each area', () => {
  const warmup = fenjueTrainingSystem.trainingMap.sections.find((item) => item.key === 'warmup')
  const chest = fenjueTrainingSystem.trainingMap.sections.find((item) => item.key === 'chest')
  const back = fenjueTrainingSystem.trainingMap.sections.find((item) => item.key === 'back')
  const shoulder = fenjueTrainingSystem.trainingMap.sections.find((item) => item.key === 'shoulder')
  const arms = fenjueTrainingSystem.trainingMap.sections.find((item) => item.key === 'arms')
  const legs = fenjueTrainingSystem.trainingMap.sections.find((item) => item.key === 'legs')
  const glutes = fenjueTrainingSystem.trainingMap.sections.find((item) => item.key === 'glutes')
  const core = fenjueTrainingSystem.trainingMap.sections.find((item) => item.key === 'core')

  assert.deepEqual(
    warmup.actionGroups.map((item) => item.key),
    ['general-warmup', 'upper-activation', 'lower-activation']
  )
  assert.ok(warmup.actionGroups[0].items.some((item) => item.movement.includes('泡沫轴脊柱滚动放松')))
  assert.ok(warmup.actionGroups[1].items.some((item) => item.movement.includes('跪姿肘屈伸')))
  assert.ok(warmup.actionGroups[2].items.some((item) => item.movement.includes('青蛙趴髋关节动态激活')))

  assert.ok(chest.actionGroups.some((group) => group.items.some((item) => item.movement.includes('上斜史密斯卧推'))))
  assert.ok(chest.actionGroups.some((group) => group.items.some((item) => item.movement.includes('双杠臂屈伸'))))
  assert.ok(back.actionGroups.some((group) => group.items.some((item) => item.movement.includes('中距离对握高位下拉'))))
  assert.ok(back.actionGroups.some((group) => group.items.some((item) => item.movement.includes('俯卧 T 杠划船'))))
  assert.ok(shoulder.actionGroups.some((group) => group.items.some((item) => item.movement.includes('站姿史密斯实力推'))))
  assert.ok(shoulder.actionGroups.some((group) => group.items.some((item) => item.movement.includes('哑铃侧平举'))))
  assert.ok(arms.actionGroups.some((group) => group.items.some((item) => item.movement.includes('绳索下压'))))
  assert.ok(arms.actionGroups.some((group) => group.items.some((item) => item.movement.includes('杠铃弯举'))))
  assert.ok(legs.actionGroups.some((group) => group.items.some((item) => item.movement.includes('腿屈伸'))))
  assert.ok(legs.actionGroups.some((group) => group.items.some((item) => item.movement.includes('保加利亚蹲'))))
  assert.ok(glutes.actionGroups.some((group) => group.items.some((item) => item.movement.includes('负重臀推'))))
  assert.ok(glutes.actionGroups.some((group) => group.items.some((item) => item.movement.includes('髋外展训练'))))
  assert.ok(core.actionGroups.some((group) => group.items.some((item) => item.movement.includes('死虫式'))))
  assert.ok(core.actionGroups.some((group) => group.items.some((item) => item.movement.includes('俄罗斯转体'))))

  for (const section of [warmup, chest, back, shoulder, arms, legs, glutes, core]) {
    for (const group of section.actionGroups) {
      for (const item of group.items) {
        assert.equal(typeof item.mistakeHint, 'string')
        assert.ok(item.mistakeHint.trim().length > 0)
      }
    }
  }
})
