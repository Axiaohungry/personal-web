<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import { navigationItems } from '@/data/navigation.js'
import { profile } from '@/data/profile.js'

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
</script>

<template>
  <slot name="shell" :hero="props.hero" :variant="props.variant">
    <main class="project-case-page" :class="`project-case-page--${props.variant}`">
      <div class="page-shell project-case-page__shell">
        <SiteHeader
          :site-name="profile.name"
          :location="profile.location"
          :navigation-items="navigationItems"
        />

        <section class="project-case-hero shell-surface motion-rise">
          <slot name="hero" :hero="props.hero">
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
          </slot>
        </section>

        <slot />
      </div>
    </main>
  </slot>
</template>
