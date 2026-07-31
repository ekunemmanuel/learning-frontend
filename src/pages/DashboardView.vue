<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import HomeStats from '../components/home/HomeStats.vue'
import HomeChart from '../components/home/HomeChart.vue'
import HomeSales from '../components/home/HomeSales.vue'
import { useDashboard } from '../composables/useDashboard'

const { isNotificationsSlideoverOpen } = useDashboard()

const items = [
  [
    {
      label: 'New customer',
      icon: 'i-lucide-user-plus',
      to: '/customers',
    },
    {
      label: 'Organization Settings',
      icon: 'i-lucide-building',
      to: '/settings/members',
    },
  ],
] satisfies DropdownMenuItem[][]
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>

          <UDropdownMenu :items="items">
            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <HomeStats />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div class="lg:col-span-2">
          <HomeChart />
        </div>
        <div>
          <HomeSales />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
