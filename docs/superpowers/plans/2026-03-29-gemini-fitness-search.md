# Gemini Fitness Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Gemini-backed proxy search for the food and supplement modules without exposing the API key to the browser.

**Architecture:** Route frontend requests through same-origin `/api` handlers, keep Gemini request/response logic in one shared server module, and mirror the same API locally through Vite middleware so development and deployment use the same contracts.

**Tech Stack:** Vite, Vue 3, Ant Design Vue, Node.js built-in fetch, Vercel-style serverless handlers, `node:test`

---

### Task 1: Lock the Gemini server contract

**Files:**
- Create: `G:\Codex—playground\personal-web\tests\unit\fitness-gemini.test.js`
- Create: `G:\Codex—playground\personal-web\server\fitnessGemini.js`

- [ ] **Step 1: Write the failing tests**
- [ ] **Step 2: Run `node tests/unit/fitness-gemini.test.js` and confirm `ERR_MODULE_NOT_FOUND`**
- [ ] **Step 3: Implement Gemini request building, JSON extraction, and row normalization**
- [ ] **Step 4: Re-run `node tests/unit/fitness-gemini.test.js` and confirm green**

### Task 2: Expose same-origin proxy routes

**Files:**
- Create: `G:\Codex—playground\personal-web\api\fitness\food-search.js`
- Create: `G:\Codex—playground\personal-web\api\fitness\supplement-search.js`
- Modify: `G:\Codex—playground\personal-web\vite.config.js`
- Create: `G:\Codex—playground\personal-web\vercel.json`

- [ ] **Step 1: Add Vercel-style handlers that delegate to the shared server module**
- [ ] **Step 2: Add Vite dev/preview middleware for the same `/api` routes**
- [ ] **Step 3: Add SPA rewrites for Vercel deployment**

### Task 3: Rewire the two module views

**Files:**
- Modify: `G:\Codex—playground\personal-web\src\views\modules\FoodLibraryView.vue`
- Modify: `G:\Codex—playground\personal-web\src\views\modules\SupplementLibraryView.vue`
- Modify: `G:\Codex—playground\personal-web\src\main.js`

- [ ] **Step 1: Replace direct third-party requests with same-origin `/api` fetches**
- [ ] **Step 2: Align the result tables with the new contracts**
- [ ] **Step 3: Add AI quick-reference disclaimer copy**
- [ ] **Step 4: Register any missing Ant Design Vue components**

### Task 4: Document env setup and verify

**Files:**
- Create: `G:\Codex—playground\personal-web\.env.example`
- Create: `G:\Codex—playground\personal-web\.gitignore`
- Modify: `G:\Codex—playground\personal-web\README.md`
- Modify: `G:\Codex—playground\personal-web\package.json`

- [ ] **Step 1: Add `.env.example` for `GEMINI_API_KEY` and `GEMINI_MODEL`**
- [ ] **Step 2: Ignore local env files**
- [ ] **Step 3: Update the README with local setup and deployment notes**
- [ ] **Step 4: Add the new Gemini test to `pnpm test`**

## Review Notes

- This workspace is not currently a Git repository, so commit steps are not included.
- The user approved inline execution, so this plan was documented and executed in the same session.
