import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

import { campusCollaborationCase } from '../../src/data/projectCases/campusCollaboration.js'

test('campus collaboration page locks the refreshed stage structure', async () => {
  const [viewFile, shellFile] = await Promise.all([
    readFile(new URL('../../src/views/projects/ProjectCampusCollaborationView.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/projects/ProjectCaseShell.vue', import.meta.url), 'utf8'),
  ])

  assert.ok(viewFile.includes('ProjectCaseShell'))
  assert.ok(viewFile.includes('ProjectCaseSection'))
  assert.ok(viewFile.includes('ProjectEvidenceGrid'))
  assert.ok(viewFile.includes('page.positioningSection'))
  assert.ok(viewFile.includes('page.leadCaseSection'))
  assert.ok(viewFile.includes('page.processSection'))
  assert.ok(viewFile.includes('page.supportingSection'))
  assert.ok(viewFile.includes('page.evidenceSection'))
  assert.ok(viewFile.includes('page.outcomesSection'))
  assert.ok(viewFile.includes('variant="bare"'))
  assert.ok(viewFile.includes('variant="panel"'))
  assert.ok(viewFile.includes('variant="proof"'))

  assert.ok(shellFile.includes('ProjectCaseSignalRail'))

  assert.equal(typeof campusCollaborationCase.leadCase.title, 'string')
  assert.ok(campusCollaborationCase.leadCase.title.trim().length > 0)
  assert.ok(campusCollaborationCase.hero.signals.length >= 3)
  assert.ok(campusCollaborationCase.leadCase.highlights.length >= 3)
  assert.ok(campusCollaborationCase.supportingCases.length >= 2)

  for (const item of campusCollaborationCase.evidence) {
    assert.equal(typeof item.src, 'string')
    assert.ok(item.src.trim().length > 0)
    await access(new URL(`../../public${item.src}`, import.meta.url))
  }
})
