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

test('homepage surfaces the study entry beside fitness before the main grid', () => {
  assert.match(homeViewSource, /今天学习了吗？/)
  assert.match(homeViewSource, /href=['"]\/study\/['"]/)
  assert.match(homeViewSource, /href=['"]\/fitness\/['"]/)

  const bodyShellStart = homeViewSource.indexOf('<section class="home-page__body-shell')
  const mainGridStart = homeViewSource.indexOf('<div class="home-page__grid">')

  assert.ok(bodyShellStart !== -1)
  assert.ok(mainGridStart !== -1)
  assert.ok(bodyShellStart < mainGridStart)

  const preGridBody = homeViewSource.slice(bodyShellStart, mainGridStart)
  const postGridBody = homeViewSource.slice(mainGridStart)

  assert.match(preGridBody, /今天学习了吗？/)
  assert.match(preGridBody, /href=['"]\/fitness\/['"]/)
  assert.match(preGridBody, /href=['"]\/study\/['"]/)
  assert.ok(!postGridBody.includes("href='/study/'"))
})
