import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('project case foundation locks the shared refresh surface contract', async () => {
  const packageJson = await readFile(new URL('../../package.json', import.meta.url), 'utf8')
  const mainCss = await readFile(new URL('../../src/assets/main.css', import.meta.url), 'utf8')
  const shellFile = await readFile(new URL('../../src/components/projects/ProjectCaseShell.vue', import.meta.url), 'utf8')
  const sectionFile = await readFile(new URL('../../src/components/projects/ProjectCaseSection.vue', import.meta.url), 'utf8')
  const evidenceFile = await readFile(new URL('../../src/components/projects/ProjectEvidenceGrid.vue', import.meta.url), 'utf8')
  const projectCasesCss = await readFile(new URL('../../src/styles/project-cases.css', import.meta.url), 'utf8')
  const expectContains = (content, snippet, message) => assert.ok(content.includes(snippet), message)

  expectContains(mainCss, "@import '../styles/project-cases.css';", 'main.css should import the shared project case stylesheet')
  expectContains(packageJson, 'node tests/unit/project-case-foundation.test.js', 'package.json should expose the foundation test command')
  expectContains(shellFile, 'ProjectCaseSignalRail', 'ProjectCaseShell.vue should reference ProjectCaseSignalRail')
  expectContains(sectionFile, 'title', 'ProjectCaseSection.vue should still render section titles')
  expectContains(sectionFile, 'variant:', 'ProjectCaseSection.vue should expose a variant prop')
  expectContains(sectionFile, "default: 'panel'", 'ProjectCaseSection.vue variant prop should have a panel default')
  expectContains(evidenceFile, 'evidence-media', 'ProjectEvidenceGrid.vue should include evidence-media handling')
  expectContains(evidenceFile, 'item.src', 'ProjectEvidenceGrid.vue should still read item.src')
  expectContains(evidenceFile, 'item.note', 'ProjectEvidenceGrid.vue should keep the note text path')
  expectContains(projectCasesCss, 'prefers-reduced-motion', 'project-cases.css should include reduced-motion handling')
  expectContains(projectCasesCss, 'project-case-hero', 'project-cases.css should include hero classes')
  expectContains(projectCasesCss, 'project-case-stage', 'project-cases.css should include stage classes')
  expectContains(projectCasesCss, 'project-case-signal-rail', 'project-cases.css should include signal rail classes')
})
