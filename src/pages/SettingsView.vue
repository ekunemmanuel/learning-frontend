<script setup lang="ts">
import { computed } from 'vue'

const links = computed(() => [
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
<UDashboardPanel id="settings" :ui="{ body: '' }">
    <template #header>
      <UDashboardNavbar title="Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <RouterView />
    </template>
  </UDashboardPanel>
</template>
