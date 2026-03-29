<script setup>
import { computed, inject, ref } from 'vue'

const props = defineProps({
  siteName: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: '',
  },
  navigationItems: {
    type: Array,
    default: () => [],
  },
})

const themeMode = inject('theme-mode', {
  appearance: computed(() => 'light'),
  toggleTheme: () => {},
})

const mobileOpen = ref(false)
const primaryLinks = computed(() => props.navigationItems.slice(0, 4))
const utilityLinks = computed(() => props.navigationItems.slice(4))
const isDark = computed(() => themeMode.appearance.value === 'dark')
const themeLabel = computed(() => (isDark.value ? '深色' : '浅色'))

function handleThemeToggle() {
  themeMode.toggleTheme()
}
</script>

<template>
  <header class="site-header shell-surface motion-rise">
    <div class="site-header__brandlock">
      <a class="site-header__title" href="/">{{ siteName }}</a>
      <p v-if="location" class="site-header__meta">{{ location }}</p>
    </div>

    <div class="site-header__desktop">
      <nav class="site-header__nav" aria-label="Primary navigation">
        <a-button
          v-for="item in primaryLinks"
          :key="item.href"
          type="text"
          class="site-header__nav-button"
          :href="item.href"
        >
          {{ item.label }}
        </a-button>
      </nav>

      <div class="site-header__controls">
        <div class="site-header__theme">
          <span class="site-header__theme-label">{{ themeLabel }}</span>
          <a-switch
            :checked="isDark"
            checked-children="深"
            un-checked-children="浅"
            @change="handleThemeToggle"
          />
        </div>

        <div class="site-header__utilities">
          <a-button
            v-for="item in utilityLinks"
            :key="item.href"
            class="site-header__utility"
            :href="item.href"
          >
            {{ item.label }}
          </a-button>
        </div>
      </div>
    </div>

    <div class="site-header__mobile-actions">
      <a-switch
        :checked="isDark"
        checked-children="深"
        un-checked-children="浅"
        @change="handleThemeToggle"
      />
      <a-button class="site-header__menu" @click="mobileOpen = true">导航</a-button>
    </div>

    <a-drawer
      v-model:open="mobileOpen"
      placement="right"
      width="20rem"
      class="site-header__drawer"
      :closable="false"
    >
      <div class="site-header__drawer-top">
        <div>
          <p class="site-header__drawer-label">Navigate</p>
          <h2 class="site-header__drawer-title">{{ siteName }}</h2>
          <p v-if="location" class="site-header__drawer-meta">{{ location }}</p>
        </div>
        <a-button type="text" @click="mobileOpen = false">关闭</a-button>
      </div>

      <div class="site-header__drawer-theme">
        <span>当前主题</span>
        <a-switch
          :checked="isDark"
          checked-children="深"
          un-checked-children="浅"
          @change="handleThemeToggle"
        />
      </div>

      <nav class="site-header__drawer-nav" aria-label="Mobile navigation">
        <a-button
          v-for="item in navigationItems"
          :key="item.href"
          block
          class="site-header__drawer-link"
          :href="item.href"
          @click="mobileOpen = false"
        >
          {{ item.label }}
        </a-button>
      </nav>
    </a-drawer>
  </header>
</template>
