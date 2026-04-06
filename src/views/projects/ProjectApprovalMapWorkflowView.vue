<script setup>
import ProjectCaseSection from '@/components/projects/ProjectCaseSection.vue'
import ProjectCaseShell from '@/components/projects/ProjectCaseShell.vue'
import ProjectEvidenceGrid from '@/components/projects/ProjectEvidenceGrid.vue'
import { approvalMapWorkflowCase } from '@/data/projectCases/approvalMapWorkflow.js'

const page = approvalMapWorkflowCase
</script>

<template>
  <ProjectCaseShell class="project-case-approval-map-view" :hero="page.hero" variant="approval-map">
    <ProjectCaseSection
      class="project-case-approval__stage project-case-approval__stage--bare"
      variant="bare"
      :eyebrow="page.difficultySection.eyebrow"
      title="痛点解构"
      :intro="page.difficultySection.intro"
    >
      <div class="project-case-approval__two-up">
        <article class="project-case-approval__substage">
          <p class="project-case-approval__substage-kicker">
            {{ page.difficultySection.title }}
          </p>
          <p class="project-case-approval__substage-copy">
            这不是把审批对象重新画一遍，而是先把“审批人员效率”定义为终点，再决定交互怎么收束、接口怎么聚合、自动化该做到哪里。
          </p>

          <ul class="project-case-approval__complexity-list">
            <li v-for="item in page.complexity" :key="item" class="project-case-approval__complexity-item">
              {{ item }}
            </li>
          </ul>
        </article>

        <article class="project-case-approval__substage">
          <p class="project-case-approval__substage-kicker">
            {{ page.responsibilitySection.title }}
          </p>
          <p class="project-case-approval__substage-copy">
            {{ page.responsibilitySection.intro }}
          </p>

          <div class="project-case-approval__responsibility-grid">
            <article
              v-for="(item, index) in page.responsibilities"
              :key="item"
              class="project-case-approval__responsibility-item"
            >
              <p class="project-case-approval__item-kicker">职责 {{ index + 1 }}</p>
              <p class="project-case-approval__responsibility-copy">
                {{ item }}
              </p>
            </article>
          </div>
        </article>
      </div>
    </ProjectCaseSection>

    <ProjectCaseSection
      class="project-case-approval__stage project-case-approval__stage--panel"
      variant="panel"
      :eyebrow="page.processSection.eyebrow"
      title="我怎么把它收束成价值闭环"
      :intro="page.processSection.intro"
    >
      <div class="project-case-approval__workflow">
        <div class="project-case-approval__workflow-lead">
          <p class="project-case-approval__substage-kicker">
            {{ page.processSection.title }}
          </p>
          <p class="project-case-approval__workflow-copy">
            我没有把它理解成一次前端改版，而是把视图聚合、接口聚合和数据预填收束成同一条交付链路，让每个技术决策都直接服务审批效率。
          </p>
        </div>

        <ol class="project-case-approval__process-list">
          <li v-for="(step, index) in page.process" :key="step.key" class="project-case-approval__process-step">
            <span class="project-case-approval__process-step-key">
              {{ page.processSection.stepLabelPrefix }} {{ index + 1 }}{{ page.processSection.stepLabelSuffix }}
            </span>
            <strong class="project-case-approval__process-step-title">
              {{ step.title }}
            </strong>
            <p class="project-case-approval__process-step-detail">
              {{ step.description }}
            </p>
          </li>
        </ol>
      </div>
    </ProjectCaseSection>

    <ProjectCaseSection
      class="project-case-approval__stage project-case-approval__stage--proof"
      variant="proof"
      :eyebrow="page.evidenceSection.eyebrow"
      title="证据与价值交付"
      :intro="page.evidenceSection.intro"
    >
      <div class="project-case-approval__proof">
        <p class="project-case-approval__proof-note">
          这些图不是装饰，而是验证痛点、方案和结果的证据位。后续替换为真实截图后，仍然能完整证明 4 合 1 视图、4 接口 -> 1 聚合接口与效率收益。
        </p>

        <ProjectEvidenceGrid :items="page.evidence" />

        <article class="project-case-approval__outcomes">
          <p class="project-case-approval__substage-kicker">
            {{ page.outcomesSection.title }}
          </p>
          <p class="project-case-approval__outcome-summary">
            {{ page.outcomes.summary }}
          </p>

          <div class="chip-list project-case-approval__capabilities">
            <a-tag v-for="capability in page.outcomes.capabilities" :key="capability">
              {{ capability }}
            </a-tag>
          </div>

          <ul class="project-case-approval__reflections">
            <li v-for="reflection in page.outcomes.reflections" :key="reflection">
              {{ reflection }}
            </li>
          </ul>

          <p class="project-case-approval__disclaimer">
            {{ page.outcomes.disclaimer }}
          </p>
        </article>
      </div>
    </ProjectCaseSection>
  </ProjectCaseShell>
</template>

<style scoped>
.project-case-approval-map-view {
  position: relative;
  isolation: isolate;
  overflow-x: clip;
}

.project-case-approval-map-view::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 12% 8%, rgba(180, 85, 45, 0.11), transparent 18%),
    radial-gradient(circle at 86% 14%, rgba(31, 123, 104, 0.11), transparent 20%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 42%);
  pointer-events: none;
}

.project-case-approval-map-view :deep(.project-case-page__shell) {
  gap: 0.95rem;
}

.project-case-approval-map-view :deep(.project-case-hero) {
  padding: clamp(1.2rem, 3vw, 2rem);
}

.project-case-approval-map-view :deep(.project-case-hero__layout) {
  grid-template-columns: minmax(0, 1.55fr) minmax(18rem, 0.95fr);
  gap: clamp(1rem, 2vw, 1.75rem);
}

.project-case-approval-map-view :deep(.project-case-hero__content) {
  max-width: 48rem;
}

.project-case-approval-map-view :deep(.project-case-hero__title) {
  font-size: clamp(2.7rem, 6vw, 5.4rem);
  line-height: 0.94;
  letter-spacing: -0.06em;
}

.project-case-approval__stage {
  margin-top: clamp(0.9rem, 2vw, 1.2rem);
}

.project-case-approval__two-up,
.project-case-approval__workflow,
.project-case-approval__proof {
  display: grid;
  gap: 1.15rem;
}

.project-case-approval__two-up {
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
}

.project-case-approval__substage,
.project-case-approval__outcomes {
  display: grid;
  gap: 0.8rem;
  padding: 1.05rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
}

.project-case-approval__substage-kicker,
.project-case-approval__item-kicker,
.project-case-approval__process-step-key {
  margin: 0;
  color: var(--accent);
  font-size: 0.76rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.project-case-approval__substage-copy,
.project-case-approval__workflow-copy,
.project-case-approval__process-step-detail,
.project-case-approval__proof-note,
.project-case-approval__outcome-summary,
.project-case-approval__disclaimer,
.project-case-approval__responsibility-copy {
  margin: 0;
  color: var(--muted);
  line-height: 1.75;
}

.project-case-approval__complexity-list {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.project-case-approval__complexity-item {
  padding: 0.95rem 1rem;
  border: 1px solid var(--line);
  border-inline-start: 3px solid color-mix(in srgb, var(--accent) 60%, var(--line));
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--accent-soft) 20%, transparent), transparent 44%),
    var(--panel);
  line-height: 1.78;
}

.project-case-approval__responsibility-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.project-case-approval__responsibility-item {
  display: grid;
  gap: 0.38rem;
  padding: 0.95rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--panel-soft) 86%, white 14%);
}

.project-case-approval__workflow {
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: calc(var(--radius-lg) + 2px);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--panel) 88%, white 12%), var(--panel-soft));
}

.project-case-approval__workflow-lead {
  display: grid;
  gap: 0.35rem;
  max-width: 42rem;
}

.project-case-approval__process-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--line);
}

.project-case-approval__process-step {
  display: grid;
  align-content: start;
  gap: 0.45rem;
  padding: 1rem 0.9rem 0;
}

.project-case-approval__process-step + .project-case-approval__process-step {
  border-inline-start: 1px solid color-mix(in srgb, var(--line) 80%, transparent);
}

.project-case-approval__process-step-title {
  margin: 0;
  font-size: 1.05rem;
}

.project-case-approval__proof-note {
  max-width: 42rem;
}

.project-case-approval__capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.project-case-approval__reflections {
  display: grid;
  gap: 0.6rem;
  margin: 0;
  padding-left: 1.1rem;
  list-style: disc;
}

.project-case-approval__reflections li {
  color: var(--muted);
  line-height: 1.75;
}

.project-case-approval__disclaimer {
  padding: 0.92rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
}

@media (max-width: 1080px) {
  .project-case-approval-map-view :deep(.project-case-hero__layout),
  .project-case-approval__two-up,
  .project-case-approval__responsibility-grid,
  .project-case-approval__process-list {
    grid-template-columns: 1fr;
  }

  .project-case-approval__process-step + .project-case-approval__process-step {
    border-inline-start: 0;
    border-top: 1px solid color-mix(in srgb, var(--line) 80%, transparent);
  }
}

@media (max-width: 720px) {
  .project-case-approval-map-view :deep(.project-case-hero),
  .project-case-approval__stage {
    padding-inline: 1rem;
  }

  .project-case-approval-map-view :deep(.project-case-hero__title) {
    font-size: clamp(2.3rem, 11vw, 3.6rem);
  }

  .project-case-approval__workflow,
  .project-case-approval__substage,
  .project-case-approval__outcomes {
    padding: 0.9rem;
  }
}
</style>
