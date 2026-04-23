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

test('homepage surfaces the study entry beside fitness in the same section', () => {
  assert.match(homeViewSource, /今天学习了吗？/)
  assert.match(homeViewSource, /href=['"]\/study\/['"]/)

  assert.match(
    homeViewSource,
    /<section[\s\S]*?今天学习了吗？[\s\S]*?href=['"]\/fitness\/['"][\s\S]*?href=['"]\/study\/['"][\s\S]*?<\/section>/
  )
})
