import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('project case foundation locks the shared refresh surface contract', async () => {
  const shellFile = await readFile(new URL('../../src/components/projects/ProjectCaseShell.vue', import.meta.url), 'utf8')
  const sectionFile = await readFile(new URL('../../src/components/projects/ProjectCaseSection.vue', import.meta.url), 'utf8')
  const signalRailFile = await readFile(new URL('../../src/components/projects/ProjectCaseSignalRail.vue', import.meta.url), 'utf8')
  const evidenceFile = await readFile(new URL('../../src/components/projects/ProjectEvidenceGrid.vue', import.meta.url), 'utf8')
  const projectCasesCss = await readFile(new URL('../../src/styles/project-cases.css', import.meta.url), 'utf8')

  assert.ok(shellFile.includes('import ProjectCaseSignalRail from'), 'ProjectCaseShell.vue should import ProjectCaseSignalRail')
  assert.match(
    shellFile,
    /v-if="heroSignals\.length"[\s\S]*:items="heroSignals"/,
    'ProjectCaseShell.vue should pass heroSignals into the rail behind a length guard'
  )

  assert.match(
    sectionFile,
    /variant:\s*\{[\s\S]*default:\s*['"]panel['"][\s\S]*\}/,
    'ProjectCaseSection.vue should expose a panel default variant'
  )
  assert.match(
    sectionFile,
    /class="project-case-section project-case-stage motion-rise"/,
    'ProjectCaseSection.vue should render as a standalone stage container'
  )
  assert.doesNotMatch(
    sectionFile,
    /content-section/,
    'ProjectCaseSection.vue should not inherit the home section split layout'
  )
  assert.match(
    sectionFile,
    /:class="`project-case-stage--\$\{props\.variant\}`"/,
    'ProjectCaseSection.vue should map the variant prop onto the stage modifier class'
  )

  assert.match(
    signalRailFile,
    /getSignalValue\(item\)\s*\{\s*return item\?\.value\s*\?\?\s*item\?\.metric\s*\?\?\s*item\?\.stat\s*\?\?\s*''\s*\}/s,
    'ProjectCaseSignalRail.vue should preserve numeric zero through nullish extraction'
  )
  assert.match(
    signalRailFile,
    /function hasSignalValue\(item\)[\s\S]*value !== undefined && value !== null && value !== ''/,
    'ProjectCaseSignalRail.vue should keep zero-valued signals visible'
  )
  assert.match(
    signalRailFile,
    /:class="\{ 'project-case-signal-rail__item--featured': item\?\.featured \}"/,
    'ProjectCaseSignalRail.vue should keep the featured modifier hook'
  )

  assert.match(
    evidenceFile,
    /class="\{ 'project-case-evidence-card--featured': item\.featured \}"/,
    'ProjectEvidenceGrid.vue should support featured proof blocks'
  )
  assert.match(
    evidenceFile,
    /v-if="getEvidenceDetail\(item\)"/,
    'ProjectEvidenceGrid.vue should keep the detail-only path'
  )
  assert.match(
    evidenceFile,
    /v-if="item\.note"/,
    'ProjectEvidenceGrid.vue should keep the note text path'
  )

  assert.match(
    projectCasesCss,
    /\.project-case-section\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    'project-cases.css should keep project case sections on a single runway column'
  )
  assert.doesNotMatch(
    projectCasesCss,
    /grid-template-columns:\s*minmax\(0,\s*17rem\)\s+minmax\(0,\s*1fr\)/,
    'project-cases.css should no longer force a fixed sidebar/body split'
  )
  assert.match(
    projectCasesCss,
    /\.project-case-signal-rail__item--featured[\s\S]*background:\s*color-mix\(in srgb, var\(--accent\) 6%, transparent\)/,
    'project-cases.css should style featured signal rail items lightly'
  )
  assert.match(
    projectCasesCss,
    /\.project-case-stage--bare[\s\S]*background:[\s\S]*linear-gradient/,
    'project-cases.css should keep bare stages intentionally surfaced'
  )
  assert.match(
    projectCasesCss,
    /\.project-case-page__shell > \.project-case-stage\.motion-rise:nth-of-type\(2\)[\s\S]*animation-delay:\s*90ms[\s\S]*nth-of-type\(3\)[\s\S]*180ms[\s\S]*nth-of-type\(n \+ 4\)[\s\S]*270ms/s,
    'project-cases.css should stagger shared case stages lightly after the hero'
  )
  assert.match(
    projectCasesCss,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.project-case-page :where\(a:hover, button:hover, \[role='button'\]:hover\)[\s\S]*?transform:\s*none !important;/s,
    'project-cases.css should neutralize hover transforms in reduced-motion mode'
  )
})
