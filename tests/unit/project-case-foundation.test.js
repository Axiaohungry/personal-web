import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('project case foundation imports shared styles and shell components', async () => {
  const packageJson = await readFile(new URL('../../package.json', import.meta.url), 'utf8')
  const mainCss = await readFile(new URL('../../src/assets/main.css', import.meta.url), 'utf8')
  const shellFile = await readFile(new URL('../../src/components/projects/ProjectCaseShell.vue', import.meta.url), 'utf8')
  const sectionFile = await readFile(new URL('../../src/components/projects/ProjectCaseSection.vue', import.meta.url), 'utf8')
  const evidenceFile = await readFile(new URL('../../src/components/projects/ProjectEvidenceGrid.vue', import.meta.url), 'utf8')
  const projectCasesCss = await readFile(new URL('../../src/styles/project-cases.css', import.meta.url), 'utf8')

  assert.ok(mainCss.includes("@import '../styles/project-cases.css';"))
  assert.ok(packageJson.includes('node tests/unit/project-case-foundation.test.js'))
  assert.ok(shellFile.includes('ProjectCaseSignalRail'))
  assert.ok(sectionFile.includes('title'))
  assert.ok(sectionFile.includes('variant'))
  assert.ok(evidenceFile.includes('evidence-media'))
  assert.ok(evidenceFile.includes('item.src'))
  assert.ok(evidenceFile.includes('item.note'))
  assert.ok(projectCasesCss.includes('prefers-reduced-motion'))
  assert.ok(projectCasesCss.includes('project-case-hero'))
  assert.ok(projectCasesCss.includes('project-case-stage'))
  assert.ok(projectCasesCss.includes('project-case-signal-rail'))
})
