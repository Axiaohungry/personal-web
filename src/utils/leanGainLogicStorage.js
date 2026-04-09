const PREFS_KEY = 'leanGainLogicPrefs'
const HISTORY_KEY = 'leanGainLogicHistory'

function parseJson(value, fallback) {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function createLeanGainLogicStorageApi(storage = globalThis.localStorage) {
  const loadHistory = () => parseJson(storage.getItem(HISTORY_KEY), [])

  return {
    loadPrefs() {
      return parseJson(storage.getItem(PREFS_KEY), {})
    },
    savePrefs(payload) {
      storage.setItem(PREFS_KEY, JSON.stringify(payload))
    },
    loadHistory() {
      return loadHistory()
    },
    pushHistory(entry, limit = 5) {
      const next = [entry, ...loadHistory()].slice(0, limit)
      storage.setItem(HISTORY_KEY, JSON.stringify(next))
      return next
    },
  }
}
