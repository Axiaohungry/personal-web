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

  return undefined
}

export function normalizeQuizQuestion(rawQuestion, { chapterKey = '', index = 0 } = {}) {
  const rawOptions = rawQuestion?.options
  let options = {}
  let derivedCorrectOptionKey

  if (Array.isArray(rawOptions)) {
    options = rawOptions.reduce((result, option, optionIndex) => {
      const key = option.key ?? `choice-${String.fromCharCode(97 + optionIndex)}`
      result[key] = option.label ?? option.text ?? ''

      if (option?.isCorrect) {
        derivedCorrectOptionKey = key
      }

      return result
    }, {})
  } else if (rawOptions && typeof rawOptions === 'object') {
    options = { ...rawOptions }
  }

  return {
    id: rawQuestion?.id ?? rawQuestion?.key ?? `${chapterKey || 'quiz'}-${index + 1}`,
    prompt: rawQuestion?.prompt ?? rawQuestion?.question ?? `第 ${index + 1} 题`,
    explanation:
      rawQuestion?.explanation ??
      rawQuestion?.summary ??
      (Array.isArray(rawQuestion?.answerPoints) ? rawQuestion.answerPoints.join(' ') : ''),
    options,
    correctOptionKey:
      rawQuestion?.correctOptionKey ??
      rawQuestion?.correctAnswerKey ??
      derivedCorrectOptionKey,
    isLocked: false,
    explanationVisible: false,
  }
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
        isLocked: true,
        explanationVisible: true,
        ...(correctOptionKey ? { isCorrect: selectedOptionKey === correctOptionKey } : {}),
      },
    },
  }
}
