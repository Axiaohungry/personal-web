import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { projects } from '../../src/data/projects.js'

test('3dgs project page route, homepage entry, and metadata contract stay aligned', async () => {
  const routerFile = await readFile(new URL('../../src/router/index.js', import.meta.url), 'utf8')
  const metadata = JSON.parse(
    await readFile(new URL('../../public/3dgs/scene-metadata.json', import.meta.url), 'utf8')
  )

  assert.ok(routerFile.includes("path: '/projects/3dgs'"))
  assert.equal(
    projects.find((project) => project.name.includes('3DGS'))?.href,
    '/projects/3dgs'
  )
  assert.equal(metadata.defaultGroup, 'full_zscore')
  assert.equal(metadata.defaultMode, 'thermal')
  assert.deepEqual(
    metadata.groups.map((group) => group.id),
    ['full_zscore', 'full', 'sem_only', 'shadow_only', 'shuffled']
  )
})
