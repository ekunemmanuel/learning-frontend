<script setup lang="ts">
import { ref } from 'vue'

const period = ref<'daily' | 'weekly' | 'monthly'>('weekly')

const chartData = [
  { label: 'Jan', value: 45, height: '45%' },
  { label: 'Feb', value: 65, height: '65%' },
  { label: 'Mar', value: 55, height: '55%' },
  { label: 'Apr', value: 85, height: '85%' },
  { label: 'May', value: 70, height: '70%' },
  { label: 'Jun', value: 95, height: '95%' },
  { label: 'Jul', value: 80, height: '80%' },
  { label: 'Aug', value: 110, height: '100%' },
  { label: 'Sep', value: 90, height: '90%' },
  { label: 'Oct', value: 105, height: '98%' },
  { label: 'Nov', value: 75, height: '75%' },
  { label: 'Dec', value: 120, height: '100%' },
]
</script>

<template>
  <UCard class="border border-gray-200 dark:border-gray-800 shadow-sm">
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-gray-900 dark:text-white">Revenue Overview</h2>
          <p class="text-xs text-gray-500">Track monthly performance analytics and growth</p>
        </div>

        <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg self-start sm:self-auto">
          <UButton
            color="neutral"
            :variant="period === 'daily' ? 'solid' : 'ghost'"
            size="xs"
            @click="period = 'daily'"
          >
            Daily
          </UButton>
          <UButton
            color="neutral"
            :variant="period === 'weekly' ? 'solid' : 'ghost'"
            size="xs"
            @click="period = 'weekly'"
          >
            Weekly
          </UButton>
          <UButton
            color="neutral"
            :variant="period === 'monthly' ? 'solid' : 'ghost'"
            size="xs"
            @click="period = 'monthly'"
          >
            Monthly
          </UButton>
        </div>
      </div>
    </template>

    <!-- Visual Chart Bars -->
    <div class="space-y-4 py-2">
      <div class="h-56 flex items-end justify-between gap-2 pt-6 px-2">
        <div
          v-for="item in chartData"
          :key="item.label"
          class="flex-1 flex flex-col items-center gap-2 group h-full justify-end"
        >
          <div
            class="w-full max-w-[28px] bg-primary-500/80 hover:bg-primary-600 rounded-t-md transition-all duration-300 relative"
            :style="{ height: item.height }"
          >
            <!-- Tooltip -->
            <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg font-bold">
              ${{ item.value }}k
            </div>
          </div>
          <span class="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
            {{ item.label }}
          </span>
        </div>
      </div>
    </div>
  </UCard>
</template>
