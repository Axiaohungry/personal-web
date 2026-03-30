<script setup>
import { ref } from 'vue'

import ModuleWorkbenchLayout from '@/components/modules/ModuleWorkbenchLayout.vue'
import { moduleSources } from '@/data/moduleSources.js'
import { aisGroupA, aisGroupB, supplementCatalog } from '@/data/supplementCatalog.js'
import { useEmbeddedModuleState } from '@/hooks/useEmbeddedModuleState.js'

useEmbeddedModuleState()

const searchKeyword = ref('')
const loading = ref(false)
const remoteRows = ref([])
const remoteError = ref('')

const supplementColumns = [
  { title: '补剂', dataIndex: 'name', key: 'name' },
  { title: '优先级', dataIndex: 'priority', key: 'priority' },
  { title: '证据', dataIndex: 'evidence', key: 'evidence' },
  { title: '常见剂量', dataIndex: 'dose', key: 'dose' },
  { title: '适用场景', dataIndex: 'bestFor', key: 'bestFor' },
]

const remoteColumns = [
  { title: '补剂', dataIndex: 'name', key: 'name' },
  { title: '常见剂量', dataIndex: 'dose', key: 'dose' },
  { title: '适用场景', dataIndex: 'bestFor', key: 'bestFor' },
]

async function handleSearch() {
  const keyword = searchKeyword.value.trim()
  if (!keyword) return

  loading.value = true
  remoteError.value = ''

  try {
    const response = await fetch(`/api/fitness/supplement-search?q=${encodeURIComponent(keyword)}`)
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.error || `接口响应 ${response.status}`)
    }

    remoteRows.value = (data.items || []).map((item, index) => ({
      ...item,
      key: `supplement-result-${index}`,
    }))

    if (!remoteRows.value.length) {
      remoteError.value = '没有拿到可用结果，换个关键词再试试。'
    }
  } catch (error) {
    remoteRows.value = []
    remoteError.value = error.message || '搜索失败，请稍后再试。'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <ModuleWorkbenchLayout
    eyebrow="Supplement Library"
    title="补剂库"
    intro="补剂页分成两层：先看核心补剂说明和 AIS 分类，再用 Gemini 快速补充常见剂量与适用场景。"
    note="这里的搜索结果是 AI 汇总后的快速参考，不替代医生建议，也不应该直接当成品牌标签或疗效结论。存在基础疾病、长期用药或特殊人群场景时，请优先咨询专业人士。"
  >
    <a-row :gutter="[16, 16]">
      <a-col :xs="24">
        <a-card title="核心补剂说明" :bordered="false">
          <a-table
            :columns="supplementColumns"
            :data-source="supplementCatalog.map((item) => ({ ...item, key: item.key }))"
            :pagination="false"
            :scroll="{ x: 860 }"
          />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="12">
        <a-card title="A 类补剂" :bordered="false">
          <a-collapse>
            <a-collapse-panel
              v-for="group in aisGroupA"
              :key="group.category"
              :header="group.category"
            >
              <a-list :data-source="group.items" size="small">
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </a-collapse-panel>
          </a-collapse>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="B 类补剂" :bordered="false">
          <a-collapse>
            <a-collapse-panel
              v-for="group in aisGroupB"
              :key="group.category"
              :header="group.category"
            >
              <a-list :data-source="group.items" size="small">
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </a-collapse-panel>
          </a-collapse>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="12">
        <a-card title="补剂使用提醒" :bordered="false">
          <a-list
            :data-source="[
              '先把总热量、蛋白、训练安排和睡眠做好，再考虑补剂。',
              '最有效的补剂通常不是数量最多，而是最稳定执行、最贴合目标的那几个。',
              '如果有基础疾病、长期用药或凝血相关问题，先问医生，再决定是否使用补剂。'
            ]"
          >
            <template #renderItem="{ item }">
              <a-list-item>{{ item }}</a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="Gemini 补剂搜索" :bordered="false">
          <a-space direction="vertical" style="width: 100%" size="middle">
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="支持中文搜索，比如：肌酸、鱼油、维生素 D、咖啡因"
              enter-button="搜索"
              :loading="loading"
              @search="handleSearch"
            />
            <a-alert
              type="info"
              show-icon
              message="当前结果由 Gemini 汇总常见补剂信息，适合快速回忆剂量和场景，不替代医学建议。"
            />
            <a-alert v-if="remoteError" type="error" show-icon :message="remoteError" />
            <a-table
              :columns="remoteColumns"
              :data-source="remoteRows"
              :pagination="false"
              size="small"
              :scroll="{ x: 720 }"
            />
          </a-space>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="引用与证据来源" :bordered="false">
      <a-space direction="vertical" size="middle" style="width: 100%">
        <div v-for="source in moduleSources.supplementLibrary" :key="source.url" class="source-card">
          <a-typography-title :level="5">{{ source.title }}</a-typography-title>
          <p>{{ source.organization }}</p>
          <p>{{ source.note }}</p>
          <a :href="source.url" target="_blank" rel="noreferrer">打开来源</a>
        </div>
      </a-space>
    </a-card>
  </ModuleWorkbenchLayout>
</template>
