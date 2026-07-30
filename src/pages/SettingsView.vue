<script setup lang="ts">
import { computed } from 'vue'

const tabs = computed(() => [
  {
    label: 'General',
    icon: 'i-lucide-settings',
    to: '/settings',
    exact: true,
  },
  {
    label: 'Members & Team',
    icon: 'i-lucide-users',
    to: '/settings/members',
  },
  {
    label: 'Notifications',
    icon: 'i-lucide-bell',
    to: '/settings/notifications',
  },
  {
    label: 'Security & 2FA',
    icon: 'i-lucide-shield-check',
    to: '/settings/security',
  },
])
</script>

<template>
  <div class="space-y-6">
    <!-- Header Title -->
    <div>
      <h2 class="text-xl font-extrabold text-gray-900 dark:text-white">Workspace Settings</h2>
      <p class="text-xs text-gray-500">Manage your organization preferences, team members, and security</p>
    </div>

    <!-- Sub Navigation Tabs -->
    <UNavigationMenu :items="tabs" orientation="horizontal" class="border-b border-gray-200 dark:border-gray-800 pb-2" />

    <!-- Sub Page View -->
    <UCard class="border border-gray-200 dark:border-gray-800 shadow-sm">
      <RouterView />
    </UCard>
  </div>
</template>
