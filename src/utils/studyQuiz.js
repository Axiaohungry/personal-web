function resolveCorrectOptionKey(question) {
  if (!question || typeof question !== 'object') {
    return undefined
  }

  if (question.correctOptionKey) {
    return question.correctOptionKey
  }

  if (question.correctAnswerKey) {
    return question.correctAnswerKey
  }

  if (Array.isArray(question.options)) {
    const correctOption = question.options.find((option) => option?.isCorrect)
    return correctOption?.key
  }

  if (question.options && typeof question.options === 'object') {
    return Object.keys(question.options)[0]
  }

  return undefined
}

export function shuffleQuizQuestions(questions = [], random = Math.random) {
  const shuffled = Array.isArray(questions) ? questions.slice() : []

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }

  return shuffled
}

export function answerQuizQuestion(state, questionId, selectedOptionKey) {
  const question = state?.questions?.[questionId]

  if (!question) {
    return state
  }

  if (question.isLocked) {
    return state
  }

  const correctOptionKey = resolveCorrectOptionKey(question)

  return {
    ...state,
    questions: {
      ...state.questions,
      [questionId]: {
        ...question,
        selectedOptionKey,
        isCorrect: correctOptionKey ? selectedOptionKey === correctOptionKey : false,
        isLocked: true,
        explanationVisible: true,
      },
    },
  }
}
