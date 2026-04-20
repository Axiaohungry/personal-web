<script setup>
import { computed } from 'vue'

import SiteHeader from '@/components/SiteHeader.vue'
import ProjectCaseSignalRail from '@/components/projects/ProjectCaseSignalRail.vue'
import { navigationItems } from '@/data/navigation.js'
import { profile } from '@/data/profile.js'

// 项目案例外壳组件负责统一案例页的公共框架：
// 顶部站点导航、hero 信息区和右侧信号栏都在这里收口，
// 具体案例内容通过 slot 注入。
const props = defineProps({
  variant: {
    type: String,
    default: 'system',
  },
  hero: {
    type: Object,
    required: true,
  },
})

const heroSignals = computed(() => {
  // 不同案例页传进来的字段名可能略有差异，这里统一兼容 signals / signalItems 两种写法。
  const hero = props.hero || {}

  if (Array.isArray(hero.signals)) {
    return hero.signals
  }

  if (Array.isArray(hero.signalItems)) {
    return hero.signalItems
  }

  if (Array.isArray(hero.highlights)) {
    return hero.highlights
  }

  return []
})
</script>

<template>
  <slot name="shell" :hero="props.hero" :variant="props.variant" :signals="heroSignals">
    <main class="project-case-page" :class="`project-case-page--${props.variant}`">
      <div class="page-shell project-case-page__shell">
        <SiteHeader
          :site-name="profile.name"
          :location="profile.location"
          :navigation-items="navigationItems"
        />

        <section class="project-case-hero project-case-stage project-case-stage--hero shell-surface motion-rise">
          <slot name="hero" :hero="props.hero" :signals="heroSignals">
            <div class="project-case-hero__layout">
              <div class="project-case-hero__content">
                <p v-if="props.hero.eyebrow" class="eyebrow project-case-hero__eyebrow">
                  {{ props.hero.eyebrow }}
                </p>

                <div class="project-case-hero__heading">
                  <h1 class="project-case-hero__title">
                    {{ props.hero.title }}
                  </h1>
                  <p v-if="props.hero.subtitle" class="project-case-hero__subtitle">
                    {{ props.hero.subtitle }}
                  </p>
                </div>

                <p v-if="props.hero.summary" class="project-case-hero__summary">
                  {{ props.hero.summary }}
                </p>

                <div
                  v-if="Array.isArray(props.hero.tags) && props.hero.tags.length"
                  class="project-case-hero__chips chip-list"
                >
                  <a-tag v-for="tag in props.hero.tags" :key="tag">
                    {{ tag }}
                  </a-tag>
                </div>

                <div
                  v-if="Array.isArray(props.hero.actions) && props.hero.actions.length"
                  class="project-case-hero__actions"
                >
                  <a-button
                    v-for="action in props.hero.actions"
                    :key="action.href"
                    :href="action.href"
                    :type="action.type || 'default'"
                  >
                    {{ action.label }}
                  </a-button>
                </div>
              </div>

              <ProjectCaseSignalRail
                v-if="heroSignals.length"
                class="project-case-hero__rail"
                :items="heroSignals"
              />
            </div>
          </slot>
        </section>

        <slot />
      </div>
    </main>
  </slot>
</template>
