<script setup>
import ModuleWorkbenchLayout from '@/components/modules/ModuleWorkbenchLayout.vue'
import { foodLibraryGroups } from '@/data/foodLibraryCatalog.js'
import { moduleSources } from '@/data/moduleSources.js'
import { useEmbeddedModuleState } from '@/hooks/useEmbeddedModuleState.js'
import { createRemoteLookup } from '@/hooks/useRemoteLookup.js'

// 食物库由两部分组成：
// 1. 本地静态高频食物表；
// 2. 远程 Gemini 搜索结果。
// 两部分共用同一张展示表，但数据来源不同。
useEmbeddedModuleState()

const {
  searchKeyword,
  loading,
  remoteRows,
  remoteError,
  handleSearch,
} = createRemoteLookup({
  endpoint: '/api/fitness/food-search',
  keyPrefix: 'food-result',
})

const foodColumns = [
  { title: '食物', dataIndex: 'name', key: 'name' },
  { title: '热量', key: 'calories', customRender: ({ record }) => `${record.calories} kcal` },
  { title: '碳水', key: 'carbs', customRender: ({ record }) => `${record.carbs} g` },
  { title: '蛋白', key: 'protein', customRender: ({ record }) => `${record.protein} g` },
  { title: '脂肪', key: 'fat', customRender: ({ record }) => `${record.fat} g` },
  { title: '使用场景', dataIndex: 'scene', key: 'scene' },
]

</script>

<template>
  <ModuleWorkbenchLayout
    eyebrow="Food Library"
    title="食物库"
    intro="先看本地高频食物模板，再用 Gemini 快速补充你关心的食物参考值。所有搜索结果都会统一成每 100g 的对比口径。"
    note="AI 返回更适合做快速比较，不适合作为医疗、品牌标签或极端精确称量的唯一依据。遇到包装食品、复杂烹饪方式或特殊品牌，请再核对包装和权威数据库。"
  >
    <a-row :gutter="[16, 16]">
      <a-col v-for="group in foodLibraryGroups" :key="group.key" :xs="24">
        <a-card :title="group.title" :bordered="false">
          <p class="module-copy">{{ group.description }}</p>
          <a-table
            :columns="foodColumns"
            :data-source="group.items.map((item) => ({ ...item, key: item.name }))"
            :pagination="false"
            size="small"
            :scroll="{ x: 900 }"
          />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="12">
        <a-card title="使用建议" :bordered="false">
          <a-list
            :data-source="[
              '所有本地食物都统一成每 100g，方便先横向比较热量和三大营养素密度。',
              '主食先看碳水密度，蛋白来源先看蛋白和脂肪，再回到你的真实餐量去换算。',
              '外部搜索更适合补充参考，不建议拿 AI 结果直接替代包装标签和长期记录数据。'
            ]"
          >
            <template #renderItem="{ item }">
              <a-list-item>{{ item }}</a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="Gemini 营养搜索" :bordered="false">
          <a-space direction="vertical" style="width: 100%" size="middle">
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="支持中文搜索，比如：香蕉、鸡胸肉、燕麦、酸奶"
              enter-button="搜索"
              :loading="loading"
              @search="handleSearch"
            />
            <a-alert
              type="info"
              show-icon
              message="当前结果由 Gemini 生成并规整为每 100g 数据，方便横向比较热量和三大营养素。"
            />
            <a-alert v-if="remoteError" type="error" show-icon :message="remoteError" />
            <a-table
              :columns="foodColumns"
              :data-source="remoteRows"
              :pagination="false"
              size="small"
              :scroll="{ x: 760 }"
            />
          </a-space>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="引用与数据来源" :bordered="false">
      <a-space direction="vertical" size="middle" style="width: 100%">
        <div v-for="source in moduleSources.foodLibrary" :key="source.url" class="source-card">
          <a-typography-title :level="5">{{ source.title }}</a-typography-title>
          <p>{{ source.organization }}</p>
          <p>{{ source.note }}</p>
          <a :href="source.url" target="_blank" rel="noreferrer">打开来源</a>
        </div>
      </a-space>
    </a-card>
  </ModuleWorkbenchLayout>
</template>
