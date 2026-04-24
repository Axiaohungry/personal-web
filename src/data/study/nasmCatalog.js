import { nasmChapterCatalog } from './generated/nasmChapters.js'

export const nasmCatalog = nasmChapterCatalog.map((chapter) => ({
  key: chapter.slug,
  slug: chapter.slug,
  order: chapter.order,
  title: chapter.title,
  href: `/study/nasm/${chapter.slug}/`,
  summary: chapter.summary,
  knowledgeSectionCount: chapter.knowledgeSectionCount,
  quizQuestionCount: chapter.quizQuestionCount,
}))
