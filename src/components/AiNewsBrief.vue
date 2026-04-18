<script setup>
import { computed, onMounted, ref } from 'vue'

const loading = ref(true)
const error = ref('')
const updatedAt = ref('')
const stories = ref([])

const timestampLabel = computed(() => {
  if (!updatedAt.value) {
    return loading.value ? '正在刷新' : '暂无更新时间'
  }

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      hour12: false,
    }).format(new Date(updatedAt.value))
  } catch {
    return updatedAt.value
  }
})

const displayStories = computed(() => stories.value.slice(0, 3))

function formatPublishedAt(value) {
  if (!value) return ''

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value))
  } catch {
    return value
  }
}

async function loadBrief() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/api/ai/news-brief', {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Request failed.')
    }

    const payload = await response.json()

    updatedAt.value = typeof payload?.updatedAt === 'string' ? payload.updatedAt : ''
    stories.value = Array.isArray(payload?.stories) ? payload.stories.slice(0, 3) : []
  } catch {
    stories.value = []
    updatedAt.value = ''
    error.value = 'AI 新闻简报暂时无法加载。'
  } finally {
    loading.value = false
  }
}

function refreshBrief() {
  void loadBrief()
}

onMounted(() => {
  void loadBrief()
})
</script>

<template>
  <section class="ai-news-brief shell-surface motion-rise motion-rise--2">
    <div class="ai-news-brief__copy">
      <p class="ai-news-brief__eyebrow">AI News</p>
      <h2 class="ai-news-brief__title">首页 AI 简报</h2>
      <p class="ai-news-brief__summary">
        从公开来源提炼三条最新 AI 动态，帮助你快速判断行业变化是否值得继续跟进。
      </p>

      <p class="ai-news-brief__timestamp">
        <span class="ai-news-brief__timestamp-label">更新时间</span>
        <time class="ai-news-brief__timestamp-value">{{ timestampLabel }}</time>
      </p>

      <div class="ai-news-brief__actions">
        <a-button type="primary" size="large" :loading="loading" @click="refreshBrief">
          刷新简报
        </a-button>
        <a-button size="large" href="/fitness/">打开健身工具</a-button>
      </div>
    </div>

    <div class="ai-news-brief__stories" aria-label="AI news stories">
      <a-card
        v-if="error"
        class="ai-news-brief__fallback ant-surface-card"
        :bordered="false"
      >
        <p class="ai-news-brief__story-label">更新失败</p>
        <h3 class="ai-news-brief__story-title">暂时无法加载最新 AI 简报</h3>
        <p class="ai-news-brief__story-summary">{{ error }}</p>
        <p class="ai-news-brief__story-note">请稍后再试，或直接手动刷新这一模块。</p>
        <a-button type="link" class="ai-news-brief__retry" @click="refreshBrief">
          重新加载
        </a-button>
      </a-card>

      <a-card
        v-else-if="loading && !displayStories.length"
        class="ai-news-brief__loading-card ant-surface-card"
        :bordered="false"
      >
        <p class="ai-news-brief__story-label">加载中</p>
        <h3 class="ai-news-brief__story-title">正在整理最新 AI 报道</h3>
        <p class="ai-news-brief__story-summary">
          我们正在从同源接口读取最新简报，完成后这里会显示三条精选故事。
        </p>
      </a-card>

      <template v-else>
        <a-card
          v-for="story in displayStories"
          :key="`${story.title}-${story.publishedAt}`"
          class="ai-news-brief__story-card ant-surface-card"
          :bordered="false"
        >
          <p class="ai-news-brief__story-label">{{ story.sourceLabel }}</p>
          <h3 class="ai-news-brief__story-title">{{ story.title }}</h3>
          <p class="ai-news-brief__story-summary">{{ story.summary }}</p>
          <p class="ai-news-brief__story-note">{{ story.whyItMatters }}</p>

          <div class="ai-news-brief__story-meta">
            <time class="ai-news-brief__story-time">{{ formatPublishedAt(story.publishedAt) }}</time>
            <a
              class="ai-news-brief__story-link"
              :href="story.sourceUrl"
              target="_blank"
              rel="noreferrer"
            >
              Source
            </a>
          </div>
        </a-card>
      </template>
    </div>
  </section>
</template>
