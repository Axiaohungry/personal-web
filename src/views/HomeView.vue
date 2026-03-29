<script setup>
import { computed } from 'vue'

import ContentSection from '@/components/ContentSection.vue'
import HomeHero from '@/components/HomeHero.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { contact } from '@/data/contact.js'
import { experiences } from '@/data/experience.js'
import { navigationItems } from '@/data/navigation.js'
import { profile } from '@/data/profile.js'
import { projects } from '@/data/projects.js'
import { skillGroups } from '@/data/skills.js'

const quickStats = computed(() => [
  { label: '长期项目', value: `${projects.length}` },
  { label: '当前所在', value: profile.location },
  { label: '关注方向', value: `${skillGroups.length}` },
  { label: '联系方式', value: 'Email' },
])

const focusAreas = ['产品设计', 'Vue 3 开发', 'GIS 场景', '健身工具', '需求协同', '数据分析']

const featuredSignals = computed(() => [
  {
    label: '现在的工作重心',
    value: '产品 + 前端',
    note: '既会先想清楚问题，也会把界面和功能亲手做出来。',
  },
  {
    label: '做过的场景',
    value: '政务审批 + 地图工程',
    note: '做过流程复杂、约束很多的项目，所以更重视清楚、稳定和可落地。',
  },
  {
    label: '自己的长期项目',
    value: '健身工作台',
    note: '这不是概念页，而是我自己会持续用、持续改的一套工具。',
  },
])

const narrativeCards = computed(() => [
  {
    title: '我更关心东西能不能真正用起来',
    summary:
      '无论是政务审批项目，还是现在这个健身工作台，我更在意的都不是页面本身，而是它能不能真的进入某个人的日常流程里。',
  },
  {
    title: '我做事通常是先理解，再动手',
    summary:
      '我习惯先把问题、流程和约束想清楚，再去写页面、搭结构、接数据。开始会慢一点，但后面通常更稳。',
  },
  {
    title: '工作和训练，我都习惯留出复盘空间',
    summary:
      '我不太相信“一次做完”。不管是项目、协作还是训练，我都更习惯边做边看结果，再决定下一步怎么调。',
  },
])
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

      <section class="home-page__body-shell shell-surface motion-rise motion-rise--2">
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
            eyebrow="Experience"
            title="经历"
            intro="这些经历基本都在说明一件事：我既关心问题本身，也愿意把它一步步做出来。"
          >
            <a-timeline class="experience-timeline">
              <a-timeline-item
                v-for="experience in experiences"
                :key="experience.organization + experience.title"
              >
                <a-card class="timeline-card ant-surface-card" :bordered="false">
                  <div class="timeline-card__topline">
                    <p class="timeline-card__period">{{ experience.period }}</p>
                    <p class="timeline-card__org">{{ experience.organization }}</p>
                  </div>
                  <h3 class="timeline-card__title">{{ experience.title }}</h3>
                  <p class="timeline-card__summary">{{ experience.summary }}</p>
                  <div class="timeline-card__chips">
                    <a-tag v-for="highlight in experience.highlights" :key="highlight" color="orange">
                      {{ highlight }}
                    </a-tag>
                  </div>
                </a-card>
              </a-timeline-item>
            </a-timeline>
          </ContentSection>

          <ContentSection
            section-id="projects"
            eyebrow="Projects"
            title="项目"
            intro="这里放的是我觉得最能代表自己的几类东西：能上线的、能长期维护的，以及我自己会反复使用的。"
          >
            <a-row :gutter="[18, 18]" class="feature-grid">
              <a-col
                v-for="project in projects"
                :key="project.name"
                :xs="24"
                :md="12"
              >
                <a-card class="feature-card ant-surface-card" :bordered="false">
                  <template #extra>
                    <a-button type="link" class="feature-card__link" :href="project.href">打开</a-button>
                  </template>

                  <a-tag color="geekblue">{{ project.status }}</a-tag>
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
            eyebrow="Skills"
            title="技能"
            intro="我不太把这些当作标签，更像是这些年反复使用下来，真正顺手的一套工具和方法。"
          >
            <a-row :gutter="[18, 18]" class="skills-grid">
              <a-col
                v-for="group in skillGroups"
                :key="group.title"
                :xs="24"
                :md="12"
              >
                <a-card class="skill-card ant-surface-card" :bordered="false">
                  <h3 class="skill-card__title">{{ group.title }}</h3>
                  <div class="skill-card__list">
                    <a-tag v-for="item in group.items" :key="item" color="cyan">{{ item }}</a-tag>
                  </div>
                </a-card>
              </a-col>
            </a-row>
          </ContentSection>

          <ContentSection
            section-id="contact"
            eyebrow="Contact"
            title="联系我"
            intro="如果你想聊产品、前端、地图场景，或者对这个健身工具有想法，邮件联系我最直接。"
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
                <a-button size="large" href="/fitness/">健身工作台</a-button>
              </a-space>
            </a-card>
          </ContentSection>
        </div>
      </section>
    </div>
  </main>
</template>
