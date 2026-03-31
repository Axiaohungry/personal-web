import test from 'node:test'
import assert from 'node:assert/strict'

import { approvalMapWorkflowCase } from '../../src/data/projectCases/approvalMapWorkflow.js'
import { campusCollaborationCase } from '../../src/data/projectCases/campusCollaboration.js'
import { fitnessCoachingCase } from '../../src/data/projectCases/fitnessCoaching.js'

for (const page of [approvalMapWorkflowCase, campusCollaborationCase, fitnessCoachingCase]) {
  test(`${page.slug} exposes the shared case-study contract`, () => {
    assert.equal(typeof page.route, 'string')
    assert.equal(page.process.length, 4)
    assert.equal(page.hero.signals.length, 3)
    assert.ok(page.outcomes.capabilities.length >= 3)
    assert.ok(page.evidence.length >= 2)
  })
}

test('campus case pins 活力柚子 as the lead case', () => {
  assert.equal(campusCollaborationCase.leadCase.title, '“活力柚子”篮球新生杯')
})

test('approval case preserves the approximate-result disclaimer', () => {
  assert.ok(approvalMapWorkflowCase.outcomes.disclaimer.includes('近似估算'))
})
