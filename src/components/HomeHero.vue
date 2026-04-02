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
      <p class="home-hero__eyebrow">Profile</p>
      <h1 class="home-hero__title">我喜欢把复杂的问题，整理成能被人真正使用的东西。</h1>
      <p class="home-hero__tagline">{{ profile.tagline }}</p>
      <p class="home-hero__summary">{{ profile.summary }}</p>

      <p class="home-hero__focus-line">
        我在持续关注：
        <span>{{ focusAreas.join(' / ') }}</span>
      </p>

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
        <article
          v-for="signal in featuredSignals"
          :key="signal.label"
          class="home-hero__signal-card"
        >
          <p class="home-hero__signal-label">{{ signal.label }}</p>
          <p class="home-hero__signal-value">{{ signal.value }}</p>
          <p class="home-hero__signal-note">{{ signal.note }}</p>
        </article>
      </div>
    </div>

    <aside class="home-hero__aside motion-rise motion-rise--3" aria-label="Introduction highlight">
      <a-card class="home-hero__aside-card ant-surface-card" :bordered="false">
        <p class="home-hero__accent-label">一句判断</p>
        <p class="home-hero__accent-line">{{ profile.accentLine }}</p>
      </a-card>

      <a-card class="home-hero__aside-card ant-surface-card" :bordered="false">
        <p class="home-hero__aside-title">档案速览</p>
        <div class="home-hero__stats">
          <article v-for="stat in quickStats" :key="stat.label" class="home-hero__stat">
            <p class="home-hero__stat-value">{{ stat.value }}</p>
            <p class="home-hero__stat-label">{{ stat.label }}</p>
          </article>
        </div>
      </a-card>
    </aside>
  </section>
</template>
