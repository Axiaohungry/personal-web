<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const historyState = ref({
  back: null,
  forward: null,
})

const canGoBack = computed(() => Boolean(historyState.value.back))
const canGoForward = computed(() => Boolean(historyState.value.forward))

function syncHistoryState() {
  if (typeof window === 'undefined') return

  historyState.value = {
    back: window.history.state?.back ?? null,
    forward: window.history.state?.forward ?? null,
  }
}

function scheduleHistoryStateSync() {
  if (typeof window === 'undefined') return

  window.requestAnimationFrame(syncHistoryState)
}

watch(() => route.fullPath, scheduleHistoryStateSync, { immediate: true })

function handleRouteBack() {
  if (!canGoBack.value) return

  router.back()
}

function handleRouteForward() {
  if (!canGoForward.value) return

  router.forward()
}
</script>

<template>
  <nav class="mobile-route-controls" aria-label="路由历史导航">
    <button
      type="button"
      class="mobile-route-controls__button"
      :disabled="!canGoBack"
      aria-label="后退"
      title="后退"
      @click="handleRouteBack"
    >
      <span aria-hidden="true">‹</span>
    </button>
    <button
      type="button"
      class="mobile-route-controls__button"
      :disabled="!canGoForward"
      aria-label="前进"
      title="前进"
      @click="handleRouteForward"
    >
      <span aria-hidden="true">›</span>
    </button>
  </nav>
</template>
