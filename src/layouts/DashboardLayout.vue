<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import type { NavigationMenuItem } from '@nuxt/ui'
import TeamsMenu from '../components/TeamsMenu.vue'
import UserMenu from '../components/UserMenu.vue'
import NotificationsSlideover from '../components/NotificationsSlideover.vue'
import { useOrganizationStore } from '../stores/organizationStore'

const toast = useToast()
const organizationStore = useOrganizationStore()

const open = ref(false)

const links = computed<NavigationMenuItem[][]>(() => {
  const isPersonal = organizationStore.isPersonalWorkspace

  const settingsChildren: NavigationMenuItem[] = isPersonal
    ? [
        {
          label: 'Security',
          to: '/settings/security',
          onSelect: () => {
            open.value = false
          },
        },
      ]
    : [
        {
          label: 'General',
          to: '/settings',
          exact: true,
          onSelect: () => {
            open.value = false
          },
        },
        {
          label: 'Members',
          to: '/settings/members',
          onSelect: () => {
            open.value = false
          },
        },
        {
          label: 'Security',
          to: '/settings/security',
          onSelect: () => {
            open.value = false
          },
        },
      ]

  return [
    [
      {
        label: 'Dashboard',
        icon: 'i-lucide-house',
        to: '/dashboard',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Settings',
        to: isPersonal ? '/settings/security' : '/settings',
        icon: 'i-lucide-settings',
        defaultOpen: true,
        type: 'trigger' as const,
        children: settingsChildren,
      },
    ],
  ]
})

const groups = computed(() => {
  const isPersonal = organizationStore.isPersonalWorkspace
  return [
    {
      id: 'links',
      label: 'Go to',
      items: [
        {
          label: 'Dashboard',
          icon: 'i-lucide-house',
          to: '/dashboard',
        },
        ...(isPersonal
          ? [
              {
                label: 'Security & 2FA',
                icon: 'i-lucide-shield-check',
                to: '/settings/security',
              },
            ]
          : [
              {
                label: 'General Settings',
                icon: 'i-lucide-settings',
                to: '/settings',
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
            ]),
      ],
    },
  ]
})

const cookie = useStorage('cookie-consent', 'pending')
if (cookie.value !== 'accepted') {
  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [
      {
        label: 'Accept',
        color: 'neutral',
        variant: 'outline',
        onClick: () => {
          cookie.value = 'accepted'
        },
      },
      {
        label: 'Opt out',
        color: 'neutral',
        variant: 'ghost',
      },
    ],
  })
}
</script>

<template>
  <UDashboardGroup unit="rem" storage="local">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <RouterView />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
