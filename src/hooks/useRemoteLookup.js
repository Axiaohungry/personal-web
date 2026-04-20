import { ref } from 'vue'

function buildLookupUrl(endpoint, keyword) {
  return `${endpoint}?q=${encodeURIComponent(keyword)}`
}

async function readJsonSafely(response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

export function mapRemoteLookupRows(items, keyPrefix) {
  return (Array.isArray(items) ? items : []).map((item, index) => ({
    ...item,
    key: `${keyPrefix}-${index}`,
  }))
}

// 食物库和补剂库的远程查找逻辑完全一样：读取关键词、发请求、映射表格行、回填错误提示。
// 抽成组合式函数后，页面本身只保留各自的列定义和文案，不再重复维护请求状态机。
export function createRemoteLookup({
  endpoint,
  keyPrefix,
  fetchImpl = fetch,
  emptyResultMessage = '没有拿到可用结果，换个关键词再试试。',
  fallbackErrorMessage = '搜索失败，请稍后再试。',
} = {}) {
  const searchKeyword = ref('')
  const loading = ref(false)
  const remoteRows = ref([])
  const remoteError = ref('')

  async function handleSearch(rawKeyword = searchKeyword.value) {
    const keyword = String(rawKeyword || '').trim()
    if (!keyword) return

    loading.value = true
    remoteError.value = ''

    try {
      const response = await fetchImpl(buildLookupUrl(endpoint, keyword))
      const data = await readJsonSafely(response)

      if (!response.ok) {
        throw new Error(data.error || `接口响应 ${response.status}`)
      }

      remoteRows.value = mapRemoteLookupRows(data.items, keyPrefix)

      if (!remoteRows.value.length) {
        remoteError.value = emptyResultMessage
      }
    } catch (error) {
      remoteRows.value = []
      remoteError.value = error?.message || fallbackErrorMessage
    } finally {
      loading.value = false
    }
  }

  return {
    searchKeyword,
    loading,
    remoteRows,
    remoteError,
    handleSearch,
  }
}

export const useRemoteLookup = createRemoteLookup
