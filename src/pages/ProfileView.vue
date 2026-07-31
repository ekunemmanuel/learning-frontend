<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchUser()
  }
})

// Clear backup codes when leaving page so they are not displayed again later
onUnmounted(() => {
  authStore.clearBackupCodes()
})
</script>

<template>
  <UDashboardPanel id="profile" :ui="{ body: '' }">
    <template #header>
      <UDashboardNavbar title="Profile">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- User Profile Card -->
      <UCard class="">
        <template #header>
          <div class="flex items-center gap-4">
            <UAvatar
              :src="authStore.user?.avatarUrl || ''"
              :alt="authStore.user?.name || 'User Avatar'"
              size="xl"
              class="bg-primary-500 text-white font-bold text-xl"
            >
              {{ authStore.user?.name?.charAt(0).toUpperCase() || 'U' }}
            </UAvatar>
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ authStore.user?.name || 'User Profile' }}
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                @{{ authStore.user?.username }} • ID: {{ authStore.user?.id }}
              </p>
            </div>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
          <div class="space-y-1">
            <span class="text-xs font-semibold uppercase text-gray-400">Email Address</span>
            <div class="flex items-center gap-2">
              <span class="text-base font-medium text-gray-900 dark:text-white">{{
                authStore.user?.email
              }}</span>
              <UBadge
                :color="authStore.isEmailVerified ? 'success' : 'warning'"
                variant="soft"
                size="sm"
              >
                {{ authStore.isEmailVerified ? 'Verified' : 'Unverified' }}
              </UBadge>
            </div>
          </div>

          <div class="space-y-1">
            <span class="text-xs font-semibold uppercase text-gray-400">Phone Number</span>
            <div class="flex items-center gap-2">
              <span class="text-base font-medium text-gray-900 dark:text-white">{{
                authStore.user?.phone || 'Not provided'
              }}</span>
              <UBadge
                v-if="authStore.user?.phone"
                :color="authStore.isPhoneVerified ? 'success' : 'warning'"
                variant="soft"
                size="sm"
              >
                {{ authStore.isPhoneVerified ? 'Verified' : 'Unverified' }}
              </UBadge>
            </div>
          </div>

          <div class="space-y-1">
            <span class="text-xs font-semibold uppercase text-gray-400">Country</span>
            <p class="text-base font-medium text-gray-900 dark:text-white">
              {{ authStore.user?.country || 'Not specified' }}
            </p>
          </div>

          <div class="space-y-1">
            <span class="text-xs font-semibold uppercase text-gray-400"
              >Verification Timestamps</span
            >
            <p class="text-xs text-gray-500">
              Email Verified:
              {{
                authStore.user?.emailVerifiedAt
                  ? new Date(authStore.user.emailVerifiedAt).toLocaleString()
                  : 'N/A'
              }}
            </p>
          </div>
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
