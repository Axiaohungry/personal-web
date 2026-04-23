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

test('study routes are declared as lazy-loaded study entrypoints', () => {
  assert.match(
    routerSource,
    /\{\s*path:\s*['"]\/study['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(['"]@\/views\/study\/StudyView\.vue['"]\)/
  )
  assert.match(
    routerSource,
    /\{\s*path:\s*['"]\/study\/frontend\/fundamentals['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(['"]@\/views\/study\/FrontendStudyDetailView\.vue['"]\)/
  )
  assert.match(
    routerSource,
    /\{\s*path:\s*['"]\/study\/nasm\/:chapterSlug['"][\s\S]*?component:\s*\(\)\s*=>\s*import\(['"]@\/views\/study\/NasmChapterView\.vue['"]\)/
  )
})

test('homepage keeps the study entry once in the pre-grid body shell alongside fitness', () => {
  const studyHrefPattern = /href=(['"])\/study\/\1/g
  const fitnessHrefPattern = /href=(['"])\/fitness\/\1/g
  const studyHrefMatches = homeViewSource.match(studyHrefPattern) ?? []
  const fitnessHrefMatches = homeViewSource.match(fitnessHrefPattern) ?? []
  const bodyShellStart = homeViewSource.indexOf('home-page__body-shell')
  const mainGridStart = homeViewSource.indexOf('home-page__grid')
  const studyLabelPattern = /\u4eca\u5929\u5b66\u4e60\u4e86\u5417\uff1f/

  assert.match(homeViewSource, studyLabelPattern)
  assert.equal(studyHrefMatches.length, 1)
  assert.equal(fitnessHrefMatches.length, 1)
  assert.ok(bodyShellStart !== -1)
  assert.ok(mainGridStart !== -1)
  assert.ok(bodyShellStart < mainGridStart)

  const preGridBody = homeViewSource.slice(bodyShellStart, mainGridStart)
  const postGridBody = homeViewSource.slice(mainGridStart)

  assert.match(preGridBody, studyLabelPattern)
  assert.match(preGridBody, fitnessHrefPattern)
  assert.match(preGridBody, studyHrefPattern)
  assert.equal((postGridBody.match(studyHrefPattern) ?? []).length, 0)
})
