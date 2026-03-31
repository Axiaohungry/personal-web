import { createRouter, createWebHistory } from 'vue-router'

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
