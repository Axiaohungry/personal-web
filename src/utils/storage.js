const LATEST_KEY = 'fitness.latest'
const HISTORY_KEY = 'fitness.history'
export const THEME_KEY = 'site.theme'
const THEME_MODES = new Set(['light', 'dark', 'system'])

function parseJson(value, fallback) {
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
  const safeMode = normalizeThemeMode(mode)
  if (safeMode === 'system') {
    return prefersDark ? 'dark' : 'light'
  }
  return safeMode
}

export function createStorageApi(storage = globalThis.localStorage) {
  return {
    loadLatest() {
      return parseJson(storage.getItem(LATEST_KEY), null)
    },
    saveLatest(payload) {
      storage.setItem(LATEST_KEY, JSON.stringify(payload))
    },
    loadHistory() {
      return parseJson(storage.getItem(HISTORY_KEY), [])
    },
    pushHistory(entry, limit = 5) {
      const next = [entry, ...this.loadHistory()].slice(0, limit)
      storage.setItem(HISTORY_KEY, JSON.stringify(next))
      return next
    },
  }
}

export function createThemeStorageApi(storage = globalThis.localStorage) {
  return {
    loadMode() {
      return normalizeThemeMode(storage.getItem(THEME_KEY))
    },
    saveMode(mode) {
      storage.setItem(THEME_KEY, normalizeThemeMode(mode))
    },
  }
}
