import test from 'node:test'
import assert from 'node:assert/strict'

import { approvalMapWorkflowCase } from '../../src/data/projectCases/approvalMapWorkflow.js'
import { campusCollaborationCase } from '../../src/data/projectCases/campusCollaboration.js'
import { fitnessCoachingCase } from '../../src/data/projectCases/fitnessCoaching.js'

for (const page of [approvalMapWorkflowCase, campusCollaborationCase, fitnessCoachingCase]) {
  test(`${page.slug} evidence assets no longer use public /projects paths`, () => {
    for (const item of page.evidence) {
      assert.equal(typeof item.src, 'string')
      assert.ok(!item.src.startsWith('/projects/'))
    }
  })
}
