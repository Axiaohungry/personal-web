import { nasmChapterCatalog } from './generated/nasmCatalog.generated.js'

const chapterSlugs = new Set(nasmChapterCatalog.map((chapter) => chapter.slug))

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

/**
 * 按需加载指定章节的完整详情（知识点 + 测验题目）。
 * 利用 Vite 的动态 import 实现 code-splitting，每个章节只在打开时下载。
 */
export async function loadNasmChapterDetail(slug) {
  if (!chapterSlugs.has(slug)) {
    return null
  }

  const { chapterDetail } = await import(`./generated/chapters/${slug}.js`)
  return chapterDetail
}
