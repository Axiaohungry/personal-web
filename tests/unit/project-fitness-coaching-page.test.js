import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

import { fitnessCoachingCase } from '../../src/data/projectCases/fitnessCoaching.js'

test('fitness coaching page keeps the service loop and workbench bridge', async () => {
  const viewFile = await readFile(
    new URL('../../src/views/projects/ProjectFitnessCoachingView.vue', import.meta.url),
    'utf8'
  )

  assert.ok(viewFile.includes('ProjectCaseShell'))
  assert.equal(fitnessCoachingCase.process.length, 4)
  assert.equal(fitnessCoachingCase.bridgeCta.href, '/fitness/')

  for (const item of fitnessCoachingCase.evidence) {
    await access(new URL(`../../public${item.src}`, import.meta.url))
  }
})
