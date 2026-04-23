import test from 'node:test'
import assert from 'node:assert/strict'

import { answerQuizQuestion, shuffleQuizQuestions } from '../../src/utils/studyQuiz.js'

test('shuffleQuizQuestions can be made deterministic with an injected random source', () => {
  const questions = [
    { id: 'a' },
    { id: 'b' },
    { id: 'c' },
    { id: 'd' },
  ]

  const shuffled = shuffleQuizQuestions(questions, () => 0)

  assert.deepEqual(shuffled.map((question) => question.id), ['b', 'c', 'd', 'a'])
  assert.deepEqual(questions.map((question) => question.id), ['a', 'b', 'c', 'd'])
})

test('answerQuizQuestion hides explanation until an answer is recorded', () => {
  const question = {
    id: 'chapter-2',
    prompt: 'Which muscle is trained?',
    answer: 'Quadriceps',
    explanation: 'The explanation should stay hidden until the learner answers.',
  }

  const preview = answerQuizQuestion(question)
  const answered = answerQuizQuestion(question, 'Hamstrings')

  assert.equal(preview.explanation, undefined)
  assert.equal(preview.isLocked, false)
  assert.equal(answered.userAnswer, 'Hamstrings')
  assert.equal(answered.explanation, question.explanation)
  assert.equal(answered.isLocked, true)
})

test('answerQuizQuestion locks a question after the first answer', () => {
  const question = {
    id: 'chapter-1',
    prompt: 'What is NASM?',
    answer: 'A certification framework',
    explanation: 'NASM focuses on structured programming and clear standards.',
  }

  const firstAnswer = answerQuizQuestion(question, 'A certification framework')
  const secondAnswer = answerQuizQuestion(firstAnswer, 'Something else')

  assert.equal(firstAnswer.isLocked, true)
  assert.equal(firstAnswer.isCorrect, true)
  assert.equal(secondAnswer.userAnswer, 'A certification framework')
  assert.equal(secondAnswer.isLocked, true)
  assert.equal(secondAnswer.isCorrect, true)
})
