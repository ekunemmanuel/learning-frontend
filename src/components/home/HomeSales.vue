<script setup lang="ts">
import { ref } from 'vue'

interface Transaction {
  id: string
  customer: string
  email: string
  amount: string
  status: 'Completed' | 'Pending' | 'Failed'
  date: string
}

const transactions = ref<Transaction[]>([
  {
    id: 'TX-9041',
    customer: 'Alex Rivera',
    email: 'alex.rivera@acme.com',
    amount: '$1,250.00',
    status: 'Completed',
    date: '2026-07-29',
  },
  {
    id: 'TX-9042',
    customer: 'Elena Rostova',
    email: 'elena@rostova.design',
    amount: '$450.00',
    status: 'Completed',
    date: '2026-07-29',
  },
  {
    id: 'TX-9043',
    customer: 'Marcus Vance',
    email: 'm.vance@techcorp.io',
    amount: '$2,800.00',
    status: 'Pending',
    date: '2026-07-28',
  },
  {
    id: 'TX-9044',
    customer: 'Sophia Chen',
    email: 'sophia@startup.co',
    amount: '$89.00',
    status: 'Completed',
    date: '2026-07-28',
  },
  {
    id: 'TX-9045',
    customer: 'David Miller',
    email: 'd.miller@enterprise.org',
    amount: '$3,400.00',
    status: 'Failed',
    date: '2026-07-27',
  },
])
</script>

<template>
  <UCard class="border border-gray-200 dark:border-gray-800 shadow-sm">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
          <p class="text-xs text-gray-500">Latest customer orders and payment statuses</p>
        </div>
        <RouterLink to="/customers">
          <UButton color="neutral" variant="ghost" size="xs" trailing-icon="i-lucide-arrow-right">
            View All
          </UButton>
        </RouterLink>
      </div>
    </template>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead
          class="bg-gray-50 dark:bg-gray-900 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-800"
        >
          <tr>
            <th class="py-3 px-4">Transaction ID</th>
            <th class="py-3 px-4">Customer</th>
            <th class="py-3 px-4">Amount</th>
            <th class="py-3 px-4">Status</th>
            <th class="py-3 px-4">Date</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr
            v-for="item in transactions"
            :key="item.id"
            class="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors"
          >
            <td class="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">
              {{ item.id }}
            </td>
            <td class="py-3 px-4">
              <div class="font-semibold text-gray-900 dark:text-white">{{ item.customer }}</div>
              <div class="text-[10px] text-gray-400">{{ item.email }}</div>
            </td>
            <td class="py-3 px-4 font-extrabold text-gray-900 dark:text-white">
              {{ item.amount }}
            </td>
            <td class="py-3 px-4">
              <UBadge
                :color="
                  item.status === 'Completed'
                    ? 'success'
                    : item.status === 'Pending'
                      ? 'warning'
                      : 'error'
                "
                variant="soft"
                size="xs"
              >
                {{ item.status }}
              </UBadge>
            </td>
            <td class="py-3 px-4 text-gray-500">
              {{ item.date }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
