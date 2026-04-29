<script setup>
import { computed } from 'vue'

const props = defineProps({
  index: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  question: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['answer'])

const optionEntries = computed(() => {
  const options = props.question?.options

  if (Array.isArray(options)) {
    return options.map((option, index) => ({
      key: option.key ?? `option-${index + 1}`,
      displayKey: formatOptionKey(option.key ?? `option-${index + 1}`, index),
      label: option.label ?? option.text ?? '',
    }))
  }

  if (options && typeof options === 'object') {
    return Object.entries(options).map(([key, label], index) => ({
      key,
      displayKey: formatOptionKey(key, index),
      label,
    }))
  }

  return []
})

function formatOptionKey(key, index) {
  const choiceMatch = String(key).match(/^choice-([a-z])$/i)
  if (choiceMatch) {
    return choiceMatch[1].toUpperCase()
  }

  const optionMatch = String(key).match(/^option-(\d+)$/i)
  if (optionMatch) {
    return String.fromCharCode(64 + Number(optionMatch[1]))
  }

  return String.fromCharCode(65 + index)
}

function handleAnswer(optionKey) {
  emit('answer', {
    questionId: props.question.id,
    optionKey,
  })
}
</script>

<template>
  <article class="quiz-question-card study-surface">
    <header class="quiz-question-card__header">
      <p class="quiz-question-card__eyebrow">
        第 {{ index + 1 }} 题<span v-if="total"> / {{ total }}</span>
      </p>
      <h3 class="quiz-question-card__title">{{ question.prompt }}</h3>
    </header>

    <div class="quiz-question-card__options">
      <button
        v-for="option in optionEntries"
        :key="option.key"
        type="button"
        class="quiz-question-card__option"
        :class="{
          'is-selected': option.key === question.selectedOptionKey,
          'is-correct':
            question.isLocked &&
            option.key === question.selectedOptionKey &&
            question.isCorrect,
          'is-incorrect':
            question.isLocked &&
            option.key === question.selectedOptionKey &&
            question.isCorrect === false,
        }"
        :disabled="question.isLocked"
        @click="handleAnswer(option.key)"
      >
        <span class="quiz-question-card__option-key">{{ option.displayKey }}</span>
        <span class="quiz-question-card__option-label">{{ option.label }}</span>
      </button>
    </div>

    <div
      v-if="question.explanationVisible"
      class="quiz-question-card__feedback"
      :class="{ 'is-correct': question.isCorrect, 'is-incorrect': question.isCorrect === false }"
    >
      <p class="quiz-question-card__feedback-title">
        {{
          question.isCorrect === true
            ? '回答正确'
            : question.isCorrect === false
              ? '再看一眼本章重点'
              : '这题暂不判对错，先看解析'
        }}
      </p>
      <p v-if="question.explanation" class="quiz-question-card__explanation">
        {{ question.explanation }}
      </p>
    </div>
  </article>
</template>
