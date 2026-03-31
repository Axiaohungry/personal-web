import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('project case foundation imports shared styles and shell components', async () => {
  const mainCss = await readFile(new URL('../../src/assets/main.css', import.meta.url), 'utf8')
  const shellFile = await readFile(new URL('../../src/components/projects/ProjectCaseShell.vue', import.meta.url), 'utf8')
  const sectionFile = await readFile(new URL('../../src/components/projects/ProjectCaseSection.vue', import.meta.url), 'utf8')
  const evidenceFile = await readFile(new URL('../../src/components/projects/ProjectEvidenceGrid.vue', import.meta.url), 'utf8')

  assert.ok(mainCss.includes("@import '../styles/project-cases.css';"))
  assert.ok(shellFile.includes('SiteHeader'))
  assert.ok(shellFile.includes('defineProps'))
  assert.ok(sectionFile.includes('section'))
  assert.ok(evidenceFile.includes('items'))
})
