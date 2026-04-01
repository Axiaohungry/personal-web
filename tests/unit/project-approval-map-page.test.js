import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

import { approvalMapWorkflowCase } from '../../src/data/projectCases/approvalMapWorkflow.js'

test('approval map page locks the refreshed flagship case structure', async () => {
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

  assert.ok(viewFile.includes(':eyebrow="page.difficultySection.eyebrow"'))
  assert.ok(viewFile.includes(':eyebrow="page.responsibilitySection.eyebrow"'))
  assert.ok(viewFile.includes(':eyebrow="page.processSection.eyebrow"'))
  assert.ok(viewFile.includes(':eyebrow="page.evidenceSection.eyebrow"'))
  assert.ok(viewFile.includes(':eyebrow="page.outcomesSection.eyebrow"'))

  assert.ok(viewFile.includes('variant="bare"'))
  assert.ok(viewFile.includes('variant="panel"'))
  assert.ok(viewFile.includes('variant="proof"'))

  assert.ok(viewFile.includes('<ProjectEvidenceGrid :items="page.evidence" />'))
  assert.ok(viewFile.includes('{{ page.outcomes.disclaimer }}'))

  assert.ok(approvalMapWorkflowCase.outcomes.disclaimer.length > 0)

  for (const item of approvalMapWorkflowCase.evidence) {
    assert.equal(typeof item.src, 'string')
    assert.ok(item.src.trim().length > 0)
    await access(new URL(`../../public${item.src}`, import.meta.url))
  }
})
