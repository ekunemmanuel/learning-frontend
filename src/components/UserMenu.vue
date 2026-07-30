<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const userName = computed(() => authStore.user?.name || 'User Account')
const userEmail = computed(() => authStore.user?.email || 'user@example.com')
const userAvatar = computed(() => authStore.user?.avatarUrl || undefined)

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

const dropdownItems = computed(() => [
  [
    {
      label: userName.value,
      slot: 'account',
      disabled: true,
    },
  ],
  [
    {
      label: 'Profile Settings',
      icon: 'i-lucide-user',
      to: '/profile',
    },
    {
      label: 'Security & 2FA',
      icon: 'i-lucide-shield-check',
      to: '/settings/security',
      badge: authStore.isMfaEnabled ? '2FA Active' : undefined,
    },
  ],
  [
    {
      label: 'Documentation',
      icon: 'i-lucide-book-open',
      to: '#',
    },
  ],
  [
    {
      label: 'Sign Out',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      onSelect: handleLogout,
    },
  ],
])
</script>

<template>
  <UDropdownMenu :items="dropdownItems" :content="{ align: 'end' }">
    <UButton
      color="neutral"
      variant="ghost"
      class="w-full justify-between p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <UAvatar
          :src="userAvatar"
          :alt="userName"
          size="sm"
          class="shrink-0 font-bold bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
        />
        <div class="text-left truncate">
          <p class="text-xs font-semibold text-gray-900 dark:text-white truncate">
            {{ userName }}
          </p>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 truncate">
            {{ userEmail }}
          </p>
        </div>
      </div>
      <UIcon name="i-lucide-chevrons-up-down" class="w-4 h-4 text-gray-400 shrink-0" />
    </UButton>

    <template #account>
      <div class="px-2 py-1.5">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Signed in as</p>
        <p class="text-xs font-bold text-gray-900 dark:text-white truncate">{{ userEmail }}</p>
      </div>
    </template>
  </UDropdownMenu>
</template>
