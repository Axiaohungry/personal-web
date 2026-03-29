<script setup>
defineProps({
  profile: {
    type: Object,
    required: true,
  },
  quickStats: {
    type: Array,
    default: () => [],
  },
  focusAreas: {
    type: Array,
    default: () => [],
  },
  featuredSignals: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section class="home-hero">
    <div class="home-hero__copy motion-rise motion-rise--2">
      <p class="home-hero__eyebrow">About Me</p>
      <h1 class="home-hero__title">
        我做的事，基本都和
        <span>把复杂问题真正落地有关。</span>
      </h1>
      <p class="home-hero__tagline">{{ profile.tagline }}</p>
      <p class="home-hero__summary">{{ profile.summary }}</p>

      <a-space wrap class="home-hero__focus-strip">
        <a-tag v-for="area in focusAreas" :key="area" color="cyan">{{ area }}</a-tag>
      </a-space>

      <div class="home-hero__actions">
        <a-space wrap size="middle">
          <a-button type="primary" size="large" :href="profile.ctaPrimary.href">
            {{ profile.ctaPrimary.label }}
          </a-button>
          <a-button size="large" :href="profile.ctaSecondary.href">
            {{ profile.ctaSecondary.label }}
          </a-button>
        </a-space>
      </div>

      <div class="home-hero__signals" aria-label="Career signals">
        <a-card
          v-for="signal in featuredSignals"
          :key="signal.label"
          class="home-hero__signal-card ant-surface-card"
          :bordered="false"
        >
          <p class="home-hero__signal-label">{{ signal.label }}</p>
          <p class="home-hero__signal-value">{{ signal.value }}</p>
          <p class="home-hero__signal-note">{{ signal.note }}</p>
        </a-card>
      </div>
    </div>

    <aside class="home-hero__aside motion-rise motion-rise--3" aria-label="Introduction highlight">
      <a-card class="home-hero__aside-card ant-surface-card" :bordered="false">
        <p class="home-hero__accent-label">现在在做什么</p>
        <p class="home-hero__accent-line">{{ profile.accentLine }}</p>
      </a-card>

      <a-card class="home-hero__aside-card ant-surface-card" :bordered="false">
        <p class="home-hero__aside-title">当前概况</p>
        <div class="home-hero__stats">
          <article v-for="stat in quickStats" :key="stat.label" class="home-hero__stat">
            <p class="home-hero__stat-value">{{ stat.value }}</p>
            <p class="home-hero__stat-label">{{ stat.label }}</p>
          </article>
        </div>
      </a-card>

      <a-card class="home-hero__aside-card ant-surface-card" :bordered="false">
        <p class="home-hero__aside-title">长期关注的方向</p>
        <div class="home-hero__focus">
          <span v-for="area in focusAreas" :key="area" class="home-hero__focus-item">
            {{ area }}
          </span>
        </div>
      </a-card>
    </aside>
  </section>
</template>
