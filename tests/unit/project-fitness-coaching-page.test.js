import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

import { fitnessCoachingCase } from '../../src/data/projectCases/fitnessCoaching.js'

test('fitness coaching page keeps the service loop and workbench bridge', async () => {
  const viewFile = await readFile(
    new URL('../../src/views/projects/ProjectFitnessCoachingView.vue', import.meta.url),
    'utf8'
  )

  assert.ok(viewFile.includes('<ProjectCaseShell'))
  assert.ok(viewFile.includes('ProjectCaseSignalRail'))
  assert.ok(viewFile.includes('variant="bare"'))
  assert.ok(viewFile.includes('variant="panel"'))
  assert.ok(viewFile.includes('variant="proof"'))
  assert.ok(viewFile.includes('page.problemSection'))
  assert.ok(viewFile.includes('page.processSection'))
  assert.ok(viewFile.includes('page.evidenceSection'))
  assert.ok(viewFile.includes('page.outcomesSection'))
  assert.ok(viewFile.includes('page.bridgeSection'))
  assert.ok(viewFile.includes(':eyebrow="page.problemSection.eyebrow"'))
  assert.ok(viewFile.includes(':title="page.problemSection.title"'))
  assert.ok(viewFile.includes(':intro="page.problemSection.intro"'))
  assert.ok(viewFile.includes(':eyebrow="page.processSection.eyebrow"'))
  assert.ok(viewFile.includes(':title="page.processSection.title"'))
  assert.ok(viewFile.includes(':intro="page.processSection.intro"'))
  assert.ok(viewFile.includes('v-for="(step, index) in page.process"'))
  assert.ok(viewFile.includes('page.processSection.stepLabelPrefix'))
  assert.ok(viewFile.includes('page.processSection.stepLabelSuffix'))
  assert.ok(viewFile.includes('page.bridgeSection.copy'))
  assert.ok(viewFile.includes(':href="page.bridgeCta.href"'))
  assert.equal(fitnessCoachingCase.process.length, 4)
  assert.equal(fitnessCoachingCase.bridgeCta.href, '/fitness/')

  for (const item of fitnessCoachingCase.evidence) {
    assert.equal(typeof item.src, 'string')
    assert.ok(item.src.trim().length > 0)
    assert.ok(item.src.startsWith('/projects/fitness-coaching/'))
    await access(new URL(`../../public${item.src}`, import.meta.url))
  }
})
