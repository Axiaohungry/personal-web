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
  // 这里定义的是“模块页单独打开时”的兜底值。
  // 如果没有来自主工作台的 query 或 postMessage，上述默认值可以保证页面仍然可读，而不是直接报错。
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
    // 模块上下文可能来自两种渠道：
    // 1. iframe src 上的 query 参数，用于首次加载；
    // 2. 父页面 postMessage，用于父页面参数变化后的增量同步。
    // 这里统一做一次归一化，避免页面内部到处判断空值和非法值。
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
    // query 是模块页首次进入时最稳定的上下文来源，
    // 所以每次路由变化都重新同步一次，保证刷新后也能还原主工作台当前状态。
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
    // 只响应站内约定好的 fitness-module-context 消息，
    // 避免其他 message 事件误改模块状态。
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

  // 各模块页标题统一通过这个后缀感知当前目标，避免每个模块各自重复写一次。
  const titleSuffix = computed(() => (state.goal === 'cut' ? '减脂' : '增肌'))

  return {
    state,
    titleSuffix,
  }
}
