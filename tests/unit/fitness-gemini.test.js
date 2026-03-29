import test from 'node:test'
import assert from 'node:assert/strict'

import { fetchFoodResults, fetchSupplementResults } from '../../server/fitnessGemini.js'

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
