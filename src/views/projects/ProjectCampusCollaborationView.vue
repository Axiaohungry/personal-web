<script setup>
import ProjectCaseSection from '@/components/projects/ProjectCaseSection.vue'
import ProjectCaseShell from '@/components/projects/ProjectCaseShell.vue'
import ProjectEvidenceGrid from '@/components/projects/ProjectEvidenceGrid.vue'
import { campusCollaborationCase } from '@/data/projectCases/campusCollaboration.js'

const page = campusCollaborationCase
</script>

<template>
  <ProjectCaseShell :hero="page.hero" variant="campus-collaboration">
    <template #hero="{ hero }">
      <div class="project-case-hero__content project-case-campus__hero">
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

        <div class="chip-list project-case-campus__tags">
          <a-tag v-for="tag in hero.tags" :key="tag">
            {{ tag }}
          </a-tag>
        </div>

        <div class="project-case-campus__signals">
          <article v-for="signal in hero.signals" :key="signal.label" class="project-case-campus__signal">
            <p class="project-case-campus__signal-label">{{ signal.label }}</p>
            <p class="project-case-campus__signal-value">{{ signal.value }}</p>
          </article>
        </div>
      </div>
    </template>

    <ProjectCaseSection
      eyebrow="定位"
      title="为什么这不是“办活动”"
      intro="校园项目最容易被看成一次性事件，但真正有价值的部分，是把协作链路变成能被理解和接手的机制。"
    >
      <div class="project-case-campus__narrative">
        <p class="project-case-campus__paragraph">
          这次实践的重点，不是把页面做得热闹，而是让学生团队、老师、场地与参与者都能在同一条信息链上工作。
          当报名、通知、分工和现场执行共享同一套状态时，项目才有了真正的组织能力。
        </p>

        <ul class="project-case-campus__complexity">
          <li v-for="item in page.complexity" :key="item" class="project-case-campus__complexity-item">
            {{ item }}
          </li>
        </ul>
      </div>
    </ProjectCaseSection>

    <ProjectCaseSection
      eyebrow="主案"
      :title="`主案例：${page.leadCase.title}`"
      intro="主案负责把协作机制真正跑起来，也负责让后续支持案例围绕同一目标展开。"
    >
      <article class="project-case-campus__lead">
        <div class="project-case-campus__lead-top">
          <p class="project-case-campus__lead-role">{{ page.leadCase.role }}</p>
          <p class="project-case-campus__lead-summary">{{ page.leadCase.summary }}</p>
        </div>

        <div class="project-case-campus__lead-body">
          <div>
            <p class="project-case-campus__lead-label">主线方法</p>
            <ul class="project-case-campus__lead-highlights">
              <li v-for="item in page.leadCase.highlights" :key="item">
                {{ item }}
              </li>
            </ul>
          </div>

          <div class="project-case-campus__lead-note">
            <p class="project-case-campus__lead-label">页面视角</p>
            <p>
              我希望招聘方看到的不是“做过一场比赛”，而是我能把多人协作拆成清晰步骤、角色和产物，
              并在结束后继续把经验变成可复用的项目资产。
            </p>
          </div>
        </div>
      </article>
    </ProjectCaseSection>

    <ProjectCaseSection
      eyebrow="机制"
      title="协作机制怎么跑起来"
      intro="从发现边界到沉淀复用，四步把一个校园项目从现场型工作变成可交付机制。"
    >
      <ol class="project-case-campus__steps">
        <li v-for="step in page.process" :key="step.key" class="project-case-campus__step">
          <span class="project-case-campus__step-key">{{ step.key }}</span>
          <strong class="project-case-campus__step-title">{{ step.title }}</strong>
          <p class="project-case-campus__step-detail">{{ step.description }}</p>
        </li>
      </ol>
    </ProjectCaseSection>

    <ProjectCaseSection
      eyebrow="支撑案例"
      title="支持主案的协作证明"
      intro="这些不是附带照片，而是验证协作机制是否真的跑通的三个侧面。"
    >
      <div class="project-case-campus__support-grid">
        <article v-for="item in page.supportingCases" :key="item.title" class="project-case-campus__support">
          <p class="project-case-campus__support-title">{{ item.title }}</p>
          <p class="project-case-campus__support-summary">{{ item.summary }}</p>
          <p class="project-case-campus__support-detail">{{ item.detail }}</p>
        </article>
      </div>
    </ProjectCaseSection>

    <ProjectCaseSection
      eyebrow="证据"
      title="公开可替换的证据材料"
      intro="证据区保留了后续替换真实素材的空间，方便把现在的占位图替换成最终交付版本。"
    >
      <ProjectEvidenceGrid :items="page.evidence" />
    </ProjectCaseSection>

    <ProjectCaseSection
      eyebrow="结果"
      title="结果、反思与可迁移能力"
      intro="项目结束后留下的，不只是一次顺利完成的活动记录，还有可以迁移到别的校园项目里的组织能力。"
    >
      <div class="project-case-campus__outcomes">
        <p class="project-case-campus__outcome-summary">{{ page.outcomes.summary }}</p>

        <div class="chip-list project-case-campus__capabilities">
          <a-tag v-for="capability in page.outcomes.capabilities" :key="capability">
            {{ capability }}
          </a-tag>
        </div>

        <ul class="project-case-campus__reflections">
          <li v-for="reflection in page.outcomes.reflections" :key="reflection">
            {{ reflection }}
          </li>
        </ul>
      </div>
    </ProjectCaseSection>
  </ProjectCaseShell>
</template>

<style scoped>
.project-case-campus__hero {
  max-width: 58rem;
}

.project-case-campus__tags,
.project-case-campus__signals,
.project-case-campus__complexity,
.project-case-campus__steps,
.project-case-campus__support-grid,
.project-case-campus__reflections {
  display: grid;
  gap: 0.75rem;
}

.project-case-campus__signals {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 0.5rem;
}

.project-case-campus__signal,
.project-case-campus__lead,
.project-case-campus__support {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
}

.project-case-campus__signal {
  padding: 0.95rem 1rem;
  display: grid;
  gap: 0.35rem;
}

.project-case-campus__signal-label,
.project-case-campus__step-key,
.project-case-campus__lead-label {
  margin: 0;
  color: var(--accent);
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.project-case-campus__signal-value,
.project-case-campus__paragraph,
.project-case-campus__lead-summary,
.project-case-campus__lead-note p,
.project-case-campus__step-detail,
.project-case-campus__support-summary,
.project-case-campus__support-detail,
.project-case-campus__outcome-summary {
  margin: 0;
  color: var(--muted);
  line-height: 1.75;
}

.project-case-campus__narrative {
  display: grid;
  gap: 1rem;
}

.project-case-campus__complexity {
  margin: 0;
  padding: 0;
  list-style: none;
}

.project-case-campus__complexity-item {
  padding: 0.9rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
  line-height: 1.7;
}

.project-case-campus__lead {
  display: grid;
  gap: 1rem;
  padding: 1.1rem;
  background:
    linear-gradient(180deg, rgba(174, 119, 72, 0.08), rgba(57, 81, 60, 0.04)),
    var(--panel-soft);
}

.project-case-campus__lead-top {
  display: grid;
  gap: 0.5rem;
}

.project-case-campus__lead-role {
  margin: 0;
  font-size: 1rem;
  color: var(--text);
  font-weight: 600;
}

.project-case-campus__lead-summary {
  max-width: 46rem;
}

.project-case-campus__lead-body {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1rem;
}

.project-case-campus__lead-highlights {
  margin: 0.55rem 0 0;
  padding-left: 1.1rem;
  list-style: disc;
}

.project-case-campus__lead-highlights li,
.project-case-campus__reflections li {
  line-height: 1.75;
  color: var(--muted);
}

.project-case-campus__lead-note {
  padding: 0.95rem 1rem;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--panel) 74%, var(--accent) 6%);
}

.project-case-campus__steps {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
}

.project-case-campus__step {
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
  display: grid;
  gap: 0.45rem;
}

.project-case-campus__step-title {
  margin: 0;
  font-size: 1.04rem;
}

.project-case-campus__support-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.project-case-campus__support {
  padding: 1rem;
  display: grid;
  gap: 0.45rem;
}

.project-case-campus__support-title {
  margin: 0;
  color: var(--text);
  font-weight: 600;
}

.project-case-campus__outcomes {
  display: grid;
  gap: 1rem;
}

.project-case-campus__reflections {
  margin: 0;
  padding-left: 1.1rem;
  list-style: disc;
}

@media (max-width: 1080px) {
  .project-case-campus__signals,
  .project-case-campus__lead-body,
  .project-case-campus__steps,
  .project-case-campus__support-grid {
    grid-template-columns: 1fr;
  }
}
</style>
