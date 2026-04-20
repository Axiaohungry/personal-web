import test from 'node:test'
import assert from 'node:assert/strict'

import {
  fetchFoodResults,
  fetchSupplementResults,
  handleNodeSearchRequest,
} from '../../server/fitnessGemini.js'

test('fetchFoodResults calls Gemini JSON mode and normalizes 100g rows', async () => {
  let capturedRequest = null

  const rows = await fetchFoodResults('香蕉', {
    apiKey: 'test-key',
    fetchImpl: async (url, init) => {
      capturedRequest = { url, init }

      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      items: [
                        {
                          name: '香蕉',
                          calories: 89,
                          carbs: 22.8,
                          protein: 1.1,
                          fat: 0.3,
                          scene: '训练前快速补碳',
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
  })

  assert.equal(
    capturedRequest.url,
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
  )
  assert.equal(capturedRequest.init.method, 'POST')
  assert.equal(capturedRequest.init.headers['Content-Type'], 'application/json')
  assert.equal(capturedRequest.init.headers['x-goog-api-key'], 'test-key')

  const requestBody = JSON.parse(capturedRequest.init.body)
  assert.equal(requestBody.generationConfig.responseMimeType, 'application/json')
  assert.match(requestBody.contents[0].parts[0].text, /香蕉/)

  assert.deepEqual(rows, [
    {
      name: '香蕉 100g',
      calories: 89,
      carbs: 22.8,
      protein: 1.1,
      fat: 0.3,
      scene: '训练前快速补碳',
    },
  ])
})

test('fetchSupplementResults parses fenced JSON payloads and normalizes aliases', async () => {
  const rows = await fetchSupplementResults('肌酸', {
    apiKey: 'test-key',
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: [
                      '```json',
                      JSON.stringify({
                        items: [
                          {
                            supplement: '肌酸一水合物',
                            commonDose: '3-5g / 天',
                            scenario: '力量训练与增肌期',
                          },
                        ],
                      }),
                      '```',
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
  })

  assert.deepEqual(rows, [
    {
      name: '肌酸一水合物',
      dose: '3-5g / 天',
      bestFor: '力量训练与增肌期',
    },
  ])
})

test('fetchFoodResults rejects missing Gemini credentials', async () => {
  await assert.rejects(
    () => fetchFoodResults('鸡胸肉', { apiKey: '' }),
    /GEMINI_API_KEY/
  )
})

test('handleNodeSearchRequest exposes upstream details only when local debug is enabled', async () => {
  const createResponse = () => ({
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
  })

  const fetchImpl = async () =>
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
    )

  const productionResponse = createResponse()
  await handleNodeSearchRequest(
    {
      method: 'GET',
      url: '/api/fitness/food-search?q=banana',
    },
    productionResponse,
    'food',
    {
      apiKey: 'test-key',
      fetchImpl,
      model: 'gemma-4-31b-it',
    }
  )

  assert.equal(productionResponse.statusCode, 502)
  assert.deepEqual(JSON.parse(productionResponse.body), {
    error: 'Gemini request failed.',
  })

  const debugResponse = createResponse()
  await handleNodeSearchRequest(
    {
      method: 'GET',
      url: '/api/fitness/food-search?q=banana',
    },
    debugResponse,
    'food',
    {
      apiKey: 'test-key',
      fetchImpl,
      model: 'gemma-4-31b-it',
      debugUpstreamErrors: true,
    }
  )

  assert.equal(debugResponse.statusCode, 502)
  assert.deepEqual(JSON.parse(debugResponse.body), {
    error: 'Gemini request failed.',
    upstreamStatus: 429,
    upstreamError: 'Your prepayment credits are depleted.',
    model: 'gemma-4-31b-it',
  })
})

test('handleNodeSearchRequest reports local debug details for network failures before Gemini responds', async () => {
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

  await handleNodeSearchRequest(
    {
      method: 'GET',
      url: '/api/fitness/supplement-search?q=creatine',
    },
    response,
    'supplement',
    {
      apiKey: 'test-key',
      model: 'gemma-4-31b-it',
      debugUpstreamErrors: true,
      fetchImpl: async () => {
        throw new TypeError('fetch failed')
      },
    }
  )

  assert.equal(response.statusCode, 502)
  assert.deepEqual(JSON.parse(response.body), {
    error: 'Gemini request failed.',
    upstreamError: 'Network request failed before a Gemini response was received.',
    model: 'gemma-4-31b-it',
  })
})

test('fetchSupplementResults tolerates Gemma prose, trailing commas, and omits unsupported structured config', async () => {
  let capturedRequest = null

  const rows = await fetchSupplementResults('creatine', {
    apiKey: 'test-key',
    model: 'gemma-4-26b-a4b-it',
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
                      'Here is the JSON:',
                      '{',
                      '  "items": [',
                      '    { "name": "Creatine monohydrate", "dosage": "3-5g/day", "use_case": "Strength training and muscle gain", },',
                      '  ],',
                      '}',
                      'Hope this helps.',
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
  })

  const requestBody = JSON.parse(capturedRequest.init.body)
  assert.equal(
    capturedRequest.url,
    'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent'
  )
  assert.equal(requestBody.generationConfig.responseMimeType, undefined)
  assert.equal(requestBody.generationConfig.responseJsonSchema, undefined)
  assert.deepEqual(requestBody.generationConfig.thinkingConfig, {
    thinkingLevel: 'high',
  })

  assert.deepEqual(rows, [
    {
      name: 'Creatine monohydrate',
      dose: '3-5g/day',
      bestFor: 'Strength training and muscle gain',
    },
  ])
})

test('fetchSupplementResults falls back to parsing Gemma markdown bullet lists when no JSON is returned', async () => {
  const rows = await fetchSupplementResults('creatine', {
    apiKey: 'test-key',
    model: 'gemma-4-26b-a4b-it',
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: [
                      '*   User query: creatine',
                      '*   Results:',
                      '*   Supplement: Creatine monohydrate',
                      '    *   Common dose: 3-5g/day',
                      '    *   Use case: Strength training and muscle gain',
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
  })

  assert.deepEqual(rows, [
    {
      name: 'Creatine monohydrate',
      dose: '3-5g/day',
      bestFor: 'Strength training and muscle gain',
    },
  ])
})

test('fetchFoodResults falls back to parsing Gemma markdown nutrition lists with units', async () => {
  const rows = await fetchFoodResults('banana', {
    apiKey: 'test-key',
    model: 'gemma-4-26b-a4b-it',
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: [
                      '*   User query: banana',
                      '*   Results:',
                      '*   Food: Banana',
                      '    *   Calories: 89 kcal',
                      '    *   Carbs: 22.8 g',
                      '    *   Protein: 1.1 g',
                      '    *   Fat: 0.3 g',
                      '    *   Use case: Pre-workout carbohydrate',
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
  })

  assert.deepEqual(rows, [
    {
      name: 'Banana 100g',
      calories: 89,
      carbs: 22.8,
      protein: 1.1,
      fat: 0.3,
      scene: 'Pre-workout carbohydrate',
    },
  ])
})

test('food and supplement prompts explicitly require simplified Chinese values', async () => {
  let foodRequest = null
  let supplementRequest = null

  await fetchFoodResults('香蕉', {
    apiKey: 'test-key',
    fetchImpl: async (url, init) => {
      foodRequest = JSON.parse(init.body)
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      items: [
                        {
                          name: '香蕉',
                          calories: 89,
                          carbs: 22.8,
                          protein: 1.1,
                          fat: 0.3,
                          scene: '训练前快速补碳',
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    },
  })

  await fetchSupplementResults('肌酸', {
    apiKey: 'test-key',
    model: 'gemma-4-26b-a4b-it',
    fetchImpl: async (url, init) => {
      supplementRequest = JSON.parse(init.body)
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      items: [
                        {
                          name: '肌酸一水合物',
                          dose: '3-5g/天',
                          bestFor: '力量训练与增肌期',
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    },
  })

  assert.match(foodRequest.systemInstruction.parts[0].text, /Simplified Chinese/)
  assert.match(foodRequest.contents[0].parts[0].text, /简体中文/)
  assert.match(supplementRequest.systemInstruction.parts[0].text, /Simplified Chinese/)
  assert.match(supplementRequest.contents[0].parts[0].text, /简体中文/)
})
