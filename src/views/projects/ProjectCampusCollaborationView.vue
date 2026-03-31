<script setup>
import { campusCollaborationCase } from '@/data/projectCases/campusCollaboration.js'

const page = campusCollaborationCase
</script>

<template>
  <main class="site-page project-case-page">
    <div class="page-shell">
      <section class="shell-surface project-case-page__hero">
        <p class="eyebrow">项目案例</p>
        <h1>{{ page.hero.title }}</h1>
        <p class="project-case-page__summary">{{ page.hero.summary }}</p>
        <div class="project-case-page__chips">
          <span v-for="tag in page.hero.tags" :key="tag" class="project-case-page__chip">{{ tag }}</span>
        </div>
      </section>

      <section class="shell-surface">
        <p class="eyebrow">主案例</p>
        <h2>{{ page.leadCase.title }}</h2>
        <p class="project-case-page__summary">{{ page.leadCase.summary }}</p>
        <p class="project-case-page__meta">{{ page.leadCase.role }}</p>
      </section>

      <section class="shell-surface">
        <p class="eyebrow">关键指标</p>
        <ul class="project-case-page__signal-list">
          <li v-for="signal in page.hero.signals" :key="signal.label">
            <strong>{{ signal.label }}</strong>
            <span>{{ signal.value }}</span>
          </li>
        </ul>
      </section>

      <section class="shell-surface">
        <p class="eyebrow">四步流程</p>
        <ol class="project-case-page__step-list">
          <li v-for="step in page.process" :key="step.key">
            <strong>{{ step.title }}</strong>
            <span>{{ step.description }}</span>
          </li>
        </ol>
      </section>

      <section class="shell-surface">
        <p class="eyebrow">支持案例</p>
        <div class="project-case-page__stack">
          <article v-for="item in page.supportingCases" :key="item.title" class="project-case-page__panel">
            <strong>{{ item.title }}</strong>
            <p>{{ item.detail }}</p>
          </article>
        </div>
      </section>

      <section class="shell-surface">
        <p class="eyebrow">结果与证据</p>
        <ul class="project-case-page__bullet-list">
          <li v-for="item in page.evidence" :key="item.title">
            <strong>{{ item.title }}</strong>
            <span>{{ item.detail }}</span>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>

<style scoped>
.project-case-page__summary,
.project-case-page__meta {
  margin: 0.5rem 0 0;
  line-height: 1.7;
}

.project-case-page__chips,
.project-case-page__signal-list,
.project-case-page__step-list,
.project-case-page__bullet-list,
.project-case-page__stack {
  display: grid;
  gap: 0.75rem;
  margin: 1rem 0 0;
  padding: 0;
}

.project-case-page__chips {
  display: flex;
  flex-wrap: wrap;
}

.project-case-page__chip {
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: var(--panel-soft);
}

.project-case-page__signal-list,
.project-case-page__step-list,
.project-case-page__bullet-list {
  list-style: none;
}

.project-case-page__signal-list li,
.project-case-page__step-list li,
.project-case-page__bullet-list li {
  display: grid;
  gap: 0.25rem;
}

.project-case-page__panel {
  padding: 0.9rem 1rem;
  border-radius: 16px;
  background: var(--panel-soft);
}

.project-case-page__panel p {
  margin: 0.35rem 0 0;
}
</style>
