import { createRouter, createWebHistory } from 'vue-router'

// 路由职责说明：
// - 首页与健身工作台是两条一级主线；
// - 健身工作台下的每个模块页都保留独立 URL，方便直接打开或被 iframe 嵌入；
// - 项目案例页也都拆成独立路由，便于首页卡片直接跳转。
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
      component: () => import('@/views/modules/LeanGainCalorieLogicView.vue'),
    },
    {
      path: '/fitness/modules/fenjue-training-system',
      name: 'fitness-fenjue-training-system',
      component: () => import('@/views/modules/FenjueTrainingSystemView.vue'),
    },
    {
      path: '/study',
      alias: ['/study/'],
      name: 'study',
      component: () => import('@/views/study/StudyView.vue'),
    },
    {
      path: '/study/frontend',
      alias: ['/study/frontend/'],
      name: 'study-frontend',
      component: () => import('@/views/study/FrontendStudyIndexView.vue'),
    },
    {
      path: '/study/product',
      alias: ['/study/product/', '/study/product-method/'],
      name: 'study-product',
      component: () => import('@/views/study/ProductStudyView.vue'),
    },
    {
      path: '/study/product/roadmap',
      alias: ['/study/product/roadmap/', '/study/product-method/roadmap/'],
      name: 'study-product-roadmap',
      component: () => import('@/views/study/ProductStudyView.vue'),
    },
    {
      path: '/projects/approval-map-workflow',
      alias: ['/projects/approval-map-workflow/'],
      name: 'project-approval-map-workflow',
      component: () => import('@/views/projects/ProjectApprovalMapWorkflowView.vue'),
    },
    {
      path: '/projects/approval-map-workflow/static-pages',
      alias: ['/projects/approval-map-workflow/static-pages/'],
      name: 'project-approval-map-workflow-static-pages',
      component: () => import('@/views/government-approval/GovernmentApprovalStaticPagesView.vue'),
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
