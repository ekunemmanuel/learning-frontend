import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

import DashboardLayout from '../layouts/DashboardLayout.vue'

import LoginView from '../pages/LoginView.vue'
import SignupView from '../pages/SignupView.vue'
import VerifyView from '../pages/VerifyView.vue'
import ForgotPasswordView from '../pages/ForgotPasswordView.vue'
import ResetPasswordView from '../pages/ResetPasswordView.vue'
import AcceptInvitationView from '../pages/AcceptInvitationView.vue'

import DashboardView from '../pages/DashboardView.vue'
import CustomersView from '../pages/CustomersView.vue'
import InboxView from '../pages/InboxView.vue'
import ProfileView from '../pages/ProfileView.vue'

import SettingsView from '../pages/SettingsView.vue'
import SettingsGeneralView from '../pages/settings/SettingsGeneralView.vue'
import SettingsMembersView from '../pages/settings/SettingsMembersView.vue'
import SettingsNotificationsView from '../pages/settings/SettingsNotificationsView.vue'
import SettingsSecurityView from '../pages/settings/SettingsSecurityView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    // Guest Authentication Routes (kept unchanged)
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
      path: '/invitations/accept',
      name: 'accept-invitation',
      component: AcceptInvitationView,
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
          path: 'customers',
          name: 'customers',
          component: CustomersView,
        },
        {
          path: 'inbox',
          name: 'inbox',
          component: InboxView,
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
              path: 'notifications',
              name: 'settings-notifications',
              component: SettingsNotificationsView,
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
