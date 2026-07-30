<script setup lang="ts">
import { ref } from 'vue'

interface Member {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Admin' | 'Member'
  status: 'Active' | 'Invited'
}

const members = ref<Member[]>([
  {
    id: 'm1',
    name: 'Emmanuel Apabiekun',
    email: 'emmanuelapabiekun@gmail.com',
    role: 'Owner',
    status: 'Active',
  },
  {
    id: 'm2',
    name: 'Sarah Jenkins',
    email: 'sarah@acme.com',
    role: 'Admin',
    status: 'Active',
  },
  {
    id: 'm3',
    name: 'Alex Rivera',
    email: 'alex@acme.com',
    role: 'Member',
    status: 'Invited',
  },
])

const inviteEmail = ref('')
const inviteRole = ref<'Admin' | 'Member'>('Member')

function handleInvite() {
  if (!inviteEmail.value) return
  members.value.push({
    id: String(Date.now()),
    name: inviteEmail.value.split('@')[0] || '',
    email: inviteEmail.value,
    role: inviteRole.value,
    status: 'Invited',
  })
  inviteEmail.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <!-- Invite Bar -->
    <div class="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl space-y-3">
      <h3 class="text-sm font-bold text-gray-900 dark:text-white">Invite New Team Member</h3>
      <div class="flex flex-col sm:flex-row gap-3">
        <UInput
          v-model="inviteEmail"
          placeholder="colleague@example.com"
          icon="i-lucide-mail"
          class="flex-1"
        />
        <USelect v-model="inviteRole" :items="['Admin', 'Member']" class="w-32" />
        <UButton color="primary" :disabled="!inviteEmail" @click="handleInvite">
          Send Invite
        </UButton>
      </div>
    </div>

    <!-- Members Table -->
    <div class="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <table class="w-full text-left text-xs">
        <thead class="bg-gray-50 dark:bg-gray-900 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-800">
          <tr>
            <th class="py-3 px-4">Member Name</th>
            <th class="py-3 px-4">Role</th>
            <th class="py-3 px-4">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="m in members" :key="m.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
            <td class="py-3 px-4">
              <div class="font-bold text-gray-900 dark:text-white">{{ m.name }}</div>
              <div class="text-[10px] text-gray-400">{{ m.email }}</div>
            </td>
            <td class="py-3 px-4">
              <USelect v-model="m.role" :items="['Owner', 'Admin', 'Member']" size="xs" class="w-28" />
            </td>
            <td class="py-3 px-4">
              <UBadge :color="m.status === 'Active' ? 'success' : 'warning'" variant="soft" size="xs">
                {{ m.status }}
              </UBadge>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
