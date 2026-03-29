# Personal Fitness Workbench V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chinese-first personal website with a public homepage and a public fitness workbench, using Vue 3 + JavaScript with a zero-install-first delivery path.

**Architecture:** Implement the site as a static multi-page app with two entry pages: `/` and `/fitness/`. Load Vue 3 in the browser runtime, keep page logic in local ES modules, isolate TDEE and storage logic into pure utilities, and verify calculation behavior with Node's built-in test runner.

**Tech Stack:** Vue 3 browser ESM, JavaScript, HTML, CSS, localStorage, Node.js built-in `node:test`, Node.js static file server script

---

## Scope Check

This plan keeps the homepage and fitness workbench in one implementation plan because they share one visual system, one navigation model, one runtime approach, and one release target. Future modules such as carb cycling, food lookup, and supplement reference remain placeholders only.

## File Structure

### Planned Files and Responsibilities

- Create: `G:\Codex—playground\personal-web\index.html`
  Purpose: homepage entry file for `/`
- Create: `G:\Codex—playground\personal-web\fitness\index.html`
  Purpose: workbench entry file for `/fitness/`
- Create: `G:\Codex—playground\personal-web\src\main\home.js`
  Purpose: bootstrap homepage Vue app
- Create: `G:\Codex—playground\personal-web\src\main\fitness.js`
  Purpose: bootstrap fitness page Vue app
- Create: `G:\Codex—playground\personal-web\src\data\profile.js`
  Purpose: hero copy, summary, positioning text
- Create: `G:\Codex—playground\personal-web\src\data\experience.js`
  Purpose: structured experience list curated from resume PDFs
- Create: `G:\Codex—playground\personal-web\src\data\projects.js`
  Purpose: project cards, including this workbench
- Create: `G:\Codex—playground\personal-web\src\data\skills.js`
  Purpose: grouped skill tags for homepage
- Create: `G:\Codex—playground\personal-web\src\data\contact.js`
  Purpose: public contact fields
- Create: `G:\Codex—playground\personal-web\src\data\navigation.js`
  Purpose: shared nav link definitions
- Create: `G:\Codex—playground\personal-web\src\data\futureModules.js`
  Purpose: placeholder cards for future fitness modules
- Create: `G:\Codex—playground\personal-web\src\components\SiteHeader.js`
  Purpose: top navigation shared by both pages
- Create: `G:\Codex—playground\personal-web\src\components\HomeHero.js`
  Purpose: homepage hero block
- Create: `G:\Codex—playground\personal-web\src\components\ContentSection.js`
  Purpose: reusable section wrapper for homepage blocks
- Create: `G:\Codex—playground\personal-web\src\components\TdeeForm.js`
  Purpose: grouped fitness input form
- Create: `G:\Codex—playground\personal-web\src\components\TdeeBreakdown.js`
  Purpose: transparent calculation cards
- Create: `G:\Codex—playground\personal-web\src\components\TdeeSummary.js`
  Purpose: maintain / cut / lean-gain recommendation cards
- Create: `G:\Codex—playground\personal-web\src\components\FutureModules.js`
  Purpose: future module placeholder cards
- Create: `G:\Codex—playground\personal-web\src\views\HomeView.js`
  Purpose: compose homepage sections
- Create: `G:\Codex—playground\personal-web\src\views\FitnessView.js`
  Purpose: compose fitness workbench page
- Create: `G:\Codex—playground\personal-web\src\utils\tdee.js`
  Purpose: BMR, activity, training, and total energy calculations
- Create: `G:\Codex—playground\personal-web\src\utils\macros.js`
  Purpose: calorie scenario ranges and macro allocation rules
- Create: `G:\Codex—playground\personal-web\src\utils\storage.js`
  Purpose: localStorage read / write / history helpers
- Create: `G:\Codex—playground\personal-web\src\styles\tokens.css`
  Purpose: color, spacing, typography, and motion tokens
- Create: `G:\Codex—playground\personal-web\src\styles\base.css`
  Purpose: reset, layout, shared components
- Create: `G:\Codex—playground\personal-web\src\styles\home.css`
  Purpose: homepage-specific styling
- Create: `G:\Codex—playground\personal-web\src\styles\fitness.css`
  Purpose: workbench-specific styling
- Create: `G:\Codex—playground\personal-web\tests\unit\entrypoints.test.js`
  Purpose: zero-install entry file contract tests
- Create: `G:\Codex—playground\personal-web\tests\unit\content-data.test.js`
  Purpose: homepage content shape tests
- Create: `G:\Codex—playground\personal-web\tests\unit\navigation.test.js`
  Purpose: shared navigation contract tests
- Create: `G:\Codex—playground\personal-web\tests\unit\tdee.test.js`
  Purpose: TDEE formula tests
- Create: `G:\Codex—playground\personal-web\tests\unit\macros.test.js`
  Purpose: macro recommendation tests
- Create: `G:\Codex—playground\personal-web\tests\unit\storage.test.js`
  Purpose: persistence helper tests
- Create: `G:\Codex—playground\personal-web\scripts\dev-server.js`
  Purpose: zero-install local static server for VS Code integrated terminal use
- Create: `G:\Codex—playground\personal-web\README.md`
  Purpose: local run instructions and feature summary

### Runtime Decision

Use static multi-page routing:

- homepage: `G:\Codex—playground\personal-web\index.html`
- workbench: `G:\Codex—playground\personal-web\fitness\index.html`

This avoids needing a dev server with history fallback and keeps the project compatible with a tiny local Node static server script.

### Testing Decision

- Use `node --test` for pure JavaScript logic and content contracts
- Use `node scripts/dev-server.js` for browser-based manual checks
- Do not introduce Vitest, Jest, Playwright, or Cypress in `v1`

### Environment Testing Workaround

In this environment, `node --test ...` may fail with `spawn EPERM`. When that happens, run each test file directly instead:

- `node tests/unit/entrypoints.test.js`
- `node tests/unit/content-data.test.js`
- `node tests/unit/navigation.test.js`
- `node tests/unit/tdee.test.js`
- `node tests/unit/macros.test.js`
- `node tests/unit/storage.test.js`

These files use `node:test`, so direct execution still produces TAP output without the failing subprocess spawn path.

## Formula Decisions Locked for V1

### Basal Metabolism

- If `bodyFatPct` is present and valid, use `Katch-McArdle`
  - `leanMassKg = weightKg * (1 - bodyFatPct / 100)`
  - `bmr = 370 + 21.6 * leanMassKg`
- Otherwise use `Mifflin-St Jeor`
  - male: `10 * weightKg + 6.25 * heightCm - 5 * age + 5`
  - female: `10 * weightKg + 6.25 * heightCm - 5 * age - 161`

### Step Activity

- Male step length estimate: `heightCm * 0.415 / 100`
- Female step length estimate: `heightCm * 0.413 / 100`
- `distanceKm = stepsPerDay * stepLengthM / 1000`
- `stepCalories = distanceKm * weightKg * 0.53`

### Occupation Adjustment

Use fixed daily additions for transparency:

- `sedentary = 0`
- `light = 120`
- `moderate = 220`
- `high = 350`

### Training Energy

Convert weekly training into average daily contribution:

- resistance training MET = `5.5`
- cardio MET = `7.0`
- `sessionCalories = MET * 3.5 * weightKg / 200 * minutes`
- `dailyTrainingCalories = weeklyTotal / 7`

### TDEE

- `tdee = bmr + stepCalories + occupationCalories + resistanceDailyCalories + cardioDailyCalories`
- Round displayed calorie values to whole numbers

### Calorie Scenarios

- maintain: `round(tdee)`
- cut range: `round(tdee * 0.80)` to `round(tdee * 0.90)`
- cut target for macro calculation: midpoint of cut range
- lean-gain range: `round(tdee * 1.05)` to `round(tdee * 1.12)`
- lean-gain target for macro calculation: midpoint of lean-gain range

### Macro Rules

- maintain protein: `1.8 g/kg`
- cut protein: `2.2 g/kg`
- lean-gain protein: `1.8 g/kg`
- fat floor for all scenarios: `max(0.8 g/kg, 45g)`
- carbs fill remaining calories
- if carbs would go negative, clamp to `0` and surface a UI warning later

## Task 1: Curate Resume Content Into Local Data

**Files:**
- Create: `G:\Codex—playground\personal-web\src\data\profile.js`
- Create: `G:\Codex—playground\personal-web\src\data\experience.js`
- Create: `G:\Codex—playground\personal-web\src\data\projects.js`
- Create: `G:\Codex—playground\personal-web\src\data\skills.js`
- Create: `G:\Codex—playground\personal-web\src\data\contact.js`
- Create: `G:\Codex—playground\personal-web\tests\unit\content-data.test.js`

- [ ] **Step 1: Write the failing content-shape test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { profile } from '../../src/data/profile.js'
import { experiences } from '../../src/data/experience.js'
import { projects } from '../../src/data/projects.js'
import { skillGroups } from '../../src/data/skills.js'

test('homepage content exposes required top-level fields', () => {
  assert.equal(typeof profile.name, 'string')
  assert.equal(typeof profile.tagline, 'string')
  assert.ok(experiences.length >= 2)
  assert.ok(projects.length >= 2)
  assert.ok(skillGroups.length >= 3)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/content-data.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` because the data files do not exist yet.

- [ ] **Step 3: Try to extract resume facts without adding dependencies; if unavailable, fall back to editable placeholders**

Run: inspect any existing local tools or readable metadata from the two PDFs in `assets/`
Expected:
- if readable facts are available, use them to seed real content
- if the PDFs are not reliably machine-readable in the zero-install environment, proceed with accurate high-level positioning plus clearly editable placeholder entries for experience, projects, and contact details

- [ ] **Step 4: Write the data modules with safe content and explicit edit points**

```js
export const profile = {
  name: '你的姓名',
  tagline: '产品思维驱动的开发实践者',
  summary: '一句到两句中文摘要，强调产品、前端、执行力和自驱。',
  ctaPrimary: { label: '进入健身工作台', href: '/fitness/' },
  ctaSecondary: { label: '查看项目', href: '#projects' },
}
```

```js
export const experiences = [
  {
    title: '待补充的经历标题',
    period: '待补充时间',
    summary: '在 VS Code 中直接替换为基于简历整理的真实经历。',
  },
]
```

- [ ] **Step 5: Re-run the content test**

Run: `node --test tests/unit/content-data.test.js`
Expected: PASS

- [ ] **Step 6: Commit the curated content baseline**

```bash
git add src/data tests/unit/content-data.test.js
git commit -m "feat: add curated homepage content data"
```

## Task 2: Bootstrap the Zero-Install Vue 3 Multi-Page Shell

**Files:**
- Create: `G:\Codex—playground\personal-web\index.html`
- Create: `G:\Codex—playground\personal-web\fitness\index.html`
- Create: `G:\Codex—playground\personal-web\src\main\home.js`
- Create: `G:\Codex—playground\personal-web\src\main\fitness.js`
- Create: `G:\Codex—playground\personal-web\src\styles\tokens.css`
- Create: `G:\Codex—playground\personal-web\src\styles\base.css`
- Create: `G:\Codex—playground\personal-web\scripts\dev-server.js`
- Create: `G:\Codex—playground\personal-web\tests\unit\entrypoints.test.js`

- [ ] **Step 1: Write the failing entrypoint contract test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('both entry HTML files point to local module bootstraps', async () => {
  const home = await readFile('index.html', 'utf8')
  const fitness = await readFile('fitness/index.html', 'utf8')
  assert.match(home, /src\/main\/home\.js/)
  assert.match(fitness, /\.\.\/src\/main\/fitness\.js/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/entrypoints.test.js`
Expected: FAIL with `ENOENT` because the entry files do not exist yet.

- [ ] **Step 3: Create the HTML entry files and module bootstraps**

```html
<!-- index.html -->
<div id="app"></div>
<script type="module" src="./src/main/home.js"></script>
```

```html
<!-- fitness/index.html -->
<div id="app"></div>
<script type="module" src="../src/main/fitness.js"></script>
```

```js
// src/main/home.js
import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js'
import { HomeView } from '../views/HomeView.js'
createApp(HomeView).mount('#app')
```

- [ ] **Step 4: Add shared design tokens and base styles**

```css
:root {
  --bg: #f3efe7;
  --panel: rgba(255, 255, 255, 0.72);
  --text: #171717;
  --accent: #ca5a2e;
  --muted: #6f645c;
}
```

- [ ] **Step 5: Add the local Node static server**

```js
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { createReadStream, existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const server = http.createServer(async (req, res) => {
  // serve /, /fitness/, and local module files from the workspace root
})

server.listen(4173, () => {
  console.log('Dev server running at http://localhost:4173')
})
```

- [ ] **Step 6: Re-run the entrypoint test**

Run: `node --test tests/unit/entrypoints.test.js`
Expected: PASS

- [ ] **Step 7: Launch the static server and verify both pages mount**

Run: `node scripts/dev-server.js`
Expected: terminal prints `Dev server running at http://localhost:4173` and both `http://localhost:4173/` and `http://localhost:4173/fitness/` load without 404s.

- [ ] **Step 8: Commit the runtime shell**

```bash
git add index.html fitness src/main src/styles scripts/dev-server.js tests/unit/entrypoints.test.js
git commit -m "feat: bootstrap zero-install vue multipage shell"
```

## Task 3: Build Shared Navigation and Homepage Rendering

**Files:**
- Create: `G:\Codex—playground\personal-web\src\data\navigation.js`
- Create: `G:\Codex—playground\personal-web\src\components\SiteHeader.js`
- Create: `G:\Codex—playground\personal-web\src\components\HomeHero.js`
- Create: `G:\Codex—playground\personal-web\src\components\ContentSection.js`
- Create: `G:\Codex—playground\personal-web\src\views\HomeView.js`
- Create: `G:\Codex—playground\personal-web\src\styles\home.css`
- Create: `G:\Codex—playground\personal-web\tests\unit\navigation.test.js`
- Modify: `G:\Codex—playground\personal-web\src\main\home.js`

- [ ] **Step 1: Write the failing navigation contract test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { navigationItems } from '../../src/data/navigation.js'

test('shared navigation exposes expected destinations', () => {
  assert.deepEqual(
    navigationItems.map((item) => item.href),
    ['/', '/#experience', '/#projects', '/#skills', '/fitness/', '/#contact']
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/navigation.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`

- [ ] **Step 3: Add navigation data and shared header component**

```js
export const navigationItems = [
  { label: '首页', href: '/' },
  { label: '经历', href: '/#experience' },
  { label: '项目', href: '/#projects' },
  { label: '技能', href: '/#skills' },
  { label: '健身工作台', href: '/fitness/' },
  { label: '联系我', href: '/#contact' },
]
```

- [ ] **Step 4: Implement the homepage view using the curated data**

```js
export const HomeView = {
  components: { SiteHeader, HomeHero, ContentSection },
  setup() {
    return { profile, experiences, projects, skillGroups, contact, navigationItems }
  },
  template: `
    <div class="page-home">
      <SiteHeader :items="navigationItems" />
      <main>
        <HomeHero :profile="profile" />
        <ContentSection id="experience" title="经历" />
        <ContentSection id="projects" title="项目" />
        <ContentSection id="skills" title="技能" />
        <ContentSection id="contact" title="联系我" />
      </main>
    </div>
  `,
}
```

- [ ] **Step 5: Re-run the navigation test**

Run: `node --test tests/unit/navigation.test.js`
Expected: PASS

- [ ] **Step 6: Manually verify homepage structure and anchor navigation**

Run: `node scripts/dev-server.js`
Expected: homepage shows hero, experience, projects, skills, and contact sections; clicking the nav scrolls to anchors; clicking "健身工作台" jumps to `/fitness/`.

- [ ] **Step 7: Commit the homepage shell**

```bash
git add src/data/navigation.js src/components src/views/HomeView.js src/styles/home.css tests/unit/navigation.test.js
git commit -m "feat: add homepage navigation and sections"
```

## Task 4: Implement TDEE and Macro Calculation Utilities

**Files:**
- Create: `G:\Codex—playground\personal-web\src\utils\tdee.js`
- Create: `G:\Codex—playground\personal-web\src\utils\macros.js`
- Create: `G:\Codex—playground\personal-web\tests\unit\tdee.test.js`
- Create: `G:\Codex—playground\personal-web\tests\unit\macros.test.js`

- [ ] **Step 1: Write the failing TDEE and macro tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateTdee } from '../../src/utils/tdee.js'
import { buildMacroPlan, buildScenarioPlans } from '../../src/utils/macros.js'

test('calculateTdee returns expected rounded values for the reference case', () => {
  const result = calculateTdee({
    sex: 'male',
    age: 30,
    heightCm: 175,
    weightKg: 80,
    bodyFatPct: 18,
    stepsPerDay: 8000,
    occupationLevel: 'light',
    strengthSessionsPerWeek: 4,
    strengthMinutesPerSession: 60,
    cardioSessionsPerWeek: 2,
    cardioMinutesPerSession: 30,
  })

  assert.equal(result.bmr, 1787)
  assert.equal(result.stepCalories, 246)
  assert.equal(result.occupationCalories, 120)
  assert.equal(result.resistanceDailyCalories, 264)
  assert.equal(result.cardioDailyCalories, 84)
  assert.equal(result.tdee, 2501)
})
```

```js
test('buildMacroPlan uses protein-first allocation for cut target', () => {
  const plan = buildMacroPlan({ weightKg: 80, targetCalories: 2126, mode: 'cut' })
  assert.equal(plan.proteinGrams, 176)
  assert.equal(plan.fatGrams, 64)
  assert.equal(plan.carbGrams, 212)
})

test('buildScenarioPlans returns the expected cut and lean-gain ranges', () => {
  const scenarios = buildScenarioPlans(80, 2501)
  assert.equal(scenarios.maintain.targetCalories, 2501)
  assert.equal(scenarios.cut.minCalories, 2001)
  assert.equal(scenarios.cut.maxCalories, 2251)
  assert.equal(scenarios.cut.targetCalories, 2126)
  assert.equal(scenarios.leanGain.minCalories, 2626)
  assert.equal(scenarios.leanGain.maxCalories, 2801)
  assert.equal(scenarios.leanGain.targetCalories, 2714)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/unit/tdee.test.js tests/unit/macros.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`

- [ ] **Step 3: Implement the TDEE utility as a pure function module**

```js
export function calculateTdee(input) {
  const bmr = calculateBmr(input)
  const stepCalories = calculateStepCalories(input)
  const occupationCalories = occupationMap[input.occupationLevel]
  const resistanceDailyCalories = calculateTrainingAverage(input.weightKg, 5.5, input.strengthSessionsPerWeek, input.strengthMinutesPerSession)
  const cardioDailyCalories = calculateTrainingAverage(input.weightKg, 7.0, input.cardioSessionsPerWeek, input.cardioMinutesPerSession)
  const tdee = Math.round(bmr + stepCalories + occupationCalories + resistanceDailyCalories + cardioDailyCalories)
  return { bmr, stepCalories, occupationCalories, resistanceDailyCalories, cardioDailyCalories, tdee }
}
```

- [ ] **Step 4: Implement the macro utility**

```js
export function buildMacroPlan({ weightKg, targetCalories, mode }) {
  const proteinGrams = Math.round(weightKg * (mode === 'cut' ? 2.2 : 1.8))
  const fatGrams = Math.round(Math.max(weightKg * 0.8, 45))
  const carbCalories = targetCalories - proteinGrams * 4 - fatGrams * 9
  const carbGrams = Math.max(0, Math.round(carbCalories / 4))
  return { proteinGrams, fatGrams, carbGrams }
}

export function buildScenarioPlans(weightKg, tdee) {
  const maintainTarget = Math.round(tdee)
  const cutMin = Math.round(tdee * 0.8)
  const cutMax = Math.round(tdee * 0.9)
  const cutTarget = Math.round((cutMin + cutMax) / 2)
  const leanGainMin = Math.round(tdee * 1.05)
  const leanGainMax = Math.round(tdee * 1.12)
  const leanGainTarget = Math.round((leanGainMin + leanGainMax) / 2)

  return {
    maintain: {
      targetCalories: maintainTarget,
      macros: buildMacroPlan({ weightKg, targetCalories: maintainTarget, mode: 'maintain' }),
    },
    cut: {
      minCalories: cutMin,
      maxCalories: cutMax,
      targetCalories: cutTarget,
      macros: buildMacroPlan({ weightKg, targetCalories: cutTarget, mode: 'cut' }),
    },
    leanGain: {
      minCalories: leanGainMin,
      maxCalories: leanGainMax,
      targetCalories: leanGainTarget,
      macros: buildMacroPlan({ weightKg, targetCalories: leanGainTarget, mode: 'leanGain' }),
    },
  }
}
```

- [ ] **Step 5: Re-run the utility tests**

Run: `node --test tests/unit/tdee.test.js tests/unit/macros.test.js`
Expected: PASS

- [ ] **Step 6: Commit the tested calculation core**

```bash
git add src/utils tests/unit/tdee.test.js tests/unit/macros.test.js
git commit -m "feat: add tested tdee and macro utilities"
```

## Task 5: Build the Fitness Workbench UI and Local Persistence

**Files:**
- Create: `G:\Codex—playground\personal-web\src\data\futureModules.js`
- Create: `G:\Codex—playground\personal-web\src\components\TdeeForm.js`
- Create: `G:\Codex—playground\personal-web\src\components\TdeeBreakdown.js`
- Create: `G:\Codex—playground\personal-web\src\components\TdeeSummary.js`
- Create: `G:\Codex—playground\personal-web\src\components\FutureModules.js`
- Create: `G:\Codex—playground\personal-web\src\views\FitnessView.js`
- Create: `G:\Codex—playground\personal-web\src\utils\storage.js`
- Create: `G:\Codex—playground\personal-web\src\styles\fitness.css`
- Create: `G:\Codex—playground\personal-web\tests\unit\storage.test.js`
- Modify: `G:\Codex—playground\personal-web\src\main\fitness.js`

- [ ] **Step 1: Write the failing storage helper test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { createStorageApi } from '../../src/utils/storage.js'

test('storage api saves latest form data and keeps only recent history', () => {
  const memory = new Map()
  const fakeStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  }

  const api = createStorageApi(fakeStorage)
  api.saveLatest({ weightKg: 80 })
  api.pushHistory({ tdee: 2501 }, 2)
  api.pushHistory({ tdee: 2450 }, 2)
  api.pushHistory({ tdee: 2400 }, 2)

  assert.deepEqual(api.loadLatest(), { weightKg: 80 })
  assert.deepEqual(api.loadHistory(), [{ tdee: 2400 }, { tdee: 2450 }])
})
```

- [ ] **Step 2: Run the storage test to verify it fails**

Run: `node --test tests/unit/storage.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`

- [ ] **Step 3: Implement the storage helper**

```js
export function createStorageApi(storage = window.localStorage) {
  return {
    loadLatest() { /* parse JSON or return null */ },
    saveLatest(payload) { /* save latest form */ },
    loadHistory() { /* parse history list */ },
    pushHistory(entry, limit = 5) { /* unshift + slice */ },
  }
}
```

- [ ] **Step 4: Re-run the storage test**

Run: `node --test tests/unit/storage.test.js`
Expected: PASS

- [ ] **Step 5: Build the fitness view and wire reactive state**

```js
const form = reactive({
  sex: 'male',
  age: 28,
  heightCm: 175,
  weightKg: 75,
  bodyFatPct: '',
  stepsPerDay: 8000,
  occupationLevel: 'light',
  strengthSessionsPerWeek: 4,
  strengthMinutesPerSession: 60,
  cardioSessionsPerWeek: 2,
  cardioMinutesPerSession: 30,
})
```

```js
const calculation = computed(() => calculateTdee(form))
const scenarios = computed(() => buildScenarioPlans(form.weightKg, calculation.value.tdee))

watch(form, (value) => storage.saveLatest(value), { deep: true })
```

- [ ] **Step 6: Add the future module cards and explanation copy**

```js
export const futureModules = [
  { title: '碳循环', description: '后续接入按训练日分配碳水的方案生成。' },
  { title: '碳水渐降', description: '后续接入分阶段减脂策略。' },
  { title: '食物查询', description: '后续接入常见食物热量与宏量查询。' },
  { title: '补剂说明', description: '后续接入补剂作用与使用注意事项。' },
]
```

- [ ] **Step 7: Manually verify the workbench flow**

Run: `node scripts/dev-server.js`
Expected:
- `http://localhost:4173/fitness/` loads without console errors
- editing form values updates breakdown and summary cards immediately
- refreshing the page preserves the latest form values
- submitting several changes adds new history entries in reverse chronological order

- [ ] **Step 8: Commit the workbench UI**

```bash
git add src/views/FitnessView.js src/components/TdeeForm.js src/components/TdeeBreakdown.js src/components/TdeeSummary.js src/components/FutureModules.js src/utils/storage.js src/data/futureModules.js src/styles/fitness.css tests/unit/storage.test.js
git commit -m "feat: add public fitness workbench ui"
```

## Task 6: Polish, Responsive QA, and Project Docs

**Files:**
- Modify: `G:\Codex—playground\personal-web\src\styles\tokens.css`
- Modify: `G:\Codex—playground\personal-web\src\styles\base.css`
- Modify: `G:\Codex—playground\personal-web\src\styles\home.css`
- Modify: `G:\Codex—playground\personal-web\src\styles\fitness.css`
- Create: `G:\Codex—playground\personal-web\README.md`

- [ ] **Step 1: Write the README stub before polishing**

```md
# Personal Fitness Workbench

## Local Run

node scripts/dev-server.js

Open:
- http://localhost:4173/
- http://localhost:4173/fitness/
```

- [ ] **Step 2: Add responsive breakpoints and motion polish**

```css
@media (max-width: 900px) {
  .hero-grid,
  .fitness-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Run the full automated test suite**

Run: `node --test tests/unit/entrypoints.test.js tests/unit/content-data.test.js tests/unit/navigation.test.js tests/unit/tdee.test.js tests/unit/macros.test.js tests/unit/storage.test.js`
Expected: PASS for entrypoints, content data, navigation, TDEE, macros, and storage helpers.

- [ ] **Step 4: Run final browser QA**

Run: `node scripts/dev-server.js`
Expected:
- homepage looks intentional on desktop and mobile widths
- `/fitness/` remains readable and usable on mobile widths
- CTA links and section anchors work
- no broken imports, 404s, or empty sections

- [ ] **Step 5: Final commit**

```bash
git add README.md src/styles
git commit -m "feat: polish personal fitness workbench v1"
```

## Manual Review Checklist

- Verify that the homepage copy is not a direct PDF resume dump
- Verify that `/fitness/` explains the estimate nature of the outputs
- Verify that all calorie numbers are rounded consistently
- Verify that cut and lean-gain macros use their scenario midpoint calories
- Verify that the site still works when served as static files, not just when opened from the file system
- Verify that no step in the implementation required `npm install`

## Execution Notes

- If Vue 3 CDN import stability becomes a problem during implementation, do not switch to a package-based toolchain mid-task without first confirming with the user.
- If the user later agrees to package installation, the migration target should be `Vite + Vue 3 + optional Element Plus`, but that is explicitly out of scope for this plan.
- Do not add the food database, supplement encyclopedia, carb cycling, or carb tapering logic in this pass.

## Review Notes

- This workspace is not currently a Git repository. If it remains non-Git during execution, replace each commit step with a local checkpoint note in the implementation thread.
- A plan-review subagent was not dispatched here because the current session has not been authorized for delegated agent work. Perform a manual review before execution instead.
