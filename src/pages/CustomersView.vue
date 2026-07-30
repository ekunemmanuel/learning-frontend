<script setup lang="ts">
import { ref, computed } from 'vue'
import CustomersAddModal from '../components/customers/CustomersAddModal.vue'
import CustomersDeleteModal from '../components/customers/CustomersDeleteModal.vue'

interface Customer {
  id: string
  name: string
  email: string
  role: string
  status: 'Active' | 'Pending' | 'Inactive'
  spent: string
  createdAt: string
}

const customers = ref<Customer[]>([
  {
    id: 'CUST-101',
    name: 'Sarah Jenkins',
    email: 'sarah.j@acme.com',
    role: 'Owner',
    status: 'Active',
    spent: '$4,250.00',
    createdAt: '2026-05-12',
  },
  {
    id: 'CUST-102',
    name: 'Michael Scott',
    email: 'm.scott@paper.com',
    role: 'Admin',
    status: 'Active',
    spent: '$1,890.00',
    createdAt: '2026-06-01',
  },
  {
    id: 'CUST-103',
    name: 'Pam Beesly',
    email: 'pam@dunder.org',
    role: 'Member',
    status: 'Pending',
    spent: '$0.00',
    createdAt: '2026-07-20',
  },
  {
    id: 'CUST-104',
    name: 'Dwight Schrute',
    email: 'dwight@beets.farm',
    role: 'Member',
    status: 'Active',
    spent: '$8,400.00',
    createdAt: '2026-04-18',
  },
  {
    id: 'CUST-105',
    name: 'Jim Halpert',
    email: 'jim@athlead.io',
    role: 'Guest',
    status: 'Inactive',
    spent: '$650.00',
    createdAt: '2026-06-15',
  },
])

const search = ref('')
const statusFilter = ref<string>('All')

const isAddModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const targetCustomer = ref<Customer | null>(null)

const filteredCustomers = computed(() => {
  return customers.value.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.value.toLowerCase()) ||
      item.email.toLowerCase().includes(search.value.toLowerCase()) ||
      item.id.toLowerCase().includes(search.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'All' || item.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

function handleAddCustomer(newCustomer: { name: string; email: string; role: string; status: 'Active' | 'Pending' }) {
  const newRecord: Customer = {
    id: `CUST-${100 + customers.value.length + 1}`,
    name: newCustomer.name,
    email: newCustomer.email,
    role: newCustomer.role,
    status: newCustomer.status,
    spent: '$0.00',
    createdAt: new Date().toISOString().split('T')[0] || '',
  }
  customers.value.unshift(newRecord)
}

function promptDelete(customer: Customer) {
  targetCustomer.value = customer
  isDeleteModalOpen.value = true
}

function confirmDelete() {
  if (targetCustomer.value) {
    customers.value = customers.value.filter((c) => c.id !== targetCustomer.value?.id)
    targetCustomer.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Top Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-extrabold text-gray-900 dark:text-white">Customers & Team Members</h2>
        <p class="text-xs text-gray-500">Manage user accounts, workspace memberships, and permissions</p>
      </div>

      <UButton
        color="primary"
        size="md"
        icon="i-lucide-user-plus"
        class="font-bold"
        @click="isAddModalOpen = true"
      >
        Add Customer / Member
      </UButton>
    </div>

    <!-- Filter & Search Bar -->
    <UCard class="border border-gray-200 dark:border-gray-800 shadow-sm">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <UInput
          v-model="search"
          placeholder="Search by name, email, or ID..."
          icon="i-lucide-search"
          class="w-full sm:w-80"
        />

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <span class="text-xs font-semibold text-gray-500">Status:</span>
          <USelect
            v-model="statusFilter"
            :items="['All', 'Active', 'Pending', 'Inactive']"
            class="w-36"
          />
        </div>
      </div>

      <!-- Customers Table -->
      <div class="overflow-x-auto mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
        <table class="w-full text-left text-xs">
          <thead class="bg-gray-50 dark:bg-gray-900 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th class="py-3 px-4">Customer ID</th>
              <th class="py-3 px-4">Name & Email</th>
              <th class="py-3 px-4">Role</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4">Total Spent</th>
              <th class="py-3 px-4">Joined Date</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="7" class="text-center py-8 text-gray-400">
                No customer records found matching your query.
              </td>
            </tr>
            <tr
              v-for="item in filteredCustomers"
              :key="item.id"
              class="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors"
            >
              <td class="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">
                {{ item.id }}
              </td>
              <td class="py-3 px-4">
                <div class="font-bold text-gray-900 dark:text-white">{{ item.name }}</div>
                <div class="text-[10px] text-gray-400">{{ item.email }}</div>
              </td>
              <td class="py-3 px-4">
                <UBadge color="neutral" variant="subtle" size="xs">
                  {{ item.role }}
                </UBadge>
              </td>
              <td class="py-3 px-4">
                <UBadge
                  :color="item.status === 'Active' ? 'success' : item.status === 'Pending' ? 'warning' : 'neutral'"
                  variant="soft"
                  size="xs"
                >
                  {{ item.status }}
                </UBadge>
              </td>
              <td class="py-3 px-4 font-extrabold text-gray-900 dark:text-white">
                {{ item.spent }}
              </td>
              <td class="py-3 px-4 text-gray-500">
                {{ item.createdAt }}
              </td>
              <td class="py-3 px-4 text-right">
                <UButton
                  color="error"
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-trash-2"
                  aria-label="Delete Customer"
                  @click="promptDelete(item)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Modals -->
    <CustomersAddModal v-model:open="isAddModalOpen" @add="handleAddCustomer" />
    <CustomersDeleteModal v-model:open="isDeleteModalOpen" :customer-name="targetCustomer?.name" @confirm="confirmDelete" />
  </div>
</template>
