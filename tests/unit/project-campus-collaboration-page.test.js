import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

import { campusCollaborationCase } from '../../src/data/projectCases/campusCollaboration.js'

function countOccurrences(source, needle) {
  return (source.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length
}

function getBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker)
  const end = endMarker ? source.indexOf(endMarker, start + startMarker.length) : source.length

  assert.ok(start >= 0, `missing block start: ${startMarker}`)
  assert.ok(end > start, `missing block end after: ${startMarker}`)

  return source.slice(start, end)
}

test('campus collaboration page locks the refreshed stage structure', async () => {
  const viewFile = await readFile(
    new URL('../../src/views/projects/ProjectCampusCollaborationView.vue', import.meta.url),
    'utf8'
  )

  assert.ok(viewFile.includes('ProjectCaseShell'))
  assert.ok(viewFile.includes('ProjectCaseSection'))
  assert.ok(viewFile.includes('ProjectEvidenceGrid'))
  assert.equal(countOccurrences(viewFile, '<ProjectCaseSection'), 6)
  assert.equal(countOccurrences(viewFile, 'variant="bare"'), 2)
  assert.equal(countOccurrences(viewFile, 'variant="panel"'), 2)
  assert.equal(countOccurrences(viewFile, 'variant="proof"'), 2)

  const stageMarkers = [
    'page.positioningSection',
    'page.leadCaseSection',
    'page.processSection',
    'page.supportingSection',
    'page.evidenceSection',
    'page.outcomesSection',
  ]

  const stageOffsets = stageMarkers.map((marker) => viewFile.indexOf(marker))
  for (const [index, offset] of stageOffsets.entries()) {
    assert.ok(offset >= 0, `missing stage marker: ${stageMarkers[index]}`)
  }

  for (let index = 1; index < stageOffsets.length; index += 1) {
    assert.ok(stageOffsets[index - 1] < stageOffsets[index], `${stageMarkers[index - 1]} should come before ${stageMarkers[index]}`)
  }

  const positioningBlock = getBlock(viewFile, ':eyebrow="page.positioningSection.eyebrow"', ':eyebrow="page.leadCaseSection.eyebrow"')
  const leadBlock = getBlock(viewFile, ':eyebrow="page.leadCaseSection.eyebrow"', ':eyebrow="page.processSection.eyebrow"')
  const supportingBlock = getBlock(viewFile, ':eyebrow="page.supportingSection.eyebrow"', ':eyebrow="page.evidenceSection.eyebrow"')
  const evidenceBlock = getBlock(viewFile, ':eyebrow="page.evidenceSection.eyebrow"', ':eyebrow="page.outcomesSection.eyebrow"')
  const outcomesBlock = getBlock(viewFile, ':eyebrow="page.outcomesSection.eyebrow"')

  assert.ok(positioningBlock.includes('variant="bare"'))
  assert.ok(positioningBlock.includes('positioningKicker'))
  assert.ok(leadBlock.includes('variant="panel"'))
  assert.ok(leadBlock.includes('project-case-campus__lead-title'))
  assert.ok(leadBlock.includes('{{ page.leadCase.title }}'))
  assert.ok(supportingBlock.includes('variant="proof"'))
  assert.ok(evidenceBlock.includes('variant="proof"'))
  assert.ok(evidenceBlock.includes('ProjectEvidenceGrid'))
  assert.ok(outcomesBlock.includes('variant="bare"'))
  assert.ok(outcomesBlock.includes('outcomesCapabilitiesKicker'))

  assert.equal(typeof campusCollaborationCase.leadCase.title, 'string')
  assert.ok(campusCollaborationCase.leadCase.title.trim().length > 0)
  assert.ok(campusCollaborationCase.hero.signals.length >= 3)
  assert.ok(campusCollaborationCase.leadCase.highlights.length >= 3)
  assert.ok(campusCollaborationCase.supportingCases.length >= 2)

  for (const item of campusCollaborationCase.evidence) {
    assert.equal(typeof item.src, 'string')
    assert.ok(item.src.trim().length > 0)
    await access(new URL(`../../public${item.src}`, import.meta.url))
  }
})
