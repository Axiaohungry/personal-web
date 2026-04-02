import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { projects } from '../../src/data/projects.js'

test('3dgs project page route, homepage entry, and metadata contract stay aligned', async () => {
  const routerFile = await readFile(new URL('../../src/router/index.js', import.meta.url), 'utf8')
  const pageFile = await readFile(
    new URL('../../src/views/projects/Project3dgsView.vue', import.meta.url),
    'utf8'
  )
  const metadata = JSON.parse(
    await readFile(new URL('../../public/3dgs/scene-metadata.json', import.meta.url), 'utf8')
  )

  assert.ok(routerFile.includes("path: '/projects/3dgs'"))
  assert.match(pageFile, /Project3dgsLineChart/)
  assert.match(pageFile, /selectedChartMetricKey = ref\('rmse'\)/)
  assert.match(pageFile, /project-3dgs-panel__paired/)
  assert.match(pageFile, /project-3dgs-panel__stack/)
  assert.match(pageFile, /project-3dgs-panel__group--no-divider/)
  assert.match(pageFile, /project-3dgs-group-button--compact/)
  assert.match(pageFile, /project-3dgs-group-button__note/)
  assert.doesNotMatch(pageFile, /project-3dgs-group-button__alias/)
  assert.match(pageFile, /project-3dgs-chart-card/)
  assert.match(pageFile, /project-3dgs-result-list/)
  assert.match(pageFile, /project-3dgs-paper-notes/)
  assert.match(pageFile, /project-3dgs-chart-card[\s\S]*project-3dgs-limit-card/)
  assert.doesNotMatch(pageFile, /先聚焦一个指标，再看不同实验组的变化轨迹/)
  assert.doesNotMatch(pageFile, /手机端可单指旋转、双指缩放/)
  assert.doesNotMatch(pageFile, /主评测口径下的核心结果/)
  assert.doesNotMatch(pageFile, /热场视觉链路/)
  assert.doesNotMatch(pageFile, /交互控制/)
  assert.doesNotMatch(pageFile, /论文里，还有三点我想留下来/)
  assert.doesNotMatch(pageFile, /和论文主结果保持一致/)
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
