import { onBeforeUnmount, onMounted, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'

function normalizeGoal(value) {
  return value === 'gain' ? 'gain' : 'cut'
}

function normalizeWeeks(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 4 ? parsed : 8
}

function normalizeNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function useEmbeddedModuleState() {
  const route = useRoute()
  const state = reactive({
    sex: 'male',
    goal: 'cut',
    weeks: 8,
    targetKg: 3,
    tdee: 2200,
    weightKg: 70,
  })

  function applyPayload(payload = {}) {
    state.goal = normalizeGoal(payload.goal ?? state.goal)
    state.sex = payload.sex === 'female' ? 'female' : 'male'
    state.weeks = normalizeWeeks(payload.weeks ?? state.weeks)
    state.targetKg = normalizeNumber(payload.targetKg, state.targetKg)
    state.tdee = normalizeNumber(payload.tdee, state.tdee)
    state.weightKg = normalizeNumber(payload.weightKg, state.weightKg)
  }

  function syncFromRoute() {
    applyPayload({
      goal: route.query.goal,
      sex: route.query.sex,
      weeks: route.query.weeks,
      targetKg: route.query.targetKg,
      tdee: route.query.tdee,
      weightKg: route.query.weightKg,
    })
  }

  function handleMessage(event) {
    if (!event?.data || event.data.type !== 'fitness-module-context') return
    applyPayload(event.data.payload)
  }

  onMounted(() => {
    syncFromRoute()
    window.addEventListener('message', handleMessage)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('message', handleMessage)
  })

  const titleSuffix = computed(() => (state.goal === 'cut' ? '减脂' : '增肌'))

  return {
    state,
    titleSuffix,
  }
}
