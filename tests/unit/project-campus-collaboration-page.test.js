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
  assert.ok(viewFile.includes('ProjectEvidenceGrid'))
  assert.ok(viewFile.includes('为什么这不是“办活动”'))
  assert.ok(viewFile.includes('支持主案的协作证明'))
  assert.ok(viewFile.includes('结果、反思与可迁移能力'))
  assert.ok(viewFile.includes('第 {{ index + 1 }} 步'))
  assert.ok(viewFile.includes('page.supportingCases'))
  assert.ok(viewFile.includes('page.outcomes.reflections'))
  assert.ok(viewFile.includes('page.outcomes.capabilities'))
  assert.ok(viewFile.includes('v-for="signal in hero.signals"'))
  assert.equal(campusCollaborationCase.leadCase.title, '“活力柚子”篮球新生杯')
  assert.equal(campusCollaborationCase.hero.signals.length, 3)
  assert.ok(campusCollaborationCase.supportingCases.length >= 2)

  for (const item of campusCollaborationCase.evidence) {
    assert.equal(typeof item.src, 'string')
    assert.ok(item.src.trim().length > 0)
    await access(new URL(`../../public${item.src}`, import.meta.url))
  }
})
