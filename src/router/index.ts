import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

import LoginView from '../pages/LoginView.vue'
import SignupView from '../pages/SignupView.vue'
import VerifyView from '../pages/VerifyView.vue'
import ForgotPasswordView from '../pages/ForgotPasswordView.vue'
import ResetPasswordView from '../pages/ResetPasswordView.vue'
import ProfileView from '../pages/ProfileView.vue'
import DashboardView from '../pages/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView,
      meta: { guestOnly: true },
    },
    {
      path: '/verify',
      name: 'verify',
      component: VerifyView,
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
      meta: { guestOnly: true },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPasswordView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/',
    },
  ],
})

let isInitialCheckDone = false

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!isInitialCheckDone) {
    await authStore.fetchUser()
    isInitialCheckDone = true
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { path: '/dashboard' }
  }
})

export default router
