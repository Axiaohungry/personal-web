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
      eyebrow="问题"
      title="为什么这页要更像服务台，而不是课程海报"
      intro="健身服务最容易散掉的地方，不在动作本身，而在版本、提醒和复盘没有被整理成同一条路径。"
    >
      <ul class="project-case-fitness__problem-list">
        <li v-for="problem in page.userProblems" :key="problem" class="project-case-fitness__problem-item">
          {{ problem }}
        </li>
      </ul>
    </ProjectCaseSection>

    <ProjectCaseSection
      eyebrow="流程"
      title="四步服务循环"
      intro="我把这页组织成一条固定回路：先建档，再拆计划，随后跟踪执行，最后把复盘写回服务本身。"
    >
      <ol class="project-case-fitness__steps">
        <li v-for="(step, index) in page.process" :key="step.key" class="project-case-fitness__step">
          <span class="project-case-fitness__step-key">第 {{ index + 1 }} 步</span>
          <strong class="project-case-fitness__step-title">{{ step.title }}</strong>
          <p class="project-case-fitness__step-detail">{{ step.description }}</p>
        </li>
      </ol>
    </ProjectCaseSection>

    <ProjectCaseSection
      eyebrow="证据"
      title="公开可替换的服务材料"
      intro="这三张图是匿名安全占位，先把流程、计划和跟踪的叙事位置固定下来，后续可以平滑替换成真实素材。"
    >
      <ProjectEvidenceGrid :items="page.evidence" />
    </ProjectCaseSection>

    <ProjectCaseSection
      eyebrow="结果"
      title="我希望招聘方和普通用户分别读到什么"
      intro="这不是一次性内容展示，而是一个能持续服务、持续跟进、持续迭代的工作方法。"
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
      eyebrow="桥接"
      title="从案例页回到健身工作台"
      intro="如果你想先看实际工具而不是案例说明，可以直接进入健身工作台。"
    >
      <div class="project-case-fitness__bridge">
        <p class="project-case-fitness__bridge-copy">
          这页讲的是方法，`/fitness/` 讲的是落地体验。两者保持同一套气质，但一个负责说明思路，一个负责真正使用。
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
