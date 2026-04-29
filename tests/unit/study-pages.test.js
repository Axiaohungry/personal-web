import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const routerSource = readFileSync(
  fileURLToPath(new URL('../../src/router/index.js', import.meta.url)),
  'utf8'
)

const homeViewSource = readFileSync(
  fileURLToPath(new URL('../../src/views/HomeView.vue', import.meta.url)),
  'utf8'
)

const frontendDetailSource = readFileSync(
  fileURLToPath(new URL('../../src/views/study/FrontendStudyDetailView.vue', import.meta.url)),
  'utf8'
)

const studyWorkbenchLayoutSource = readFileSync(
  fileURLToPath(new URL('../../src/components/study/StudyWorkbenchLayout.vue', import.meta.url)),
  'utf8'
)

const studyQACardSource = readFileSync(
  fileURLToPath(new URL('../../src/components/study/StudyQACard.vue', import.meta.url)),
  'utf8'
)

test('study routes are declared as lazy-loaded study entrypoints', () => {
  assert.match(
    routerSource,
    /\{\s*path:\s*['"]\/study['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(['"]@\/views\/study\/StudyView\.vue['"]\)/
  )
  assert.match(
    routerSource,
    /\{\s*path:\s*['"]\/study\/frontend['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(['"]@\/views\/study\/FrontendStudyIndexView\.vue['"]\)/
  )
  assert.match(
    routerSource,
    /\{\s*path:\s*['"]\/study\/product['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(['"]@\/views\/study\/ProductStudyView\.vue['"]\)/
  )
  assert.match(
    routerSource,
    /\{\s*path:\s*['"]\/study\/product\/roadmap['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(['"]@\/views\/study\/ProductStudyView\.vue['"]\)/
  )
})

test('future frontend detail study routes remain declared for later tasks', () => {
  assert.match(
    routerSource,
    /\{\s*path:\s*['"]\/study\/frontend\/fundamentals['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(['"]@\/views\/study\/FrontendStudyDetailView\.vue['"]\)/
  )
})

test('frontend interview detail keeps both prompts and guidance visible', () => {
  assert.match(frontendDetailSource, /const interviewPromptSections = computed/)
  assert.match(frontendDetailSource, /const interviewGuidanceSections = computed/)
  assert.match(frontendDetailSource, /v-for="section in interviewPromptSections"/)
  assert.match(frontendDetailSource, /v-for="section in interviewGuidanceSections"/)
})

test('study workbench layout mounts the shared site header', () => {
  assert.match(studyWorkbenchLayoutSource, /import SiteHeader/)
  assert.match(studyWorkbenchLayoutSource, /import \{ navigationItems \}/)
  assert.match(studyWorkbenchLayoutSource, /import \{ profile \}/)
  assert.match(studyWorkbenchLayoutSource, /<SiteHeader/)
  assert.match(studyWorkbenchLayoutSource, /:navigation-items="navigationItems"/)
})

test('study Q&A card supports structured answer blocks', () => {
  assert.match(studyQACardSource, /normalizedAnswerBlocks/)
  assert.match(studyQACardSource, /v-for="block in normalizedAnswerBlocks"/)
  assert.match(studyQACardSource, /study-qa-card__answer-block/)
})

test('future nasm study routes remain declared for later tasks', () => {
  assert.match(
    routerSource,
    /\{\s*path:\s*['"]\/study\/nasm['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(['"]@\/views\/study\/NasmStudyIndexView\.vue['"]\)/
  )
  assert.match(
    routerSource,
    /\{\s*path:\s*['"]\/study\/nasm\/:chapterSlug['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(['"]@\/views\/study\/NasmChapterView\.vue['"]\)/
  )
})

test('homepage keeps the study entry once in the pre-grid body shell alongside fitness', () => {
  const literalStudyRoutePattern = /(?:href|to)=(['"])\/study\/\1/g
  const boundStudyRoutePattern = /:(?:href|to)=['"]studyHomeCard\.href['"]/g
  const fitnessRoutePattern = /(?:href|to)=(['"])\/fitness\/\1/g
  const studyRouteCount =
    (homeViewSource.match(literalStudyRoutePattern) ?? []).length +
    (homeViewSource.match(boundStudyRoutePattern) ?? []).length
  const fitnessRouteMatches = homeViewSource.match(fitnessRoutePattern) ?? []
  const bodyShellStart = homeViewSource.indexOf('home-page__body-shell')
  const mainGridStart = homeViewSource.indexOf('home-page__grid')
  const studyLabelPattern = /\u4eca\u5929\u5b66\u4e60\u4e86\u5417\uff1f/

  assert.match(homeViewSource, studyLabelPattern)
  assert.equal(fitnessRouteMatches.length, 1)
  assert.ok(bodyShellStart !== -1)
  assert.ok(mainGridStart !== -1)
  assert.ok(bodyShellStart < mainGridStart)

  const preGridBody = homeViewSource.slice(bodyShellStart, mainGridStart)

  assert.match(preGridBody, studyLabelPattern)
  assert.match(preGridBody, fitnessRoutePattern)
  assert.ok(studyRouteCount >= 3)
  assert.equal(
    (preGridBody.match(literalStudyRoutePattern) ?? []).length +
      (preGridBody.match(boundStudyRoutePattern) ?? []).length,
    2
  )
})
