import test from 'node:test'
import assert from 'node:assert/strict'

test('buildAiNewsRequestBody requests JSON output and grounded search tooling', async () => {
  const { buildAiNewsRequestBody } = await import('../../server/aiNewsGemini.js')

  const requestBody = buildAiNewsRequestBody('2026-04-18T08:00:00.000Z')

  assert.equal(requestBody.generationConfig.responseMimeType, 'application/json')
  assert.deepEqual(requestBody.generationConfig.responseJsonSchema.properties.stories.maxItems, 3)
  assert.ok(Array.isArray(requestBody.tools))
  assert.ok(requestBody.tools.some((tool) => tool.googleSearch))
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
        title: 'Second grounded story',
        summary: 'This should stay and prove trimming.',
        whyItMatters: 'It is also valid and should remain until the cap.',
        sourceLabel: 'The Verge',
        sourceUrl: 'https://example.com/the-verge-story',
        publishedAt: '2026-04-18T06:00:00.000Z',
      },
      {
        title: 'Third grounded story',
        summary: 'This should stay as the third item.',
        whyItMatters: 'It is valid and should remain.',
        sourceLabel: 'AP News',
        sourceUrl: 'https://example.com/ap-story',
        publishedAt: '2026-04-18T05:30:00.000Z',
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
      {
        title: 'Second grounded story',
        summary: 'This should stay and prove trimming.',
        whyItMatters: 'It is also valid and should remain until the cap.',
        sourceLabel: 'The Verge',
        sourceUrl: 'https://example.com/the-verge-story',
        publishedAt: '2026-04-18T06:00:00.000Z',
      },
      {
        title: 'Third grounded story',
        summary: 'This should stay as the third item.',
        whyItMatters: 'It is valid and should remain.',
        sourceLabel: 'AP News',
        sourceUrl: 'https://example.com/ap-story',
        publishedAt: '2026-04-18T05:30:00.000Z',
      },
    ],
  })
})

test('fetchAiNewsBrief throws a stable fallback message without stale cache', async () => {
  const { fetchAiNewsBrief } = await import('../../server/aiNewsGemini.js')

  await assert.rejects(
    () =>
      fetchAiNewsBrief({
        apiKey: 'test-key',
        fetchImpl: async () =>
          new Response('upstream exploded', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' },
          }),
      }),
    /Unable to refresh AI news right now\./
  )
})
