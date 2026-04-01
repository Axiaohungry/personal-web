import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('project case foundation locks the shared refresh surface contract', async () => {
  const shellFile = await readFile(new URL('../../src/components/projects/ProjectCaseShell.vue', import.meta.url), 'utf8')
  const sectionFile = await readFile(new URL('../../src/components/projects/ProjectCaseSection.vue', import.meta.url), 'utf8')
  const signalRailFile = await readFile(new URL('../../src/components/projects/ProjectCaseSignalRail.vue', import.meta.url), 'utf8')
  const evidenceFile = await readFile(new URL('../../src/components/projects/ProjectEvidenceGrid.vue', import.meta.url), 'utf8')
  const projectCasesCss = await readFile(new URL('../../src/styles/project-cases.css', import.meta.url), 'utf8')

  assert.match(
    shellFile,
    /(import\s+ProjectCaseSignalRail|<ProjectCaseSignalRail\b)/,
    'ProjectCaseShell.vue should reference ProjectCaseSignalRail'
  )
  assert.match(
    sectionFile,
    /variant\s*:\s*\{[\s\S]*?default\s*:\s*['"]panel['"]/,
    'ProjectCaseSection.vue should expose a variant prop with a panel default'
  )
  assert.match(
    signalRailFile,
    /\bitems\b[\s\S]*\bnote\b[\s\S]*\bsubtext\b/,
    'ProjectCaseSignalRail.vue should accept items with note and subtext support'
  )
  assert.match(
    evidenceFile,
    /\bevidence-media\b/,
    'ProjectEvidenceGrid.vue should include evidence-media handling'
  )
  assert.match(
    evidenceFile,
    /\bproject-case-evidence-card--featured\b/,
    'ProjectEvidenceGrid.vue should support featured proof blocks'
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
