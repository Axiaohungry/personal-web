<script setup>
import AiNewsBrief from '@/components/AiNewsBrief.vue'
import ContentSection from '@/components/ContentSection.vue'
import HomeHero from '@/components/HomeHero.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { contact } from '@/data/contact.js'
import { experiences } from '@/data/experience.js'
import { navigationItems } from '@/data/navigation.js'
import { profile } from '@/data/profile.js'
import { projects } from '@/data/projects.js'
import { skillGroups } from '@/data/skills.js'

// 首页本身不做复杂交互，它负责把“个人介绍 / 最新动态 / 经历 / 项目 / 技能 / 联系方式”
// 这几组内容组织成一个可快速浏览的叙事顺序。
// 下面这些数组就是首页首屏和各分区要消费的展示数据。
const quickStats = [
  { label: '当前角色', value: '解决方案 + 前端' },
  { label: '工作现场', value: '真实业务 / 自用工具' },
  { label: '关注重点', value: '结构 / 使用 / 迭代' },
  { label: '联系渠道', value: '邮件联系' },
]

const focusAreas = ['产品理解', '方案推进', '前端落地', 'AI趋势', '长期工具', '数据判断']

const featuredSignals = [
  {
    label: '当前状态',
    value: '真实业务 + 自用工具',
    note: '在真实业务和自用工具之间并行推进：前者处理流程、界面和数据，后者沉淀长期可复用的工具。',
  },
  {
    label: '做事习惯',
    value: '先判断，再动手',
    note: '先定位问题，再决定如何拆解和处理。',
  },
  {
    label: '长期关注',
    value: '结构、使用与迭代',
    note: '关注的不是“做了什么”，而是是否被理解、被使用，以及能否继续演化。',
  },
]

const narrativeCards = [
  {
    title: '先把问题讲清楚',
    summary:
      '我不会急着直接给方案。很多问题难推进，并不是因为做不出来，而是目标、边界和优先级没有被明确。',
  },
  {
    title: '把复杂问题结构化',
    summary:
      '无论是业务流程、空间场景还是训练计划，我都会先梳理角色、路径和关键信息，再将其组织成更清晰、可执行的结构。',
  },
  {
    title: '让方案能够被使用',
    summary:
      '对我来说，前端、数据和方案设计并不是分开的标签，而是一套协同工作的能力，用来把想法落成可运行、可调整的结果。',
  },
]
</script>

<template>
  <main class="home-page site-page">
    <div class="page-shell">
      <SiteHeader
        :site-name="profile.name"
        :location="profile.location"
        :navigation-items="navigationItems"
      />

      <section class="home-page__frame shell-surface">
        <HomeHero
          :profile="profile"
          :quick-stats="quickStats"
          :focus-areas="focusAreas"
          :featured-signals="featuredSignals"
        />
      </section>

      <AiNewsBrief />

      <section class="home-page__body-shell home-page__body-shell--dossier shell-surface motion-rise motion-rise--2">
        <section class="home-overview">
          <a-row :gutter="[18, 18]">
            <a-col
              v-for="card in narrativeCards"
              :key="card.title"
              :xs="24"
              :md="8"
            >
              <a-card class="home-overview__card ant-surface-card" :bordered="false">
                <p class="home-overview__label">我的做法</p>
                <h2 class="home-overview__title">{{ card.title }}</h2>
                <p class="home-overview__summary">{{ card.summary }}</p>
              </a-card>
            </a-col>
          </a-row>
        </section>

        <div class="home-page__grid">
          <ContentSection
            section-id="experience"
            class="home-section home-section--now"
            eyebrow="Now"
            title="我做的几件事"
            intro="投入过的几类工作：真实业务中的产品推进、自用工具的打磨，以及会长期做下去的兴趣与研究。"
          >
            <a-row :gutter="[18, 18]" class="story-grid">
              <a-col
                v-for="experience in experiences"
                :key="experience.organization + experience.title"
                :xs="24"
                :md="8"
              >
                <a-card class="story-card ant-surface-card" :bordered="false">
                  <div class="story-card__topline">
                    <p class="story-card__label">{{ experience.organization }}</p>
                    <p class="story-card__period">{{ experience.period }}</p>
                  </div>
                  <h3 class="story-card__title">{{ experience.title }}</h3>
                  <p class="story-card__summary">{{ experience.summary }}</p>
                  <div class="story-card__chips">
                    <a-tag v-for="highlight in experience.highlights" :key="highlight">
                      {{ highlight }}
                    </a-tag>
                  </div>
                </a-card>
              </a-col>
            </a-row>
          </ContentSection>

          <ContentSection
            section-id="projects"
            class="home-section home-section--cases"
            eyebrow="Cases"
            title="几个能代表我的切面"
            intro="这些内容对我来说不只是作品展示，更像是一些留下来的工作证据。它们能比较真实地说明我在意什么，也说明我是怎么把一件事推进到落地的。"
          >
            <a-row :gutter="[18, 18]" class="feature-grid">
              <a-col
                v-for="(project, index) in projects"
                :key="project.name"
                :xs="24"
                :md="index === 0 ? 24 : 12"
              >
                <a-card
                  class="feature-card ant-surface-card"
                  :class="{ 'feature-card--lead': index === 0 }"
                  :bordered="false"
                >
                  <template #extra>
                    <a-button type="link" class="feature-card__link" :href="project.href">
                      {{ project.href === '/fitness/' ? '打开工具' : '查看案例' }}
                    </a-button>
                  </template>

                  <a-tag class="feature-card__status">{{ project.status }}</a-tag>
                  <h3 class="feature-card__title">{{ project.name }}</h3>
                  <p class="feature-card__summary">{{ project.summary }}</p>
                  <div class="chip-list">
                    <a-tag v-for="tag in project.tags" :key="tag">{{ tag }}</a-tag>
                  </div>
                </a-card>
              </a-col>
            </a-row>
          </ContentSection>

          <ContentSection
            section-id="skills"
            class="home-section home-section--tools"
            eyebrow="Tools"
            title="能力与工具"
            intro="我不太把这些看成零散的技能点。它们更像是围绕几类核心问题逐渐长出来的能力组合，以及我真正长期在用的一组工具。"
          >
            <a-row :gutter="[18, 18]" class="skills-grid">
              <a-col
                v-for="(group, index) in skillGroups"
                :key="group.title"
                :xs="24"
                :md="index === 0 ? 24 : 12"
                :lg="index === 0 ? 24 : 8"
              >
                <a-card
                  class="skill-card ant-surface-card"
                  :class="{ 'skill-card--lead': index === 0 }"
                  :bordered="false"
                >
                  <h3 class="skill-card__title">{{ group.title }}</h3>
                  <div v-if="index === 0" class="skill-card__list">
                    <a-tag v-for="item in group.items" :key="item">{{ item }}</a-tag>
                  </div>
                  <p v-if="group.description" class="skill-card__summary">{{ group.description }}</p>
                  <div v-if="index !== 0" class="skill-card__list">
                    <a-tag v-for="item in group.items" :key="item">{{ item }}</a-tag>
                  </div>
                </a-card>
              </a-col>
            </a-row>
          </ContentSection>

          <ContentSection
            section-id="contact"
            class="home-section home-section--contact"
            eyebrow="Contact"
            title="联系我"
            intro="如果你对产品、前端、地图场景，或者长期主义的工具感兴趣，可以来聊聊。"
          >
            <a-card class="contact-card ant-surface-card" :bordered="false">
              <div class="contact-card__identity">
                <div>
                  <p class="contact-card__name">{{ contact.name }}</p>
                  <p class="contact-card__location">{{ contact.location }}</p>
                </div>
                <a class="contact-card__email" :href="`mailto:${contact.email}`">{{ contact.email }}</a>
              </div>

              <p class="contact-card__note">{{ contact.note }}</p>

              <a-space wrap size="middle">
                <a-button type="primary" size="large" :href="contact.cta.href">
                  {{ contact.cta.label }}
                </a-button>
                <a-button size="large" href="/fitness/">打开健身工作台</a-button>
              </a-space>
            </a-card>
          </ContentSection>
        </div>
      </section>
    </div>
  </main>
</template>
