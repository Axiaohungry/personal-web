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
      path: '/projects/3dgs',
      alias: ['/projects/3dgs/'],
      name: 'project-3dgs',
      component: () => import('@/views/projects/Project3dgsView.vue'),
    },
  ],
})

export default router
