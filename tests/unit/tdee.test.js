import test from 'node:test'
import assert from 'node:assert/strict'

import { calculateTdee, explainTdeeModel } from '../../src/utils/tdee.js'

test('calculateTdee builds the reference TDEE case from the plan', () => {
  const result = calculateTdee({
    sex: 'male',
    age: 30,
    heightCm: 175,
    weightKg: 80,
    bodyFatPct: 18,
    stepsPerDay: 8000,
    occupation: 'light',
    strengthSessionsPerWeek: 4,
    strengthSessionMinutes: 60,
    cardioSessionsPerWeek: 2,
    cardioSessionMinutes: 30,
  })

  assert.deepEqual(result, {
    bmr: 1787,
    stepCalories: 246,
    occupationCalories: 120,
    resistanceDailyCalories: 264,
    cardioDailyCalories: 84,
    tdee: 2501,
  })
})

test('calculateTdee uses female-specific BMR fallback and step-length heuristic', () => {
  const result = calculateTdee({
    sex: 'female',
    age: 30,
    heightCm: 165,
    weightKg: 60,
    bodyFatPct: undefined,
    stepsPerDay: 8000,
    occupation: 'light',
    strengthSessionsPerWeek: 2,
    strengthSessionMinutes: 45,
    cardioSessionsPerWeek: 2,
    cardioSessionMinutes: 30,
  })

  assert.deepEqual(result, {
    bmr: 1320,
    stepCalories: 173,
    occupationCalories: 120,
    resistanceDailyCalories: 74,
    cardioDailyCalories: 63,
    tdee: 1750,
  })
})

test('explainTdeeModel describes which parts use sex-specific logic', () => {
  const female = explainTdeeModel({
    sex: 'female',
    bodyFatPct: undefined,
  })
  const maleWithBodyFat = explainTdeeModel({
    sex: 'male',
    bodyFatPct: 15,
  })

  assert.equal(female.sexLabel, '女性')
  assert.equal(female.bmrMethod, 'Mifflin-St Jeor')
  assert.match(female.bmrExplanation, /-161/)
  assert.match(female.stepExplanation, /0\.413/)
  assert.match(female.trainingExplanation, /不按性别单独调整/)

  assert.equal(maleWithBodyFat.sexLabel, '男性')
  assert.equal(maleWithBodyFat.bmrMethod, 'Katch-McArdle')
  assert.match(maleWithBodyFat.bmrExplanation, /瘦体重/)
})
