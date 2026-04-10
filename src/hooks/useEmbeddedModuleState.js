import { computed, onBeforeUnmount, onMounted, reactive, watch } from 'vue'
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

export function createEmbeddedModuleInitialState() {
  return {
    age: 24,
    heightCm: 175,
    bodyFatPct: null,
    bmr: null,
    currentCalories: null,
    sex: 'male',
    goal: 'cut',
    weeks: 8,
    targetKg: 3,
    tdee: 2200,
    weightKg: 70,
  }
}

export function useEmbeddedModuleState() {
  const route = useRoute()
  const state = reactive(createEmbeddedModuleInitialState())

  function applyPayload(payload = {}) {
    state.goal = normalizeGoal(payload.goal ?? state.goal)
    state.sex = payload.sex === 'female' ? 'female' : payload.sex === 'male' ? 'male' : state.sex
    state.weeks = normalizeWeeks(payload.weeks ?? state.weeks)
    state.targetKg = normalizeNumber(payload.targetKg, state.targetKg)
    state.age = normalizeNumber(payload.age, state.age)
    state.heightCm = normalizeNumber(payload.heightCm, state.heightCm)
    state.bodyFatPct = normalizeNumber(payload.bodyFatPct, state.bodyFatPct)
    state.bmr = normalizeNumber(payload.bmr, state.bmr)
    state.tdee = normalizeNumber(payload.tdee, state.tdee)
    state.weightKg = normalizeNumber(payload.weightKg, state.weightKg)
    state.currentCalories = normalizeNumber(payload.currentCalories, state.currentCalories)
  }

  function syncFromRoute() {
    applyPayload({
      goal: route.query.goal,
      sex: route.query.sex,
      weeks: route.query.weeks,
      targetKg: route.query.targetKg,
      age: route.query.age,
      heightCm: route.query.heightCm,
      bodyFatPct: route.query.bodyFatPct,
      bmr: route.query.bmr,
      tdee: route.query.tdee,
      weightKg: route.query.weightKg,
      currentCalories: route.query.currentCalories,
    })
  }

  function handleMessage(event) {
    if (!event?.data || event.data.type !== 'fitness-module-context') return
    applyPayload(event.data.payload)
  }

  syncFromRoute()

  watch(
    () => route.query,
    () => syncFromRoute(),
    { deep: true }
  )

  onMounted(() => {
    window.addEventListener('message', handleMessage)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('message', handleMessage)
  })

  const titleSuffix = computed(() => (state.goal === 'cut' ? '\u51cf\u8102' : '\u589e\u808c'))

  return {
    state,
    titleSuffix,
  }
}
