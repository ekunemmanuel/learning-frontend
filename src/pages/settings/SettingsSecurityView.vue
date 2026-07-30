<script setup lang="ts">
import { useAuthStore } from '../../stores/authStore'

const authStore = useAuthStore()
</script>

<template>
  <div class="space-y-6">
    <!-- 2FA Status Card -->
    <div class="p-5 border border-gray-200 dark:border-gray-800 rounded-xl space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <UIcon name="i-lucide-shield-check" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">Two-Factor Authentication (2FA)</h3>
            <p class="text-xs text-gray-500">Add an extra layer of security to your account using TOTP apps</p>
          </div>
        </div>

        <UBadge
          :color="authStore.isMfaEnabled ? 'success' : 'warning'"
          variant="soft"
          size="md"
          class="font-bold"
        >
          {{ authStore.isMfaEnabled ? '2FA Enabled' : '2FA Disabled' }}
        </UBadge>
      </div>

      <div class="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end">
        <RouterLink to="/profile">
          <UButton color="primary" size="sm" icon="i-lucide-settings">
            Manage 2FA in Profile
          </UButton>
        </RouterLink>
      </div>
    </div>

    <!-- Active Sessions -->
    <div class="p-5 border border-gray-200 dark:border-gray-800 rounded-xl space-y-4">
      <h3 class="text-sm font-bold text-gray-900 dark:text-white">Active Sessions</h3>
      <div class="space-y-3">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-laptop" class="w-5 h-5 text-gray-400" />
            <div>
              <p class="font-bold text-gray-900 dark:text-white">Windows (Chrome Browser)</p>
              <p class="text-[10px] text-gray-400">Current Session • 127.0.0.1</p>
            </div>
          </div>
          <UBadge color="success" variant="subtle" size="xs">Active Now</UBadge>
        </div>
      </div>
    </div>
  </div>
</template>
