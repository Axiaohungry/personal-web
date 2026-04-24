<script setup>
import { computed, ref, watch } from 'vue'

import QuizQuestionCard from './QuizQuestionCard.vue'
import {
  answerQuizQuestion,
  normalizeQuizQuestion,
  shuffleQuizQuestions,
} from '@/utils/studyQuiz.js'

const props = defineProps({
  chapterKey: {
    type: String,
    default: '',
  },
  questions: {
    type: Array,
    default: () => [],
  },
  random: {
    type: Function,
    default: Math.random,
  },
})

const orderedQuestions = ref([])
const quizState = ref({ questions: {} })

function resetQuizSession() {
  const normalizedQuestions = props.questions.map((question, index) =>
    normalizeQuizQuestion(question, {
      chapterKey: props.chapterKey,
      index,
    })
  )
  orderedQuestions.value = shuffleQuizQuestions(normalizedQuestions, props.random)
  quizState.value = {
    questions: orderedQuestions.value.reduce((result, question) => {
      result[question.id] = question
      return result
    }, {}),
  }
}

watch(
  () => [props.chapterKey, props.questions],
  () => {
    resetQuizSession()
  },
  { immediate: true }
)

const sessionQuestions = computed(() =>
  orderedQuestions.value.map((question) => quizState.value.questions[question.id] ?? question)
)

const answeredCount = computed(
  () => sessionQuestions.value.filter((question) => question.isLocked).length
)

function handleAnswer({ questionId, optionKey }) {
  quizState.value = answerQuizQuestion(quizState.value, questionId, optionKey)
}
</script>

<template>
  <section class="quiz-question-list">
    <header class="quiz-question-list__header">
      <div>
        <p class="quiz-question-list__eyebrow">章节测验</p>
        <h2 class="quiz-question-list__title">用随机顺序快速回看这一章</h2>
        <p class="quiz-question-list__summary">
          已回答 {{ answeredCount }} / {{ sessionQuestions.length }} 题
        </p>
      </div>

      <a-button
        type="default"
        class="quiz-question-list__shuffle-button"
        :disabled="!sessionQuestions.length"
        @click="resetQuizSession"
      >
        重新随机本章测验
      </a-button>
    </header>

    <div v-if="sessionQuestions.length" class="quiz-question-list__items">
      <QuizQuestionCard
        v-for="(question, index) in sessionQuestions"
        :key="question.id"
        :index="index"
        :total="sessionQuestions.length"
        :question="question"
        @answer="handleAnswer"
      />
    </div>

    <slot v-else name="empty" />
  </section>
</template>
