import test from 'node:test'
import assert from 'node:assert/strict'

test('buildAiNewsRequestBody requests JSON output and grounded search tooling', async () => {
  const { buildAiNewsRequestBody } = await import('../../server/aiNewsGemini.js')

  const requestBody = buildAiNewsRequestBody('2026-04-18T08:00:00.000Z')

  assert.equal(requestBody.generationConfig.responseMimeType, 'application/json')
  assert.ok(Array.isArray(requestBody.tools))
  assert.ok(requestBody.tools.some((tool) => tool.googleSearch))

  const schema = requestBody.generationConfig.responseSchema
  assert.equal(schema.type, 'object')
  assert.ok(schema.properties.updatedAt)
  assert.ok(schema.properties.stories)
  assert.deepEqual(schema.required, ['updatedAt', 'stories'])

  const storySchema = schema.properties.stories.items
  assert.equal(storySchema.type, 'object')
  assert.ok(storySchema.properties.title)
  assert.ok(storySchema.properties.summary)
  assert.ok(storySchema.properties.whyItMatters)
  assert.ok(storySchema.properties.sourceLabel)
  assert.ok(storySchema.properties.sourceUrl)
  assert.ok(storySchema.properties.publishedAt)
  assert.deepEqual(storySchema.required, [
    'title',
    'summary',
    'whyItMatters',
    'sourceLabel',
    'sourceUrl',
    'publishedAt',
  ])
})

test('normalizeAiNewsPayload keeps only grounded stories with source fields', async () => {
  const { normalizeAiNewsPayload } = await import('../../server/aiNewsGemini.js')

  const normalized = normalizeAiNewsPayload({
    updatedAt: '2026-04-18T08:00:00.000Z',
    stories: [
      {
        title: 'Grounded story',
        summary: 'A relevant update for readers.',
        whyItMatters: 'It explains a meaningful shift for readers.',
        sourceLabel: 'Reuters',
        sourceUrl: 'https://example.com/reuters-story',
        publishedAt: '2026-04-18T07:30:00.000Z',
      },
      {
        title: 'Unverified story',
        summary: 'This should be dropped.',
        whyItMatters: 'This should be dropped.',
        sourceLabel: 'Rumor blog',
        sourceUrl: 'https://example.com/rumor',
        publishedAt: '2026-04-18T06:30:00.000Z',
      },
      {
        title: 'Missing source story',
        summary: 'This should also be dropped.',
        whyItMatters: 'This should also be dropped.',
        publishedAt: '2026-04-18T06:00:00.000Z',
      },
    ],
  })

  assert.deepEqual(normalized, {
    updatedAt: '2026-04-18T08:00:00.000Z',
    stories: [
      {
        title: 'Grounded story',
        summary: 'A relevant update for readers.',
        whyItMatters: 'It explains a meaningful shift for readers.',
        sourceLabel: 'Reuters',
        sourceUrl: 'https://example.com/reuters-story',
        publishedAt: '2026-04-18T07:30:00.000Z',
      },
    ],
  })
})
