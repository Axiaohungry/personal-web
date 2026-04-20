<script setup>
import { computed, ref, watch } from 'vue'

import PagePreview from './components/PagePreview.vue'
import { approvalStaticCatalog } from './data/approvalPageCatalog.js'

// 这个页面把政务审批项目里的静态表单页整理成可浏览的页面目录。
// 它负责把原始 catalog 数据规整成统一结构，并维护当前选中的页面与检索状态。
function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function toText(value) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return ''
}

function normalizeMatterPage(page, index) {
  // catalog 来源可能不完全整齐，这里先把 id / 标题 / 编号等关键字段补齐，保证后续 UI 稳定。
  const safePage = page && typeof page === 'object' ? page : {}
  const itemNo = toText(safePage.itemNo) || String(index + 1).padStart(2, '0')

  return {
    ...safePage,
    id: safePage.id || `matter-${itemNo}-${safePage.formCode || index}`,
    itemNo,
    title: toText(safePage.title) || `事项 ${itemNo}`,
    formCode: toText(safePage.formCode),
    notes: toArray(safePage.notes ? [safePage.notes] : []).map(toText).filter(Boolean),
  }
}

const matterPages = computed(() => {
  return toArray(approvalStaticCatalog?.matterPages).map(normalizeMatterPage)
})

const activePageId = ref('')

const activePage = computed(() => {
  return matterPages.value.find((page) => page.id === activePageId.value) || matterPages.value[0] || null
})

watch(
  matterPages,
  (pages) => {
    if (!pages.length) {
      activePageId.value = ''
      return
    }

    if (!pages.some((page) => page.id === activePageId.value)) {
      activePageId.value = pages[0].id
    }
  },
  { immediate: true }
)
</script>

<template>
  <main class="approval-static-rebuild">
    <div class="approval-static-rebuild__shell page-shell">
      <section class="approval-static-rebuild__heading">
        <p class="approval-static-rebuild__eyebrow">政务审批事项页面</p>
        <h1 class="approval-static-rebuild__title">事项页面静态重建</h1>
        <p class="approval-static-rebuild__intro">
          点击左侧事项，右侧展示政务审批项目静态表单页面（模拟版）。
        </p>
      </section>

      <section class="approval-static-rebuild__workspace">
        <aside class="approval-static-rebuild__list" aria-label="事项页面列表">
          <div class="approval-static-rebuild__list-head">
            <p class="approval-static-rebuild__list-title">事项页面列表</p>
            <span class="approval-static-rebuild__count">{{ matterPages.length }} 项</span>
          </div>

          <div class="approval-static-rebuild__items">
            <button
              v-for="page in matterPages"
              :key="page.id"
              type="button"
              class="approval-static-rebuild__item"
              :class="{ 'approval-static-rebuild__item--active': page.id === activePage?.id }"
              @click="activePageId = page.id"
            >
              <span class="approval-static-rebuild__item-no">事项 {{ page.itemNo }}</span>
              <strong class="approval-static-rebuild__item-title">{{ page.title }}</strong>
              <span v-if="page.formCode" class="approval-static-rebuild__item-code">{{ page.formCode }}</span>
            </button>
          </div>
        </aside>

        <section class="approval-static-rebuild__preview" aria-label="静态重建预览">
          <PagePreview :page="activePage" />
        </section>
      </section>
    </div>
  </main>
</template>

<style scoped>
.approval-static-rebuild {
  min-height: 100vh;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--bg) 94%, white 6%), var(--bg)),
    var(--bg);
}

.approval-static-rebuild__shell {
  display: grid;
  gap: 1rem;
  width: 100%;
  max-width: none;
  padding-block: clamp(1rem, 2vw, 1.35rem) clamp(1.4rem, 3vw, 2rem);
  padding-inline: clamp(0.8rem, 1.8vw, 1.4rem);
}

.approval-static-rebuild__heading,
.approval-static-rebuild__list,
.approval-static-rebuild__preview {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 90%, white 10%);
}

.approval-static-rebuild__heading {
  display: grid;
  gap: 0.45rem;
  padding: clamp(1rem, 2vw, 1.25rem);
}

.approval-static-rebuild__eyebrow,
.approval-static-rebuild__item-no {
  margin: 0;
  color: var(--accent);
  font-size: 0.74rem;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.approval-static-rebuild__title {
  margin: 0;
  font-size: clamp(1.75rem, 3.2vw, 2.7rem);
  line-height: 1.08;
}

.approval-static-rebuild__intro {
  max-width: 52rem;
  margin: 0;
  color: var(--muted);
  line-height: 1.78;
}

.approval-static-rebuild__workspace {
  display: grid;
  grid-template-columns: minmax(17rem, 20rem) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.approval-static-rebuild__list,
.approval-static-rebuild__preview {
  min-width: 0;
}

.approval-static-rebuild__list {
  position: sticky;
  top: 1rem;
  display: grid;
  gap: 0.8rem;
  max-height: calc(100vh - 2rem);
  padding: 1rem;
}

.approval-static-rebuild__list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.approval-static-rebuild__list-title {
  margin: 0;
  color: var(--text);
  font-weight: 700;
}

.approval-static-rebuild__count {
  color: var(--muted);
  font-size: 0.86rem;
}

.approval-static-rebuild__items {
  display: grid;
  gap: 0.55rem;
  min-height: 0;
  overflow: auto;
  padding-right: 0.15rem;
}

.approval-static-rebuild__item {
  display: grid;
  gap: 0.28rem;
  width: 100%;
  min-width: 0;
  padding: 0.82rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  color: var(--text);
  text-align: left;
  background: var(--panel-soft);
  transition:
    border-color var(--duration-fast) var(--ease-out-quart),
    background-color var(--duration-fast) var(--ease-out-quart),
    transform var(--duration-fast) var(--ease-out-quart);
}

.approval-static-rebuild__item:hover,
.approval-static-rebuild__item:focus-visible {
  border-color: color-mix(in srgb, var(--accent) 38%, var(--line));
  transform: translateY(-1px);
}

.approval-static-rebuild__item--active {
  border-color: color-mix(in srgb, var(--teal) 46%, var(--line));
  background: color-mix(in srgb, var(--teal) 11%, var(--panel-soft));
}

.approval-static-rebuild__item-title,
.approval-static-rebuild__item-code {
  min-width: 0;
  overflow-wrap: anywhere;
}

.approval-static-rebuild__item-title {
  font-size: 0.98rem;
  line-height: 1.42;
}

.approval-static-rebuild__item-code {
  color: var(--muted);
  font-size: 0.84rem;
  line-height: 1.4;
}

.approval-static-rebuild__preview {
  padding: clamp(0.85rem, 1.8vw, 1.05rem);
}

@media (max-width: 980px) {
  .approval-static-rebuild__workspace {
    grid-template-columns: 1fr;
  }

  .approval-static-rebuild__list {
    position: static;
    max-height: none;
  }

  .approval-static-rebuild__items {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow: visible;
  }
}

@media (max-width: 680px) {
  .approval-static-rebuild__shell {
    padding-inline: 1rem;
  }

  .approval-static-rebuild__items {
    grid-template-columns: 1fr;
  }

  .approval-static-rebuild__heading,
  .approval-static-rebuild__list,
  .approval-static-rebuild__preview {
    border-radius: var(--radius-md);
  }
}
</style>
