import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const sourceDir =
  process.env.NASM_SOURCE_DIR ??
  'E:\\BaiduNetdiskDownload\\NSCA教材\\outputs\\chapters'
const docsDir = path.join(repoRoot, 'docs', 'study', 'nasm', 'chapters')
const generatedDir = path.join(repoRoot, 'src', 'data', 'study', 'generated')
const generatedFile = path.join(generatedDir, 'nasmChapters.js')

const HEADING_RE = /^(#{1,6})\s+(.*)$/
const BULLET_RE = /^(\s*)[-*]\s+(.*)$/
const NUMBERED_PROMPT_RE = /^\s*\d+(?:[.)]|[．、:：])\s*/
const OPTION_RE = /^\s*([A-Z])(?:[.)]|[．、:：])\s*(.*)$/

function normalizeLine(line) {
  return line.replace(/\uFEFF/g, '').trimEnd()
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stripHeadingNumber(value = '') {
  return value
    .replace(/^[A-Z]\.\s*/i, '')
    .replace(/^\d+([.)]|[.:：])\s*/, '')
    .trim()
}

function createQuestionKey(prefix, index) {
  return `${prefix}-${String(index + 1).padStart(2, '0')}`
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
  const quizHeading = headings.find((heading) => /quiz|question|题|测验|练习/i.test(heading.text))

  if (quizHeading) {
    return quizHeading.index
  }

  const numberedHeading = headings.find(
    (heading) => heading.depth === 3 && NUMBERED_PROMPT_RE.test(heading.text)
  )

  if (numberedHeading) {
    return numberedHeading.index
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

  return collectBullets(lines.slice(outlineHeading.index + 1, endIndex))
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
      summary: summary || 'Chapter summary pending.',
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
      title: 'Core points',
      summary:
        fallbackParagraphs[0] ??
        fallbackBullets.slice(0, 2).join(' ') ??
        'Chapter summary pending.',
      bullets: fallbackBullets,
    },
  ]
}

function parseQuizAnswerPoints(question, answerPoints = [], index = 0) {
  const lines = answerPoints.map((line) => normalizeLine(line)).filter(Boolean)
  const promptLine = lines.find((line) => NUMBERED_PROMPT_RE.test(line)) ?? lines[0] ?? question.prompt
  const optionLines = lines.filter((line) => OPTION_RE.test(line))
  const explanationLines = lines.filter(
    (line) => line !== promptLine && !optionLines.includes(line)
  )

  return {
    id: createQuestionKey('nasm-question', index),
    prompt: stripHeadingNumber(promptLine || question.prompt),
    options: optionLines.map((line, optionIndex) => {
      const match = line.match(OPTION_RE)

      return {
        key: match?.[1]
          ? `choice-${match[1].toLowerCase()}`
          : createQuestionKey('choice', optionIndex),
        label: match?.[2]?.trim() ?? line,
      }
    }),
    explanation:
      explanationLines.join(' ') ||
      [question.prompt, ...optionLines].filter(Boolean).join(' '),
  }
}

function parseQuizQuestionGroups(question, answerPoints = [], sectionIndex = 0) {
  const lines = answerPoints.map((line) => normalizeLine(line)).filter(Boolean)
  const groups = []
  let currentGroup = []

  for (const line of lines) {
    if (NUMBERED_PROMPT_RE.test(line) && currentGroup.length > 0) {
      groups.push(currentGroup)
      currentGroup = [line]
      continue
    }

    currentGroup.push(line)
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  const parsedGroups = groups
    .map((groupLines, groupIndex) =>
      parseQuizAnswerPoints(question, groupLines, sectionIndex * 10 + groupIndex)
    )
    .filter((entry) => entry.options.length > 0)

  if (parsedGroups.length > 0) {
    return parsedGroups
  }

  return [parseQuizAnswerPoints(question, lines, sectionIndex)].filter(
    (entry) => entry.options.length > 0
  )
}

function extractQuizQuestions(lines, headings, quizStartIndex, knowledgeSections) {
  const questionHeadings = headings.filter(
    (heading) => heading.depth === 3 && heading.index >= quizStartIndex
  )

  const questions = questionHeadings
    .flatMap((heading, index) => {
      const nextHeading = questionHeadings[index + 1]
      const bodyLines = lines.slice(
        heading.index + 1,
        nextHeading ? nextHeading.index : lines.length
      )
      const bullets = collectBullets(bodyLines)
      const paragraphs = collectParagraphs(bodyLines)

      return parseQuizQuestionGroups(
        {
          prompt: stripHeadingNumber(heading.text),
        },
        bullets.length > 0 ? bullets : paragraphs,
        index
      )
    })
    .filter((question) => question.prompt && question.options.length > 0)

  if (questions.length > 0) {
    return questions
  }

  return knowledgeSections.slice(0, 5).map((section, index) => ({
    id: createQuestionKey('nasm-fallback', index),
    prompt: `${section.title} review check`,
    options: (section.bullets.length > 0 ? section.bullets.slice(0, 2) : [section.summary])
      .filter(Boolean)
      .map((label, optionIndex) => ({
        key: createQuestionKey('choice', optionIndex),
        label,
      })),
    explanation: section.summary || section.bullets.join(' '),
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
  const quizQuestions = extractQuizQuestions(lines, headings, quizStartIndex, knowledgeSections)
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

function buildChapterCatalog(chapters) {
  return chapters.map((chapter, index) => ({
    slug: chapter.slug,
    order: index + 1,
    title: chapter.title,
    summary: chapter.summary,
    knowledgeSectionCount: chapter.knowledgeSections.length,
    quizQuestionCount: chapter.quizQuestions.length,
  }))
}

function toGeneratedModule(chapters) {
  const chapterCatalog = buildChapterCatalog(chapters)

  return [
    `export const nasmChapterCatalog = ${JSON.stringify(chapterCatalog, null, 2)}`,
    `export const nasmChapters = ${JSON.stringify(chapters, null, 2)}`,
    '',
  ].join('\n')
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

function isDirectExecution() {
  if (!process.argv[1]) {
    return false
  }

  return import.meta.url === pathToFileURL(process.argv[1]).href
}

if (isDirectExecution()) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
