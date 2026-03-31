import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { projects } from '../../src/data/projects.js'
import { approvalMapWorkflowCase } from '../../src/data/projectCases/approvalMapWorkflow.js'
import { campusCollaborationCase } from '../../src/data/projectCases/campusCollaboration.js'
import { fitnessCoachingCase } from '../../src/data/projectCases/fitnessCoaching.js'

test('project case routes and homepage cards stay aligned', async () => {
  const routerFile = await readFile(new URL('../../src/router/index.js', import.meta.url), 'utf8')
  const routeBindings = [
    {
      route: approvalMapWorkflowCase.route,
      viewFile: 'ProjectApprovalMapWorkflowView.vue',
    },
    {
      route: campusCollaborationCase.route,
      viewFile: 'ProjectCampusCollaborationView.vue',
    },
    {
      route: fitnessCoachingCase.route,
      viewFile: 'ProjectFitnessCoachingView.vue',
    },
  ]

  for (const binding of routeBindings) {
    assert.ok(routerFile.includes(binding.route))
    assert.ok(routerFile.includes(binding.viewFile))
  }

  assert.equal(
    projects.filter((project) => project.href === approvalMapWorkflowCase.route).length,
    1
  )
  assert.equal(
    projects.filter((project) => project.href === campusCollaborationCase.route).length,
    1
  )
  assert.equal(
    projects.filter((project) => project.href === fitnessCoachingCase.route).length,
    1
  )
})
