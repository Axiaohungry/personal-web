<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  intro: {
    type: String,
    default: '',
  },
  note: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <main class="module-page">
    <section class="module-page__hero">
      <div>
        <p class="module-page__eyebrow">{{ eyebrow }}</p>
        <h1 class="module-page__title">{{ title }}</h1>
        <p class="module-page__intro">{{ intro }}</p>
      </div>
      <aside class="module-page__note">
        {{ note }}
      </aside>
    </section>

    <div class="module-page__content">
      <slot />
    </div>
  </main>
</template>

<style scoped>
.module-page {
  min-height: 100vh;
  padding: 1.5rem;
  overflow-x: clip;
  background-color: var(--bg);
  background-image: var(--page-background);
  background-repeat: no-repeat;
  color: var(--text);
}

.module-page__hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(16rem, 0.8fr);
  gap: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  width: min(100%, 76rem);
  margin-inline: auto;
}

.module-page__eyebrow {
  margin: 0 0 0.7rem;
  color: var(--accent);
  font-size: 0.8rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.module-page__title {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.05;
}

.module-page__intro,
.module-page__note {
  color: var(--muted);
}

.module-page__intro {
  margin: 0.85rem 0 0;
  max-width: 52rem;
  line-height: 1.7;
}

.module-page__note {
  margin: 0;
  padding: 1rem 1.1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
  align-self: end;
}

.module-page__content {
  display: grid;
  gap: 1rem;
  min-width: 0;
  width: min(100%, 76rem);
  margin-inline: auto;
}

:deep(.module-grid) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

:deep(.ant-row),
:deep(.ant-col),
:deep(.ant-card),
:deep(.ant-card-body),
:deep(.ant-space),
:deep(.ant-space-item) {
  min-width: 0;
}

:deep(.module-section) {
  padding: 1.1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel);
  box-shadow: var(--shadow-soft);
}

:deep(.module-section h2),
:deep(.module-section h3) {
  margin: 0;
}

:deep(.module-section p) {
  margin: 0.75rem 0 0;
  color: var(--muted);
  line-height: 1.65;
}

:deep(.module-copy) {
  margin: 0 0 0.9rem;
  color: var(--muted);
}

:deep(.module-list) {
  margin: 0.85rem 0 0;
  padding-left: 1.1rem;
  color: var(--muted);
  line-height: 1.65;
}

:deep(.module-table) {
  width: 100%;
  margin-top: 0.9rem;
  border-collapse: collapse;
}

:deep(.module-table th),
:deep(.module-table td) {
  padding: 0.75rem 0.65rem;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
}

:deep(.module-pill-row) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.9rem;
}

:deep(.module-pill) {
  padding: 0.42rem 0.7rem;
  border-radius: 999px;
  background: var(--teal-soft);
  color: var(--text);
  font-size: 0.88rem;
  font-weight: 600;
}

:deep(.source-card) {
  padding: 0.9rem 1rem;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--panel-soft);
}

:deep(.source-card p) {
  margin: 0.35rem 0 0;
}

:deep(.source-card a),
:deep(.source-card p),
:deep(.ant-alert-message),
:deep(.ant-alert-description),
:deep(.ant-collapse-header-text),
:deep(.ant-card-head-title),
:deep(.ant-list-item),
:deep(.ant-typography) {
  overflow-wrap: anywhere;
  word-break: break-word;
}

:deep(.ant-table-wrapper) {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

:deep(.ant-table-content) {
  overflow-x: auto;
}

:deep(.ant-table) {
  min-width: 40rem;
}

:deep(.ant-table-cell) {
  white-space: normal;
  word-break: break-word;
}

@media (max-width: 820px) {
  .module-page {
    padding: 0.8rem;
  }

  .module-page__hero,
  :deep(.module-grid) {
    grid-template-columns: 1fr;
  }

  .module-page__note {
    padding: 0.9rem 1rem;
  }

  :deep(.ant-card-body) {
    padding: 0.95rem;
  }

  :deep(.ant-table) {
    min-width: 34rem;
  }
}
</style>
