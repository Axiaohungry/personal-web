<script setup>
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { theme as antTheme } from 'ant-design-vue'

import {
  THEME_KEY,
  createThemeStorageApi,
  normalizeThemeMode,
  resolveThemeMode,
} from '@/utils/storage.js'

const themeStorage = createThemeStorageApi()
const preferredMode = ref(themeStorage.loadMode())
const systemPrefersDark = ref(false)
let detachMediaQuery = null
let detachStorage = null
let detachThemeMessage = null

// 明暗主题共用一套语义色板。
// 组件层不直接写死颜色，而是通过这里切换当前 palette，再由 CSS 变量和 Ant Design token 接管渲染。
const palettes = {
  light: {
    bg: '#f7f5f0',
    surface: '#f9f3ea',
    panel: '#fffaf3',
    text: '#1b2128',
    muted: '#5f6774',
    line: 'rgba(27, 33, 40, 0.12)',
    accent: '#b4552d',
    accentStrong: '#8f3917',
    accentSoft: 'rgba(180, 85, 45, 0.14)',
    teal: '#1f7b68',
    tealSoft: 'rgba(31, 123, 104, 0.14)',
    gold: '#b98630',
    shadow: '0 30px 80px rgba(34, 28, 22, 0.14)',
  },
  dark: {
    bg: '#17191f',
    surface: '#21252d',
    panel: '#262b35',
    text: '#f2ebdf',
    muted: '#aeb5c3',
    line: 'rgba(242, 235, 223, 0.14)',
    accent: '#e09367',
    accentStrong: '#efb18b',
    accentSoft: 'rgba(224, 147, 103, 0.16)',
    teal: '#6ec5b0',
    tealSoft: 'rgba(110, 197, 176, 0.16)',
    gold: '#d9b26f',
    shadow: '0 34px 90px rgba(0, 0, 0, 0.34)',
  },
}

const appearance = computed(() => resolveThemeMode(preferredMode.value, systemPrefersDark.value))
const isDark = computed(() => appearance.value === 'dark')
const palette = computed(() => palettes[appearance.value])

// 这里把站点主题映射到 Ant Design Vue 的 token。
// 运行时只要 appearance 变化，整站组件外观就会一起更新，不需要每个页面单独处理主题。
const themeConfig = computed(() => ({
  algorithm: isDark.value ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
  token: {
    colorPrimary: palette.value.accent,
    colorInfo: palette.value.accent,
    colorSuccess: palette.value.teal,
    colorWarning: palette.value.gold,
    colorTextBase: palette.value.text,
    colorBgBase: palette.value.bg,
    colorBorder: palette.value.line,
    colorLink: palette.value.accent,
    fontFamily: '\'IBM Plex Sans\', \'Noto Sans SC\', sans-serif',
    borderRadius: 18,
    borderRadiusLG: 28,
    controlHeight: 42,
    controlHeightLG: 48,
    boxShadow: palette.value.shadow,
    wireframe: false,
  },
  components: {
    Layout: {
      bodyBg: 'transparent',
      headerBg: 'transparent',
      siderBg: 'transparent',
    },
    Card: {
      colorBgContainer: palette.value.panel,
      boxShadow: 'none',
    },
    Button: {
      borderRadius: 999,
      primaryShadow: 'none',
    },
    Drawer: {
      colorBgElevated: palette.value.panel,
    },
    Input: {
      colorBgContainer: palette.value.panel,
      activeShadow: `0 0 0 2px ${palette.value.accentSoft}`,
    },
    InputNumber: {
      colorBgContainer: palette.value.panel,
      activeShadow: `0 0 0 2px ${palette.value.accentSoft}`,
    },
    Select: {
      colorBgContainer: palette.value.panel,
      optionSelectedBg: palette.value.accentSoft,
      controlOutline: palette.value.accentSoft,
    },
    Segmented: {
      itemActiveBg: palette.value.panel,
      trackBg: isDark.value ? 'rgba(255, 255, 255, 0.06)' : 'rgba(27, 33, 40, 0.06)',
    },
    Statistic: {
      colorTextDescription: palette.value.muted,
    },
  },
}))

function applyThemeMode(mode, persist = false) {
  const nextMode = normalizeThemeMode(mode)
  preferredMode.value = nextMode

  // 只有用户主动切换时才落盘；
  // 来自系统主题或 iframe 消息的同步更新，只改当前会话状态，不覆盖用户偏好。
  if (persist) {
    themeStorage.saveMode(nextMode)
  }
}

function setThemeMode(mode) {
  applyThemeMode(mode, true)
}

function toggleTheme() {
  setThemeMode(appearance.value === 'dark' ? 'light' : 'dark')
}

function handleStorageChange(event) {
  // 多标签页同步：如果另一个标签页改了主题，这里也会立刻跟上。
  if (event.key !== THEME_KEY) return
  applyThemeMode(event.newValue ?? 'system')
}

function handleThemeMessage(event) {
  // 站内嵌入模块页会把主题通过 postMessage 回传到根容器，这里负责接收并同步。
  if (!event?.data || event.data.type !== 'site-theme-context') return
  if (event.origin !== window.location.origin) return

  const nextMode = event.data.payload?.mode ?? event.data.payload?.appearance
  if (!nextMode) return

  applyThemeMode(nextMode)
}

provide('theme-mode', {
  appearance,
  isDark,
  preferredMode,
  setThemeMode,
  toggleTheme,
})

function syncDocumentTheme(nextAppearance) {
  // documentElement 上的数据属性会被全局 CSS 读取，
  // color-scheme 则交给浏览器原生控件（滚动条、表单等）使用。
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = nextAppearance
  document.documentElement.style.colorScheme = nextAppearance
}

watch(appearance, syncDocumentTheme, { immediate: true })

onMounted(() => {
  if (typeof window === 'undefined') return

  // 根组件挂载后统一接管三类主题来源：
  // 本地存储、iframe 消息、以及系统 prefers-color-scheme。
  window.addEventListener('storage', handleStorageChange)
  detachStorage = () => window.removeEventListener('storage', handleStorageChange)

  window.addEventListener('message', handleThemeMessage)
  detachThemeMessage = () => window.removeEventListener('message', handleThemeMessage)

  if (typeof window.matchMedia === 'function') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemPrefersDark.value = mediaQuery.matches

    const handleChange = (event) => {
      systemPrefersDark.value = event.matches
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      detachMediaQuery = () => mediaQuery.removeEventListener('change', handleChange)
      return
    }

    mediaQuery.addListener(handleChange)
    detachMediaQuery = () => mediaQuery.removeListener(handleChange)
  }
})

onBeforeUnmount(() => {
  // 根组件卸载时释放所有订阅，避免在热更新或测试环境里残留监听器。
  detachMediaQuery?.()
  detachStorage?.()
  detachThemeMessage?.()
})
</script>

<template>
  <a-config-provider :theme="themeConfig">
    <a-app>
      <router-view />
    </a-app>
  </a-config-provider>
</template>
