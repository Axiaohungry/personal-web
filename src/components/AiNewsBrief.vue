<script setup>
import { computed, onMounted, ref } from 'vue'

const loading = ref(true)
const error = ref('')
const updatedAt = ref('')
const stories = ref([])
const requestSequence = ref(0)

const timestampLabel = computed(() => {
  if (!updatedAt.value) {
    return loading.value ? '正在更新' : '暂无更新时间'
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
const firstStorySourceUrl = computed(() => displayStories.value[0]?.sourceUrl || '')
const hasSourceAction = computed(() => Boolean(firstStorySourceUrl.value))

function storyVariantClass(index) {
  if (index === 0) return 'ai-news-brief__story-card--lead'
  if (index === 1) return 'ai-news-brief__story-card--secondary'
  return 'ai-news-brief__story-card--tertiary'
}

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
  const requestId = ++requestSequence.value
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/api/ai/news-brief', {
      headers: {
        Accept: 'application/json',
      },
    })

    if (requestId !== requestSequence.value) {
      return
    }

    if (!response.ok) {
      throw new Error('Request failed.')
    }

    const payload = await response.json()

    if (requestId !== requestSequence.value) {
      return
    }

    updatedAt.value = typeof payload?.updatedAt === 'string' ? payload.updatedAt : ''
    stories.value = Array.isArray(payload?.stories) ? payload.stories.slice(0, 3) : []
  } catch {
    if (requestId !== requestSequence.value) {
      return
    }

    stories.value = []
    updatedAt.value = ''
    error.value = '暂时无法加载最新动态，请稍后再试。'
  } finally {
    if (requestId === requestSequence.value) {
      loading.value = false
    }
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
      <p class="ai-news-brief__eyebrow">AI 最新动态</p>
      <h2 class="ai-news-brief__title">AI 最新动态</h2>
      <p class="ai-news-brief__summary">
        从公开来源整理三条最新 AI 变化，帮助你快速判断哪些信息值得继续关注。
      </p>

      <p class="ai-news-brief__timestamp">
        <span class="ai-news-brief__timestamp-label">更新时间</span>
        <time class="ai-news-brief__timestamp-value">{{ timestampLabel }}</time>
      </p>

      <div class="ai-news-brief__actions">
        <a-button type="primary" size="large" :loading="loading" @click="refreshBrief">
          刷新动态
        </a-button>
        <a-button
          v-if="hasSourceAction"
          size="large"
          :href="firstStorySourceUrl"
          target="_blank"
          rel="noreferrer"
        >
          查看来源
        </a-button>
      </div>
    </div>

    <div class="ai-news-brief__stories" aria-label="AI 最新动态">
      <a-card
        v-if="error"
        class="ai-news-brief__fallback ant-surface-card"
        :bordered="false"
      >
        <p class="ai-news-brief__story-label">更新状态</p>
        <h3 class="ai-news-brief__story-title">暂时无法获取最新动态</h3>
        <p class="ai-news-brief__story-summary">{{ error }}</p>
        <p class="ai-news-brief__story-note">你可以稍后重新刷新，等接口恢复后再查看三条精选动态。</p>
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
        <h3 class="ai-news-brief__story-title">正在整理最新动态</h3>
        <p class="ai-news-brief__story-summary">
          我们正在从同源接口读取最新内容，准备好后这里会显示三条精选动态。
        </p>
      </a-card>

      <template v-else>
        <a-card
          v-for="(story, index) in displayStories"
          :key="`${story.title}-${story.publishedAt}`"
          class="ai-news-brief__story-card ant-surface-card"
          :class="storyVariantClass(index)"
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
              原文
            </a>
          </div>
        </a-card>
      </template>
    </div>
  </section>
</template>
