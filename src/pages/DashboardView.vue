<script setup lang="ts">
import HomeStats from '../components/home/HomeStats.vue'
import HomeChart from '../components/home/HomeChart.vue'
import HomeSales from '../components/home/HomeSales.vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
</script>

<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-linear-to-r from-primary-600 to-primary-800 rounded-2xl text-white shadow-lg">
      <div class="space-y-1">
        <h2 class="text-2xl font-black tracking-tight">
          Welcome back, {{ authStore.user?.name || 'Developer' }}!
        </h2>
        <p class="text-xs text-primary-100 font-medium">
          Here is what is happening in your workspace today.
        </p>
      </div>

      <div class="flex items-center gap-2 self-start sm:self-auto">
        <RouterLink to="/customers">
          <UButton color="neutral" variant="solid" size="sm" class="font-bold">
            Manage Customers
          </UButton>
        </RouterLink>
      </div>
    </div>

    <!-- Stat Metric Cards -->
    <HomeStats />

    <!-- Performance Chart & Recent Transactions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <HomeChart />
      </div>
      <div>
        <HomeSales />
      </div>
    </div>
  </div>
</template>
