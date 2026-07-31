import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

import AuthLayout from '../layouts/AuthLayout.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'

import LoginView from '../pages/auth/LoginView.vue'
import SignupView from '../pages/auth/SignupView.vue'
import VerifyView from '../pages/auth/VerifyView.vue'
import ForgotPasswordView from '../pages/auth/ForgotPasswordView.vue'
import ResetPasswordView from '../pages/auth/ResetPasswordView.vue'
import AcceptInvitationView from '../pages/AcceptInvitationView.vue'

import DashboardView from '../pages/DashboardView.vue'
import ProfileView from '../pages/ProfileView.vue'

import SettingsView from '../pages/SettingsView.vue'
import SettingsGeneralView from '../pages/settings/SettingsGeneralView.vue'
import SettingsMembersView from '../pages/settings/SettingsMembersView.vue'
import SettingsSecurityView from '../pages/settings/SettingsSecurityView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    // Guest Authentication Routes (Single Source of Truth Layout)
    {
      path: '/',
      component: AuthLayout,
      children: [
        {
          path: 'login',
          name: 'login',
          component: LoginView,
          meta: { guestOnly: true },
        },
        {
          path: 'signup',
          name: 'signup',
          component: SignupView,
          meta: { guestOnly: true },
        },
        {
          path: 'verify',
          name: 'verify',
          component: VerifyView,
        },
        {
          path: 'forgot-password',
          name: 'forgot-password',
          component: ForgotPasswordView,
          meta: { guestOnly: true },
        },
        {
          path: 'reset-password',
          name: 'reset-password',
          component: ResetPasswordView,
        },
        {
          path: 'invitations/accept',
          name: 'accept-invitation',
          component: AcceptInvitationView,
        },
      ],
    },
    // Protected Dashboard Layout Routes
    {
      path: '/',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
        },
        {
          path: 'profile',
          name: 'profile',
          component: ProfileView,
        },
        {
          path: 'settings',
          component: SettingsView,
          children: [
            {
              path: '',
              name: 'settings-general',
              component: SettingsGeneralView,
            },
            {
              path: 'members',
              name: 'settings-members',
              component: SettingsMembersView,
            },
            {
              path: 'security',
              name: 'settings-security',
              component: SettingsSecurityView,
            },
          ],
        },
      ],
    },
    // Wildcard Catch-All Route (redirects non-existent pages to homepage)
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
