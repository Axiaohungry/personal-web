import { nasmChapters } from './generated/nasmChapters.js'

export const nasmCatalog = nasmChapters.map((chapter, index) => ({
  key: chapter.slug,
  slug: chapter.slug,
  order: index + 1,
  title: chapter.title,
  href: `/study/nasm/${chapter.slug}/`,
  summary: chapter.summary,
  knowledgeSectionCount: chapter.knowledgeSections.length,
  quizQuestionCount: chapter.quizQuestions.length,
}))
