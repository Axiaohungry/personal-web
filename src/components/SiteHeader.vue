<script setup>
import { computed, inject, ref } from 'vue'

// 站点头部承担三件事：
// 1. 展示品牌名和地点；
// 2. 桌面端/移动端导航切换；
// 3. 通过注入的 theme-mode 控制全站主题。
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
const isAnchorLink = (href) => href.includes('#')
const isDark = computed(() => themeMode.appearance.value === 'dark')
const themeLabel = computed(() => (isDark.value ? '深色' : '浅色'))

function handleThemeToggle() {
  // 具体的主题存储与同步逻辑由根组件提供，这里只负责触发切换动作。
  themeMode.toggleTheme()
}
</script>

<template>
  <header class="site-header shell-surface motion-rise">
    <div class="site-header__brandlock">
      <router-link class="site-header__title" to="/">{{ siteName }}</router-link>
      <p v-if="location" class="site-header__meta">{{ location }}</p>
    </div>

    <div class="site-header__desktop">
      <nav class="site-header__nav" aria-label="Primary navigation">
        <router-link
          v-for="item in primaryLinks.filter((i) => !isAnchorLink(i.href))"
          :key="item.href"
          :to="item.href"
        >
          <a-button
            type="text"
            class="site-header__nav-button"
          >
            {{ item.label }}
          </a-button>
        </router-link>
        <a
          v-for="item in primaryLinks.filter((i) => isAnchorLink(i.href))"
          :key="item.href"
          :href="item.href"
        >
          <a-button
            type="text"
            class="site-header__nav-button"
          >
            {{ item.label }}
          </a-button>
        </a>
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
          <router-link
            v-for="item in utilityLinks.filter((i) => !isAnchorLink(i.href))"
            :key="item.href"
            :to="item.href"
          >
            <a-button class="site-header__utility">
              {{ item.label }}
            </a-button>
          </router-link>
          <a
            v-for="item in utilityLinks.filter((i) => isAnchorLink(i.href))"
            :key="item.href"
            :href="item.href"
          >
            <a-button class="site-header__utility">
              {{ item.label }}
            </a-button>
          </a>
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
        <router-link
          v-for="item in navigationItems.filter((i) => !isAnchorLink(i.href))"
          :key="item.href"
          :to="item.href"
          @click="mobileOpen = false"
        >
          <a-button block class="site-header__drawer-link">
            {{ item.label }}
          </a-button>
        </router-link>
        <a
          v-for="item in navigationItems.filter((i) => isAnchorLink(i.href))"
          :key="item.href"
          :href="item.href"
          @click="mobileOpen = false"
        >
          <a-button block class="site-header__drawer-link">
            {{ item.label }}
          </a-button>
        </a>
      </nav>
    </a-drawer>
  </header>
</template>
