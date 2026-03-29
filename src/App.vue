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
  if (event.key !== THEME_KEY) return
  applyThemeMode(event.newValue ?? 'system')
}

function handleThemeMessage(event) {
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
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = nextAppearance
  document.documentElement.style.colorScheme = nextAppearance
}

watch(appearance, syncDocumentTheme, { immediate: true })

onMounted(() => {
  if (typeof window === 'undefined') return

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
