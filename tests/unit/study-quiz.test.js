import test from 'node:test'
import assert from 'node:assert/strict'

import { answerQuizQuestion, shuffleQuizQuestions } from '../../src/utils/studyQuiz.js'

function createRandomSequence(values) {
  let index = 0
  return () => values[index++ % values.length]
}

test('shuffleQuizQuestions is deterministic with injected random and does not mutate input', () => {
  const questions = [
    { id: 'a' },
    { id: 'b' },
    { id: 'c' },
    { id: 'd' },
  ]
  const originalIds = questions.map((question) => question.id)

  const shuffledA = shuffleQuizQuestions(questions, createRandomSequence([0.91, 0.17, 0.63, 0.28]))
  const shuffledB = shuffleQuizQuestions(questions, createRandomSequence([0.91, 0.17, 0.63, 0.28]))
  const shuffledC = shuffleQuizQuestions(questions, createRandomSequence([0.12, 0.84, 0.39, 0.57]))

  assert.notStrictEqual(shuffledA, questions)
  assert.deepEqual(questions.map((question) => question.id), originalIds)
  assert.deepEqual(shuffledA, shuffledB)
  assert.notDeepEqual(shuffledA, shuffledC)
  assert.deepEqual(
    shuffledA.map((question) => question.id).sort(),
    originalIds.slice().sort()
  )
})

test('answerQuizQuestion locks the result after the first answer', () => {
  const questionId = 'chapter-1'
  const initialState = {
    questions: {
      [questionId]: {
        prompt: 'What is NASM?',
        explanation: 'NASM focuses on structured programming and clear standards.',
        correctOptionKey: 'choice-a',
        isLocked: false,
        explanationVisible: false,
        options: {
          'choice-a': 'A certification framework',
          'choice-b': 'Something else',
        },
      },
    },
  }

  const answeredState = answerQuizQuestion(initialState, questionId, 'choice-a')
  const secondAnswerState = answerQuizQuestion(answeredState, questionId, 'choice-b')

  assert.notStrictEqual(answeredState, initialState)
  assert.equal(initialState.questions[questionId].isLocked, false)
  assert.equal(initialState.questions[questionId].explanationVisible, false)
  assert.equal(answeredState.questions[questionId].isLocked, true)
  assert.equal(answeredState.questions[questionId].selectedOptionKey, 'choice-a')
  assert.equal(answeredState.questions[questionId].isCorrect, true)
  assert.equal(secondAnswerState.questions[questionId].selectedOptionKey, 'choice-a')
  assert.equal(secondAnswerState.questions[questionId].isLocked, true)
})

test('answerQuizQuestion keeps explanation hidden until an answer is recorded', () => {
  const questionId = 'chapter-2'
  const state = {
    questions: {
      [questionId]: {
        prompt: 'Which muscle is trained?',
        explanation: 'The explanation should stay hidden until the learner answers.',
        correctOptionKey: 'choice-a',
        isLocked: false,
        explanationVisible: false,
        options: {
          'choice-a': 'Quadriceps',
          'choice-b': 'Hamstrings',
        },
      },
    },
  }

  const previewState = state
  const answeredState = answerQuizQuestion(state, questionId, 'choice-a')

  assert.equal(previewState.questions[questionId].explanationVisible, false)
  assert.ok(!('selectedOptionKey' in previewState.questions[questionId]))
  assert.equal(answeredState.questions[questionId].explanationVisible, true)
  assert.equal(answeredState.questions[questionId].selectedOptionKey, 'choice-a')
})

test('answerQuizQuestion keeps unverifiable questions locked without guessing correctness', () => {
  const questionId = 'chapter-3'
  const state = {
    questions: {
      [questionId]: {
        prompt: 'Which statement is best supported?',
        explanation: 'This review card should still reveal its explanation after answering.',
        isLocked: false,
        explanationVisible: false,
        options: {
          'choice-a': 'Option A',
          'choice-b': 'Option B',
        },
      },
    },
  }

  const answeredState = answerQuizQuestion(state, questionId, 'choice-a')

  assert.equal(answeredState.questions[questionId].selectedOptionKey, 'choice-a')
  assert.equal(answeredState.questions[questionId].isLocked, true)
  assert.equal(answeredState.questions[questionId].explanationVisible, true)
  assert.ok(!('isCorrect' in answeredState.questions[questionId]))
})
