import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { projects } from '../../src/data/projects.js'
import { approvalMapWorkflowCase } from '../../src/data/projectCases/approvalMapWorkflow.js'
import { campusCollaborationCase } from '../../src/data/projectCases/campusCollaboration.js'
import { fitnessCoachingCase } from '../../src/data/projectCases/fitnessCoaching.js'

function assertRouteBlock(routerFile, route, viewFile) {
  const normalizedRouterFile = routerFile.replace(/\r\n/g, '\n')
  const routeStart = normalizedRouterFile.indexOf(`path: '${route}'`)
  assert.ok(routeStart >= 0, `Expected router to define ${route}`)

  const nextRouteStart = normalizedRouterFile.indexOf('\n    },\n    {', routeStart)
  assert.ok(nextRouteStart > routeStart, `Expected ${route} to be isolated in a route block`)

  const routeBlock = normalizedRouterFile.slice(routeStart, nextRouteStart)
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

  const projectHrefs = projects.map((project) => project.href)

  assert.ok(projectHrefs.includes(approvalMapWorkflowCase.route))
  assert.ok(projectHrefs.includes(campusCollaborationCase.route))
  assert.ok(projectHrefs.includes(fitnessCoachingCase.route))
})
