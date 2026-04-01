import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

import { approvalMapWorkflowCase } from '../../src/data/projectCases/approvalMapWorkflow.js'

test('approval map page keeps the approved content emphasis', async () => {
  const viewFile = await readFile(
    new URL('../../src/views/projects/ProjectApprovalMapWorkflowView.vue', import.meta.url),
    'utf8'
  )

  assert.ok(viewFile.includes('ProjectCaseShell'))
  assert.ok(viewFile.includes('ProjectEvidenceGrid'))
  assert.ok(viewFile.includes(':items="page.evidence"'))
  assert.ok(viewFile.includes('{{ page.outcomes.disclaimer }}'))
  assert.ok(viewFile.includes('步骤 {{ index + 1 }}'))
  assert.ok(approvalMapWorkflowCase.outcomes.disclaimer.includes('近似估算'))

  for (const item of approvalMapWorkflowCase.evidence) {
    assert.equal(typeof item.src, 'string')
    assert.ok(item.src.trim().length > 0)
    await access(new URL(`../../public${item.src}`, import.meta.url))
  }
})
