<script setup lang="ts">
interface StatCard {
  title: string
  value: string
  trend: string
  trendType: 'positive' | 'negative'
  period: string
  icon: string
  iconColor: string
}

const stats: StatCard[] = [
  {
    title: 'Total Revenue',
    value: '$45,231.89',
    trend: '+12.5%',
    trendType: 'positive',
    period: 'vs. last month',
    icon: 'i-lucide-dollar-sign',
    iconColor: 'text-success-600 dark:text-success-400 bg-success-100 dark:bg-success-950',
  },
  {
    title: 'Active Users',
    value: '2,350',
    trend: '+18.2%',
    trendType: 'positive',
    period: 'vs. last month',
    icon: 'i-lucide-users',
    iconColor: 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-950',
  },
  {
    title: 'Conversion Rate',
    value: '3.42%',
    trend: '-1.4%',
    trendType: 'negative',
    period: 'vs. last month',
    icon: 'i-lucide-trending-up',
    iconColor: 'text-info-600 dark:text-info-400 bg-info-100 dark:bg-info-950',
  },
  {
    title: 'New Subscriptions',
    value: '+573',
    trend: '+24.1%',
    trendType: 'positive',
    period: 'vs. last month',
    icon: 'i-lucide-user-check',
    iconColor: 'text-warning-600 dark:text-warning-400 bg-warning-100 dark:bg-warning-950',
  },
]
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <UCard
      v-for="stat in stats"
      :key="stat.title"
      class="border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
    >
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{{
            stat.title
          }}</span>
          <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="stat.iconColor">
            <UIcon :name="stat.icon" class="w-4 h-4" />
          </div>
        </div>

        <div>
          <h3 class="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {{ stat.value }}
          </h3>
        </div>

        <div class="flex items-center gap-1.5 text-xs">
          <span
            class="font-bold flex items-center gap-0.5"
            :class="
              stat.trendType === 'positive'
                ? 'text-success-600 dark:text-success-400'
                : 'text-error-600 dark:text-error-400'
            "
          >
            <UIcon
              :name="
                stat.trendType === 'positive'
                  ? 'i-lucide-arrow-up-right'
                  : 'i-lucide-arrow-down-right'
              "
              class="w-3.5 h-3.5"
            />
            {{ stat.trend }}
          </span>
          <span class="text-gray-500 dark:text-gray-400">{{ stat.period }}</span>
        </div>
      </div>
    </UCard>
  </div>
</template>
