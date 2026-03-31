import test from 'node:test'
import assert from 'node:assert/strict'

import { approvalMapWorkflowCase } from '../../src/data/projectCases/approvalMapWorkflow.js'
import { campusCollaborationCase } from '../../src/data/projectCases/campusCollaboration.js'
import { fitnessCoachingCase } from '../../src/data/projectCases/fitnessCoaching.js'

function assertSharedCaseContract(page) {
  assert.equal(typeof page.route, 'string')
  assert.equal(typeof page.title, 'string')
  assert.equal(typeof page.subtitle, 'string')
  assert.equal(typeof page.hero?.title, 'string')
  assert.equal(typeof page.hero?.summary, 'string')
  assert.equal(page.hero?.signals.length, 3)
  assert.deepEqual(page.process.map((item) => item.key), ['discover', 'structure', 'collaboration', 'execution'])

  for (const item of page.process) {
    assert.equal(typeof item.key, 'string')
    assert.equal(typeof item.title, 'string')
    assert.equal(typeof item.description, 'string')
  }

  for (const signal of page.hero.signals) {
    assert.equal(typeof signal.label, 'string')
    assert.equal(typeof signal.value, 'string')
  }

  assert.ok(page.outcomes.capabilities.length >= 3)
  for (const capability of page.outcomes.capabilities) {
    assert.equal(typeof capability, 'string')
  }

  assert.ok(page.evidence.length >= 2)
  for (const item of page.evidence) {
    assert.equal(typeof item.title, 'string')
    assert.ok(typeof item.detail === 'string' || typeof item.caption === 'string')
  }
}

for (const page of [approvalMapWorkflowCase, campusCollaborationCase, fitnessCoachingCase]) {
  test(`${page.slug} exposes the shared case-study contract`, () => {
    assertSharedCaseContract(page)
  })
}

test('campus case pins 活力柚子 as the lead case and keeps supporting cases at the top level', () => {
  assert.equal(campusCollaborationCase.leadCase.title, '“活力柚子”篮球新生杯')
  assert.ok(Array.isArray(campusCollaborationCase.supportingCases))
  assert.ok(campusCollaborationCase.supportingCases.length >= 2)
  for (const item of campusCollaborationCase.supportingCases) {
    assert.equal(typeof item.title, 'string')
    assert.equal(typeof item.detail, 'string')
  }
})

test('approval case preserves the approximate-result disclaimer', () => {
  assert.ok(approvalMapWorkflowCase.outcomes.disclaimer.includes('近似估算'))
  assert.ok(approvalMapWorkflowCase.outcomes.disclaimer.includes('不是可视化仪表盘指标'))
})

test('fitness case exposes a bridge CTA at the top level', () => {
  assert.equal(fitnessCoachingCase.bridgeCta?.href, '/fitness/')
  assert.equal(typeof fitnessCoachingCase.bridgeCta?.label, 'string')
})
