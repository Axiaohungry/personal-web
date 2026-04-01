import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

import { campusCollaborationCase } from '../../src/data/projectCases/campusCollaboration.js'

test('campus collaboration page keeps one lead case plus supporting cases', async () => {
  const viewFile = await readFile(
    new URL('../../src/views/projects/ProjectCampusCollaborationView.vue', import.meta.url),
    'utf8'
  )

  assert.ok(viewFile.includes('ProjectCaseShell'))
  assert.equal(campusCollaborationCase.leadCase.title, '“活力柚子”篮球新生杯')
  assert.ok(campusCollaborationCase.supportingCases.length >= 2)

  for (const item of campusCollaborationCase.evidence) {
    await access(new URL(`../../public${item.src}`, import.meta.url))
  }
})
