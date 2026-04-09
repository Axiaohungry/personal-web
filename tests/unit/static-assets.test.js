import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'
import path from 'node:path'

const publicRoot = path.resolve('public')

async function listPublicFiles(currentDir = publicRoot) {
  const entries = await readdir(currentDir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await listPublicFiles(fullPath))
    } else {
      files.push(path.relative(publicRoot, fullPath).replaceAll('\\', '/'))
    }
  }

  return files
}

test('public directory only keeps 3dgs assets', async () => {
  const files = await listPublicFiles()
  assert.ok(files.length > 0)
  assert.ok(files.every((file) => file.startsWith('3dgs/')))
})
