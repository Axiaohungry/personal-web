<script setup>
import ProjectCaseSection from '@/components/projects/ProjectCaseSection.vue'
import ProjectCaseShell from '@/components/projects/ProjectCaseShell.vue'
import ProjectCaseSignalRail from '@/components/projects/ProjectCaseSignalRail.vue'
import ProjectEvidenceGrid from '@/components/projects/ProjectEvidenceGrid.vue'
import { fitnessCoachingCase } from '@/data/projectCases/fitnessCoaching.js'

const page = fitnessCoachingCase
</script>

<template>
  <ProjectCaseShell class="project-case-fitness-view" :hero="page.hero" variant="fitness-coaching">
    <template #hero="{ hero }">
      <div class="project-case-fitness__hero">
        <div class="project-case-fitness__hero-copy">
          <p v-if="hero.eyebrow" class="eyebrow project-case-fitness__hero-eyebrow">
            {{ hero.eyebrow }}
          </p>

          <div class="project-case-hero__heading">
            <h1 class="project-case-hero__title">
              {{ hero.title }}
            </h1>
            <p v-if="hero.subtitle" class="project-case-hero__subtitle">
              {{ hero.subtitle }}
            </p>
          </div>

          <p class="project-case-hero__summary">
            {{ hero.summary }}
          </p>

          <p class="project-case-fitness__hero-note">
            我把咨询、计划、跟进和复盘收进同一条服务线里，页面只负责把这条线说清楚。
          </p>
        </div>

        <ProjectCaseSignalRail class="project-case-fitness__rail" :items="hero.signals" />
      </div>
    </template>

    <ProjectCaseSection
      class="project-case-fitness__stage project-case-fitness__stage--problem"
      variant="bare"
      :eyebrow="page.problemSection.eyebrow"
      :title="page.problemSection.title"
      :intro="page.problemSection.intro"
    >
      <ul class="project-case-fitness__problem-list">
        <li
          v-for="(problem, index) in page.userProblems"
          :key="problem"
          class="project-case-fitness__problem-item"
        >
          <p class="project-case-fitness__problem-index">0{{ index + 1 }}</p>
          <p class="project-case-fitness__problem-copy">
            {{ problem }}
          </p>
        </li>
      </ul>
    </ProjectCaseSection>

    <ProjectCaseSection
      class="project-case-fitness__stage project-case-fitness__stage--process"
      variant="panel"
      :eyebrow="page.processSection.eyebrow"
      :title="page.processSection.title"
      :intro="page.processSection.intro"
    >
      <ol class="project-case-fitness__steps">
        <li v-for="(step, index) in page.process" :key="step.key" class="project-case-fitness__step">
          <p class="project-case-fitness__step-key">
            {{ page.processSection.stepLabelPrefix }} {{ index + 1 }} {{ page.processSection.stepLabelSuffix }}
          </p>
          <strong class="project-case-fitness__step-title">{{ step.title }}</strong>
          <p class="project-case-fitness__step-detail">{{ step.description }}</p>
        </li>
      </ol>
    </ProjectCaseSection>

    <ProjectCaseSection
      class="project-case-fitness__stage project-case-fitness__stage--proof"
      variant="proof"
      :eyebrow="page.evidenceSection.eyebrow"
      :title="page.evidenceSection.title"
      :intro="page.evidenceSection.intro"
    >
      <div class="project-case-fitness__proof">
        <p class="project-case-fitness__proof-copy">
          这些图不是装饰，而是为了把方法、节奏和交付位置钉住。
        </p>

        <ProjectEvidenceGrid :items="page.evidence" />
      </div>
    </ProjectCaseSection>

    <ProjectCaseSection
      class="project-case-fitness__stage project-case-fitness__stage--outcomes"
      variant="bare"
      :eyebrow="page.outcomesSection.eyebrow"
      :title="page.outcomesSection.title"
      :intro="page.outcomesSection.intro"
    >
      <div class="project-case-fitness__outcomes">
        <p class="project-case-fitness__outcome-summary">
          {{ page.outcomes.summary }}
        </p>

        <div class="project-case-fitness__outcome-grid">
          <div class="project-case-fitness__capability-block">
            <p class="project-case-fitness__section-label">沉淀能力</p>

            <div class="chip-list project-case-fitness__capabilities">
              <a-tag v-for="capability in page.outcomes.capabilities" :key="capability">
                {{ capability }}
              </a-tag>
            </div>
          </div>

          <ul class="project-case-fitness__reflections">
            <li v-for="reflection in page.outcomes.reflections" :key="reflection">
              {{ reflection }}
            </li>
          </ul>
        </div>
      </div>
    </ProjectCaseSection>

    <ProjectCaseSection
      class="project-case-fitness__stage project-case-fitness__stage--bridge"
      variant="bare"
      :eyebrow="page.bridgeSection.eyebrow"
      :title="page.bridgeSection.title"
      :intro="page.bridgeSection.intro"
    >
      <div class="project-case-fitness__bridge">
        <p class="project-case-fitness__bridge-copy">
          {{ page.bridgeSection.copy }}
        </p>
        <div class="project-case-fitness__bridge-action">
          <p class="project-case-fitness__bridge-note">
            方法在这里收束，工具页继续承接输入、建议和复盘。
          </p>
          <a class="project-case-fitness__bridge-link" :href="page.bridgeCta.href">
            {{ page.bridgeCta.label }}
          </a>
        </div>
      </div>
    </ProjectCaseSection>
  </ProjectCaseShell>
</template>

<style scoped>
.project-case-fitness-view {
  position: relative;
  isolation: isolate;
  overflow-x: clip;
}

.project-case-fitness-view::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 12% 8%, rgba(174, 119, 72, 0.07), transparent 18%),
    radial-gradient(circle at 86% 14%, rgba(57, 81, 60, 0.07), transparent 20%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 36%);
  pointer-events: none;
}

.project-case-fitness-view :deep(.project-case-page__shell) {
  gap: 0.85rem;
}

.project-case-fitness-view :deep(.project-case-hero) {
  padding: clamp(1.1rem, 2.6vw, 1.75rem);
}

.project-case-fitness-view :deep(.project-case-hero__title) {
  max-width: 12ch;
  font-size: clamp(2.4rem, 5vw, 4.45rem);
  line-height: 0.96;
  letter-spacing: -0.05em;
}

.project-case-fitness-view :deep(.project-case-hero__subtitle),
.project-case-fitness-view :deep(.project-case-hero__summary) {
  max-width: 42rem;
}

.project-case-fitness__hero {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(18rem, 0.7fr);
  gap: clamp(1rem, 2vw, 1.5rem);
  align-items: end;
  max-width: 72rem;
}

.project-case-fitness__hero-copy {
  display: grid;
  gap: 0.7rem;
  max-width: 48rem;
}

.project-case-fitness__hero-note,
.project-case-fitness__problem-copy,
.project-case-fitness__step-detail,
.project-case-fitness__proof-copy,
.project-case-fitness__outcome-summary,
.project-case-fitness__bridge-copy,
.project-case-fitness__bridge-note,
.project-case-fitness__reflections li {
  margin: 0;
  color: var(--muted);
  line-height: 1.75;
}

.project-case-fitness__hero-note {
  max-width: 40rem;
}

.project-case-fitness__rail {
  align-self: stretch;
}

.project-case-fitness__rail :deep(.project-case-signal-rail__list) {
  display: grid;
  gap: 0.6rem;
}

.project-case-fitness__rail :deep(.project-case-signal-rail__item) {
  display: grid;
  gap: 0.3rem;
  padding: 0.88rem 0.96rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--panel-soft) 90%, transparent);
}

.project-case-fitness__rail :deep(.project-case-signal-rail__label) {
  margin: 0;
  color: var(--accent);
  font-size: 0.76rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.project-case-fitness__rail :deep(.project-case-signal-rail__value),
.project-case-fitness__rail :deep(.project-case-signal-rail__note),
.project-case-fitness__rail :deep(.project-case-signal-rail__subtext) {
  margin: 0;
  line-height: 1.6;
}

.project-case-fitness__stage {
  margin-top: clamp(0.85rem, 2vw, 1.1rem);
}

.project-case-fitness__problem-list,
.project-case-fitness__steps,
.project-case-fitness__reflections {
  margin: 0;
  padding: 0;
  list-style: none;
}

.project-case-fitness__problem-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid var(--line);
}

.project-case-fitness__problem-item {
  display: grid;
  gap: 0.4rem;
  padding: 1rem 0.25rem 1rem 0;
  border-bottom: 1px solid var(--line);
}

.project-case-fitness__problem-item:nth-child(odd) {
  padding-right: 1.25rem;
}

.project-case-fitness__problem-index,
.project-case-fitness__step-key,
.project-case-fitness__section-label {
  margin: 0;
  color: var(--accent);
  font-size: 0.76rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.project-case-fitness__steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid var(--line);
}

.project-case-fitness__step {
  display: grid;
  gap: 0.5rem;
  padding: 1rem 0.9rem 0;
}

.project-case-fitness__step + .project-case-fitness__step {
  border-inline-start: 1px solid color-mix(in srgb, var(--line) 82%, transparent);
}

.project-case-fitness__step-title {
  margin: 0;
  font-size: 1.02rem;
}

.project-case-fitness__proof {
  display: grid;
  gap: 0.85rem;
}

.project-case-fitness__outcomes {
  display: grid;
  gap: 0.95rem;
}

.project-case-fitness__outcome-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.95fr);
  gap: 1rem;
  align-items: start;
}

.project-case-fitness__capability-block {
  display: grid;
  gap: 0.55rem;
}

.project-case-fitness__capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.project-case-fitness__reflections {
  display: grid;
  gap: 0.65rem;
  padding-left: 1.1rem;
  list-style: disc;
}

.project-case-fitness__bridge {
  display: grid;
  gap: 0.85rem;
  max-width: 58rem;
  padding-top: 0.25rem;
  border-top: 1px solid var(--line);
}

.project-case-fitness__bridge-action {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.8rem 1rem;
}

.project-case-fitness__bridge-link {
  display: inline-flex;
  align-items: center;
  color: var(--text);
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 60%, transparent);
  padding-bottom: 0.15rem;
}

.project-case-fitness__bridge-link:hover {
  border-bottom-color: var(--accent);
}

@media (max-width: 1080px) {
  .project-case-fitness__hero,
  .project-case-fitness__problem-list,
  .project-case-fitness__steps,
  .project-case-fitness__outcome-grid {
    grid-template-columns: 1fr;
  }

  .project-case-fitness__step + .project-case-fitness__step {
    border-inline-start: 0;
    border-top: 1px solid color-mix(in srgb, var(--line) 82%, transparent);
  }

  .project-case-fitness__problem-item:nth-child(odd) {
    padding-right: 0.25rem;
  }
}

@media (max-width: 720px) {
  .project-case-fitness-view :deep(.project-case-hero),
  .project-case-fitness__stage {
    padding-inline: 1rem;
  }

  .project-case-fitness-view :deep(.project-case-hero__title) {
    font-size: clamp(2.2rem, 10vw, 3.5rem);
  }

  .project-case-fitness__problem-list {
    gap: 0;
  }
}
</style>
