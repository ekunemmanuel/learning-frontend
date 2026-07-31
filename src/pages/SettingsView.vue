<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOrganizationStore } from '../stores/organizationStore'

const router = useRouter()
const route = useRoute()
const organizationStore = useOrganizationStore()

// Auto-redirect personal workspace users away from org-only settings tabs
watchEffect(() => {
  if (organizationStore.isPersonalWorkspace) {
    if (
      route.path === '/settings' ||
      route.path === '/settings/' ||
      route.path === '/settings/members'
    ) {
      router.replace('/settings/security')
    }
  }
})

const links = computed(() => {
  if (organizationStore.isPersonalWorkspace) {
    return [
      {
        label: 'Security & 2FA',
        icon: 'i-lucide-shield-check',
        to: '/settings/security',
      },
    ]
  }

  return [
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
      label: 'Security & 2FA',
      icon: 'i-lucide-shield-check',
      to: '/settings/security',
    },
  ]
})
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
