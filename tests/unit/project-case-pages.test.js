import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { projects } from '../../src/data/projects.js'
import { approvalMapWorkflowCase } from '../../src/data/projectCases/approvalMapWorkflow.js'
import { campusCollaborationCase } from '../../src/data/projectCases/campusCollaboration.js'
import { fitnessCoachingCase } from '../../src/data/projectCases/fitnessCoaching.js'

function assertRouteBlock(routerFile, route, viewFile) {
  const routeStart = routerFile.indexOf(`path: '${route}'`)
  assert.ok(routeStart >= 0, `Expected router to define ${route}`)

  const nextRouteStart = routerFile.indexOf('\n    },\n    {', routeStart)
  assert.ok(nextRouteStart > routeStart, `Expected ${route} to be isolated in a route block`)

  const routeBlock = routerFile.slice(routeStart, nextRouteStart)
  assert.ok(
    routeBlock.includes(`Project${viewFile}`),
    `Expected ${route} to bind ${viewFile} within the same route block`
  )
}

test('project case routes and homepage cards stay aligned', async () => {
  const routerFile = await readFile(new URL('../../src/router/index.js', import.meta.url), 'utf8')

  assertRouteBlock(routerFile, approvalMapWorkflowCase.route, 'ApprovalMapWorkflowView.vue')
  assertRouteBlock(routerFile, campusCollaborationCase.route, 'CampusCollaborationView.vue')
  assertRouteBlock(routerFile, fitnessCoachingCase.route, 'FitnessCoachingView.vue')

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
