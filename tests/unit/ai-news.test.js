import test from 'node:test'
import assert from 'node:assert/strict'

test('buildAiNewsRequestBody uses nowIso and normalizeAiNewsPayload keeps stories centered', async () => {
  const { buildAiNewsRequestBody, normalizeAiNewsPayload } = await import('../../server/aiNewsGemini.js')

  const nowIso = '2026-04-18T08:00:00.000Z'
  const requestBody = buildAiNewsRequestBody(nowIso)

  assert.equal(requestBody.generationConfig.responseMimeType, 'application/json')
  assert.match(requestBody.systemInstruction.parts[0].text, /updatedAt/i)
  assert.match(requestBody.contents[0].parts[0].text, /2026-04-18T08:00:00\.000Z/)

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
