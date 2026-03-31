<script setup>
import ProjectCaseSection from '@/components/projects/ProjectCaseSection.vue'
import ProjectCaseShell from '@/components/projects/ProjectCaseShell.vue'
import ProjectEvidenceGrid from '@/components/projects/ProjectEvidenceGrid.vue'
import { approvalMapWorkflowCase } from '@/data/projectCases/approvalMapWorkflow.js'

const page = approvalMapWorkflowCase
</script>

<template>
  <ProjectCaseShell :hero="page.hero" variant="approval-map">
    <template #hero="{ hero }">
      <div class="project-case-hero__content project-case-approval__hero">
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

        <div class="chip-list project-case-approval__tags">
          <a-tag v-for="tag in hero.tags" :key="tag">
            {{ tag }}
          </a-tag>
        </div>

        <div class="project-case-approval__signals">
          <article v-for="signal in hero.signals" :key="signal.label" class="project-case-approval__signal">
            <p class="project-case-approval__signal-label">{{ signal.label }}</p>
            <p class="project-case-approval__signal-value">{{ signal.value }}</p>
          </article>
        </div>
      </div>
    </template>

    <ProjectCaseSection
      eyebrow="复杂度"
      title="为什么这个页面需要被认真拆开"
      intro="审批地图类页面的难点，不在于图层本身，而在于把对象、表单和状态变成统一叙事。"
    >
      <ul class="project-case-approval__list project-case-approval__list--stack">
        <li v-for="item in page.complexity" :key="item" class="project-case-approval__list-item">
          {{ item }}
        </li>
      </ul>
    </ProjectCaseSection>

    <ProjectCaseSection
      eyebrow="职责"
      title="我在这个案例里负责什么"
      intro="职责不是堆功能点，而是把跨角色的理解收束成一套能交付的页面结构。"
    >
      <div class="project-case-approval__grid">
        <article v-for="item in page.responsibilities" :key="item" class="project-case-approval__panel">
          {{ item }}
        </article>
      </div>
    </ProjectCaseSection>

    <ProjectCaseSection
      eyebrow="流程"
      title="四步工作法"
      intro="从发现问题到交付结果，页面结构沿着同一条阅读路径展开。"
    >
      <ol class="project-case-approval__steps">
        <li v-for="step in page.process" :key="step.key" class="project-case-approval__step">
          <span class="project-case-approval__step-key">{{ step.key }}</span>
          <strong class="project-case-approval__step-title">{{ step.title }}</strong>
          <p class="project-case-approval__step-detail">{{ step.description }}</p>
        </li>
      </ol>
    </ProjectCaseSection>

    <ProjectCaseSection
      eyebrow="证据"
      title="可替换的公开证据"
      intro="三张静态图先把叙事位立住，后续可以平滑替换成真实裁切图。"
    >
      <ProjectEvidenceGrid :items="page.evidence" />
    </ProjectCaseSection>

    <ProjectCaseSection
      eyebrow="结果与反思"
      title="我希望招聘方读到什么"
      intro="这是一个强调交付边界的案例，不是单纯展示功能堆叠的页面。"
    >
      <div class="project-case-approval__outcomes">
        <p class="project-case-approval__outcome-summary">
          {{ page.outcomes.summary }}
        </p>

        <p class="project-case-approval__disclaimer">
          {{ page.outcomes.disclaimer }}
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
      </div>
    </ProjectCaseSection>
  </ProjectCaseShell>
</template>

<style scoped>
.project-case-approval__hero {
  max-width: 52rem;
}

.project-case-approval__tags,
.project-case-approval__signals,
.project-case-approval__grid,
.project-case-approval__steps,
.project-case-approval__reflections {
  display: grid;
  gap: 0.75rem;
}

.project-case-approval__signals {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.project-case-approval__signal,
.project-case-approval__panel,
.project-case-approval__step {
  padding: 0.95rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
}

.project-case-approval__signal {
  display: grid;
  gap: 0.35rem;
}

.project-case-approval__signal-label,
.project-case-approval__step-key {
  margin: 0;
  color: var(--accent);
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.project-case-approval__signal-value,
.project-case-approval__step-detail,
.project-case-approval__outcome-summary,
.project-case-approval__disclaimer {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

.project-case-approval__list,
.project-case-approval__reflections {
  margin: 0;
  padding: 0;
  list-style: none;
}

.project-case-approval__list--stack {
  display: grid;
  gap: 0.75rem;
}

.project-case-approval__list-item {
  padding: 0.9rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
  line-height: 1.7;
}

.project-case-approval__grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.project-case-approval__panel {
  line-height: 1.7;
}

.project-case-approval__steps {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;
}

.project-case-approval__step {
  display: grid;
  gap: 0.45rem;
}

.project-case-approval__step-title {
  margin: 0;
  font-size: 1.04rem;
}

.project-case-approval__outcomes {
  display: grid;
  gap: 0.95rem;
}

.project-case-approval__capabilities {
  margin-top: 0.25rem;
}

.project-case-approval__reflections {
  gap: 0.6rem;
  padding-left: 1.1rem;
  list-style: disc;
}

.project-case-approval__reflections li {
  line-height: 1.7;
  color: var(--muted);
}

@media (max-width: 1080px) {
  .project-case-approval__signals,
  .project-case-approval__grid,
  .project-case-approval__steps {
    grid-template-columns: 1fr;
  }
}
</style>
