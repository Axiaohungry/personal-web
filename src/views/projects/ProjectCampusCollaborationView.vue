<script setup>
import ProjectCaseSection from '@/components/projects/ProjectCaseSection.vue'
import ProjectCaseShell from '@/components/projects/ProjectCaseShell.vue'
import ProjectEvidenceGrid from '@/components/projects/ProjectEvidenceGrid.vue'
import { campusCollaborationCase } from '@/data/projectCases/campusCollaboration.js'

const page = campusCollaborationCase

const positioningKicker = '为什么这不是办活动'
const outcomesCapabilitiesKicker = '可复用能力'
</script>

<template>
  <ProjectCaseShell :hero="page.hero" variant="campus-collaboration">
    <ProjectCaseSection
      :eyebrow="page.positioningSection.eyebrow"
      :title="page.positioningSection.title"
      :intro="page.positioningSection.intro"
      variant="bare"
    >
      <div class="project-case-campus__positioning">
        <div class="project-case-campus__positioning-copy">
          <p class="project-case-campus__section-kicker">{{ positioningKicker }}</p>
          <p class="project-case-campus__positioning-lede">
            先把问题框清楚，再谈协作、动作和结果。校园合作不是单次活动，而是一套
            需要被拆解、对齐和复用的执行机制。
          </p>
        </div>

        <ul class="project-case-campus__complexity">
          <li v-for="item in page.complexity" :key="item" class="project-case-campus__complexity-item">
            {{ item }}
          </li>
        </ul>
      </div>
    </ProjectCaseSection>

    <ProjectCaseSection
      :eyebrow="page.leadCaseSection.eyebrow"
      :title="page.leadCaseSection.title"
      :intro="page.leadCaseSection.intro"
      variant="panel"
    >
      <article class="project-case-campus__lead-stage">
        <div class="project-case-campus__lead-head">
          <p class="project-case-campus__lead-role">{{ page.leadCase.role }}</p>
          <h3 class="project-case-campus__lead-title">{{ page.leadCase.title }}</h3>
          <p class="project-case-campus__lead-summary">
            {{ page.leadCase.summary }}
          </p>
        </div>

        <div class="project-case-campus__lead-grid">
          <section class="project-case-campus__lead-track">
            <p class="project-case-campus__lead-label">{{ page.leadCaseSection.methodLabel }}</p>
            <ul class="project-case-campus__lead-highlights">
              <li v-for="item in page.leadCase.highlights" :key="item">
                {{ item }}
              </li>
            </ul>
          </section>

          <section class="project-case-campus__lead-note">
            <p class="project-case-campus__lead-label">{{ page.leadCaseSection.perspectiveLabel }}</p>
            <p class="project-case-campus__lead-note-copy">
              {{ page.leadCaseSection.perspectiveCopy }}
            </p>
          </section>
        </div>
      </article>
    </ProjectCaseSection>

    <ProjectCaseSection
      :eyebrow="page.processSection.eyebrow"
      :title="page.processSection.title"
      :intro="page.processSection.intro"
      variant="panel"
    >
      <ol class="project-case-campus__process-list">
        <li v-for="(step, index) in page.process" :key="step.key" class="project-case-campus__process-step">
          <p class="project-case-campus__step-index">
            {{ page.processSection.stepLabelPrefix }}{{ index + 1 }}{{ page.processSection.stepLabelSuffix }}
          </p>
          <strong class="project-case-campus__step-title">{{ step.title }}</strong>
          <p class="project-case-campus__step-detail">{{ step.description }}</p>
        </li>
      </ol>
    </ProjectCaseSection>

    <ProjectCaseSection
      :eyebrow="page.supportingSection.eyebrow"
      :title="page.supportingSection.title"
      :intro="page.supportingSection.intro"
      variant="proof"
    >
      <div class="project-case-campus__proof-columns">
        <article
          v-for="(item, index) in page.supportingCases"
          :key="item.title"
          class="project-case-campus__proof-column"
        >
          <p class="project-case-campus__proof-index">证明 {{ index + 1 }}</p>
          <p class="project-case-campus__proof-title">{{ item.title }}</p>
          <p class="project-case-campus__proof-summary">{{ item.summary }}</p>
          <p class="project-case-campus__proof-detail">{{ item.detail }}</p>
        </article>
      </div>
    </ProjectCaseSection>

    <ProjectCaseSection
      :eyebrow="page.evidenceSection.eyebrow"
      :title="page.evidenceSection.title"
      :intro="page.evidenceSection.intro"
      variant="proof"
    >
      <div class="project-case-campus__evidence">
        <ProjectEvidenceGrid :items="page.evidence" />
      </div>
    </ProjectCaseSection>

    <ProjectCaseSection
      :eyebrow="page.outcomesSection.eyebrow"
      :title="page.outcomesSection.title"
      :intro="page.outcomesSection.intro"
      variant="bare"
    >
      <div class="project-case-campus__outcomes">
        <p class="project-case-campus__outcome-summary">
          {{ page.outcomes.summary }}
        </p>

        <div class="project-case-campus__outcome-grid">
          <div class="project-case-campus__outcome-capabilities">
            <p class="project-case-campus__section-kicker">{{ outcomesCapabilitiesKicker }}</p>
            <div class="chip-list project-case-campus__capabilities">
              <a-tag v-for="capability in page.outcomes.capabilities" :key="capability">
                {{ capability }}
              </a-tag>
            </div>
          </div>

          <ul class="project-case-campus__reflections">
            <li v-for="reflection in page.outcomes.reflections" :key="reflection">
              {{ reflection }}
            </li>
          </ul>
        </div>
      </div>
    </ProjectCaseSection>
  </ProjectCaseShell>
</template>

<style scoped>
.project-case-campus__positioning,
.project-case-campus__lead-grid,
.project-case-campus__outcome-grid {
  display: grid;
  gap: 1rem;
}

.project-case-campus__positioning {
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  align-items: start;
}

.project-case-campus__positioning-copy {
  display: grid;
  gap: 0.7rem;
}

.project-case-campus__section-kicker,
.project-case-campus__lead-label,
.project-case-campus__step-index,
.project-case-campus__proof-index {
  margin: 0;
  color: var(--accent);
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.project-case-campus__positioning-lede,
.project-case-campus__complexity-item,
.project-case-campus__lead-summary,
.project-case-campus__lead-note-copy,
.project-case-campus__step-detail,
.project-case-campus__proof-summary,
.project-case-campus__proof-detail,
.project-case-campus__outcome-summary,
.project-case-campus__reflections li {
  margin: 0;
  color: var(--muted);
  line-height: 1.75;
}

.project-case-campus__complexity {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.project-case-campus__complexity-item {
  padding: 0.95rem 1rem;
  border: 1px solid var(--line);
  border-left: 3px solid color-mix(in srgb, var(--accent) 70%, transparent);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--panel-soft) 92%, var(--accent) 4%);
}

.project-case-campus__lead-stage {
  display: grid;
  gap: 1rem;
}

.project-case-campus__lead-head {
  display: grid;
  gap: 0.5rem;
  max-width: 52rem;
}

.project-case-campus__lead-role {
  margin: 0;
  color: var(--text);
  font-weight: 600;
  font-size: 1.02rem;
}

.project-case-campus__lead-title {
  margin: 0;
  color: var(--text);
  font-size: clamp(1.55rem, 3vw, 2.2rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.project-case-campus__lead-grid {
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.95fr);
}

.project-case-campus__lead-track,
.project-case-campus__lead-note,
.project-case-campus__proof-column {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
}

.project-case-campus__lead-track,
.project-case-campus__lead-note {
  padding: 1rem;
}

.project-case-campus__lead-track {
  display: grid;
  gap: 0.8rem;
}

.project-case-campus__lead-highlights {
  margin: 0;
  padding-left: 1.1rem;
  list-style: disc;
  display: grid;
  gap: 0.65rem;
}

.project-case-campus__lead-highlights li,
.project-case-campus__reflections li {
  color: var(--muted);
}

.project-case-campus__lead-note {
  background:
    linear-gradient(180deg, rgba(174, 119, 72, 0.08), rgba(57, 81, 60, 0.04)),
    var(--panel-soft);
}

.project-case-campus__process-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.9rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.project-case-campus__process-step {
  display: grid;
  gap: 0.5rem;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
}

.project-case-campus__step-title {
  margin: 0;
  color: var(--text);
  font-size: 1.02rem;
}

.project-case-campus__proof-columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.project-case-campus__proof-column {
  display: grid;
  gap: 0.55rem;
  padding: 1rem;
}

.project-case-campus__proof-title {
  margin: 0;
  color: var(--text);
  font-weight: 600;
}

.project-case-campus__evidence {
  display: grid;
  gap: 1rem;
}

.project-case-campus__outcomes {
  display: grid;
  gap: 1rem;
}

.project-case-campus__outcome-grid {
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
  align-items: start;
}

.project-case-campus__capabilities {
  margin-top: 0.6rem;
}

.project-case-campus__reflections {
  margin: 0;
  padding-left: 1.1rem;
  list-style: disc;
  display: grid;
  gap: 0.7rem;
}

@media (max-width: 1080px) {
  .project-case-campus__positioning,
  .project-case-campus__lead-grid,
  .project-case-campus__outcome-grid,
  .project-case-campus__process-list,
  .project-case-campus__proof-columns {
    grid-template-columns: 1fr;
  }
}
</style>
