import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('project case foundation locks the shared refresh surface contract', async () => {
  const shellFile = await readFile(new URL('../../src/components/projects/ProjectCaseShell.vue', import.meta.url), 'utf8')
  const sectionFile = await readFile(new URL('../../src/components/projects/ProjectCaseSection.vue', import.meta.url), 'utf8')
  const evidenceFile = await readFile(new URL('../../src/components/projects/ProjectEvidenceGrid.vue', import.meta.url), 'utf8')
  const projectCasesCss = await readFile(new URL('../../src/styles/project-cases.css', import.meta.url), 'utf8')

  assert.match(
    shellFile,
    /(import\s+ProjectCaseSignalRail|<ProjectCaseSignalRail\b)/,
    'ProjectCaseShell.vue should reference ProjectCaseSignalRail'
  )
  assert.match(
    sectionFile,
    /props\s*:\s*\{[\s\S]*?variant\s*:\s*\{[\s\S]*?default\s*:\s*['"]panel['"]/,
    'ProjectCaseSection.vue should expose a variant prop with a panel default'
  )
  assert.match(
    evidenceFile,
    /\bevidence-media\b/,
    'ProjectEvidenceGrid.vue should include evidence-media handling'
  )
  assert.match(
    evidenceFile,
    /\bitem\.note\b/,
    'ProjectEvidenceGrid.vue should keep the note text path'
  )
  assert.match(
    projectCasesCss,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.project-case-hero[\s\S]*?\.project-case-stage[\s\S]*?\.project-case-signal-rail/s,
    'project-cases.css should include reduced-motion handling plus hero, stage, and signal rail classes'
  )
})
