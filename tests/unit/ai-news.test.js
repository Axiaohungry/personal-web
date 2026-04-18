import test from 'node:test'
import assert from 'node:assert/strict'

test('buildAiNewsRequestBody and normalizeAiNewsPayload enforce grounded news contracts', async () => {
  const { buildAiNewsRequestBody, normalizeAiNewsPayload } = await import('../../server/aiNewsGemini.js')

  const requestBody = buildAiNewsRequestBody({
    query: 'fitness AI news',
  })

  assert.equal(requestBody.generationConfig.responseMimeType, 'application/json')
  assert.match(requestBody.systemInstruction.parts[0].text, /grounded/i)
  assert.match(requestBody.contents[0].parts[0].text, /fitness AI news/)

  const normalized = normalizeAiNewsPayload({
    items: [
      {
        title: 'Grounded story',
        summary: 'A relevant update for readers.',
        grounded: true,
        sourceName: 'Reuters',
        sourceUrl: 'https://example.com/reuters-story',
      },
      {
        title: 'Unverified story',
        summary: 'This should be dropped.',
        grounded: false,
        sourceName: 'Rumor blog',
        sourceUrl: 'https://example.com/rumor',
      },
      {
        title: 'Missing source story',
        summary: 'This should also be dropped.',
        grounded: true,
      },
    ],
  })

  assert.deepEqual(normalized, [
    {
      title: 'Grounded story',
      summary: 'A relevant update for readers.',
      grounded: true,
      sourceName: 'Reuters',
      sourceUrl: 'https://example.com/reuters-story',
    },
  ])
})
