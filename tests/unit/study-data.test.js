import test from 'node:test'
import assert from 'node:assert/strict'

import { studyHomeCard, studyTopics } from '../../src/data/study/studyTopics.js'
import {
  frontendStudyCategories,
  frontendStudySections,
} from '../../src/data/study/frontendStudy.js'
import { nasmCatalog } from '../../src/data/study/nasmCatalog.js'
import {
  nasmChapterCatalog,
  nasmChapters,
} from '../../src/data/study/generated/nasmChapters.js'

test('study topic catalog stays intentionally small', () => {
  assert.equal(studyTopics.length, 3)
})

test('frontend study categories stay locked to the ordered card shape', () => {
  assert.ok(Array.isArray(frontendStudyCategories))
  assert.deepEqual(
    frontendStudyCategories.map((category) => category.key),
    ['fundamentals', 'interview', 'coding']
  )
})

test('frontend study sections expose the planned keyed section collections', () => {
  assert.ok(frontendStudySections)
  assert.ok('fundamentals' in frontendStudySections)
  assert.ok('interview' in frontendStudySections)
  assert.ok('coding' in frontendStudySections)
  assert.ok(Array.isArray(frontendStudySections.fundamentals))
  assert.ok(frontendStudySections.fundamentals.length > 0)
})

test('study home card points to the study route', () => {
  assert.ok(studyHomeCard)
  assert.equal(studyHomeCard.href, '/study/')
})

test('NASM catalog stays at the expected chapter count', () => {
  assert.equal(nasmCatalog.length, 26)
})

test('generated NASM chapters always expose quiz-ready chapter metadata', () => {
  assert.ok(Array.isArray(nasmChapters))
  assert.ok(nasmChapters.length > 0)

  for (const chapter of nasmChapters) {
    assert.equal(typeof chapter.slug, 'string')
    assert.ok(chapter.slug.trim().length > 0)
    assert.equal(typeof chapter.title, 'string')
    assert.ok(chapter.title.trim().length > 0)
    assert.ok(Array.isArray(chapter.knowledgeSections))
    assert.ok(chapter.knowledgeSections.length > 0)
    assert.ok(Array.isArray(chapter.quizQuestions))
    assert.ok(chapter.quizQuestions.length > 0)
  }
})

test('generated NASM chapter module also exposes lightweight catalog metadata', () => {
  assert.ok(Array.isArray(nasmChapterCatalog))
  assert.equal(nasmChapterCatalog.length, 26)

  for (const chapter of nasmChapterCatalog) {
    assert.equal(typeof chapter.slug, 'string')
    assert.ok(chapter.slug.trim().length > 0)
    assert.equal(typeof chapter.title, 'string')
    assert.ok(chapter.title.trim().length > 0)
    assert.equal(typeof chapter.summary, 'string')
    assert.equal(typeof chapter.knowledgeSectionCount, 'number')
    assert.equal(typeof chapter.quizQuestionCount, 'number')
    assert.equal(chapter.knowledgeSections, undefined)
    assert.equal(chapter.quizQuestions, undefined)
  }
})

test('import script stays reusable when imported as a module', async () => {
  const previousSourceDir = process.env.NASM_SOURCE_DIR
  const previousExitCode = process.exitCode

  process.env.NASM_SOURCE_DIR = 'Z:\\codex-missing-nasm-source'
  process.exitCode = undefined

  const module = await import(
    `../../scripts/import-nasm-chapters.mjs?study-data-test=${Date.now()}`
  )

  assert.equal(typeof module.parseChapterMarkdown, 'function')
  assert.equal(process.exitCode, undefined)

  process.env.NASM_SOURCE_DIR = previousSourceDir
  process.exitCode = previousExitCode
})
