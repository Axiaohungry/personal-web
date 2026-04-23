import test from 'node:test'
import assert from 'node:assert/strict'

import { studyTopics } from '../../src/data/study/studyTopics.js'
import { frontendStudyCategories } from '../../src/data/study/frontendStudy.js'
import { nasmCatalog } from '../../src/data/study/nasmCatalog.js'
import { nasmChapters } from '../../src/data/study/generated/nasmChapters.js'

test('study topic catalog stays intentionally small', () => {
  assert.equal(studyTopics.length, 3)
})

test('frontend study categories stay locked to fundamentals, interview, and coding', () => {
  assert.deepEqual(Object.keys(frontendStudyCategories), ['fundamentals', 'interview', 'coding'])
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
