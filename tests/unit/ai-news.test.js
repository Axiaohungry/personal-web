import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('buildAiNewsRequestBody keeps grounded search tooling and requests Chinese display fields', async () => {
  const { buildAiNewsRequestBody } = await import('../../server/aiNewsGemini.js')

  const requestBody = buildAiNewsRequestBody('2026-04-18T08:00:00.000Z')

  assert.equal(requestBody.generationConfig.temperature, 0.2)
  assert.equal(requestBody.generationConfig.responseMimeType, undefined)
  assert.equal(requestBody.generationConfig.responseJsonSchema, undefined)
  assert.ok(Array.isArray(requestBody.tools))
  assert.ok(requestBody.tools.some((tool) => tool.googleSearch))
  assert.match(requestBody.systemInstruction.parts[0].text, /Chinese/i)
  assert.match(requestBody.contents[0].parts[0].text, /Chinese/i)
})

test('buildAiNewsRequestBody enables schema only for tool-compatible Gemini 3 models', async () => {
  const { buildAiNewsRequestBody } = await import('../../server/aiNewsGemini.js')

  const requestBody = buildAiNewsRequestBody('2026-04-18T08:00:00.000Z', 'gemini-3.0-pro-preview')

  assert.equal(requestBody.generationConfig.responseMimeType, 'application/json')
  assert.equal(requestBody.generationConfig.responseJsonSchema.required.includes('stories'), true)
})

test('handleNodeAiNewsRequest short-circuits HEAD before fetch work', async () => {
  const { handleNodeAiNewsRequest } = await import('../../server/aiNewsGemini.js')

  let fetchCalls = 0
  let ended = false
  const response = {
    statusCode: 0,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value
    },
    end() {
      ended = true
    },
  }

  await handleNodeAiNewsRequest(
    { method: 'HEAD', url: '/api/ai-news' },
    response,
    {
      apiKey: 'test-key',
      fetchImpl: async () => {
        fetchCalls += 1
        throw new Error('should not run')
      },
    }
  )

  assert.equal(fetchCalls, 0)
  assert.equal(ended, true)
  assert.equal(response.statusCode, 200)
  assert.equal(response.headers['Content-Type'], 'application/json; charset=utf-8')
})

test('handleNodeAiNewsRequest reuses the shared TTL cache across repeated GETs', async () => {
  const { handleNodeAiNewsRequest } = await import('../../server/aiNewsGemini.js')

  let fetchCalls = 0
  const responseOne = {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value
    },
    end(payload = '') {
      this.body = payload
      return this
    },
  }

  const responseTwo = {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value
    },
    end(payload = '') {
      this.body = payload
      return this
    },
  }

  const request = { method: 'GET', url: '/api/ai/news-brief' }
  const options = {
    apiKey: 'test-key',
    fetchImpl: async () => {
      fetchCalls += 1
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
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
                    }),
                  },
                ],
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    },
  }

  await handleNodeAiNewsRequest(request, responseOne, options)
  await handleNodeAiNewsRequest(request, responseTwo, options)

  assert.equal(fetchCalls, 1)
  assert.equal(responseOne.statusCode, 200)
  assert.equal(responseTwo.statusCode, 200)
  assert.deepEqual(JSON.parse(responseOne.body), JSON.parse(responseTwo.body))
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

test('fetchAiNewsBrief serves stale cache for retryable upstream errors', async () => {
  const { createAiNewsCache, fetchAiNewsBrief } = await import('../../server/aiNewsGemini.js')

  let currentTime = 1000
  const cache = createAiNewsCache({ ttlMs: 1, now: () => currentTime })
  cache.set({
    updatedAt: '2026-04-18T08:00:00.000Z',
    stories: [
      {
        title: 'Cached story',
        summary: 'Cached summary.',
        whyItMatters: 'Cached reason.',
        sourceLabel: 'Reuters',
        sourceUrl: 'https://example.com/cached-story',
        publishedAt: '2026-04-18T07:30:00.000Z',
      },
    ],
  })
  currentTime = 1005

  const result = await fetchAiNewsBrief({
    apiKey: 'test-key',
    cache,
    fetchImpl: async () => {
      throw new TypeError('fetch failed')
    },
  })

  assert.deepEqual(result, {
    updatedAt: '2026-04-18T08:00:00.000Z',
    stories: [
      {
        title: 'Cached story',
        summary: 'Cached summary.',
        whyItMatters: 'Cached reason.',
        sourceLabel: 'Reuters',
        sourceUrl: 'https://example.com/cached-story',
        publishedAt: '2026-04-18T07:30:00.000Z',
      },
    ],
  })
})

test('fetchAiNewsBrief rejects malformed upstream payloads with a stable fallback message', async () => {
  const { createAiNewsCache, fetchAiNewsBrief } = await import('../../server/aiNewsGemini.js')

  let currentTime = 1000
  const cache = createAiNewsCache({ ttlMs: 1, now: () => currentTime })
  cache.set({
    updatedAt: '2026-04-18T08:00:00.000Z',
    stories: [
      {
        title: 'Cached story',
        summary: 'Cached summary.',
        whyItMatters: 'Cached reason.',
        sourceLabel: 'Reuters',
        sourceUrl: 'https://example.com/cached-story',
        publishedAt: '2026-04-18T07:30:00.000Z',
      },
    ],
  })
  currentTime = 1005

  await assert.rejects(
    () =>
      fetchAiNewsBrief({
        apiKey: 'test-key',
        cache,
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: 'not-json',
                      },
                    ],
                  },
                },
              ],
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          ),
      }),
    /Unable to refresh AI news right now\./
  )
})

test('fetchAiNewsBrief throws a stable fallback message without stale cache', async () => {
  const { fetchAiNewsBrief } = await import('../../server/aiNewsGemini.js')

  await assert.rejects(
    () =>
      fetchAiNewsBrief({
        apiKey: 'test-key',
        fetchImpl: async () => {
          throw new TypeError('fetch failed')
        },
      }),
    /Unable to refresh AI news right now\./
  )
})

test('AI news brief keeps actions in the header and stacks story cards below', async () => {
  const componentFile = await readFile(new URL('../../src/components/AiNewsBrief.vue', import.meta.url), 'utf8')
  const styleFile = await readFile(new URL('../../src/styles/home.css', import.meta.url), 'utf8')

  assert.match(componentFile, /ai-news-brief__header[\s\S]*ai-news-brief__actions[\s\S]*ai-news-brief__stories/)
  assert.match(styleFile, /\.ai-news-brief__header\s*\{[\s\S]*justify-content:\s*space-between;/)
  assert.match(styleFile, /\.ai-news-brief__stories\s*\{[^}]*flex-direction:\s*column;/)
  assert.doesNotMatch(styleFile, /\.ai-news-brief__stories\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/)
})

test('handleNodeAiNewsRequest includes upstream details in local debug mode', async () => {
  const { createAiNewsCache, handleNodeAiNewsRequest } = await import('../../server/aiNewsGemini.js')

  const response = {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value
    },
    end(payload = '') {
      this.body = payload
      return this
    },
  }

  await handleNodeAiNewsRequest(
    {
      method: 'GET',
      url: '/api/ai/news-brief?nowIso=2026-04-20T00%3A00%3A00.000Z',
    },
    response,
    {
      apiKey: 'test-key',
      model: 'gemma-4-31b-it',
      debugUpstreamErrors: true,
      cache: createAiNewsCache(),
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            error: {
              code: 429,
              message: 'Your prepayment credits are depleted.',
              status: 'RESOURCE_EXHAUSTED',
            },
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        ),
    }
  )

  assert.equal(response.statusCode, 502)
  assert.deepEqual(JSON.parse(response.body), {
    error: 'Unable to refresh AI news right now.',
    upstreamStatus: 429,
    upstreamError: 'Your prepayment credits are depleted.',
    model: 'gemma-4-31b-it',
  })
})

test('handleNodeAiNewsRequest accepts Gemma news JSON wrapped in prose and common alias fields', async () => {
  const { createAiNewsCache, handleNodeAiNewsRequest } = await import('../../server/aiNewsGemini.js')

  let capturedRequest = null
  const response = {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value
    },
    end(payload = '') {
      this.body = payload
      return this
    },
  }

  await handleNodeAiNewsRequest(
    {
      method: 'GET',
      url: '/api/ai/news-brief?nowIso=2026-04-20T00%3A00%3A00.000Z',
    },
    response,
    {
      apiKey: 'test-key',
      model: 'gemma-4-26b-a4b-it',
      cache: createAiNewsCache(),
      fetchImpl: async (url, init) => {
        capturedRequest = { url, init }

        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: [
                        'I found the following grounded stories:',
                        '{',
                        '  "updated_at": "2026-04-20T00:00:00.000Z",',
                        '  "articles": [',
                        '    {',
                        '      "title": "Open model update",',
                        '      "summary": "A lab released a model update for developers.",',
                        '      "why_it_matters": "It changes how small teams prototype AI features.",',
                        '      "source": "Google AI",',
                        '      "url": "https://example.com/open-model-update",',
                        '      "date": "2026-04-19T12:00:00.000Z",',
                        '    }',
                        '  ],',
                        '}',
                      ].join('\n'),
                    },
                  ],
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      },
    }
  )

  const requestBody = JSON.parse(capturedRequest.init.body)
  assert.equal(requestBody.generationConfig.responseMimeType, undefined)
  assert.equal(requestBody.generationConfig.responseJsonSchema, undefined)
  assert.deepEqual(requestBody.generationConfig.thinkingConfig, {
    thinkingLevel: 'high',
  })

  assert.equal(response.statusCode, 200)
  assert.deepEqual(JSON.parse(response.body), {
    updatedAt: '2026-04-20T00:00:00.000Z',
    stories: [
      {
        title: 'Open model update',
        summary: 'A lab released a model update for developers.',
        whyItMatters: 'It changes how small teams prototype AI features.',
        sourceLabel: 'Google AI',
        sourceUrl: 'https://example.com/open-model-update',
        publishedAt: '2026-04-19T12:00:00.000Z',
      },
    ],
  })
})

test('handleNodeAiNewsRequest prefers the final grounded JSON over prompt example JSON embedded in reasoning', async () => {
  const { createAiNewsCache, handleNodeAiNewsRequest } = await import('../../server/aiNewsGemini.js')

  const response = {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value
    },
    end(payload = '') {
      this.body = payload
      return this
    },
  }

  await handleNodeAiNewsRequest(
    {
      method: 'GET',
      url: '/api/ai/news-brief?nowIso=2026-04-20T08%3A00%3A00.000Z',
    },
    response,
    {
      apiKey: 'test-key',
      model: 'gemma-4-31b-it',
      cache: createAiNewsCache(),
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: [
                        'Thinking about the request.',
                        'Use this JSON shape as a guide:',
                        '{"updatedAt":"ISO-8601 string","stories":[{"title":"","summary":"","whyItMatters":"","sourceLabel":"","sourceUrl":"","publishedAt":"ISO-8601 string"}]}',
                        'Now here is the grounded result:',
                        '{"updatedAt":"2026-04-20T15:02:00Z","stories":[{"title":"Anthropic 发布 Claude Opus 4.7","summary":"Anthropic 于 4 月 16 日推出 Claude Opus 4.7。","whyItMatters":"说明模型在专业技术任务上的自主性继续提升。","sourceLabel":"Anthropic","sourceUrl":"https://www.anthropic.com/news/claude-opus-4-7","publishedAt":"2026-04-16T00:00:00Z"}]}',
                      ].join('\n'),
                    },
                  ],
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        ),
    }
  )

  assert.equal(response.statusCode, 200)
  assert.deepEqual(JSON.parse(response.body), {
    updatedAt: '2026-04-20T15:02:00Z',
    stories: [
      {
        title: 'Anthropic 发布 Claude Opus 4.7',
        summary: 'Anthropic 于 4 月 16 日推出 Claude Opus 4.7。',
        whyItMatters: '说明模型在专业技术任务上的自主性继续提升。',
        sourceLabel: 'Anthropic',
        sourceUrl: 'https://www.anthropic.com/news/claude-opus-4-7',
        publishedAt: '2026-04-16T00:00:00Z',
      },
    ],
  })
})
