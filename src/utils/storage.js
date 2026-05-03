const LATEST_KEY = 'fitness.latest'
const HISTORY_KEY = 'fitness.history'
export const THEME_KEY = 'site.theme'
const THEME_MODES = new Set(['light', 'dark', 'system'])

export function parseJson(value, fallback) {
  // localStorage 里保存的是字符串。
  // 这里统一兜底 JSON 解析失败的情况，避免单个坏数据让整页崩掉。
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function normalizeThemeMode(value) {
  return THEME_MODES.has(value) ? value : 'system'
}

export function resolveThemeMode(mode, prefersDark = false) {
  // system 模式不直接返回固定值，而是根据浏览器的 prefers-color-scheme 动态解析。
  const safeMode = normalizeThemeMode(mode)
  if (safeMode === 'system') {
    return prefersDark ? 'dark' : 'light'
  }
  return safeMode
}

export function createStorageApi(storage = globalThis.localStorage) {
  return {
    loadLatest() {
      // 读取最近一次表单输入，供工作台刷新后恢复状态。
      return parseJson(storage.getItem(LATEST_KEY), null)
    },
    saveLatest(payload) {
      storage.setItem(LATEST_KEY, JSON.stringify(payload))
    },
    loadHistory() {
      // 历史记录只用来给界面展示最近几次计算，不承担复杂审计功能。
      return parseJson(storage.getItem(HISTORY_KEY), [])
    },
    pushHistory(entry, limit = 5) {
      // 新纪录永远插到最前面，再按 limit 截断，保证 UI 始终展示最近数据。
      const next = [entry, ...this.loadHistory()].slice(0, limit)
      storage.setItem(HISTORY_KEY, JSON.stringify(next))
      return next
    },
  }
}

export function createThemeStorageApi(storage = globalThis.localStorage) {
  return {
    loadMode() {
      // 主题只允许 light / dark / system 三种值，非法值会被归一化。
      return normalizeThemeMode(storage.getItem(THEME_KEY))
    },
    saveMode(mode) {
      storage.setItem(THEME_KEY, normalizeThemeMode(mode))
    },
  }
}
