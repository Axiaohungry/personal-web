import test from 'node:test'
import assert from 'node:assert/strict'

import { approvalMapWorkflowCase } from '../../src/data/projectCases/approvalMapWorkflow.js'
import { campusCollaborationCase } from '../../src/data/projectCases/campusCollaboration.js'
import { fitnessCoachingCase } from '../../src/data/projectCases/fitnessCoaching.js'

function assertSection(section, requiredKeys = ['eyebrow', 'title', 'intro']) {
  assert.equal(typeof section, 'object')
  for (const key of requiredKeys) {
    assert.equal(typeof section[key], 'string')
    assert.ok(section[key].trim().length > 0)
  }
}

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
    assert.equal(typeof item.src, 'string')
    assert.equal(typeof item.note, 'string')
    assert.ok(typeof item.detail === 'string' || typeof item.caption === 'string')
  }
}

for (const page of [approvalMapWorkflowCase, campusCollaborationCase, fitnessCoachingCase]) {
  test(`${page.slug} exposes the shared case-study contract`, () => {
    assertSharedCaseContract(page)
  })
}

test('approval case keeps the expanded workflow metadata', () => {
  assert.equal(approvalMapWorkflowCase.complexity.length, 4)
  assert.equal(approvalMapWorkflowCase.responsibilities.length, 4)
  assertSection(approvalMapWorkflowCase.difficultySection)
  assertSection(approvalMapWorkflowCase.responsibilitySection)
  assertSection(approvalMapWorkflowCase.processSection)
  assertSection(approvalMapWorkflowCase.evidenceSection)
  assertSection(approvalMapWorkflowCase.outcomesSection)
  assert.ok(approvalMapWorkflowCase.outcomes.disclaimer.includes('KPI'))
  assert.ok(approvalMapWorkflowCase.outcomes.reflections.length >= 3)
})

test('campus case keeps organizer-oriented supporting structure', () => {
  assert.equal(typeof campusCollaborationCase.leadCase.title, 'string')
  assert.ok(campusCollaborationCase.leadCase.title.trim().length > 0)
  assertSection(campusCollaborationCase.positioningSection)
  assertSection(campusCollaborationCase.complexitySection)
  assertSection(campusCollaborationCase.leadCaseSection, ['eyebrow', 'title', 'intro', 'methodLabel', 'perspectiveLabel', 'perspectiveCopy'])
  assertSection(campusCollaborationCase.processSection)
  assertSection(campusCollaborationCase.supportingSection)
  assertSection(campusCollaborationCase.evidenceSection)
  assertSection(campusCollaborationCase.outcomesSection)
  assert.ok(Array.isArray(campusCollaborationCase.supportingCases))
  assert.ok(campusCollaborationCase.supportingCases.length >= 2)
})

test('fitness case keeps the service loop and workbench bridge contract', () => {
  assert.equal(fitnessCoachingCase.userProblems.length, 4)
  assertSection(fitnessCoachingCase.problemSection)
  assertSection(fitnessCoachingCase.processSection)
  assertSection(fitnessCoachingCase.evidenceSection)
  assertSection(fitnessCoachingCase.outcomesSection)
  assertSection(fitnessCoachingCase.bridgeSection)
  assert.equal(fitnessCoachingCase.bridgeCta?.href, '/fitness/')
  assert.equal(typeof fitnessCoachingCase.bridgeCta?.label, 'string')
})
