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
  assert.match(routerSource, /path:\s*['"]\/study['"]/)
  assert.match(routerSource, /import\(['"]@\/views\/StudyView\.vue['"]\)/)
  assert.match(routerSource, /path:\s*['"]\/study\/frontend\/fundamentals['"]/)
  assert.match(routerSource, /import\(['"]@\/views\/FrontendStudyDetailView\.vue['"]\)/)
  assert.match(routerSource, /path:\s*['"]\/study\/nasm\/:chapterSlug['"]/)
  assert.match(routerSource, /import\(['"]@\/views\/NasmChapterView\.vue['"]\)/)
})

test('homepage surfaces the study entry beside fitness in the same row before the main grid', () => {
  assert.match(homeViewSource, /今天学习了吗？/)
  assert.match(homeViewSource, /href=['"]\/study\/['"]/)
  assert.match(homeViewSource, /href=['"]\/fitness\/['"]/)

  const bodyShellStart = homeViewSource.indexOf('<section class="home-page__body-shell')
  const mainGridStart = homeViewSource.indexOf('<div class="home-page__grid">')
  const fitnessHrefStart = homeViewSource.indexOf("href='/fitness/'")
  const studyHrefStart = homeViewSource.indexOf("href='/study/'")

  assert.ok(bodyShellStart !== -1)
  assert.ok(mainGridStart !== -1)
  assert.ok(fitnessHrefStart !== -1)
  assert.ok(studyHrefStart !== -1)
  assert.ok(fitnessHrefStart > bodyShellStart)
  assert.ok(studyHrefStart > bodyShellStart)
  assert.ok(fitnessHrefStart < mainGridStart)
  assert.ok(studyHrefStart < mainGridStart)

  assert.match(
    homeViewSource,
    /<section class="home-page__body-shell[\s\S]*?<a-row[\s\S]*?href=['"]\/fitness\/['"][\s\S]*?href=['"]\/study\/['"][\s\S]*?<\/a-row>[\s\S]*?<div class="home-page__grid">/
  )
})
