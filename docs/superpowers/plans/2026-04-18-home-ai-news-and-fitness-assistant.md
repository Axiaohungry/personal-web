# Home AI News and Fitness Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an above-the-fold homepage `AI 最新动态` module backed by grounded Gemini news summaries, plus a scoped `训练与健康助手` panel inside the fitness workbench that only answers training and health questions.

**Architecture:** Keep the release incremental. Add two focused Vue components for the homepage and fitness workbench, and add two same-origin API endpoints that extend the existing Node/Gemini server pattern. Split backend responsibilities into a news-focused Gemini module and a fitness-assistant Gemini module so route handling, schema validation, caching, and refusal logic stay isolated and testable.

**Tech Stack:** Vue 3, Vue Router, Ant Design Vue, Vite middleware, Node HTTP server, Gemini API with Google Search grounding, `node:test`

---

## File Structure

**Create**
- `G:\Codex—playground\personal-web\src\components\AiNewsBrief.vue`
  - Homepage news module that fetches and renders three grounded AI stories with loading and fallback states.
- `G:\Codex—playground\personal-web\src\components\FitnessAssistantPanel.vue`
  - Fitness workbench assistant panel with scoped input, quick prompts, answer cards, refusal cards, and error states.
- `G:\Codex—playground\personal-web\server\aiNewsGemini.js`
  - Grounded Gemini request builder, response normalization, and in-memory caching for homepage AI news.
- `G:\Codex—playground\personal-web\server\fitnessAssistantGemini.js`
  - Domain gate, Gemini prompt/config builder, response normalization, and refusal fallback logic for the fitness assistant.
- `G:\Codex—playground\personal-web\api\ai\news-brief.js`
  - Serverless handler that delegates to the shared AI news server module.
- `G:\Codex—playground\personal-web\api\fitness\assistant.js`
  - Serverless handler that delegates to the shared fitness assistant server module.
- `G:\Codex—playground\personal-web\tests\unit\ai-news.test.js`
  - Contract tests for the AI news request/response shape, caching behavior, and fallback handling.
- `G:\Codex—playground\personal-web\tests\unit\fitness-assistant.test.js`
  - Contract tests for assistant domain gating, refusal modes, prompt shaping, and normalized output.

**Modify**
- `G:\Codex—playground\personal-web\src\views\HomeView.vue`
  - Insert the new homepage news module directly below the hero shell.
- `G:\Codex—playground\personal-web\src\views\FitnessView.vue`
  - Insert the new assistant panel between `TdeeSummary` and `FutureModules`, wiring it to existing context.
- `G:\Codex—playground\personal-web\src\styles\home.css`
  - Add the layout, card, and mobile rules for the `AI 最新动态` module.
- `G:\Codex—playground\personal-web\src\styles\fitness.css`
  - Add the layout, prompt chips, answer card, and refusal/error styling for the assistant panel.
- `G:\Codex—playground\personal-web\server\httpServer.js`
  - Route `/api/ai/news-brief` and `/api/fitness/assistant` through the Node server path.
- `G:\Codex—playground\personal-web\vite.config.js`
  - Register dev/preview middleware for the new same-origin API endpoints.
- `G:\Codex—playground\personal-web\tests\unit\http-server.test.js`
  - Assert the new API routes resolve correctly.
- `G:\Codex—playground\personal-web\tests\unit\entrypoints.test.js`
  - Assert the homepage and fitness workbench wire in the new components.
- `G:\Codex—playground\personal-web\tests\unit\fitness-gemini.test.js`
  - Keep existing Gemini tests green and, if useful, refactor only enough to avoid duplication with the new server modules.
- `G:\Codex—playground\personal-web\package.json`
  - Add the new unit tests to the explicit `test` script.

**Notes**
- This spec touches two user-facing slices, but they share the same Gemini server conventions, route plumbing, and test strategy, so a single implementation plan is still coherent.
- `docs/` is ignored by Git in this workspace, so plan/spec commits must continue to use `git add -f` when the docs need to be preserved in history.

---

### Task 1: Lock the API contracts and entry wiring with failing tests

**Files:**
- Create: `G:\Codex—playground\personal-web\tests\unit\ai-news.test.js`
- Create: `G:\Codex—playground\personal-web\tests\unit\fitness-assistant.test.js`
- Modify: `G:\Codex—playground\personal-web\tests\unit\http-server.test.js`
- Modify: `G:\Codex—playground\personal-web\tests\unit\entrypoints.test.js`
- Modify: `G:\Codex—playground\personal-web\package.json`

- [ ] **Step 1: Write the failing AI news contract test**

Add a test that imports the future `server/aiNewsGemini.js` module and expects helpers like:

```js
import { buildAiNewsRequestBody, normalizeAiNewsPayload } from '../../server/aiNewsGemini.js'

test('normalizeAiNewsPayload keeps only three grounded stories with source fields', () => {
  const stories = normalizeAiNewsPayload({
    stories: [
      {
        title: 'Gemini 3.1 Pro gets workflow upgrades',
        summary: 'Google shipped a model update.',
        whyItMatters: 'Tooling agents can do more in one pass.',
        sourceLabel: 'Google AI Blog',
        sourceUrl: 'https://example.com/a',
        publishedAt: '2026-04-18',
      },
    ],
  })

  assert.equal(stories.length, 1)
  assert.equal(stories[0].sourceLabel, 'Google AI Blog')
})
```

- [ ] **Step 2: Write the failing fitness assistant contract test**

Add tests that expect the future `server/fitnessAssistantGemini.js` module to:

- classify unrelated prompts as `out_of_scope`
- classify medical prompts as `medical_boundary`
- normalize a valid assistant answer into:
  - `status`
  - `answerTitle`
  - `summary`
  - `actions`
  - `cautions`
  - `relatedModules`

Use a shape like:

```js
assert.deepEqual(classifyAssistantQuestion('帮我写一个 Python 脚本'), {
  status: 'out_of_scope',
})
```

- [ ] **Step 3: Extend routing and entrypoint tests before implementation**

Add failing assertions for:

- `/api/ai/news-brief` resolving to `{ kind: 'api', apiKind: 'ai-news' }`
- `/api/fitness/assistant` resolving to `{ kind: 'api', apiKind: 'fitness-assistant' }`
- `HomeView.vue` importing or rendering `AiNewsBrief`
- `FitnessView.vue` importing or rendering `FitnessAssistantPanel`

- [ ] **Step 4: Add the new tests to the explicit test script**

Insert:

```json
"node tests/unit/ai-news.test.js && node tests/unit/fitness-assistant.test.js"
```

into the `package.json` `test` script in a sensible position near the other Gemini and HTTP tests.

- [ ] **Step 5: Run the red tests**

Run:

```bash
node tests/unit/ai-news.test.js
node tests/unit/fitness-assistant.test.js
node tests/unit/http-server.test.js
node tests/unit/entrypoints.test.js
```

Expected:

- the new AI news and assistant tests fail because the modules do not exist yet
- route assertions fail because the new API kinds are not registered
- entrypoint assertions fail because the new components are not wired in

- [ ] **Step 6: Commit the red test harness**

```bash
git add tests/unit/ai-news.test.js tests/unit/fitness-assistant.test.js tests/unit/http-server.test.js tests/unit/entrypoints.test.js package.json
git commit -m "test: lock AI news and fitness assistant contracts"
```

---

### Task 2: Build the grounded AI news server module

**Files:**
- Create: `G:\Codex—playground\personal-web\server\aiNewsGemini.js`
- Modify: `G:\Codex—playground\personal-web\tests\unit\ai-news.test.js`

- [ ] **Step 1: Implement the smallest request builder that satisfies the tests**

Export focused helpers such as:

```js
export function buildAiNewsRequestBody(nowIso) {
  return {
    tools: [{ googleSearch: {} }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: {
          updatedAt: { type: 'string' },
          stories: {
            type: 'array',
            maxItems: 3,
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                summary: { type: 'string' },
                whyItMatters: { type: 'string' },
                sourceLabel: { type: 'string' },
                sourceUrl: { type: 'string' },
                publishedAt: { type: 'string' },
              },
              required: ['title', 'summary', 'whyItMatters', 'sourceLabel', 'sourceUrl', 'publishedAt'],
            },
          },
        },
        required: ['updatedAt', 'stories'],
      },
    },
  }
}
```

- [ ] **Step 2: Implement normalization and cache helpers**

Keep the module tight:

- `normalizeAiNewsPayload(payload)`
- `createAiNewsCache({ ttlMs, now })`
- `fetchAiNewsBrief(options)`
- `handleNodeAiNewsRequest(req, res, options)`

Rules:

- trim stories to 3
- reject items missing any source field
- keep an in-memory cache with a default 15-30 minute TTL
- return a stable fallback error when Gemini fails

- [ ] **Step 3: Keep the Gemini prompt editorial, not opinionated**

Prompt rules:

- focus on recent AI developments
- prioritize model/tooling/workflow/product impact
- avoid personal commentary
- always include source-facing fields

- [ ] **Step 4: Run the targeted AI news tests**

Run:

```bash
node tests/unit/ai-news.test.js
```

Expected:

- AI news normalization and cache tests pass

- [ ] **Step 5: Commit the server module**

```bash
git add server/aiNewsGemini.js tests/unit/ai-news.test.js
git commit -m "feat: add grounded AI news server module"
```

---

### Task 3: Wire the AI news endpoint through Node and Vite

**Files:**
- Create: `G:\Codex—playground\personal-web\api\ai\news-brief.js`
- Modify: `G:\Codex—playground\personal-web\server\httpServer.js`
- Modify: `G:\Codex—playground\personal-web\vite.config.js`
- Modify: `G:\Codex—playground\personal-web\tests\unit\http-server.test.js`

- [ ] **Step 1: Add the serverless handler**

Implement:

```js
import { handleNodeAiNewsRequest } from '../../server/aiNewsGemini.js'

export default async function handler(req, res) {
  return handleNodeAiNewsRequest(req, res)
}
```

- [ ] **Step 2: Register the HTTP server route**

Update `resolveRequestTarget()` and related execution-mode handling so:

- `/api/ai/news-brief` maps to `apiKind: 'ai-news'`
- local execution calls `handleNodeAiNewsRequest`
- proxy mode still preserves the full query string if you later add optional query params

- [ ] **Step 3: Extend the Vite middleware plugin**

Add middleware branches for:

- `/api/ai/news-brief`
- `/api/fitness/assistant` placeholder branch only if Task 5 will reuse the same middleware path

Keep the pattern aligned with the existing food/supplement handlers instead of inventing a second plugin.

- [ ] **Step 4: Re-run the HTTP route tests**

Run:

```bash
node tests/unit/http-server.test.js
```

Expected:

- the AI news route assertions pass
- existing food/supplement route assertions remain green

- [ ] **Step 5: Commit the route plumbing**

```bash
git add api/ai/news-brief.js server/httpServer.js vite.config.js tests/unit/http-server.test.js
git commit -m "feat: expose homepage AI news endpoint"
```

---

### Task 4: Build the homepage AI news UI slice

**Files:**
- Create: `G:\Codex—playground\personal-web\src\components\AiNewsBrief.vue`
- Modify: `G:\Codex—playground\personal-web\src\views\HomeView.vue`
- Modify: `G:\Codex—playground\personal-web\src\styles\home.css`
- Modify: `G:\Codex—playground\personal-web\tests\unit\entrypoints.test.js`

- [ ] **Step 1: Add the component shell with stable fetch state**

Implement local state for:

- `loading`
- `error`
- `updatedAt`
- `stories`

Use a simple `onMounted(fetchNews)` flow; do not add background polling in this release.

- [ ] **Step 2: Keep the component markup aligned with the approved design**

Render:

- left column: title, updated timestamp, one-sentence description, action buttons
- right column: three story cards
- fallback card when the request fails

Do not render:

- author commentary
- auto-rotating content
- more than three stories

- [ ] **Step 3: Wire the module into `HomeView.vue` below the hero shell**

The top-level structure should remain:

```vue
<section class="home-page__frame shell-surface">
  <HomeHero ... />
</section>

<AiNewsBrief />

<section class="home-page__body-shell ...">
  ...
</section>
```

- [ ] **Step 4: Add the homepage styling without breaking the existing editorial rhythm**

Add CSS blocks for:

- `.ai-news-brief`
- `.ai-news-brief__meta`
- `.ai-news-brief__stories`
- `.ai-news-story`

Mobile rules must stack the module vertically and keep the first card fully readable.

- [ ] **Step 5: Re-run the entrypoint test**

Run:

```bash
node tests/unit/entrypoints.test.js
```

Expected:

- homepage assertions pass because `AiNewsBrief` is now wired in

- [ ] **Step 6: Commit the homepage UI**

```bash
git add src/components/AiNewsBrief.vue src/views/HomeView.vue src/styles/home.css tests/unit/entrypoints.test.js
git commit -m "feat: add homepage AI news module"
```

---

### Task 5: Build the scoped fitness assistant server module

**Files:**
- Create: `G:\Codex—playground\personal-web\server\fitnessAssistantGemini.js`
- Modify: `G:\Codex—playground\personal-web\tests\unit\fitness-assistant.test.js`

- [ ] **Step 1: Implement the domain gate first**

Export helpers such as:

```js
export function classifyAssistantQuestion(question) {
  if (/Python|JavaScript|简历|八卦/i.test(question)) return { status: 'out_of_scope' }
  if (/化验|处方药|诊断|医生|血常规/i.test(question)) return { status: 'medical_boundary' }
  return { status: 'ok' }
}
```

Keep the first version intentionally simple and explainable. Expand only for obvious false positives/negatives found by tests.

- [ ] **Step 2: Implement the request builder and response normalizer**

Export:

- `buildFitnessAssistantRequestBody(question, context)`
- `normalizeAssistantPayload(payload)`
- `buildAssistantRelatedModules(question)`
- `handleNodeFitnessAssistantRequest(req, res, options)`

Response shape must always normalize to:

```js
{
  status: 'ok',
  answerTitle: '...',
  summary: '...',
  actions: ['...'],
  cautions: ['...'],
  relatedModules: [{ label: '食物库', href: '/fitness/modules/food-library' }],
}
```

- [ ] **Step 3: Enforce hard refusals before and after Gemini**

Behavior:

- return `out_of_scope` without calling Gemini for unrelated prompts
- return `medical_boundary` without calling Gemini for medical prompts
- if Gemini returns malformed or off-domain output, convert it into one of the refusal shapes instead of leaking raw text

- [ ] **Step 4: Re-run the assistant tests**

Run:

```bash
node tests/unit/fitness-assistant.test.js
```

Expected:

- classification tests pass
- normalization tests pass
- malformed payload tests fall back to refusal/error structures

- [ ] **Step 5: Commit the assistant server module**

```bash
git add server/fitnessAssistantGemini.js tests/unit/fitness-assistant.test.js
git commit -m "feat: add scoped fitness assistant server module"
```

---

### Task 6: Wire the fitness assistant endpoint through Node and Vite

**Files:**
- Create: `G:\Codex—playground\personal-web\api\fitness\assistant.js`
- Modify: `G:\Codex—playground\personal-web\server\httpServer.js`
- Modify: `G:\Codex—playground\personal-web\vite.config.js`
- Modify: `G:\Codex—playground\personal-web\tests\unit\http-server.test.js`

- [ ] **Step 1: Add the serverless handler**

Implement:

```js
import { handleNodeFitnessAssistantRequest } from '../../server/fitnessAssistantGemini.js'

export default async function handler(req, res) {
  return handleNodeFitnessAssistantRequest(req, res)
}
```

- [ ] **Step 2: Extend Node route resolution**

Add `/api/fitness/assistant` to `resolveRequestTarget()` with:

```js
{ kind: 'api', apiKind: 'fitness-assistant' }
```

and make local execution delegate to `handleNodeFitnessAssistantRequest`.

- [ ] **Step 3: Extend Vite middleware**

Add a middleware branch for:

```js
if (url.pathname === '/api/fitness/assistant') {
  return handleNodeFitnessAssistantRequest(req, res, options)
}
```

- [ ] **Step 4: Re-run the route tests**

Run:

```bash
node tests/unit/http-server.test.js
```

Expected:

- fitness assistant route assertions pass
- other API and SPA assertions remain green

- [ ] **Step 5: Commit the assistant route plumbing**

```bash
git add api/fitness/assistant.js server/httpServer.js vite.config.js tests/unit/http-server.test.js
git commit -m "feat: expose fitness assistant endpoint"
```

---

### Task 7: Build the fitness assistant UI slice

**Files:**
- Create: `G:\Codex—playground\personal-web\src\components\FitnessAssistantPanel.vue`
- Modify: `G:\Codex—playground\personal-web\src\views\FitnessView.vue`
- Modify: `G:\Codex—playground\personal-web\src\styles\fitness.css`
- Modify: `G:\Codex—playground\personal-web\tests\unit\entrypoints.test.js`

- [ ] **Step 1: Create the assistant panel with scoped request payloads**

The component should accept:

- `context`
- `goal`
- `weeks`
- `targetKg`

When submitting, send:

```js
{
  question,
  context: {
    ...props.context,
    goal: props.goal,
    weeks: props.weeks,
    targetKg: props.targetKg,
  },
}
```

- [ ] **Step 2: Add fast client-side guardrails**

Client rules should be lightweight:

- empty input does nothing
- clearly unrelated prompts show a local helper nudge before or alongside the server refusal
- quick prompt chips seed valid questions

Do not let the client become the source of truth; the server remains the hard boundary.

- [ ] **Step 3: Render three answer states**

Support:

- success state with `summary`, `actions`, `cautions`, `relatedModules`
- refusal state for `out_of_scope` and `medical_boundary`
- transient error state for request failures

Avoid full chat bubbles. Keep the visual language consistent with the existing workbench cards.

- [ ] **Step 4: Insert the panel into `FitnessView.vue`**

Place it between:

```vue
<TdeeSummary ... />
<FitnessAssistantPanel ... />
<div class="motion-rise motion-rise--3">
  <FutureModules ... />
</div>
```

Pass the same shared context already used by the module workbench where possible.

- [ ] **Step 5: Add styling for the new panel**

Add CSS for:

- `.fitness-assistant`
- `.fitness-assistant__prompts`
- `.fitness-assistant__answer`
- `.fitness-assistant__related-links`

Mobile rules must keep the prompt chips tappable and the answer blocks readable.

- [ ] **Step 6: Re-run the entrypoint test**

Run:

```bash
node tests/unit/entrypoints.test.js
```

Expected:

- the fitness workbench assertions pass because `FitnessAssistantPanel` is now wired in

- [ ] **Step 7: Commit the fitness UI**

```bash
git add src/components/FitnessAssistantPanel.vue src/views/FitnessView.vue src/styles/fitness.css tests/unit/entrypoints.test.js
git commit -m "feat: add fitness assistant panel"
```

---

### Task 8: Run the integrated verification pass

**Files:**
- Verify all touched files above

- [ ] **Step 1: Run the targeted feature tests**

Run:

```bash
node tests/unit/ai-news.test.js
node tests/unit/fitness-assistant.test.js
node tests/unit/http-server.test.js
node tests/unit/entrypoints.test.js
node tests/unit/fitness-gemini.test.js
```

Expected:

- all new feature tests pass
- the legacy Gemini search tests remain green

- [ ] **Step 2: Run the full project test suite**

Run:

```bash
npm test
```

Expected:

- full suite passes without regressions

- [ ] **Step 3: Run the production build**

Run:

```bash
npm run build
```

Expected:

- build exits with code `0`

- [ ] **Step 4: Manual browser acceptance**

Verify:

- homepage shows `AI 最新动态` directly below the hero
- news cards load with timestamp and source links
- homepage fallback copy appears cleanly if the endpoint errors
- fitness workbench shows the assistant between summary and modules
- assistant answers valid fitness questions with structured blocks
- assistant refuses unrelated prompts
- assistant refuses medical-boundary prompts
- desktop and mobile widths remain readable in both theme modes

- [ ] **Step 5: Commit the final integration**

```bash
git add src api server tests package.json vite.config.js
git commit -m "feat: ship AI news and fitness assistant"
```

---

## Review Notes

- This plan was self-reviewed locally in-session.
- A dedicated plan-review subagent was not used because the current session instructions only permit subagent dispatch when the user explicitly asks for delegated or parallel agent work.
