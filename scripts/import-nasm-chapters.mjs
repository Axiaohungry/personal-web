import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const sourceDir =
  process.env.NASM_SOURCE_DIR ??
  'E:\\BaiduNetdiskDownload\\NSCA第三版教材按章节拆分\\outputs\\chapters'
const docsDir = path.join(repoRoot, 'docs', 'study', 'nasm', 'chapters')
const generatedDir = path.join(repoRoot, 'src', 'data', 'study', 'generated')
const generatedFile = path.join(generatedDir, 'nasmChapters.js')

const HEADING_RE = /^(#{1,6})\s+(.*)$/
const BULLET_RE = /^(\s*)[-*]\s+(.*)$/

function normalizeLine(line) {
  return line.replace(/\uFEFF/g, '').trimEnd()
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stripHeadingNumber(value) {
  return value
    .replace(/^[A-Z]\.\s*/i, '')
    .replace(/^\d+([.)]|[.:：])\s*/, '')
    .trim()
}

function collectBullets(lines) {
  return lines
    .map((line) => normalizeLine(line))
    .filter(Boolean)
    .filter((line) => BULLET_RE.test(line))
    .map((line) => line.replace(BULLET_RE, '$2').trim())
}

function collectParagraphs(lines) {
  return lines
    .map((line) => normalizeLine(line))
    .filter(Boolean)
    .filter((line) => !HEADING_RE.test(line))
    .filter((line) => !BULLET_RE.test(line))
}

function getHeadingBlocks(lines) {
  const headings = []

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(HEADING_RE)
    if (!match) {
      continue
    }

    headings.push({
      index,
      depth: match[1].length,
      text: match[2].trim(),
    })
  }

  return headings
}

function findOutlineHeading(headings) {
  return headings.find((heading) => /markdown/i.test(heading.text))
}

function findQuizStartIndex(headings, lines) {
  const questionHeading = headings.find(
    (heading) => heading.depth === 3 && /^[A-Z]\./i.test(heading.text)
  )

  if (questionHeading) {
    return questionHeading.index
  }

  const quizSection = headings.find((heading) =>
    /quiz|question|练习|习题|测试|题目|复习|思考/i.test(heading.text)
  )

  if (quizSection) {
    return quizSection.index
  }

  const fallbackIndex = lines.findIndex((line) => /^###\s+\d+/.test(line))
  return fallbackIndex === -1 ? lines.length : fallbackIndex
}

function buildOutline(lines, outlineHeading, quizStartIndex) {
  if (!outlineHeading) {
    return []
  }

  const nextHeadingIndex = lines
    .slice(outlineHeading.index + 1)
    .findIndex((line) => /^##\s+/.test(line))
  const endIndex =
    nextHeadingIndex === -1
      ? quizStartIndex
      : Math.min(outlineHeading.index + 1 + nextHeadingIndex, quizStartIndex)

  const bulletLines = collectBullets(lines.slice(outlineHeading.index + 1, endIndex))
  return bulletLines
}

function extractKnowledgeSections(lines, headings, boundaryIndex) {
  const sectionHeadings = headings.filter(
    (heading) => heading.depth === 3 && heading.index < boundaryIndex
  )

  const sections = []

  for (let index = 0; index < sectionHeadings.length; index += 1) {
    const heading = sectionHeadings[index]
    const nextHeading = sectionHeadings[index + 1]
    const endIndex = nextHeading ? nextHeading.index : boundaryIndex
    const bodyLines = lines.slice(heading.index + 1, endIndex)
    const bullets = collectBullets(bodyLines)
    const paragraphs = collectParagraphs(bodyLines)
    const summary = paragraphs[0] ?? bullets.slice(0, 2).join(' ')

    if (!summary && bullets.length === 0) {
      continue
    }

    sections.push({
      key: slugify(stripHeadingNumber(heading.text)) || `section-${index + 1}`,
      title: stripHeadingNumber(heading.text) || `Section ${index + 1}`,
      summary: summary || '本章内容整理中。',
      bullets: bullets.slice(0, 8),
    })
  }

  if (sections.length > 0) {
    return sections
  }

  const fallbackBullets = collectBullets(lines.slice(0, boundaryIndex)).slice(0, 8)
  const fallbackParagraphs = collectParagraphs(lines.slice(0, boundaryIndex))

  return [
    {
      key: 'core-points',
      title: '核心知识点',
      summary:
        fallbackParagraphs[0] ??
        fallbackBullets.slice(0, 2).join(' ') ??
        '当前章节保留原文，待后续精修。',
      bullets: fallbackBullets,
    },
  ]
}

function extractQuizQuestions(lines, headings, quizStartIndex, knowledgeSections) {
  const questionHeadings = headings.filter(
    (heading) => heading.depth === 3 && heading.index >= quizStartIndex
  )

  const questions = questionHeadings
    .map((heading, index) => {
      const nextHeading = questionHeadings[index + 1]
      const bodyLines = lines.slice(
        heading.index + 1,
        nextHeading ? nextHeading.index : lines.length
      )
      const bullets = collectBullets(bodyLines)
      const paragraphs = collectParagraphs(bodyLines)

      return {
        prompt: stripHeadingNumber(heading.text),
        answerPoints: bullets.length > 0 ? bullets.slice(0, 6) : paragraphs.slice(0, 3),
      }
    })
    .filter((question) => question.prompt)

  if (questions.length > 0) {
    return questions
  }

  return knowledgeSections.slice(0, 5).map((section) => ({
    prompt: `${section.title} 里最值得复习的是什么？`,
    answerPoints:
      section.bullets.length > 0
        ? section.bullets.slice(0, 4)
        : [section.summary || '回看章节原文并整理关键词。'],
  }))
}

export function parseChapterMarkdown(raw, filename) {
  const lines = raw.split(/\r?\n/).map(normalizeLine)
  const headings = getHeadingBlocks(lines)
  const firstHeading = headings.find((heading) => heading.depth === 1)
  const outlineHeading = findOutlineHeading(headings)
  const outlineIndex = outlineHeading ? outlineHeading.index : lines.length
  const quizStartIndex = findQuizStartIndex(headings, lines)
  const contentBoundary = Math.min(outlineIndex, quizStartIndex)

  const knowledgeSections = extractKnowledgeSections(lines, headings, contentBoundary)
  const outline = buildOutline(lines, outlineHeading, quizStartIndex)
  const quizQuestions = extractQuizQuestions(
    lines,
    headings,
    quizStartIndex,
    knowledgeSections
  )
  const summarySource =
    knowledgeSections[0]?.summary ||
    collectParagraphs(lines).find(Boolean) ||
    collectBullets(lines).slice(0, 2).join(' ')

  return {
    slug: path.basename(filename, path.extname(filename)),
    title: firstHeading?.text?.trim() || path.basename(filename, path.extname(filename)),
    summary: summarySource || '章节摘要待补充。',
    knowledgeSections,
    outline,
    quizQuestions,
  }
}

function toGeneratedModule(chapters) {
  return `export const nasmChapters = ${JSON.stringify(chapters, null, 2)}\n`
}

async function main() {
  await mkdir(docsDir, { recursive: true })
  await mkdir(generatedDir, { recursive: true })

  const filenames = (await readdir(sourceDir))
    .filter((filename) => /^ch\d+\.md$/i.test(filename))
    .sort((left, right) => left.localeCompare(right))

  const chapters = []

  for (const filename of filenames) {
    const sourcePath = path.join(sourceDir, filename)
    const targetPath = path.join(docsDir, filename)
    const raw = await readFile(sourcePath, 'utf8')
    const parsed = parseChapterMarkdown(raw, filename)

    await writeFile(targetPath, raw, 'utf8')
    chapters.push(parsed)
  }

  await writeFile(generatedFile, toGeneratedModule(chapters), 'utf8')
  console.log(`Imported ${chapters.length} NASM chapters into repo-local study data.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
