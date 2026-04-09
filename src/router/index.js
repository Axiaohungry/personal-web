import { defineComponent, h } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import { useEmbeddedModuleState } from '@/hooks/useEmbeddedModuleState.js'

const LeanGainCalorieLogicView = defineComponent({
  name: 'LeanGainCalorieLogicView',
  setup() {
    const { state } = useEmbeddedModuleState()

    return () =>
      h('main', { class: 'lean-gain-module' }, [
        h('section', { class: 'lean-gain-module__shell' }, [
          h('p', { class: 'lean-gain-module__eyebrow' }, 'Fitness Module'),
          h('h1', { class: 'lean-gain-module__title' }, '增肌底层热量逻辑'),
          h(
            'p',
            { class: 'lean-gain-module__lede' },
            '围绕 BMR、TDEE、体脂与增肌目标建立一层可复用的热量判断入口。'
          ),
          h('dl', { class: 'lean-gain-module__grid' }, [
            h('div', [
              h('dt', 'Age'),
              h('dd', String(state.age)),
            ]),
            h('div', [
              h('dt', 'Height'),
              h('dd', `${state.heightCm} cm`),
            ]),
            h('div', [
              h('dt', 'Body Fat'),
              h('dd', `${state.bodyFatPct}%`),
            ]),
            h('div', [
              h('dt', 'BMR'),
              h('dd', `${state.bmr} kcal`),
            ]),
          ]),
        ]),
      ])
  },
})

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/fitness',
      alias: ['/fitness/'],
      name: 'fitness',
      component: () => import('@/views/FitnessView.vue'),
    },
    {
      path: '/fitness/modules/carb-cycling',
      name: 'fitness-carb-cycling',
      component: () => import('@/views/modules/CarbCyclingView.vue'),
    },
    {
      path: '/fitness/modules/carb-taper',
      name: 'fitness-carb-taper',
      component: () => import('@/views/modules/CarbTaperView.vue'),
    },
    {
      path: '/fitness/modules/five-two-fasting',
      name: 'fitness-five-two-fasting',
      component: () => import('@/views/modules/FiveTwoFastingView.vue'),
    },
    {
      path: '/fitness/modules/sixteen-eight-fasting',
      name: 'fitness-sixteen-eight-fasting',
      component: () => import('@/views/modules/SixteenEightFastingView.vue'),
    },
    {
      path: '/fitness/modules/food-library',
      name: 'fitness-food-library',
      component: () => import('@/views/modules/FoodLibraryView.vue'),
    },
    {
      path: '/fitness/modules/supplement-library',
      name: 'fitness-supplement-library',
      component: () => import('@/views/modules/SupplementLibraryView.vue'),
    },
    {
      path: '/fitness/modules/lean-gain-calorie-logic',
      name: 'fitness-lean-gain-calorie-logic',
      component: LeanGainCalorieLogicView,
    },
    {
      path: '/projects/approval-map-workflow',
      alias: ['/projects/approval-map-workflow/'],
      name: 'project-approval-map-workflow',
      component: () => import('@/views/projects/ProjectApprovalMapWorkflowView.vue'),
    },
    {
      path: '/projects/campus-collaboration',
      alias: ['/projects/campus-collaboration/'],
      name: 'project-campus-collaboration',
      component: () => import('@/views/projects/ProjectCampusCollaborationView.vue'),
    },
    {
      path: '/projects/fitness-coaching',
      alias: ['/projects/fitness-coaching/'],
      name: 'project-fitness-coaching',
      component: () => import('@/views/projects/ProjectFitnessCoachingView.vue'),
    },
    {
      path: '/projects/3dgs',
      alias: ['/projects/3dgs/'],
      name: 'project-3dgs',
      component: () => import('@/views/projects/Project3dgsView.vue'),
    },
  ],
})

export default router
