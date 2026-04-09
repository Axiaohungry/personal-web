import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

import { approvalMapWorkflowCase } from '../../src/data/projectCases/approvalMapWorkflow.js'

test('approval map page keeps the flagship case structure', async () => {
  const viewFile = await readFile(
    new URL('../../src/views/projects/ProjectApprovalMapWorkflowView.vue', import.meta.url),
    'utf8'
  )

  const shellFile = await readFile(
    new URL('../../src/components/projects/ProjectCaseShell.vue', import.meta.url),
    'utf8'
  )

  assert.ok(viewFile.includes('<ProjectCaseShell'))
  assert.ok(viewFile.includes(':hero="page.hero"'))
  assert.ok(viewFile.includes('variant="approval-map"'))
  assert.ok(shellFile.includes('ProjectCaseSignalRail'))
  assert.ok(shellFile.includes(':items="heroSignals"'))

  assert.equal((viewFile.match(/<ProjectCaseSection\b/g) || []).length, 3)
  assert.equal((viewFile.match(/variant="bare"/g) || []).length, 1)
  assert.equal((viewFile.match(/variant="panel"/g) || []).length, 1)
  assert.equal((viewFile.match(/variant="proof"/g) || []).length, 1)

  assert.ok(viewFile.includes(':eyebrow="page.difficultySection.eyebrow"'))
  assert.ok(viewFile.includes('page.responsibilitySection.title'))
  assert.ok(viewFile.includes('page.responsibilitySection.intro'))
  assert.ok(viewFile.includes(':eyebrow="page.processSection.eyebrow"'))
  assert.ok(viewFile.includes(':eyebrow="page.evidenceSection.eyebrow"'))
  assert.ok(viewFile.includes('page.outcomesSection.title'))

  assert.ok(viewFile.includes('<ProjectEvidenceGrid :items="page.evidence" />'))
  assert.ok(viewFile.includes('{{ page.outcomes.disclaimer }}'))
  assert.ok(approvalMapWorkflowCase.outcomes.disclaimer.length > 0)

  for (const item of approvalMapWorkflowCase.evidence) {
    assert.equal(typeof item.src, 'string')
    assert.ok(item.src.trim().length > 0)
    await access(new URL(item.src))
  }
})
