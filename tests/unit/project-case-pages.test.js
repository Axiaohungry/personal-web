import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { projects } from '../../src/data/projects.js'
import { approvalMapWorkflowCase } from '../../src/data/projectCases/approvalMapWorkflow.js'
import { campusCollaborationCase } from '../../src/data/projectCases/campusCollaboration.js'
import { fitnessCoachingCase } from '../../src/data/projectCases/fitnessCoaching.js'

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function assertRouteBlock(routerFile, route, viewFile) {
  const routeBlock = new RegExp(
    "path:\\s*'" +
      escapeRegExp(route) +
      "'[\\s\\S]*?component:\\s*\\(\\)\\s*=>\\s*import\\('@/views/projects/" +
      escapeRegExp(viewFile) +
      "'\\)",
    'm'
  )

  assert.ok(routeBlock.test(routerFile), `Expected ${route} to bind ${viewFile} in the same route block`)
}

test('project case routes and homepage cards stay aligned', async () => {
  const routerFile = await readFile(new URL('../../src/router/index.js', import.meta.url), 'utf8')

  assertRouteBlock(routerFile, approvalMapWorkflowCase.route, 'ProjectApprovalMapWorkflowView.vue')
  assertRouteBlock(routerFile, campusCollaborationCase.route, 'ProjectCampusCollaborationView.vue')
  assertRouteBlock(routerFile, fitnessCoachingCase.route, 'ProjectFitnessCoachingView.vue')

  assert.equal(
    projects.find((project) => project.name === '政务审批地图工作流')?.href,
    approvalMapWorkflowCase.route
  )
  assert.equal(
    projects.find((project) => project.name === '校园产品化协作项目集')?.href,
    campusCollaborationCase.route
  )
  assert.equal(
    projects.find((project) => project.name === '健身私教顾问方案')?.href,
    fitnessCoachingCase.route
  )
})
