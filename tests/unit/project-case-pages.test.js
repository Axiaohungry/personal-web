import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { projects } from '../../src/data/projects.js'
import { approvalMapWorkflowCase } from '../../src/data/projectCases/approvalMapWorkflow.js'
import { campusCollaborationCase } from '../../src/data/projectCases/campusCollaboration.js'
import { fitnessCoachingCase } from '../../src/data/projectCases/fitnessCoaching.js'

test('project case routes and homepage cards stay aligned', async () => {
  const routerFile = await readFile(new URL('../../src/router/index.js', import.meta.url), 'utf8')

  assert.ok(routerFile.includes("path: '/projects/approval-map-workflow'"))
  assert.ok(routerFile.includes("path: '/projects/campus-collaboration'"))
  assert.ok(routerFile.includes("path: '/projects/fitness-coaching'"))

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
