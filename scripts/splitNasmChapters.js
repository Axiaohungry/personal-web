/**
 * 将 nasmChapters.js 拆分为：
 *  1. nasmCatalog.generated.js  — 仅包含目录级摘要（~10KB）
 *  2. chapters/ch01.js ~ ch26.js — 每章独立的详情文件
 *
 * 同时给每道 quiz 题目 ID 加上章节前缀，避免跨章碰撞。
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SOURCE = join(__dirname, '..', 'src', 'data', 'study', 'generated', 'nasmChapters.js')
const OUT_DIR = join(__dirname, '..', 'src', 'data', 'study', 'generated', 'chapters')
const CATALOG_OUT = join(__dirname, '..', 'src', 'data', 'study', 'generated', 'nasmCatalog.generated.js')

// Dynamically import the source module
async function main() {
  // We need to use a data URL or eval approach since the file uses `export`
  const sourceContent = readFileSync(SOURCE, 'utf-8')

  // Extract nasmChapterCatalog
  const catalogMatch = sourceContent.match(
    /export const nasmChapterCatalog = (\[[\s\S]*?\n\])/
  )
  if (!catalogMatch) {
    console.error('Could not find nasmChapterCatalog export')
    process.exit(1)
  }

  // Extract nasmChapters
  const chaptersMatch = sourceContent.match(
    /export const nasmChapters = (\[[\s\S]*)/
  )
  if (!chaptersMatch) {
    console.error('Could not find nasmChapters export')
    process.exit(1)
  }

  // Parse the catalog
  const catalogData = new Function(`return ${catalogMatch[1]}`)()
  // Parse the chapters - the rest of the file from the match
  const chaptersData = new Function(`return ${chaptersMatch[1]}`)()

  console.log(`找到 ${catalogData.length} 条目录数据`)
  console.log(`找到 ${chaptersData.length} 条章节详情数据`)

  // 1. Write catalog file (lightweight)
  const catalogCode = `// 自动生成，请勿手动修改。\n// 生成命令：node scripts/splitNasmChapters.js\n\nexport const nasmChapterCatalog = ${JSON.stringify(catalogData, null, 2)}\n`
  writeFileSync(CATALOG_OUT, catalogCode, 'utf-8')
  console.log(`已写入目录：${CATALOG_OUT} (${(catalogCode.length / 1024).toFixed(1)}KB)`)

  // 2. Write per-chapter files
  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true })
  }

  for (const chapter of chaptersData) {
    const slug = chapter.slug

    // Prefix quiz question IDs with chapter slug to avoid collisions
    if (chapter.quizQuestions) {
      chapter.quizQuestions = chapter.quizQuestions.map((q, idx) => ({
        ...q,
        id: q.id && !q.id.startsWith(`${slug}-`) ? `${slug}-${q.id}` : q.id,
      }))
    }

    const chapterCode = `// 自动生成，请勿手动修改。\n// 章节：${chapter.title}\n\nexport const chapterDetail = ${JSON.stringify(chapter, null, 2)}\n`
    const filePath = join(OUT_DIR, `${slug}.js`)
    writeFileSync(filePath, chapterCode, 'utf-8')
    console.log(`  ${slug}.js (${(chapterCode.length / 1024).toFixed(1)}KB)`)
  }

  console.log('\n拆分完成。请确认 nasmCatalog.js 已使用轻量目录和分章详情文件。')
}

main().catch(console.error)
