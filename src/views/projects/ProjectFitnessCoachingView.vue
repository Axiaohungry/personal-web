<script setup>
import ProjectCaseSection from '@/components/projects/ProjectCaseSection.vue'
import ProjectCaseShell from '@/components/projects/ProjectCaseShell.vue'
import ProjectEvidenceGrid from '@/components/projects/ProjectEvidenceGrid.vue'
import { fitnessCoachingCase } from '@/data/projectCases/fitnessCoaching.js'

const page = fitnessCoachingCase
</script>

<template>
  <ProjectCaseShell :hero="page.hero" variant="fitness-coaching">
    <template #hero="{ hero }">
      <div class="project-case-hero__content project-case-fitness__hero">
        <p class="eyebrow project-case-hero__eyebrow">{{ hero.eyebrow }}</p>

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

        <div class="chip-list project-case-fitness__tags">
          <a-tag v-for="tag in hero.tags" :key="tag">
            {{ tag }}
          </a-tag>
        </div>

        <div class="project-case-fitness__signals">
          <article v-for="signal in hero.signals" :key="signal.label" class="project-case-fitness__signal">
            <p class="project-case-fitness__signal-label">{{ signal.label }}</p>
            <p class="project-case-fitness__signal-value">{{ signal.value }}</p>
          </article>
        </div>
      </div>
    </template>

    <ProjectCaseSection
      :eyebrow="page.problemSection.eyebrow"
      :title="page.problemSection.title"
      :intro="page.problemSection.intro"
    >
      <ul class="project-case-fitness__problem-list">
        <li v-for="problem in page.userProblems" :key="problem" class="project-case-fitness__problem-item">
          {{ problem }}
        </li>
      </ul>
    </ProjectCaseSection>

    <ProjectCaseSection
      :eyebrow="page.processSection.eyebrow"
      :title="page.processSection.title"
      :intro="page.processSection.intro"
    >
      <ol class="project-case-fitness__steps">
        <li v-for="(step, index) in page.process" :key="step.key" class="project-case-fitness__step">
          <span class="project-case-fitness__step-key">
            {{ page.processSection.stepLabelPrefix }} {{ index + 1 }} {{ page.processSection.stepLabelSuffix }}
          </span>
          <strong class="project-case-fitness__step-title">{{ step.title }}</strong>
          <p class="project-case-fitness__step-detail">{{ step.description }}</p>
        </li>
      </ol>
    </ProjectCaseSection>

    <ProjectCaseSection
      :eyebrow="page.evidenceSection.eyebrow"
      :title="page.evidenceSection.title"
      :intro="page.evidenceSection.intro"
    >
      <ProjectEvidenceGrid :items="page.evidence" />
    </ProjectCaseSection>

    <ProjectCaseSection
      :eyebrow="page.outcomesSection.eyebrow"
      :title="page.outcomesSection.title"
      :intro="page.outcomesSection.intro"
    >
      <div class="project-case-fitness__outcomes">
        <p class="project-case-fitness__outcome-summary">
          {{ page.outcomes.summary }}
        </p>

        <div class="chip-list project-case-fitness__capabilities">
          <a-tag v-for="capability in page.outcomes.capabilities" :key="capability">
            {{ capability }}
          </a-tag>
        </div>

        <ul class="project-case-fitness__reflections">
          <li v-for="reflection in page.outcomes.reflections" :key="reflection">
            {{ reflection }}
          </li>
        </ul>
      </div>
    </ProjectCaseSection>

    <ProjectCaseSection
      :eyebrow="page.bridgeSection.eyebrow"
      :title="page.bridgeSection.title"
      :intro="page.bridgeSection.intro"
    >
      <div class="project-case-fitness__bridge">
        <p class="project-case-fitness__bridge-copy">
          {{ page.bridgeSection.copy }}
        </p>
        <a class="project-case-fitness__cta" :href="page.bridgeCta.href">
          {{ page.bridgeCta.label }}
        </a>
      </div>
    </ProjectCaseSection>
  </ProjectCaseShell>
</template>

<style scoped>
.project-case-fitness__hero {
  max-width: 58rem;
}

.project-case-fitness__tags,
.project-case-fitness__signals,
.project-case-fitness__problem-list,
.project-case-fitness__steps,
.project-case-fitness__reflections {
  display: grid;
  gap: 0.75rem;
}

.project-case-fitness__signals {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 0.5rem;
}

.project-case-fitness__signal,
.project-case-fitness__problem-item,
.project-case-fitness__step,
.project-case-fitness__bridge {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
}

.project-case-fitness__signal {
  padding: 0.95rem 1rem;
  display: grid;
  gap: 0.35rem;
}

.project-case-fitness__signal-label,
.project-case-fitness__step-key {
  margin: 0;
  color: var(--accent);
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.project-case-fitness__signal-value,
.project-case-fitness__step-detail,
.project-case-fitness__outcome-summary,
.project-case-fitness__bridge-copy {
  margin: 0;
  color: var(--muted);
  line-height: 1.75;
}

.project-case-fitness__problem-list,
.project-case-fitness__reflections {
  margin: 0;
  padding: 0;
  list-style: none;
}

.project-case-fitness__problem-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.project-case-fitness__problem-item {
  padding: 0.95rem 1rem;
  line-height: 1.75;
}

.project-case-fitness__steps {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
}

.project-case-fitness__step {
  padding: 1rem;
  display: grid;
  gap: 0.45rem;
}

.project-case-fitness__step-title {
  margin: 0;
  font-size: 1.04rem;
}

.project-case-fitness__outcomes {
  display: grid;
  gap: 0.95rem;
}

.project-case-fitness__reflections {
  padding-left: 1.1rem;
  list-style: disc;
}

.project-case-fitness__reflections li {
  color: var(--muted);
  line-height: 1.75;
}

.project-case-fitness__bridge {
  display: grid;
  gap: 1rem;
  padding: 1.1rem;
  background:
    linear-gradient(180deg, rgba(57, 81, 60, 0.06), rgba(174, 119, 72, 0.05)),
    var(--panel-soft);
}

.project-case-fitness__cta {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 0.8rem 1rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--text);
  font-weight: 600;
  text-decoration: none;
}

.project-case-fitness__cta:hover {
  border-color: var(--accent);
}

@media (max-width: 1080px) {
  .project-case-fitness__signals,
  .project-case-fitness__problem-list,
  .project-case-fitness__steps {
    grid-template-columns: 1fr;
  }
}
</style>
