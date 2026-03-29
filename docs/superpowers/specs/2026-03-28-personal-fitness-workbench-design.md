# Personal Fitness Workbench Design

Date: 2026-03-28
Workspace: `personal-web` workspace root
Status: Draft approved in conversation, written for final user review

## 1. Summary

Build a Chinese-first personal website that combines:

- a public personal homepage that presents the owner as a product-and-development hybrid
- a public fitness workbench that anyone can use
- a practical v1 focus on a fine-grained daily metabolism and TDEE calculator

The site should feel like a personal portal rather than a generic portfolio. It must be useful to the owner day to day, while still helping outside visitors quickly understand who the owner is, what they have done, and what kind of tools they build for themselves.

## 2. Confirmed Decisions

- Primary positioning: product + development hybrid
- Primary audience: self-use first, with public-facing value
- Public/private boundary: homepage is public, workbench is also public and reusable by others
- Primary language: Chinese
- Homepage information scope: positioning, experience, projects, skills, contact
- v1 workbench focus: daily metabolism and TDEE calculator
- Data persistence: browser local storage only
- Calculator output style: both transparent calculation steps and concise recommendations
- Technical stack: Vue 3 + JavaScript
- UI library policy: Element family is allowed, but for Vue 3 the compatible choice is Element Plus
- Environment constraint: do not rely on extra package installation for v1

## 3. Product Goals

### 3.1 Primary Goals

- Present the owner as someone with both product judgment and hands-on implementation ability
- Make the site genuinely useful as a daily personal tool, not only a showcase
- Provide a public fitness calculator that feels trustworthy, transparent, and practical
- Establish an extensible structure for later modules such as carb cycling, carb tapering, food lookup, and supplement reference

### 3.2 Non-Goals for v1

- No account system
- No backend or cloud sync
- No food database browsing UI in v1
- No supplement encyclopedia in v1
- No advanced body recomposition planner in v1
- No medical claims or personalized clinical advice

## 4. User Scenarios

### 4.1 Owner Scenario

The owner opens the site as a daily portal, quickly jumps into the fitness workbench, modifies body weight, body fat, steps, and training load, then gets a maintenance calorie estimate and practical intake suggestions.

### 4.2 Public Visitor Scenario

A visitor lands on the homepage, understands the owner's profile through the public sections, notices the fitness workbench as a real tool, and can immediately try the calculator without registration.

## 5. Information Architecture

### 5.1 Routes

- `/`: public homepage
- `/fitness`: public fitness workbench

### 5.2 Global Navigation

- Home
- Experience
- Projects
- Skills
- Fitness Workbench
- Contact

The strongest navigation emphasis should go to the fitness workbench entry.

## 6. Homepage Design

### 6.1 Homepage Role

The homepage is a public portal with two jobs:

- introduce the owner in a clear, credible, human way
- act as the launch point into the fitness workbench

### 6.2 Homepage Sections

#### Hero

- Chinese-first headline with a clear hybrid identity
- short personal positioning statement
- primary CTA to enter the fitness workbench
- secondary CTA to jump to projects or contact

#### About / Positioning

- short narrative about product thinking, development execution, and self-driven experimentation
- content should feel more editorial than resume-like

#### Experience

- condensed career or project timeline derived from the resume assets
- highlight impact and role rather than copying resume formatting

#### Projects

- selected projects with short outcome-driven descriptions
- include the fitness workbench itself as a living project

#### Skills

- grouped skills rather than a flat keyword wall
- suggested groups: product, frontend, engineering, experimentation, personal systems

#### Contact

- simple public contact block
- should feel lightweight and trustworthy

## 7. Fitness Workbench Design

### 7.1 Page Role

The fitness page is a single public tool page optimized for repeat use. It should feel like a workbench, not a blog article.

### 7.2 Main Sections

#### Intro

- one sentence explaining that this is a fine-grained TDEE and daily metabolism calculator for training-focused users
- short disclaimer that all outputs are estimates, not medical advice

#### Input Panel

Split the form into focused groups:

- body profile: sex, age, height, weight, body fat
- daily activity: steps, occupational activity intensity
- training: resistance training frequency and duration, cardio frequency and duration
- goal context: maintain by default, with cut and lean-gain outputs shown alongside

#### Result Panel

Two output layers must be shown together:

- transparent calculation layer
- concise decision layer

Transparent calculation layer:

- basal metabolic estimate
- step-related activity estimate
- occupational activity adjustment
- average resistance training energy contribution
- average cardio energy contribution
- final estimated TDEE

Concise decision layer:

- maintenance calorie estimate
- cut calorie suggestion range
- lean-gain calorie suggestion range
- macro split suggestion for each scenario

#### Explanation Panel

- explain how the estimate was derived in plain Chinese
- explain what each input means
- explain that estimates should be adjusted with real weight and performance feedback over time

#### Future Module Entry Cards

Reserve visible but clearly secondary entry cards for:

- carb cycling
- carb tapering
- food macro lookup
- supplement reference

These modules are placeholders in v1 and should not block launch.

## 8. TDEE Calculation Model

### 8.1 Design Principle

The calculator should be more transparent than a typical one-click activity multiplier tool, but it should avoid pretending to be perfectly precise.

### 8.2 Basal Metabolism

Recommended logic:

- if body fat is provided, prefer a lean-mass-aware method such as Katch-McArdle
- if body fat is missing, fall back to a standard method such as Mifflin-St Jeor

This lets the tool use richer personal data when available while keeping the tool usable for general visitors.

### 8.3 Activity and Training Model

Recommended breakdown:

- steps contribute a daily movement estimate
- occupational intensity adds a daily non-exercise activity adjustment
- resistance training and cardio are converted into average daily energy contribution from weekly totals

The UI should clearly show these as estimated components, not absolute truths.

### 8.4 Output Scenarios

The calculator should always produce three calorie scenarios:

- maintain
- cut
- lean gain

Suggested macro strategy:

- protein anchored first
- fat given a minimum protective floor
- carbohydrate fills the remaining calories

This structure supports later expansion into carb cycling and carb tapering without rewriting the core calorie engine.

## 9. Local Data and Persistence

### 9.1 Browser Storage

Store all calculator inputs and recent result snapshots in `localStorage`.

Recommended stored items:

- latest form values
- recent calculations history
- last selected unit or display preferences if added later

### 9.2 Resume-Based Content

Personal homepage content should be curated into local data files instead of trying to render the PDF resumes directly in the UI.

Recommended content sources:

- the development-oriented resume PDF currently stored in `assets/`
- the product-oriented resume PDF currently stored in `assets/`

Recommended handling:

- manually curate the final display text into structured local data modules
- keep the website copy concise and web-native
- do not mirror the PDF layout directly

## 10. Visual Direction

### 10.1 Overall Tone

The site should combine:

- editorial personal-brand energy on the homepage
- dashboard-like utility on the fitness page

It should not look like:

- a generic developer portfolio
- a clone of a fitness app
- a dense spreadsheet-style calculator

### 10.2 Aesthetic Direction

Recommended direction:

- Chinese-first typography with strong headline contrast
- deliberate spacing and asymmetry on the homepage
- clearer numeric emphasis and card hierarchy in the workbench
- shared color system across both pages so the site still feels like one product

### 10.3 Interaction Style

- homepage interactions should feel polished and directional
- workbench interactions should feel stable and efficient
- result changes should be noticeable but not noisy

## 11. Technical Architecture

### 11.1 v1 Delivery Strategy

Because the environment requirement is "do not install extra packages for v1," the default implementation path should be zero-install first.

Recommended v1 approach:

- use Vue 3 in the browser runtime
- use JavaScript only
- use local ES modules for app code
- use Vue Router only if needed through browser-compatible loading
- use Element Plus only if loaded in a way that does not require local package installation

This means v1 should favor a static, browser-run architecture over a local build pipeline.

### 11.2 UI Library Clarification

The user mentioned "Element UI," but with Vue 3 the compatible choice is Element Plus. For this project, "Element UI allowed" is interpreted as "Element Plus may be used where it improves forms, cards, or layout."

If Element Plus creates unnecessary runtime or integration complexity in the no-install setup, the fallback is custom Vue 3 components with project CSS.

### 11.3 Recommended File Structure

```text
index.html
src/
  main.js
  app.js
  router.js
  data/
    profile.js
    experience.js
    projects.js
    skills.js
  views/
    HomeView.js
    FitnessView.js
  components/
    SiteHeader.js
    HeroSection.js
    ExperienceSection.js
    ProjectsSection.js
    SkillsSection.js
    ContactSection.js
    TdeeForm.js
    TdeeBreakdown.js
    TdeeSummary.js
    FutureModules.js
  utils/
    tdee.js
    macros.js
    storage.js
  styles/
    tokens.css
    base.css
    home.css
    fitness.css
```

### 11.4 Separation of Concerns

- profile and resume-derived content live in `data/`
- calculator logic lives in `utils/`
- presentational structure lives in `components/` and `views/`
- styles are organized by global tokens, shared base styles, and page-specific styles

This keeps the site easy to maintain even without a full build toolchain.

## 12. Risks and Mitigations

### 12.1 Risk: False Precision

If the calculator looks too exact, users may over-trust it.

Mitigation:

- label outputs as estimates
- show the calculation structure
- provide ranges for cut and lean-gain guidance

### 12.2 Risk: Homepage and Tool Feel Disconnected

If the homepage is too editorial and the tool is too utilitarian, the site may feel split.

Mitigation:

- use one shared visual system
- repeat the same positioning language across both pages
- include the workbench as part of the public identity, not as a hidden side project

### 12.3 Risk: No-Install Constraint Limits Developer Ergonomics

Without a build pipeline, Vue single-file components and package-managed UI libraries are not available by default.

Mitigation:

- structure code as local ES modules from the start
- keep component boundaries clean
- preserve a later migration path to a Vite project if the user decides installation is acceptable

## 13. Implementation Notes for the Next Phase

The next planning phase should cover:

- final page layout and section ordering
- exact data schema for personal content
- exact TDEE formula decisions and constants
- local storage schema
- whether v1 uses native UI only or a minimal Element Plus integration path
- how to seed the homepage content from the resume assets without depending on PDF parsing at runtime

## 14. Review Notes

- This workspace is currently not a Git repository, so a design-doc commit cannot be created from this folder unless version control is initialized elsewhere.
- A sub-agent-based spec review loop was not used here because this session is not authorized for delegated agent work. The spec should therefore receive a manual review in the next step.
