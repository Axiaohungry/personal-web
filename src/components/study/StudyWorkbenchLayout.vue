<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: true,
  },
  intro: {
    type: String,
    default: '',
  },
  note: {
    type: String,
    default: '',
  },
  metrics: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section class="study-shell">
    <section class="study-shell__hero shell-surface">
      <div class="study-shell__copy">
        <p v-if="eyebrow" class="eyebrow study-shell__eyebrow">{{ eyebrow }}</p>
        <h1 class="study-shell__title">{{ title }}</h1>
        <p v-if="intro" class="study-shell__intro">{{ intro }}</p>

        <div v-if="metrics.length" class="study-shell__metrics">
          <article
            v-for="metric in metrics"
            :key="metric.label"
            class="study-shell__metric"
          >
            <span class="study-shell__metric-label">{{ metric.label }}</span>
            <strong class="study-shell__metric-value">{{ metric.value }}</strong>
          </article>
        </div>
      </div>

      <aside v-if="note || $slots.aside" class="study-shell__aside">
        <slot name="aside">
          <p class="study-shell__note">{{ note }}</p>
        </slot>
      </aside>
    </section>

    <section v-if="$slots.nav" class="study-shell__nav shell-surface">
      <slot name="nav" />
    </section>

    <section class="study-shell__content">
      <slot />
    </section>
  </section>
</template>
