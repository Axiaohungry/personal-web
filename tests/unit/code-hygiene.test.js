import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const activeRoots = ['server', 'src', 'api', 'tests']
const codeExtensions = new Set(['.js', '.vue', '.css'])

async function walk(dir, files = []) {
  const { readdir } = await import('node:fs/promises')
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(fullPath, files)
      continue
    }

    if (codeExtensions.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

function collectEnglishComments(text) {
  const lines = text.split(/\r?\n/)
  const findings = []

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim()
    if (!trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('<!--')) {
      continue
    }

    const body = trimmed
      .replace(/^\/\/\s?/, '')
      .replace(/^\/\*+\s?/, '')
      .replace(/^<!--\s?/, '')
      .replace(/\*\/$/, '')
      .replace(/-->$/, '')
      .trim()

    if (!body) continue

    if (/[A-Za-z]{3,}/.test(body) && !/[\u4e00-\u9fff]/.test(body)) {
      findings.push({ line: index + 1, body })
    }
  }

  return findings
}

test('active app code comments use simplified Chinese instead of English notes', async () => {
  const files = (
    await Promise.all(
      activeRoots.map(async (root) => {
        return walk(path.join(projectRoot, root))
      })
    )
  ).flat()

  const findings = []

  for (const file of files) {
    const text = await readFile(file, 'utf8')
    for (const finding of collectEnglishComments(text)) {
      findings.push(`${path.relative(projectRoot, file)}:${finding.line}: ${finding.body}`)
    }
  }

  assert.deepEqual(findings, [])
})

test('runtime code no longer keeps the confirmed redundant exports and helpers', async () => {
  const checks = [
    {
      file: 'server/fitnessAssistantGemini.js',
      pattern: /\bnormalizeFitnessAssistantPayload\b/,
    },
    {
      file: 'src/data/foodLibraryCatalog.js',
      pattern: /\bfoodMealTemplates\b/,
    },
    {
      file: 'src/views/government-approval/components/PagePreview.vue',
      pattern: /\bfunction controlLabel\s*\(/,
    },
    {
      file: 'src/views/government-approval/data/approvalPageCatalog.js',
      pattern: /\bapprovalCategoryOptions\b/,
    },
  ]

  for (const check of checks) {
    const text = await readFile(path.join(projectRoot, check.file), 'utf8')
    assert.equal(check.pattern.test(text), false, `${check.file} still contains redundant code`)
  }

  await assert.rejects(
    () => access(path.join(projectRoot, 'src/data/futureModules.js'), fsConstants.F_OK)
  )
})
