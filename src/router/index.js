import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue')
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chat/:id?',
    name: 'Chat',
    component: () => import('@/views/ChatView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/knowledgebase',
    name: 'KnowledgeBase',
    component: () => import('@/views/KnowledgeBaseView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/records/glucose',
    name: 'BloodGlucose',
    component: () => import('@/views/BloodGlucoseRecordView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/records/exercise',
    name: 'Exercise',
    component: () => import('@/views/ExerciseRecordView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/report',
    name: 'HealthWeeklyReport',
    component: () => import('@/views/HealthWeeklyReportView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/system/message',
    name: 'SystemMessage',
    component: () => import('@/views/SystemMessageView.vue'),
    mata: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if ((to.name === 'Login' || to.name === 'Register') && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
